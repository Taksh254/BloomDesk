// Two schools side by side: nothing one school does can read or change the other's data.
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { db } from "@/lib/db";
import { getAttendance, getChild, getChildAttendance, getChildren, getClass, getClasses } from "@/lib/data";
import { insertChild, setChildStatus, updateChild, classBelongsToSchool, type ChildValues } from "@/lib/children";
import { deleteClass, insertClass, updateClass } from "@/lib/classes";
import { recordAttendance } from "@/lib/attendance";
import { makeSchool, removeSchools } from "./helpers";

const TODAY = "2026-10-07";
const child = (classId: string | null, fullName: string): ChildValues => ({
  fullName,
  classId,
  dateOfBirth: "2022-03-14",
  gender: "girl",
  parentName: "Priya",
  parentPhone: "9876543210",
  joinedOn: "2026-06-10",
  notes: null,
});

let a: Awaited<ReturnType<typeof makeSchool>>;
let b: Awaited<ReturnType<typeof makeSchool>>;
let aChild: string;
let bChild: string;

before(async () => {
  a = await makeSchool("A");
  b = await makeSchool("B");
  aChild = (await insertChild(a.schoolId, child(a.classes[0].id, "Aanya A"))).id;
  bChild = (await insertChild(b.schoolId, child(b.classes[0].id, "Kabir B"))).id;
  await recordAttendance(b.schoolId, b.userId, { classId: b.classes[0].id, date: TODAY, entries: [{ childId: bChild, status: "present" }] }, TODAY);
});

after(async () => {
  await removeSchools(a, b);
  await db.$disconnect();
});

describe("creating a school", () => {
  test("makes the creator the owner and adds the four usual classes", async () => {
    const member = await db.schoolMember.findUnique({ where: { schoolId_userId: { schoolId: a.schoolId, userId: a.userId } } });
    assert.equal(member?.role, "owner");
    assert.deepEqual(a.classes.map((c) => c.name), ["Playgroup", "Nursery", "LKG", "UKG"]);
  });
});

describe("reading", () => {
  test("lists only the school's own classes and children", async () => {
    assert.ok((await getClasses(a.schoolId)).every((c) => c.schoolId === a.schoolId));
    assert.deepEqual((await getChildren(a.schoolId)).map((c) => c.id), [aChild]);
  });

  test("another school's child or class is not found", async () => {
    assert.equal(await getChild(a.schoolId, bChild), null);
    assert.equal(await getClass(a.schoolId, b.classes[0].id), null);
    assert.equal(await getChild(a.schoolId, "not-a-uuid"), null);
  });

  test("another school's attendance is not visible", async () => {
    assert.equal((await getAttendance(a.schoolId, TODAY)).length, 0);
    assert.equal((await getChildAttendance(a.schoolId, bChild, "2026-01-01")).length, 0);
    assert.equal((await getAttendance(b.schoolId, TODAY)).length, 1);
  });

  test("calendar days come back as YYYY-MM-DD", async () => {
    const c = await getChild(a.schoolId, aChild);
    assert.equal(c?.dateOfBirth, "2022-03-14");
    assert.equal(c?.joinedOn, "2026-06-10");
  });
});

describe("changing", () => {
  test("can't edit, remove or re-class another school's child", async () => {
    assert.equal(await updateChild(a.schoolId, bChild, child(null, "Hacked")), false);
    assert.equal(await setChildStatus(a.schoolId, bChild, "left"), false);
    const untouched = await getChild(b.schoolId, bChild);
    assert.equal(untouched?.fullName, "Kabir B");
    assert.equal(untouched?.status, "active");
  });

  test("a child can't be put in another school's class", async () => {
    assert.equal(await classBelongsToSchool(a.schoolId, b.classes[0].id), false);
    assert.equal(await classBelongsToSchool(a.schoolId, a.classes[0].id), true);
    assert.equal(await classBelongsToSchool(a.schoolId, null), true);
  });

  test("can't rename or delete another school's class", async () => {
    assert.deepEqual(await updateClass(a.schoolId, b.classes[0].id, { name: "Hacked", level: "other", capacity: null }), {
      ok: false,
      reason: "not_found",
    });
    assert.equal(await deleteClass(a.schoolId, b.classes[0].id), false);
    assert.equal((await getClass(b.schoolId, b.classes[0].id))?.name, "Playgroup");
  });

  test("class names are unique within a school, not across schools", async () => {
    assert.deepEqual(await insertClass(a.schoolId, { name: "Nursery", level: "nursery", capacity: null }), { ok: false, reason: "duplicate" });
    assert.deepEqual(await insertClass(a.schoolId, { name: "Daycare", level: "daycare", capacity: 12 }), { ok: true });
    assert.deepEqual(await insertClass(b.schoolId, { name: "Daycare", level: "daycare", capacity: null }), { ok: true });
  });

  test("the database refuses a malformed parent mobile", async () => {
    await assert.rejects(insertChild(a.schoolId, { ...child(null, "Bad Phone"), parentPhone: "12345" }));
  });
});

describe("attendance", () => {
  test("only accepts active children of that class in that school", async () => {
    const res = await recordAttendance(
      a.schoolId,
      a.userId,
      { classId: a.classes[0].id, date: TODAY, entries: [{ childId: aChild, status: "absent" }, { childId: bChild, status: "absent" }] },
      TODAY,
    );
    assert.deepEqual(res, { ok: true, saved: 1 });
    assert.equal((await getAttendance(b.schoolId, TODAY))[0].status, "present");
  });

  test("refuses another school's class and future days", async () => {
    const other = await recordAttendance(a.schoolId, a.userId, { classId: b.classes[0].id, date: TODAY, entries: [{ childId: bChild, status: "absent" }] }, TODAY);
    assert.equal(other.ok, false);
    const future = await recordAttendance(a.schoolId, a.userId, { classId: a.classes[0].id, date: "2026-10-08", entries: [{ childId: aChild, status: "present" }] }, TODAY);
    assert.equal(future.ok, false);
  });

  test("saving again replaces the mark instead of adding a second one", async () => {
    await recordAttendance(a.schoolId, a.userId, { classId: a.classes[0].id, date: TODAY, entries: [{ childId: aChild, status: "late" }] }, TODAY);
    const rows = await getAttendance(a.schoolId, TODAY);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].status, "late");
  });

  test("a child who left can't be marked", async () => {
    const leaver = (await insertChild(a.schoolId, child(a.classes[1].id, "Gone Child"))).id;
    await setChildStatus(a.schoolId, leaver, "left");
    const res = await recordAttendance(a.schoolId, a.userId, { classId: a.classes[1].id, date: TODAY, entries: [{ childId: leaver, status: "present" }] }, TODAY);
    assert.equal(res.ok, false);
  });
});
