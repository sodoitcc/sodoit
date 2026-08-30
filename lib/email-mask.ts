export function maskEmail(email: string): string {
  const atIndex = email.indexOf("@");
  if (atIndex <= 0) return email;

  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);

  if (local.length <= 1) {
    return `${local}•••@${domain}`;
  }

  const dots = "•".repeat(local.length - 1);
  return `${local[0]}${dots}@${domain}`;
}
