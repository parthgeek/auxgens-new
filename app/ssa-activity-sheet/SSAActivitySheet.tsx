"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  PiArrowClockwiseDuotone,
  PiCheckCircleDuotone,
  PiCircleNotchDuotone,
  PiClipboardTextDuotone,
  PiFlagDuotone,
  PiPlusDuotone,
  PiWarningCircleDuotone,
} from "react-icons/pi";

type ActivityStatus = "planned" | "in_progress" | "blocked" | "done";
type ActivityPriority = "low" | "medium" | "high";

type Activity = {
  id: string;
  title: string;
  owner: string;
  status: ActivityStatus;
  priority: ActivityPriority;
  due_date: string | null;
  notes: string;
  created_at: string;
};

type ActivityForm = {
  title: string;
  owner: string;
  status: ActivityStatus;
  priority: ActivityPriority;
  due_date: string;
  notes: string;
};

const initialForm: ActivityForm = {
  title: "",
  owner: "",
  status: "planned",
  priority: "medium",
  due_date: "",
  notes: "",
};

const statusText: Record<ActivityStatus, string> = {
  planned: "Planned",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
};

function formatDate(value: string | null) {
  if (!value) return "No deadline";
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function SSAActivitySheet() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [form, setForm] = useState<ActivityForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ActivityStatus>("all");

  const loadActivities = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/ssa-activities", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to load activities.");
      setActivities(result.activities ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load activities.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadActivities();
  }, []);

  const visibleActivities = useMemo(
    () =>
      statusFilter === "all"
        ? activities
        : activities.filter((activity) => activity.status === statusFilter),
    [activities, statusFilter],
  );

  const counts = useMemo(
    () =>
      activities.reduce(
        (current, activity) => ({
          ...current,
          [activity.status]: current[activity.status] + 1,
        }),
        { planned: 0, in_progress: 0, blocked: 0, done: 0 } as Record<ActivityStatus, number>,
      ),
    [activities],
  );

  const updateForm = <K extends keyof ActivityForm>(field: K, value: ActivityForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submitActivity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    if (!form.title.trim() || !form.owner.trim()) {
      setFormError("Add both an activity and the person responsible for it.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/ssa-activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, due_date: form.due_date || null }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to save activity.");
      setActivities((current) => [result.activity, ...current]);
      setForm(initialForm);
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Unable to save activity.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <section className="ssa-hero">
        <div className="wrap ssa-hero-grid">
          <div className="ssa-hero-copy anim">
            <div className="hero-badge">
              <div className="badge-dot" />
              <span className="eyebrow">Sri Sri Academy workspace</span>
            </div>
            <h1>One clear view of the work in motion.</h1>
            <p>
              Log the team&apos;s SSA activity here, then use the live sheet to see what is planned,
              moving, blocked, or complete.
            </p>
          </div>
          <div className="ssa-summary anim d1" aria-label="Activity summary">
            <div><span>In progress</span><strong>{counts.in_progress}</strong></div>
            <div><span>Blocked</span><strong>{counts.blocked}</strong></div>
            <div><span>Completed</span><strong>{counts.done}</strong></div>
          </div>
        </div>
      </section>

      <section className="ssa-workspace">
        <div className="wrap ssa-workspace-grid">
          <aside className="ssa-entry-panel anim">
            <div className="ssa-panel-heading">
              <PiPlusDuotone aria-hidden="true" />
              <div><p className="eyebrow">New update</p><h2>Add an activity</h2></div>
            </div>
            <form className="ssa-form" onSubmit={submitActivity}>
              <label>
                Activity <span aria-hidden="true">*</span>
                <input value={form.title} onChange={(event) => updateForm("title", event.target.value)} maxLength={180} placeholder="e.g. Finalise campaign calendar" />
              </label>
              <label>
                Owner <span aria-hidden="true">*</span>
                <input value={form.owner} onChange={(event) => updateForm("owner", event.target.value)} maxLength={100} placeholder="Team member responsible" />
              </label>
              <div className="ssa-form-two-column">
                <label>
                  Status
                  <select value={form.status} onChange={(event) => updateForm("status", event.target.value as ActivityStatus)}>
                    {Object.entries(statusText).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label>
                  Priority
                  <select value={form.priority} onChange={(event) => updateForm("priority", event.target.value as ActivityPriority)}>
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                  </select>
                </label>
              </div>
              <label>
                Target date <span className="ssa-optional">optional</span>
                <input type="date" value={form.due_date} onChange={(event) => updateForm("due_date", event.target.value)} />
              </label>
              <label>
                Notes <span className="ssa-optional">optional</span>
                <textarea value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} maxLength={2000} rows={4} placeholder="What is needed next, or what is holding this up?" />
              </label>
              {formError && <p className="ssa-form-error" role="alert"><PiWarningCircleDuotone aria-hidden="true" />{formError}</p>}
              <button className="ssa-save" type="submit" disabled={saving}>
                {saving ? <PiCircleNotchDuotone className="ssa-spin" aria-hidden="true" /> : <PiCheckCircleDuotone aria-hidden="true" />}
                {saving ? "Saving update" : "Save to activity sheet"}
              </button>
            </form>
          </aside>

          <div className="ssa-sheet anim d1">
            <div className="ssa-sheet-header">
              <div><p className="eyebrow">Live activity sheet</p><h2>SSA workboard</h2></div>
              <button className="ssa-refresh" type="button" onClick={() => void loadActivities()} disabled={loading}>
                <PiArrowClockwiseDuotone aria-hidden="true" /> Refresh
              </button>
            </div>
            <div className="ssa-filter-row" aria-label="Filter activities by status">
              {(["all", "planned", "in_progress", "blocked", "done"] as const).map((status) => (
                <button key={status} type="button" className={statusFilter === status ? "is-active" : ""} onClick={() => setStatusFilter(status)}>
                  {status === "all" ? "All work" : statusText[status]} <span>{status === "all" ? activities.length : counts[status]}</span>
                </button>
              ))}
            </div>
            {loading ? <div className="ssa-loading" aria-label="Loading activities"><span /><span /><span /></div> : error ? (
              <div className="ssa-state ssa-state-error" role="alert"><PiWarningCircleDuotone aria-hidden="true" /><p>{error}</p><button type="button" onClick={() => void loadActivities()}>Try again</button></div>
            ) : visibleActivities.length === 0 ? (
              <div className="ssa-state"><PiClipboardTextDuotone aria-hidden="true" /><h3>{activities.length ? "No matching activities" : "The sheet is ready for its first update."}</h3><p>{activities.length ? "Choose another status to see more work." : "Use the form to capture the first SSA task, owner, and next step."}</p></div>
            ) : (
              <div className="ssa-table-wrap"><table className="ssa-table"><thead><tr><th>Activity</th><th>Owner</th><th>Status</th><th>Priority</th><th>Target</th></tr></thead><tbody>{visibleActivities.map((activity) => (
                <tr key={activity.id}><td><strong>{activity.title}</strong>{activity.notes && <span>{activity.notes}</span>}</td><td>{activity.owner}</td><td><span className={`ssa-status ssa-status-${activity.status}`}>{statusText[activity.status]}</span></td><td><span className={`ssa-priority ssa-priority-${activity.priority}`}><PiFlagDuotone aria-hidden="true" />{activity.priority}</span></td><td>{formatDate(activity.due_date)}</td></tr>
              ))}</tbody></table></div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
