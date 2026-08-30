import { beforeEach, describe, expect, it, vi } from "vitest";

class NotFoundSignal extends Error {}
class RedirectSignal extends Error {
  constructor(public href: string) {
    super("redirect");
  }
}

const { notFoundMock, permanentRedirectMock, createClientMock } = vi.hoisted(
  () => ({
    notFoundMock: vi.fn(() => {
      throw new NotFoundSignal();
    }),
    permanentRedirectMock: vi.fn((href: string) => {
      throw new RedirectSignal(href);
    }),
    createClientMock: vi.fn(),
  }),
);

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
  permanentRedirect: permanentRedirectMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import LegacyTaskPage from "@/app/(app)/tasks/[id]/page";

function client(row: { slug: string } | null) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: row }),
          }),
        }),
      }),
    }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("legacy /tasks/{id} compatibility route", () => {
  it("404s on a malformed UUID without querying the database", async () => {
    createClientMock.mockResolvedValue(client(null));

    await expect(
      LegacyTaskPage({ params: Promise.resolve({ id: "not-a-uuid" }) }),
    ).rejects.toBeInstanceOf(NotFoundSignal);

    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("404s on a well-formed but nonexistent UUID", async () => {
    createClientMock.mockResolvedValue(client(null));

    await expect(
      LegacyTaskPage({
        params: Promise.resolve({
          id: "11111111-1111-4111-8111-111111111111",
        }),
      }),
    ).rejects.toBeInstanceOf(NotFoundSignal);
  });

  it("permanently redirects a valid public UUID to its slug URL", async () => {
    createClientMock.mockResolvedValue(
      client({ slug: "swim-with-whale-sharks" }),
    );

    await expect(
      LegacyTaskPage({
        params: Promise.resolve({
          id: "11111111-1111-4111-8111-111111111111",
        }),
      }),
    ).rejects.toBeInstanceOf(RedirectSignal);

    expect(permanentRedirectMock).toHaveBeenCalledWith(
      "/experiences/swim-with-whale-sharks",
    );
  });

  it("does not redirect to itself, ruling out a redirect loop", async () => {
    createClientMock.mockResolvedValue(
      client({ slug: "swim-with-whale-sharks" }),
    );

    try {
      await LegacyTaskPage({
        params: Promise.resolve({
          id: "11111111-1111-4111-8111-111111111111",
        }),
      });
    } catch (error) {
      expect((error as RedirectSignal).href).not.toMatch(/^\/tasks\//);
    }
  });
});
