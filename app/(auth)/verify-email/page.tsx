import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSafeNextPath } from "@/lib/auth-redirect";
import { isEmailVerified } from "@/lib/auth/require-verified-user";
import { AuthShell } from "../AuthShell";
import { VerifyEmailForm } from "./VerifyEmailForm";

interface VerifyEmailPageProps {
  searchParams: Promise<{ email?: string; next?: string }>;
}

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const { email, next } = await searchParams;
  const safeNext = getSafeNextPath(next);

  if (!email || !email.includes("@")) {
    redirect("/signup");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && isEmailVerified(user)) {
    redirect(safeNext);
  }

  return (
    <AuthShell>
      <VerifyEmailForm email={email} next={safeNext} />
    </AuthShell>
  );
}
