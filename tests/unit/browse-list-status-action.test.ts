import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { setListStatus } from "@/app/(app)/browse/actions";

const USER_ID = "user-1";
const EXPERIENCE_ID = "11111111-1111-4111-8111-111111111111";

function makeClient({ existingRow }: { existingRow: boolean }) {
  const insertMock = vi.fn().mockResolvedValue({ error: null });
  const updateEqCalls: unknown[][] = [];
  const updateMock = vi.fn(() => ({
    eq: (col: string, val: unknown) => {
      updateEqCalls.push([col, val]);
      return {
        eq: (col2: string, val2: unknown) => {
          updateEqCalls.push([col2, val2]);
          return Promise.resolve({ error: null });
        },
      };
    },
  }));

  const client = {
    auth: {
      getUser: () =>
        Promise.resolve({
          data: {
            user: { id: USER_ID, email_confirmed_at: "2026-01-01T00:00:00Z" },
          },
        }),
    },
    from() {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: existingRow
                    ? { experience_id: EXPERIENCE_ID }
                    : null,
                }),
            }),
          }),
        }),
        insert: insertMock,
        update: updateMock,
      };
    },
  };

  return { client, insertMock, updateMock, updateEqCalls };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("setListStatus", () => {
  it("inserts a new row rather than relying on upsert when none exists", async () => {
    const { client, insertMock, updateMock } = makeClient({
      existingRow: false,
    });
    createClientMock.mockResolvedValue(client);

    await setListStatus(EXPERIENCE_ID, "saved");

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: USER_ID,
        experience_id: EXPERIENCE_ID,
        status: "saved",
      }),
    );
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("updates the existing row rather than inserting a duplicate", async () => {
    const { client, insertMock, updateMock } = makeClient({
      existingRow: true,
    });
    createClientMock.mockResolvedValue(client);

    await setListStatus(EXPERIENCE_ID, "completed");

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: "completed" }),
    );
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid experience id without touching the database", async () => {
    const { client, insertMock, updateMock } = makeClient({
      existingRow: false,
    });
    createClientMock.mockResolvedValue(client);

    await setListStatus("not-a-uuid", "saved");

    expect(insertMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });
});
