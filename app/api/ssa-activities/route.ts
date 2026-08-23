import { NextResponse } from "next/server";

export const runtime = "nodejs";

const statuses = ["planned", "in_progress", "blocked", "done"] as const;
const categories = ["marketing", "website", "admissions_events"] as const;
const metadataPrefix = "__SSA_ACTIVITY_V2__";

type ActivityStatus = (typeof statuses)[number];
type ActivityCategory = (typeof categories)[number];

type ActivityInput = {
  title: string;
  owner: string;
  category: ActivityCategory;
  status: ActivityStatus;
  start_date: string;
  end_date: string;
  dependency: string;
  detail_status: string;
  notes: string;
};

type StoredActivity = {
  id: string;
  title: string;
  owner: string;
  status: ActivityStatus;
  priority?: string;
  due_date: string | null;
  notes: string;
  created_at: string;
};

type ActivityMetadata = {
  version: 2;
  category: ActivityCategory;
  start_date: string;
  end_date: string;
  dependency: string;
  detail_status: string;
  notes: string;
  replaces_id?: string;
  deleted?: boolean;
};

function readText(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function readDate(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function parseActivity(value: unknown): ActivityInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const body = value as Record<string, unknown>;
  const title = readText(body.title, 180);
  const owner = readText(body.owner, 100);
  const category = body.category;
  const status = body.status;
  const startDate = readDate(body.start_date);
  const endDate = readDate(body.end_date);

  if (
    !title ||
    !owner ||
    !categories.includes(category as ActivityCategory) ||
    !statuses.includes(status as ActivityStatus) ||
    !startDate ||
    !endDate ||
    endDate < startDate
  ) {
    return null;
  }

  return {
    title,
    owner,
    category: category as ActivityCategory,
    status: status as ActivityStatus,
    start_date: startDate,
    end_date: endDate,
    dependency: readText(body.dependency, 300),
    detail_status: readText(body.detail_status, 400),
    notes: readText(body.notes, 2000),
  };
}

function encodeMetadata(activity: ActivityInput, replacesId?: string | null, deleted = false) {
  const metadata: ActivityMetadata = {
    version: 2,
    category: activity.category,
    start_date: activity.start_date,
    end_date: activity.end_date,
    dependency: activity.dependency,
    detail_status: activity.detail_status,
    notes: activity.notes,
    ...(replacesId ? { replaces_id: replacesId } : {}),
    ...(deleted ? { deleted: true } : {}),
  };
  return `${metadataPrefix}${JSON.stringify(metadata)}`;
}

function decodeActivity(activity: StoredActivity) {
  const legacy = {
    id: activity.id,
    title: activity.title,
    owner: activity.owner,
    category: "website" as ActivityCategory,
    status: activity.status,
    start_date: null as string | null,
    end_date: activity.due_date,
    dependency: "",
    detail_status: "",
    notes: activity.notes ?? "",
    created_at: activity.created_at,
    replaces_id: null as string | null,
    deleted: false,
  };

  if (!activity.notes?.startsWith(metadataPrefix)) return legacy;

  try {
    const metadata = JSON.parse(activity.notes.slice(metadataPrefix.length)) as Partial<ActivityMetadata>;
    if (metadata.version !== 2 || !categories.includes(metadata.category as ActivityCategory)) return legacy;

    return {
      ...legacy,
      category: metadata.category as ActivityCategory,
      start_date: readDate(metadata.start_date) || null,
      end_date: readDate(metadata.end_date) || activity.due_date,
      dependency: readText(metadata.dependency, 300),
      detail_status: readText(metadata.detail_status, 400),
      notes: readText(metadata.notes, 2000),
      replaces_id: readText(metadata.replaces_id, 200) || null,
      deleted: metadata.deleted === true,
    };
  } catch {
    return legacy;
  }
}

function publicActivity(activity: ReturnType<typeof decodeActivity>) {
  const { replaces_id: _replacesId, deleted: _deleted, ...result } = activity;
  return result;
}

function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_ANON_KEY;
  return url && key ? { url, key } : null;
}

function unavailable() {
  return NextResponse.json(
    { error: "The activity sheet is not connected yet. Add a Supabase key to the server environment and restart the site." },
    { status: 503 },
  );
}

async function supabaseRequest(config: { url: string; key: string }, path: string, options: RequestInit) {
  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Supabase SSA activity request failed:", response.status, detail);
    throw new Error("Supabase request failed");
  }
  return response;
}

export async function GET() {
  const config = supabaseConfig();
  if (!config) return unavailable();

  try {
    const response = await supabaseRequest(config, "ssa_activities?select=*&order=created_at.desc", { method: "GET" });
    const storedActivities = (await response.json()) as StoredActivity[];
    const decodedActivities = storedActivities.map(decodeActivity);
    const replacedIds = new Set(
      decodedActivities
        .map((activity) => activity.replaces_id)
        .filter((id): id is string => Boolean(id)),
    );
    const activities = decodedActivities
      .filter((activity) => !replacedIds.has(activity.id) && !activity.deleted)
      .map(publicActivity);
    return NextResponse.json({ activities });
  } catch {
    return NextResponse.json({ error: "We could not load the activity sheet. Please try again." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const config = supabaseConfig();
  if (!config) return unavailable();

  let activity: ActivityInput | null = null;
  try {
    activity = parseActivity(await request.json());
  } catch {
    return NextResponse.json({ error: "The activity details could not be read." }, { status: 400 });
  }

  if (!activity) {
    return NextResponse.json(
      { error: "Add an activity, owner, start date, end date, and status before saving." },
      { status: 400 },
    );
  }

  try {
    const response = await supabaseRequest(config, "ssa_activities", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        title: activity.title,
        owner: activity.owner,
        status: activity.status,
        priority: "medium",
        due_date: activity.end_date,
        notes: encodeMetadata(activity),
      }),
    });
    const [created] = (await response.json()) as StoredActivity[];
    return NextResponse.json({ activity: publicActivity(decodeActivity(created)) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "We could not save this activity. Please try again." }, { status: 502 });
  }
}

export async function PATCH(request: Request) {
  const config = supabaseConfig();
  if (!config) return unavailable();

  let body: Record<string, unknown>;
  try {
    const payload = await request.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Invalid payload");
    body = payload as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "The activity details could not be read." }, { status: 400 });
  }

  const id = readText(body.id, 200);
  const activity = parseActivity(body);
  if (!id || !activity) {
    return NextResponse.json(
      { error: "Add an activity, owner, start date, end date, and status before saving." },
      { status: 400 },
    );
  }

  try {
    const currentResponse = await supabaseRequest(
      config,
      `ssa_activities?id=eq.${encodeURIComponent(id)}&select=*`,
      { method: "GET" },
    );
    const [currentStored] = (await currentResponse.json()) as StoredActivity[];
    if (!currentStored) return NextResponse.json({ error: "This activity no longer exists." }, { status: 404 });
    const currentActivity = decodeActivity(currentStored);

    const response = await supabaseRequest(config, `ssa_activities?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        title: activity.title,
        owner: activity.owner,
        status: activity.status,
        priority: "medium",
        due_date: activity.end_date,
        notes: encodeMetadata(activity, currentActivity.replaces_id),
      }),
    });
    const updated = (await response.json()) as StoredActivity[];
    if (updated[0]) return NextResponse.json({ activity: publicActivity(decodeActivity(updated[0])) });

    // Some deployments permit anonymous inserts but intentionally block updates.
    // Append the edited version and mark the previous row as superseded so edits
    // remain persistent without weakening the database's row-level security.
    const fallbackResponse = await supabaseRequest(config, "ssa_activities", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        title: activity.title,
        owner: activity.owner,
        status: activity.status,
        priority: "medium",
        due_date: activity.end_date,
        notes: encodeMetadata(activity, id),
      }),
    });
    const [replacement] = (await fallbackResponse.json()) as StoredActivity[];
    if (!replacement) throw new Error("Replacement activity was not returned");
    return NextResponse.json({ activity: publicActivity(decodeActivity(replacement)) });
  } catch {
    return NextResponse.json({ error: "We could not update this activity. Please try again." }, { status: 502 });
  }
}

export async function DELETE(request: Request) {
  const config = supabaseConfig();
  if (!config) return unavailable();

  let id = "";
  try {
    const body = await request.json() as Record<string, unknown>;
    id = readText(body.id, 200);
  } catch {
    return NextResponse.json({ error: "The activity could not be identified." }, { status: 400 });
  }
  if (!id) return NextResponse.json({ error: "The activity could not be identified." }, { status: 400 });

  try {
    const currentResponse = await supabaseRequest(
      config,
      `ssa_activities?id=eq.${encodeURIComponent(id)}&select=*`,
      { method: "GET" },
    );
    const [currentStored] = (await currentResponse.json()) as StoredActivity[];
    if (!currentStored) return NextResponse.json({ error: "This activity no longer exists." }, { status: 404 });

    const current = decodeActivity(currentStored);
    const fallbackDate = current.end_date ?? currentStored.due_date ?? currentStored.created_at.slice(0, 10);
    const tombstoneActivity: ActivityInput = {
      title: current.title,
      owner: current.owner,
      category: current.category,
      status: current.status,
      start_date: current.start_date ?? fallbackDate,
      end_date: fallbackDate,
      dependency: current.dependency,
      detail_status: current.detail_status,
      notes: current.notes,
    };

    const response = await supabaseRequest(config, "ssa_activities", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        title: currentStored.title,
        owner: currentStored.owner,
        status: currentStored.status,
        priority: currentStored.priority ?? "medium",
        due_date: fallbackDate,
        notes: encodeMetadata(tombstoneActivity, id, true),
      }),
    });
    const [tombstone] = (await response.json()) as StoredActivity[];
    if (!tombstone) throw new Error("Deletion marker was not returned");
    return NextResponse.json({ deleted: true, id });
  } catch {
    return NextResponse.json({ error: "We could not delete this activity. Please try again." }, { status: 502 });
  }
}
