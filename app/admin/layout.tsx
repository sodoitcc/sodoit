import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { getAdminAccess } from "@/lib/admin/access";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const access = await getAdminAccess(supabase);

  if (access.status !== "ok") {
    notFound();
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <div className="min-w-0 flex-1">
        <main className="mx-auto w-full max-w-[1440px] px-6 py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
