import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { createServerClientMock, getClaimsMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
  getClaimsMock: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: createServerClientMock,
}));

vi.mock("@/lib/env/public", () => ({
  publicEnv: { supabaseUrl: "https://x.supabase.co", supabaseAnonKey: "key" },
}));

import { proxy } from "@/proxy";

function makeRequest(pathname: string) {
  return new NextRequest(`https://www.sodoit.cc${pathname}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  createServerClientMock.mockReturnValue({
    auth: { getClaims: getClaimsMock },
  });
  getClaimsMock.mockResolvedValue({ data: null, error: new Error("none") });
});

describe("proxy", () => {
  it("does not construct a Supabase client for a public route", async () => {
    await proxy(makeRequest("/"));
    expect(createServerClientMock).not.toHaveBeenCalled();
  });

  it("does not construct a Supabase client for other public routes", async () => {
    await proxy(makeRequest("/discovery"));
    await proxy(makeRequest("/experiences/some-slug"));
    expect(createServerClientMock).not.toHaveBeenCalled();
  });

  it("checks auth for a protected route and redirects when unauthenticated", async () => {
    const response = await proxy(makeRequest("/list"));
    expect(createServerClientMock).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
  });

  it("allows a protected route through when authenticated", async () => {
    getClaimsMock.mockResolvedValue({
      data: { claims: { sub: "user-1" } },
      error: null,
    });

    const response = await proxy(makeRequest("/settings/profile"));
    expect(createServerClientMock).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
  });
});
