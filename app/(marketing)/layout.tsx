import Link from "next/link";
import { Logo } from "@/components/ui";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-border flex items-center justify-between px-10">
        <Link href="/">
          <Logo size="lg" />
        </Link>
        <div className="flex items-center gap-5">
          <Link
            href="/login"
            className="text-sm font-medium text-muted hover:text-ink transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/browse"
            className="bg-accent text-white rounded-[10px] px-5 py-2 text-sm font-bold hover:bg-accent-dark transition-colors"
          >
            Get started
          </Link>
        </div>
      </header>
      <main className="pt-16">{children}</main>
    </div>
  );
}
