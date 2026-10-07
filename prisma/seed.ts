// Demo data: `npm run db:seed` (also run by `prisma migrate reset`).
// Creates "Little Sprouts Play School" with its four classes, 30 children and the last
// two weeks of attendance. Running it again replaces the demo school with a fresh copy.
//
//   Owner:   demo@bloomdesk.in    / bloomdesk123
//   Teacher: teacher@bloomdesk.in / bloomdesk123
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type AttendanceStatus, type Gender } from "../src/generated/prisma/client";
import { dayToDate, shiftDay, todayISO } from "../src/lib/format";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const PASSWORD = "bloomdesk123";
const OWNER_EMAIL = "demo@bloomdesk.in";
const TEACHER_EMAIL = "teacher@bloomdesk.in";
const TZ = "Asia/Kolkata";

const CLASSES = [
  { name: "Playgroup", level: "playgroup", sortOrder: 1, capacity: 15, ageYears: 2 },
  { name: "Nursery", level: "nursery", sortOrder: 2, capacity: 20, ageYears: 3 },
  { name: "LKG", level: "lkg", sortOrder: 3, capacity: 20, ageYears: 4 },
  { name: "UKG", level: "ukg", sortOrder: 4, capacity: 20, ageYears: 5 },
] as const;

const GIRLS = ["Aanya", "Diya", "Ira", "Kiara", "Meera", "Myra", "Navya", "Pari", "Riya", "Saanvi", "Siya", "Tara", "Anika", "Zoya", "Avni"];
const BOYS = ["Aarav", "Arjun", "Advik", "Ishaan", "Kabir", "Reyansh", "Vihaan", "Vivaan", "Ayaan", "Dhruv", "Krish", "Rudra", "Shaurya", "Atharv", "Yuvan"];
const SURNAMES = ["Sharma", "Patil", "Iyer", "Gupta", "Kulkarni", "Reddy", "Joshi", "Nair", "Deshmukh", "Mehta", "Singh", "Kapoor", "Rao", "Bhat", "Verma"];
const PARENTS = ["Priya", "Rahul", "Sneha", "Amit", "Pooja", "Vikram", "Neha", "Sanjay", "Kavita", "Rohan", "Anjali", "Suresh", "Deepa", "Manish", "Swati"];

// Small deterministic random generator, so every seed gives the same school.
let state = 20261006;
function random() {
  state = (state * 1664525 + 1013904223) % 2 ** 32;
  return state / 2 ** 32;
}

async function main() {
  // Start fresh: deleting the users and their schools cascades to everything else.
  const old = await db.user.findMany({ where: { email: { in: [OWNER_EMAIL, TEACHER_EMAIL] } }, select: { id: true } });
  await db.school.deleteMany({ where: { createdById: { in: old.map((u) => u.id) } } });
  await db.user.deleteMany({ where: { id: { in: old.map((u) => u.id) } } });

  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const now = new Date();
  const owner = await db.user.create({
    data: { email: OWNER_EMAIL, name: "Anita Kulkarni", passwordHash, emailVerifiedAt: now },
  });
  const teacher = await db.user.create({
    data: { email: TEACHER_EMAIL, name: "Farah Shaikh", passwordHash, emailVerifiedAt: now },
  });

  const school = await db.school.create({
    data: {
      name: "Little Sprouts Play School",
      city: "Pune",
      phone: "9822012345",
      timezone: TZ,
      createdById: owner.id,
      members: {
        create: [
          { userId: owner.id, role: "owner", fullName: "Anita Kulkarni" },
          { userId: teacher.id, role: "teacher", fullName: "Farah Shaikh" },
        ],
      },
    },
  });

  const classes = [];
  for (const { ageYears, ...c } of CLASSES) {
    classes.push({ ageYears, ...(await db.schoolClass.create({ data: { ...c, schoolId: school.id } })) });
  }

  const today = todayISO(TZ);
  const termStart = `${today.slice(0, 4)}-06-10`;
  const children = [];
  for (let i = 0; i < 30; i++) {
    const cls = classes[i % classes.length];
    const gender: Gender = i % 2 === 0 ? "girl" : "boy";
    const first = (gender === "girl" ? GIRLS : BOYS)[Math.floor(i / 2) % 15];
    const surname = SURNAMES[(i * 7) % SURNAMES.length];
    const birthYear = Number(today.slice(0, 4)) - cls.ageYears - 1;
    const birthday = `${birthYear}-${String(1 + Math.floor(random() * 12)).padStart(2, "0")}-${String(1 + Math.floor(random() * 28)).padStart(2, "0")}`;
    children.push(
      await db.child.create({
        data: {
          schoolId: school.id,
          classId: cls.id,
          fullName: `${first} ${surname}`,
          gender,
          dateOfBirth: dayToDate(birthday),
          parentName: `${PARENTS[(i * 3) % PARENTS.length]} ${surname}`,
          parentPhone: `98${String(20000000 + i * 104729).slice(0, 8)}`,
          joinedOn: dayToDate(i < 26 ? termStart : shiftDay(today, -20 + i)),
          notes: i === 3 ? "Allergic to peanuts." : i === 8 ? "Picked up by grandfather on Fridays." : null,
        },
      }),
    );
  }
  // One child who has left, so the "Left" filter has something to show.
  await db.child.update({ where: { id: children[29].id }, data: { status: "left" } });

  // Two weeks of school days up to yesterday. Today is left for you to mark.
  const rows = [];
  for (let back = 14; back >= 1; back--) {
    const day = shiftDay(today, -back);
    const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    for (const child of children.slice(0, 29)) {
      if (dayToDate(day) < child.joinedOn) continue;
      const r = random();
      const status: AttendanceStatus = r < 0.84 ? "present" : r < 0.92 ? "absent" : r < 0.96 ? "late" : "leave";
      rows.push({
        childId: child.id,
        schoolId: school.id,
        classId: child.classId,
        date: dayToDate(day),
        status,
        markedById: teacher.id,
        markedAt: new Date(`${day}T04:00:00Z`),
      });
    }
  }
  await db.attendance.createMany({ data: rows });

  console.info(
    `Seeded ${school.name}: ${classes.length} classes, ${children.length} children, ${rows.length} attendance marks.\n` +
      `Sign in as ${OWNER_EMAIL} (owner) or ${TEACHER_EMAIL} (teacher) with the password ${PASSWORD}.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
