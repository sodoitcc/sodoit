import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { toggleCompletion } from "@/app/(app)/browse/actions";

const USER_ID = "user-1";
const EXPERIENCE_ID = "11111111-1111-4111-8111-111111111111";

function makeClient({ existingRow }: { existingRow: boolean }) {
  const insertMock = vi.fn().mockResolvedValue({ error: null });
  const updateMock = vi.fn(() => ({
    eq: () => ({
      eq: () => Promise.resolve({ error: null }),
    }),
  }));
  const deleteMock = vi.fn(() => ({
    eq: () => ({
      eq: () => Promise.resolve({ error: null }),
    }),
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
                  data: existingRow ? { experience_id: EXPERIENCE_ID } : null,
                }),
            }),
          }),
        }),
        insert: insertMock,
        update: updateMock,
        delete: deleteMock,
      };
    },
  };

  return { client, insertMock, updateMock, deleteMock };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("toggleCompletion", () => {
  it("marks complete via the update path when not currently completed", async () => {
    const { client, insertMock, updateMock, deleteMock } = makeClient({
      existingRow: true,
    });
    createClientMock.mockResolvedValue(client);

    await toggleCompletion(EXPERIENCE_ID, false);

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: "completed" }),
    );
    expect(insertMock).not.toHaveBeenCalled();
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("reverts to saved when un-completing, never deleting the row", async () => {
    const { client, insertMock, updateMock, deleteMock } = makeClient({
      existingRow: true,
    });
    createClientMock.mockResolvedValue(client);

    await toggleCompletion(EXPERIENCE_ID, true);

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: "saved" }),
    );
    expect(deleteMock).not.toHaveBeenCalled();
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("supports a full saved -> completed -> saved round trip on the same row", async () => {
    const { client, updateMock, deleteMock } = makeClient({
      existingRow: true,
    });
    createClientMock.mockResolvedValue(client);

    await toggleCompletion(EXPERIENCE_ID, false);
    await toggleCompletion(EXPERIENCE_ID, true);

    expect(updateMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ status: "completed" }),
    );
    expect(updateMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ status: "saved" }),
    );
    expect(deleteMock).not.toHaveBeenCalled();
  });
});
