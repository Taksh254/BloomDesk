// App-wide types come from the Prisma schema. Dates that are calendar days
// (date of birth, joined on, attendance day) travel as "YYYY-MM-DD" strings.
import type {
  AttendanceStatus,
  ClassLevel,
  Child as ChildModel,
  School as SchoolModel,
  SchoolClass as SchoolClassModel,
} from "@/generated/prisma/browser";

export type { AttendanceStatus, ChildStatus, ClassLevel, Gender, MemberRole } from "@/generated/prisma/browser";

export type School = Pick<SchoolModel, "id" | "name" | "city" | "timezone">;

export type SchoolClass = Pick<SchoolClassModel, "id" | "schoolId" | "name" | "level" | "capacity" | "sortOrder">;

export type Child = Pick<
  ChildModel,
  "id" | "schoolId" | "classId" | "fullName" | "gender" | "parentName" | "parentPhone" | "status" | "notes"
> & {
  dateOfBirth: string | null;
  joinedOn: string;
};

export type AttendanceRow = {
  childId: string;
  date: string;
  status: AttendanceStatus;
  classId: string | null;
};

export const CLASS_LEVELS: { value: ClassLevel; label: string }[] = [
  { value: "playgroup", label: "Playgroup" },
  { value: "nursery", label: "Nursery" },
  { value: "lkg", label: "LKG" },
  { value: "ukg", label: "UKG" },
  { value: "daycare", label: "Daycare" },
  { value: "other", label: "Other" },
];
