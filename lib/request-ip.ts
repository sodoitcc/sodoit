import "server-only";
import { headers } from "next/headers";

export async function getClientIp(): Promise<string | null> {
  const headerList = await headers();

  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = headerList.get("x-real-ip");
  return realIp?.trim() || null;
}
