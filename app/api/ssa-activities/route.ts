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

function encodeMetadata(activity: ActivityInput) {
  const metadata: ActivityMetadata = {
    version: 2,
    category: activity.category,
    start_date: activity.start_date,
    end_date: activity.end_date,
    dependency: activity.dependency,
    detail_status: activity.detail_status,
    notes: activity.notes,
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
    };
  } catch {
    return legacy;
  }
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
    return NextResponse.json({ activities: storedActivities.map(decodeActivity) });
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
    return NextResponse.json({ activity: decodeActivity(created) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "We could not save this activity. Please try again." }, { status: 502 });
  }
}
