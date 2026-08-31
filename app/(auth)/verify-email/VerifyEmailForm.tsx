"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { maskEmail } from "@/lib/email-mask";
import { resendVerificationCode, verifyEmailCode } from "./actions";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

type FormState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "error"; message: string }
  | { status: "verified" };

export function VerifyEmailForm({
  email,
  next,
}: {
  email: string;
  next: string;
}) {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [state, setState] = useState<FormState>({ status: "idle" });
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const maskedEmail = maskEmail(email);
  const code = digits.join("");

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    const interval = window.setInterval(() => {
      setCooldown((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  }

  function setDigitAt(index: number, value: string) {
    setDigits((previous) => {
      const next = [...previous];
      next[index] = value;
      return next;
    });
  }

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setDigitAt(index, digit);

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(event: React.ClipboardEvent) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;

    event.preventDefault();
    const next = Array(CODE_LENGTH).fill("");
    for (let i = 0; i < CODE_LENGTH && i < pasted.length; i += 1) {
      next[i] = pasted[i];
    }
    setDigits(next);

    const lastFilled = Math.min(pasted.length, CODE_LENGTH) - 1;
    inputRefs.current[Math.max(lastFilled, 0)]?.focus();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (code.length !== CODE_LENGTH || state.status === "submitting") return;

    setState({ status: "submitting" });

    const result = await verifyEmailCode(email, code, next);

    if (!result.success) {
      setState({
        status: "error",
        message: result.error ?? "That code is incorrect or has expired.",
      });
      return;
    }

    posthog.capture("email_verified");
    setState({ status: "verified" });
    router.push(result.next ?? next);
    router.refresh();
  }

  async function handleResend() {
    if (cooldown > 0) return;

    setResendMessage(null);
    const result = await resendVerificationCode(email);

    if (!result.success) {
      setCooldown(result.retryAfterSeconds ?? RESEND_COOLDOWN_SECONDS);
      setResendMessage("Please wait before requesting another code.");
      return;
    }

    startCooldown();
    setResendMessage("A new code is on its way.");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Verify your email</h1>

      <p className="mt-2 text-sm text-muted">
        We sent a 6-digit code to{" "}
        <span className="font-medium text-ink">{maskedEmail}</span>. Enter it
        below to finish creating your account.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
        <div className="flex justify-between gap-2" onPaste={handlePaste}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                inputRefs.current[index] = element;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={digit}
              onChange={(event) => handleChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              aria-label={`Digit ${index + 1} of ${CODE_LENGTH}`}
              className="h-14 w-11 rounded-md border border-border text-center text-xl font-semibold text-ink outline-none focus:border-accent"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={
            code.length !== CODE_LENGTH || state.status === "submitting"
          }
          className="h-11 rounded-md bg-accent text-[15px] font-bold text-white transition-colors hover:bg-accent-dark disabled:opacity-70"
        >
          {state.status === "submitting" ? "Verifying..." : "Verify email"}
        </button>

        {state.status === "error" && (
          <p
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600"
          >
            {state.message}
          </p>
        )}
      </form>

      <p className="mt-6 text-center text-[13px] text-muted">
        Didn&apos;t get the code?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0}
          className="font-semibold text-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
        </button>
      </p>

      {resendMessage && (
        <p role="status" className="mt-2 text-center text-[13px] text-muted">
          {resendMessage}
        </p>
      )}
    </div>
  );
}
