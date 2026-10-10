export type FormState = {
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
};

export const initialFormState: FormState = {};

/** Reads a trimmed string from FormData. */
export function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/** Keeps what the person typed so a failed submit doesn't clear the form. Skips passwords. */
export function keepValues(formData: FormData) {
  const values: Record<string, string> = {};
  formData.forEach((v, k) => {
    if (typeof v === "string" && !k.startsWith("$") && !k.toLowerCase().includes("password")) values[k] = v;
  });
  return values;
}

/** Normalises an Indian mobile number to 10 digits, or returns null if it isn't one. */
export function normaliseMobile(raw: string) {
  const digits = raw.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

/** Only allow redirects to paths inside the app. */
export function safeNext(next: string | null | undefined, fallback = "/today") {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
