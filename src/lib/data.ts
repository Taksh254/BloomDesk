import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AttendanceRow, Child, SchoolClass } from "@/lib/types";

const CHILD_COLUMNS =
  "id, school_id, class_id, full_name, date_of_birth, gender, parent_name, parent_phone, joined_on, status, notes";

export async function getClasses(schoolId: string): Promise<SchoolClass[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("classes")
    .select("id, school_id, name, level, capacity, sort_order")
    .eq("school_id", schoolId)
    .order("sort_order")
    .order("name");
  if (error) throw error;
  return (data ?? []) as SchoolClass[];
}

export async function getChildren(
  schoolId: string,
  opts: { classId?: string | null; status?: "active" | "left" | "all" } = {},
): Promise<Child[]> {
  const supabase = await createClient();
  let query = supabase.from("children").select(CHILD_COLUMNS).eq("school_id", schoolId).order("full_name");
  const status = opts.status ?? "active";
  if (status !== "all") query = query.eq("status", status);
  if (opts.classId === null) query = query.is("class_id", null);
  else if (opts.classId) query = query.eq("class_id", opts.classId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Child[];
}

export async function getChild(schoolId: string, id: string): Promise<Child | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("children").select(CHILD_COLUMNS).eq("school_id", schoolId).eq("id", id).maybeSingle();
  return (data as Child | null) ?? null;
}

export async function getAttendance(schoolId: string, date: string): Promise<AttendanceRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendance")
    .select("child_id, date, status, class_id")
    .eq("school_id", schoolId)
    .eq("date", date);
  if (error) throw error;
  return (data ?? []) as AttendanceRow[];
}

export async function getChildAttendance(schoolId: string, childId: string, from: string): Promise<AttendanceRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendance")
    .select("child_id, date, status, class_id")
    .eq("school_id", schoolId)
    .eq("child_id", childId)
    .gte("date", from)
    .order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AttendanceRow[];
}
