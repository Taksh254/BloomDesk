export type MemberRole = "owner" | "admin" | "teacher" | "parent";
export type ClassLevel = "playgroup" | "nursery" | "lkg" | "ukg" | "daycare" | "other";
export type AttendanceStatus = "present" | "absent" | "late" | "leave";

export type School = {
  id: string;
  name: string;
  city: string | null;
  timezone: string;
};

export type SchoolClass = {
  id: string;
  school_id: string;
  name: string;
  level: ClassLevel;
  capacity: number | null;
  sort_order: number;
};

export type Child = {
  id: string;
  school_id: string;
  class_id: string | null;
  full_name: string;
  date_of_birth: string | null;
  gender: "girl" | "boy" | "other" | null;
  parent_name: string | null;
  parent_phone: string | null;
  joined_on: string;
  status: "active" | "left";
  notes: string | null;
};

export type AttendanceRow = {
  child_id: string;
  date: string;
  status: AttendanceStatus;
  class_id: string | null;
};

export const CLASS_LEVELS: { value: ClassLevel; label: string }[] = [
  { value: "playgroup", label: "Playgroup" },
  { value: "nursery", label: "Nursery" },
  { value: "lkg", label: "LKG" },
  { value: "ukg", label: "UKG" },
  { value: "daycare", label: "Daycare" },
  { value: "other", label: "Other" },
];
