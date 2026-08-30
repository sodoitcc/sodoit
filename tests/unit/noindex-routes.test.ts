import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { metadata as adminMetadata } from "@/app/admin/layout";
import { metadata as authMetadata } from "@/app/(auth)/layout";
import { metadata as settingsMetadata } from "@/app/(app)/settings/layout";
import { metadata as listMetadata } from "@/app/(app)/list/page";

describe("private route noindex metadata", () => {
  it.each([
    ["admin", adminMetadata],
    ["auth (login/signup/verify-email/forgot-password/reset-password)", authMetadata],
    ["settings", settingsMetadata],
    ["list", listMetadata],
  ])("%s is noindex,nofollow", (_name, metadata) => {
    expect(metadata?.robots).toEqual({ index: false, follow: false });
  });
});
