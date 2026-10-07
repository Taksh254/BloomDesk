import "server-only";

export type Email = { to: string; subject: string; text: string };

export interface Mailer {
  send(email: Email): Promise<void>;
}

// Development stand-in: prints the email, links included, to the server console.
const consoleMailer: Mailer = {
  async send({ to, subject, text }) {
    const line = "─".repeat(60);
    console.info(`\n${line}\n✉  To: ${to}\n   Subject: ${subject}\n\n${text}\n${line}\n`);
  },
};

// Without a real provider in production, links must not end up in server logs.
const unconfiguredMailer: Mailer = {
  async send({ to, subject }) {
    console.error(`Email not sent (no EMAIL_PROVIDER configured): "${subject}" to ${to}`);
  },
};

function pickMailer(): Mailer {
  const provider = process.env.EMAIL_PROVIDER ?? (process.env.NODE_ENV === "production" ? "" : "console");
  if (provider === "console") return consoleMailer;
  // Real providers plug in here once one is chosen (Phase 5).
  return unconfiguredMailer;
}

/** Sends an email. Never throws: a failed email must not break sign-up or a password reset request. */
export async function sendEmail(email: Email) {
  try {
    await pickMailer().send(email);
  } catch (error) {
    console.error("Email failed", { to: email.to, subject: email.subject, error });
  }
}
