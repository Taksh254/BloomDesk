import type { Email } from "./index";

export function verifyEmailMessage(to: string, name: string, link: string): Email {
  return {
    to,
    subject: "Confirm your email for BloomDesk",
    text: `Hi ${name},\n\nPlease confirm this is your email address by opening the link below:\n\n${link}\n\nThe link works for 24 hours. If you didn't sign up for BloomDesk, you can ignore this email.\n\nBloomDesk`,
  };
}

export function resetPasswordMessage(to: string, name: string, link: string): Email {
  return {
    to,
    subject: "Reset your BloomDesk password",
    text: `Hi ${name},\n\nSomeone asked to reset the password for your BloomDesk account. To choose a new password, open the link below:\n\n${link}\n\nThe link works for 1 hour and can be used once. If you didn't ask for this, you can ignore this email; your password stays the same.\n\nBloomDesk`,
  };
}
