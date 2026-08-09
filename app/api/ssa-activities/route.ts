import { NextResponse } from "next/server";

export const runtime = "nodejs";

const statuses = ["planned", "in_progress", "blocked", "done"] as const;
const priorities = ["low", "medium", "high"] as const;

type ActivityStatus = (typeof statuses)[number];
type ActivityPriority = (typeof priorities)[number];

type ActivityInput = {
  title: string;
  owner: string;
  status: ActivityStatus;
  priority: ActivityPriority;
  due_date: string | null;
  notes: string;
};

function readText(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function readDate(value: unknown) {
  if (typeof value !== "string" || !value) {
    return null;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function parseActivity(value: unknown): ActivityInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const body = value as Record<string, unknown>;
  const title = readText(body.title, 180);
  const owner = readText(body.owner, 100);
  const status = body.status;
  const priority = body.priority;

  if (
    !title ||
    !owner ||
    !statuses.includes(status as ActivityStatus) ||
    !priorities.includes(priority as ActivityPriority)
  ) {
    return null;
  }

  return {
    title,
    owner,
    status: status as ActivityStatus,
    priority: priority as ActivityPriority,
    due_date: readDate(body.due_date),
    notes: readText(body.notes, 2000),
  };
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
    {
      error:
        "The activity sheet is not connected yet. Add SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) to the server environment and restart the site.",
    },
    { status: 503 },
  );
}

async function supabaseRequest(
  config: { url: string; key: string },
  path: string,
  options: RequestInit,
) {
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

  if (!config) {
    return unavailable();
  }

  try {
    const response = await supabaseRequest(
      config,
      "ssa_activities?select=*&order=created_at.desc",
      { method: "GET" },
    );
    const activities = await response.json();
    return NextResponse.json({ activities });
  } catch {
    return NextResponse.json(
      { error: "We could not load the activity sheet. Please try again." },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  const config = supabaseConfig();

  if (!config) {
    return unavailable();
  }

  let activity: ActivityInput | null = null;

  try {
    activity = parseActivity(await request.json());
  } catch {
    return NextResponse.json(
      { error: "The activity details could not be read." },
      { status: 400 },
    );
  }

  if (!activity) {
    return NextResponse.json(
      { error: "Add an activity, owner, status, and priority before saving." },
      { status: 400 },
    );
  }

  try {
    const response = await supabaseRequest(config, "ssa_activities", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(activity),
    });
    const [created] = await response.json();
    return NextResponse.json({ activity: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "We could not save this activity. Please try again." },
      { status: 502 },
    );
  }
}
