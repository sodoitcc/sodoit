import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const PNG = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  ),
);

class UnusedWebSocket {
  constructor() {
    throw new Error("Realtime is not used by the security test suite.");
  }
}

function env(name: (typeof REQUIRED_ENV)[number]) {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing required security test environment variable: ${name}`,
    );
  }

  return value;
}

function client(key: string) {
  return createClient(env("NEXT_PUBLIC_SUPABASE_URL"), key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    realtime: {
      transport: UnusedWebSocket as unknown as typeof WebSocket,
    },
  });
}

function projectRefFromUrl(url: string) {
  const match = url.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i);
  return match?.[1] ?? null;
}

function assertSecurityTestGuard() {
  if (process.env.RUN_SECURITY_TESTS !== "true") {
    throw new Error(
      "Security tests are disabled. Set RUN_SECURITY_TESTS=true only for a dedicated, approved Supabase test run.",
    );
  }

  for (const name of REQUIRED_ENV) env(name);

  if (process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Refusing to run: the service-role key must never use a NEXT_PUBLIC_ variable.",
    );
  }

  const targetUrl = env("NEXT_PUBLIC_SUPABASE_URL");
  const targetRef = projectRefFromUrl(targetUrl);
  const allowedRef = process.env.SECURITY_TEST_SUPABASE_PROJECT_REF;

  if (!allowedRef) {
    throw new Error(
      "Refusing to run: SECURITY_TEST_SUPABASE_PROJECT_REF is not set. " +
        "Security tests create and delete live rows and must target a dedicated test Supabase project, never production. " +
        "Set SECURITY_TEST_SUPABASE_PROJECT_REF to the test project's ref to enable this suite.",
    );
  }

  if (!targetRef || targetRef !== allowedRef) {
    throw new Error(
      `Refusing to run: NEXT_PUBLIC_SUPABASE_URL does not match the approved test project (SECURITY_TEST_SUPABASE_PROJECT_REF=${allowedRef}). ` +
        "This guard exists to stop destructive security fixtures from ever running against production.",
    );
  }
}

export interface SecurityFixture {
  admin: SupabaseClient;
  anon: SupabaseClient;
  userA: SupabaseClient;
  userB: SupabaseClient;
  aId: string;
  bId: string;
  runId: string;
  experienceIds: {
    main: string;
    ownList: string;
    privateList: string;
    publicList: string;
    achievement: string;
    deletion: string;
    forgedAuthenticated: string;
    forgedAnon: string;
  };
  guideIds: {
    public: string;
    private: string;
    forgedAuthenticated: string;
    forgedAnon: string;
  };
  guideItemIds: {
    public: string;
    private: string;
    forgedAuthenticated: string;
    forgedAnon: string;
  };
  legacyIds: {
    completion: string;
  };
  storage: {
    aAvatar: string;
    bAvatar: string;
    bForgedAvatar: string;
    experienceImage: string;
    forgedExperienceImage: string;
  };
  image: Uint8Array;
}

function requireSuccess(
  result: { error: { message: string } | null },
  operation: string,
) {
  if (result.error) {
    throw new Error(`${operation}: ${result.error.message}`);
  }
}

async function signIn(email: string, password: string) {
  const supabase = client(env("NEXT_PUBLIC_SUPABASE_ANON_KEY"));
  const result = await supabase.auth.signInWithPassword({ email, password });
  requireSuccess(result, `Sign in ${email.split("@")[0]}`);
  return supabase;
}

export async function createSecurityFixture(): Promise<SecurityFixture> {
  assertSecurityTestGuard();

  const admin = client(env("SUPABASE_SERVICE_ROLE_KEY"));
  const anon = client(env("NEXT_PUBLIC_SUPABASE_ANON_KEY"));
  const runId = `${Date.now().toString(36)}${crypto.randomUUID().slice(0, 6)}`;
  const password = `Sodoit-${crypto.randomUUID()}-9aA!`;
  const aEmail = `security-a-${runId}@example.com`;
  const bEmail = `security-b-${runId}@example.com`;
  const aUsername = `seca_${runId.slice(-10)}`;
  const bUsername = `secb_${runId.slice(-10)}`;
  let aId = "";
  let bId = "";

  const experienceIds = {
    main: crypto.randomUUID(),
    ownList: crypto.randomUUID(),
    privateList: crypto.randomUUID(),
    publicList: crypto.randomUUID(),
    achievement: crypto.randomUUID(),
    deletion: crypto.randomUUID(),
    forgedAuthenticated: crypto.randomUUID(),
    forgedAnon: crypto.randomUUID(),
  };
  const guideIds = {
    public: crypto.randomUUID(),
    private: crypto.randomUUID(),
    forgedAuthenticated: crypto.randomUUID(),
    forgedAnon: crypto.randomUUID(),
  };
  const guideItemIds = {
    public: crypto.randomUUID(),
    private: crypto.randomUUID(),
    forgedAuthenticated: crypto.randomUUID(),
    forgedAnon: crypto.randomUUID(),
  };
  const legacyIds = {
    completion: crypto.randomUUID(),
  };

  try {
    const createdA = await admin.auth.admin.createUser({
      email: aEmail,
      password,
      email_confirm: true,
      user_metadata: { username: aUsername },
    });
    requireSuccess(createdA, "Create User A");
    aId = createdA.data.user?.id ?? "";

    const createdB = await admin.auth.admin.createUser({
      email: bEmail,
      password,
      email_confirm: true,
      user_metadata: { username: bUsername },
    });
    requireSuccess(createdB, "Create User B");
    bId = createdB.data.user?.id ?? "";

    if (!aId || !bId)
      throw new Error("Supabase did not return both test user IDs.");

    requireSuccess(
      await admin.from("profiles").upsert([
        { id: aId, username: aUsername, bio: `security-a-${runId}` },
        { id: bId, username: bUsername, bio: `security-b-${runId}` },
      ]),
      "Prepare profiles",
    );

    requireSuccess(
      await admin.from("experiences").insert(
        (
          [
            "main",
            "ownList",
            "privateList",
            "publicList",
            "achievement",
          ] as const
        ).map((name) => ({
          id: experienceIds[name],
          title: `Security ${name} ${runId}`,
          slug: `security-${name}-${runId}`,
          category: "Adventure",
          description: `Temporary security fixture ${runId}`,
          difficulty: "Easy",
          is_public: true,
          saved_count: 0,
          completed_count: 0,
        })),
      ),
      "Prepare experiences",
    );

    requireSuccess(
      await admin.from("guides").insert([
        {
          id: guideIds.public,
          slug: `security-public-${runId}`,
          title: `Security public guide ${runId}`,
          city: "Prague",
          country_code: "CZ",
          is_public: true,
        },
        {
          id: guideIds.private,
          slug: `security-private-${runId}`,
          title: `Security private guide ${runId}`,
          city: "Prague",
          country_code: "CZ",
          is_public: false,
        },
      ]),
      "Prepare guides",
    );

    requireSuccess(
      await admin.from("guide_items").insert([
        {
          id: guideItemIds.public,
          guide_id: guideIds.public,
          position: 0,
          title: `Security public item ${runId}`,
        },
        {
          id: guideItemIds.private,
          guide_id: guideIds.private,
          position: 0,
          title: `Security private item ${runId}`,
        },
      ]),
      "Prepare guide items",
    );

    requireSuccess(
      await admin.from("user_lists").insert([
        {
          user_id: bId,
          experience_id: experienceIds.privateList,
          status: "saved",
        },
        {
          user_id: bId,
          experience_id: experienceIds.publicList,
          status: "completed",
        },
      ]),
      "Prepare User B lists",
    );

    requireSuccess(
      await admin.from("completions").insert({
        id: legacyIds.completion,
        user_id: bId,
        experience_id: experienceIds.main,
        note: `security-${runId}`,
      }),
      "Prepare completion",
    );

    const storage = {
      aAvatar: `${aId}/avatar.png`,
      bAvatar: `${bId}/avatar.png`,
      bForgedAvatar: `${bId}/avatar.jpg`,
      experienceImage: `security-tests/${runId}.png`,
      forgedExperienceImage: `security-tests/${runId}-forged.png`,
    };

    requireSuccess(
      await admin.storage.from("avatars").upload(storage.bAvatar, PNG, {
        contentType: "image/png",
        upsert: true,
      }),
      "Prepare User B avatar",
    );
    requireSuccess(
      await admin.storage
        .from("experience-images")
        .upload(storage.experienceImage, PNG, {
          contentType: "image/png",
          upsert: true,
        }),
      "Prepare experience image",
    );

    return {
      admin,
      anon,
      userA: await signIn(aEmail, password),
      userB: await signIn(bEmail, password),
      aId,
      bId,
      runId,
      experienceIds,
      guideIds,
      guideItemIds,
      legacyIds,
      storage,
      image: PNG,
    };
  } catch (error) {
    await cleanupSecurityFixture({
      admin,
      aId,
      bId,
      experienceIds,
      guideIds,
      guideItemIds,
      runId,
    });
    throw error;
  }
}

interface PartialFixture {
  admin: SupabaseClient;
  aId: string;
  bId: string;
  experienceIds: SecurityFixture["experienceIds"];
  guideIds: SecurityFixture["guideIds"];
  guideItemIds: SecurityFixture["guideItemIds"];
  runId: string;
}

export async function cleanupSecurityFixture(fixture: PartialFixture) {
  const { admin, aId, bId, experienceIds, guideIds, guideItemIds, runId } =
    fixture;
  const errors: string[] = [];
  const ids = [aId, bId].filter(Boolean);
  const experienceIdList = Object.values(experienceIds);
  const guideIdList = Object.values(guideIds);
  const guideItemIdList = Object.values(guideItemIds);
  const clean = async (
    operation: string,
    work: () => PromiseLike<{ error: { message: string } | null }>,
  ) => {
    try {
      const result = await work();
      if (result.error) errors.push(`${operation}: ${result.error.message}`);
    } catch (error) {
      errors.push(
        `${operation}: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }
  };

  if (ids.length) {
    await clean("Remove avatar objects", () =>
      admin.storage
        .from("avatars")
        .remove(
          ids.flatMap((id) => [
            `${id}/avatar.jpg`,
            `${id}/avatar.png`,
            `${id}/avatar.webp`,
          ]),
        ),
    );
  }
  await clean("Remove experience image objects", () =>
    admin.storage
      .from("experience-images")
      .remove([
        `security-tests/${runId}.png`,
        `security-tests/${runId}-forged.png`,
      ]),
  );

  for (const table of [
    "user_achievements",
    "user_lists",
    "completions",
    "rate_limits",
  ]) {
    if (ids.length) {
      await clean(`Clean ${table}`, () =>
        admin.from(table).delete().in("user_id", ids),
      );
    }
  }

  if (experienceIdList.length) {
    await clean("Clean experiences", () =>
      admin.from("experiences").delete().in("id", experienceIdList),
    );
  }
  await clean("Clean guides", () =>
    admin.from("guides").delete().in("id", guideIdList),
  );

  for (const id of ids) {
    const existing = await admin.auth.admin.getUserById(id);

    if (existing.error && existing.error.status !== 404) {
      errors.push(
        `Find Auth user ${id.slice(0, 8)}: ${existing.error.message}`,
      );
    }

    if (existing.data.user) {
      await clean(`Delete Auth user ${id.slice(0, 8)}`, async () => {
        const result = await admin.auth.admin.deleteUser(id);
        return { error: result.error };
      });
    }
  }

  if (ids.length) {
    const profiles = await admin.from("profiles").select("id").in("id", ids);
    if (profiles.error)
      errors.push(`Verify profile cleanup: ${profiles.error.message}`);
    if (profiles.data?.length)
      errors.push("Profile cleanup left test rows behind.");

    for (const table of [
      "user_achievements",
      "user_lists",
      "completions",
      "rate_limits",
    ]) {
      const rows = await admin.from(table).select("*").in("user_id", ids);
      if (rows.error)
        errors.push(`Verify ${table} cleanup: ${rows.error.message}`);
      if (rows.data?.length)
        errors.push(`${table} cleanup left test rows behind.`);
    }
    for (const id of ids) {
      const authUser = await admin.auth.admin.getUserById(id);
      if (authUser.data.user)
        errors.push("Auth cleanup left a test user behind.");
      if (authUser.error && authUser.error.status !== 404) {
        errors.push(`Verify Auth cleanup: ${authUser.error.message}`);
      }
      const avatars = await admin.storage.from("avatars").list(id);
      if (avatars.error)
        errors.push(`Verify avatar cleanup: ${avatars.error.message}`);
      if (avatars.data?.length)
        errors.push("Avatar cleanup left test objects behind.");
    }
  }
  const experiences = await admin
    .from("experiences")
    .select("id")
    .in("id", experienceIdList);
  if (experiences.error)
    errors.push(`Verify experience cleanup: ${experiences.error.message}`);
  if (experiences.data?.length)
    errors.push("Experience cleanup left test rows behind.");
  const guides = await admin.from("guides").select("id").in("id", guideIdList);
  if (guides.error)
    errors.push(`Verify guide cleanup: ${guides.error.message}`);
  if (guides.data?.length) errors.push("Guide cleanup left test rows behind.");
  const guideItems = await admin
    .from("guide_items")
    .select("id")
    .in("id", guideItemIdList);
  if (guideItems.error)
    errors.push(`Verify guide-item cleanup: ${guideItems.error.message}`);
  if (guideItems.data?.length)
    errors.push("Guide-item cleanup left test rows behind.");
  const images = await admin.storage
    .from("experience-images")
    .list("security-tests", {
      search: runId,
    });
  if (images.error)
    errors.push(`Verify image cleanup: ${images.error.message}`);
  if (images.data?.length)
    errors.push("Experience-image cleanup left test objects behind.");

  if (errors.length) {
    throw new Error(`Security test cleanup failed:\n${errors.join("\n")}`);
  }
}

export async function adminRow(
  fixture: SecurityFixture,
  table: string,
  column: string,
  value: string,
) {
  const result = await fixture.admin
    .from(table)
    .select("*")
    .eq(column, value)
    .maybeSingle();
  requireSuccess(result, `Verify ${table}`);
  return result.data as Record<string, unknown> | null;
}

export async function storageBytes(
  fixture: SecurityFixture,
  bucket: "avatars" | "experience-images",
  path: string,
) {
  const result = await fixture.admin.storage.from(bucket).download(path);
  requireSuccess(result, `Download ${bucket}/${path}`);
  if (!result.data)
    throw new Error(`Missing Storage object: ${bucket}/${path}`);
  return new Uint8Array(await result.data.arrayBuffer());
}

export async function storageObjectExists(
  fixture: SecurityFixture,
  bucket: "avatars" | "experience-images",
  path: string,
) {
  const separator = path.lastIndexOf("/");
  const folder = separator === -1 ? "" : path.slice(0, separator);
  const name = path.slice(separator + 1);
  const result = await fixture.admin.storage.from(bucket).list(folder, {
    limit: 100,
    search: name,
  });
  requireSuccess(result, `List ${bucket}/${folder}`);
  return result.data?.some((object) => object.name === name) ?? false;
}
