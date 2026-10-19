"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  PiArrowClockwiseDuotone,
  PiCalendarBlankDuotone,
  PiCaretDownDuotone,
  PiCheckCircleDuotone,
  PiCircleNotchDuotone,
  PiClipboardTextDuotone,
  PiClockDuotone,
  PiPencilSimpleDuotone,
  PiFlagDuotone,
  PiListChecksDuotone,
  PiMagnifyingGlassDuotone,
  PiPlusDuotone,
  PiSlidersHorizontalDuotone,
  PiWarningCircleDuotone,
  PiXDuotone,
} from "react-icons/pi";

type ActivityStatus = "planned" | "in_progress" | "blocked" | "done";
type ActivityCategory = "marketing" | "website" | "admissions_events";
type ActivityGroup = "ssa" | "jssa";
type StatusFilter = "all" | ActivityStatus;

type Activity = {
  group: ActivityGroup;
  id: string;
  title: string;
  owner: string;
  category: ActivityCategory;
  status: ActivityStatus;
  start_date: string | null;
  notes: string;
  created_at: string;
};

type ActivityForm = {
  group: ActivityGroup;
  title: string;
  owner: string;
  category: ActivityCategory;
  status: ActivityStatus;
  notes: string;
};

type FormErrors = Partial<Record<keyof ActivityForm, string>>;
type OptionalColumn = "start_date" | "owner" | "category" | "status" | "notes";

const activityGroups: Array<{ id: ActivityGroup; label: string }> = [
  { id: "ssa", label: "SSA Activity" },
  { id: "jssa", label: "JSSA Activity" },
];

const categories: Array<{
  id: ActivityCategory;
  label: string;
  shortLabel: string;
  description: string;
  placeholder: string;
}> = [
  {
    id: "marketing",
    label: "Marketing activities",
    shortLabel: "Marketing",
    description: "Campaigns, content, partnerships, and outreach",
    placeholder: "e.g. Finalise the campaign calendar",
  },
  {
    id: "website",
    label: "Website activities",
    shortLabel: "Website",
    description: "Pages, content, fixes, and site improvements",
    placeholder: "e.g. Publish the new admissions page",
  },
  {
    id: "admissions_events",
    label: "Admissions & events",
    shortLabel: "Admissions",
    description: "Enrolment follow-ups, school visits, and events",
    placeholder: "e.g. Prepare the open-house registration desk",
  },
];

const statusText: Record<ActivityStatus, string> = {
  planned: "Planned",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
};

const statusFilters: StatusFilter[] = ["all", "planned", "in_progress", "blocked", "done"];

const optionalColumns: Array<{ id: OptionalColumn; label: string }> = [
  { id: "start_date", label: "Start date" },
  { id: "owner", label: "Owner" },
  { id: "category", label: "Category" },
  { id: "status", label: "Status" },
  { id: "notes", label: "Notes / remark" },
];

function createInitialForm(category: ActivityCategory, group: ActivityGroup): ActivityForm {
  return {
    group,
    title: "",
    owner: "",
    category,
    status: "planned",
    notes: "",
  };
}

function formFromActivity(activity: Activity): ActivityForm {
  return {
    group: activity.group,
    title: activity.title,
    owner: activity.owner,
    category: activity.category,
    status: activity.status,
    notes: activity.notes,
  };
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function validateField(field: keyof ActivityForm, value: string) {
  if (field === "title" && !value.trim()) return "Add a task or activity.";
  if (field === "owner" && !value.trim()) return "Add the person responsible.";
  return undefined;
}

function FieldError({ message }: { message?: string }) {
  return message ? <span className="ssa-field-error">{message}</span> : null;
}

function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  const tabs = Array.from(event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)') ?? []);
  if (!tabs.length) return;
  event.preventDefault();
  const index = tabs.indexOf(event.currentTarget);
  const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1
    : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
  tabs[nextIndex].focus();
  tabs[nextIndex].click();
}

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit, timeout = 12_000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

export default function SSAActivitySheet() {
  const [activeGroup, setActiveGroup] = useState<ActivityGroup>("ssa");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [form, setForm] = useState<ActivityForm>(() => createInitialForm("website", "ssa"));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [compactRows, setCompactRows] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<OptionalColumn, boolean>>({
    start_date: true,
    owner: true,
    category: true,
    status: true,
    notes: true,
  });
  const formPanelRef = useRef<HTMLElement>(null);
  const activitySheetRef = useRef<HTMLDivElement>(null);
  const activityInputRef = useRef<HTMLTextAreaElement>(null);

  const loadActivities = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchWithTimeout("/api/ssa-activities", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to load activities.");
      setActivities(result.activities ?? []);
    } catch (caught) {
      setError(caught instanceof Error && caught.name === "AbortError"
        ? "The activity sheet is taking too long to respond. Please try again."
        : caught instanceof Error ? caught.message : "Unable to load activities.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadActivities();
  }, []);

  useEffect(() => {
    if (!successMessage) return;
    const timeout = window.setTimeout(() => setSuccessMessage(""), 4_500);
    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  const formCategoryData = categories.find((category) => category.id === form.category) ?? categories[1];
  const activeGroupLabel = activityGroups.find((group) => group.id === activeGroup)!.label;
  const groupActivities = useMemo(
    () => activities.filter((activity) => activity.group === activeGroup),
    [activeGroup, activities],
  );
  const counts = useMemo(
    () => groupActivities.reduce(
      (current, activity) => ({ ...current, [activity.status]: current[activity.status] + 1 }),
      { planned: 0, in_progress: 0, blocked: 0, done: 0 } as Record<ActivityStatus, number>,
    ),
    [groupActivities],
  );
  const visibleActivities = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return groupActivities.filter((activity) => {
      const matchesStatus = statusFilter === "all" || activity.status === statusFilter;
      const matchesSearch = !normalizedQuery || [
        activity.title,
        activity.owner,
        activity.notes,
      ].join(" ").toLowerCase().includes(normalizedQuery);
      return matchesStatus && matchesSearch;
    });
  }, [groupActivities, searchQuery, statusFilter]);

  const updateForm = <K extends keyof ActivityForm>(field: K, value: ActivityForm[K]) => {
    setForm({ ...form, [field]: value });
    setFormErrors((current) => ({
      ...current,
      [field]: validateField(field, String(value)),
    }));
    setFormError("");
    setSuccessMessage("");
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};
    (Object.keys(form) as Array<keyof ActivityForm>).forEach((field) => {
      const fieldError = validateField(field, String(form[field]));
      if (fieldError) nextErrors[field] = fieldError;
    });
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitActivity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");
    if (!validateForm()) return;

    setSaving(true);
    try {
      const isEditing = Boolean(editingId);
      const response = await fetchWithTimeout("/api/ssa-activities", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEditing ? { id: editingId, ...form } : form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to save activity.");
      const previousEditingId = editingId;
      setActivities((current) => isEditing
        ? current.map((activity) => activity.id === previousEditingId ? result.activity : activity)
        : [result.activity, ...current]);
      setActiveGroup(result.activity.group);
      setForm(createInitialForm(result.activity.category, result.activity.group));
      setEditingId(null);
      setFormErrors({});
      setStatusFilter("all");
      setSuccessMessage(isEditing ? "Activity updated." : `Added to ${(categories.find((category) => category.id === result.activity.category) ?? categories[1]).label.toLowerCase()}.`);
      activityInputRef.current?.focus();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Unable to save activity.");
    } finally {
      setSaving(false);
    }
  };

  const chooseGroup = (group: ActivityGroup) => {
    if (group === activeGroup || saving) return;
    setActiveGroup(group);
    setEditingId(null);
    setForm(createInitialForm(form.category, group));
    setFormErrors({});
    setFormError("");
    setStatusFilter("all");
    setSearchQuery("");
    setSuccessMessage("");
    setSettingsOpen(false);
  };

  const filterFromSummary = (filter: StatusFilter) => {
    setStatusFilter(filter);
    activitySheetRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const focusForm = () => {
    formPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => activityInputRef.current?.focus(), 350);
  };

  const editActivity = (activity: Activity) => {
    setEditingId(activity.id);
    setForm(formFromActivity(activity));
    setFormErrors({});
    setFormError("");
    setSuccessMessage("");
    setActiveGroup(activity.group);
    formPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => activityInputRef.current?.focus(), 350);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setForm(createInitialForm(form.category, activeGroup));
    setFormErrors({});
    setFormError("");
  };

  return (
    <div className="ssa-activity-page">
      {successMessage ? <div className="ssa-success-toast" role="status"><PiCheckCircleDuotone aria-hidden="true" />{successMessage}</div> : null}
      <section className="ssa-hero">
        <div className="ssa-wrap ssa-hero-grid">
          <div className="ssa-hero-copy">
            <span className="eyebrow">{activeGroup.toUpperCase()} team workboard</span>
            <h1>Team activity desk</h1>
            <p className="ssa-hero-lead">Plan clearly. Move work forward.</p>
            <p>Log the team&apos;s activity, assign an owner, and keep every task moving from plan to completion.</p>
          </div>
          <div className="ssa-summary" aria-label={`${activeGroupLabel} summary`}>
            <button type="button" className={statusFilter === "all" ? "is-active" : ""} aria-pressed={statusFilter === "all"} aria-controls="ssa-activity-list" onClick={() => filterFromSummary("all")}>
              <PiListChecksDuotone aria-hidden="true" /><span><strong>{groupActivities.length}</strong>All work</span>
            </button>
            <button type="button" className={statusFilter === "planned" ? "is-active" : ""} aria-pressed={statusFilter === "planned"} aria-controls="ssa-activity-list" onClick={() => filterFromSummary("planned")}>
              <PiCalendarBlankDuotone aria-hidden="true" /><span><strong>{counts.planned}</strong>Planned</span>
            </button>
            <button type="button" className={statusFilter === "in_progress" ? "is-active" : ""} aria-pressed={statusFilter === "in_progress"} aria-controls="ssa-activity-list" onClick={() => filterFromSummary("in_progress")}>
              <PiClockDuotone aria-hidden="true" /><span><strong>{counts.in_progress}</strong>In progress</span>
            </button>
            <button type="button" className={statusFilter === "done" ? "is-active" : ""} aria-pressed={statusFilter === "done"} aria-controls="ssa-activity-list" onClick={() => filterFromSummary("done")}>
              <PiFlagDuotone aria-hidden="true" /><span><strong>{counts.done}</strong>Done</span>
            </button>
          </div>
        </div>
      </section>

      <nav className="ssa-group-nav" aria-label="Activity sheets">
        <div className="ssa-wrap ssa-group-tabs" role="tablist" aria-label="Activity sheets">
          {activityGroups.map((group) => (
            <button
              key={group.id}
              id={`ssa-group-tab-${group.id}`}
              type="button"
              role="tab"
              aria-selected={group.id === activeGroup}
              aria-controls="ssa-group-panel"
              tabIndex={group.id === activeGroup ? 0 : -1}
              className={group.id === activeGroup ? "is-active" : ""}
              disabled={saving}
              onClick={() => chooseGroup(group.id)}
              onKeyDown={handleTabKeyDown}
            >
              {group.label}
            </button>
          ))}
        </div>
      </nav>

      <div id="ssa-group-panel" role="tabpanel" aria-labelledby={`ssa-group-tab-${activeGroup}`}>
      <section id="ssa-workboard-panel" className="ssa-workspace">
        <div className="ssa-wrap ssa-workspace-grid">
          <section ref={formPanelRef} className="ssa-entry-panel" aria-labelledby="ssa-entry-title">
            <div className="ssa-panel-heading">
              <div><p className="eyebrow">{editingId ? "Editing activity" : "New update"}</p><h2 id="ssa-entry-title">{editingId ? "Edit activity" : "Add activity"}</h2></div>
              <span className="ssa-panel-icon">{editingId ? <PiPencilSimpleDuotone aria-hidden="true" /> : <PiPlusDuotone aria-hidden="true" />}</span>
            </div>
            <p className="ssa-form-context">{editingId ? "Change any detail below, then save your update." : <>Adding to <strong>{activeGroupLabel} / {formCategoryData.label}</strong></>}</p>

            <form className="ssa-form" onSubmit={submitActivity} noValidate>
              <label className="ssa-form-title">
                <span className="ssa-field-label">Task / activity <span aria-hidden="true">*</span></span>
                <textarea
                  ref={activityInputRef}
                  value={form.title}
                  onChange={(event) => updateForm("title", event.target.value)}
                  onBlur={() => setFormErrors((current) => ({ ...current, title: validateField("title", form.title) }))}
                  aria-invalid={Boolean(formErrors.title)}
                  maxLength={180}
                  rows={1}
                  placeholder={formCategoryData.placeholder}
                />
                <FieldError message={formErrors.title} />
              </label>

              <label className="ssa-form-owner">
                <span className="ssa-field-label">Owner <span aria-hidden="true">*</span></span>
                <input
                  value={form.owner}
                  onChange={(event) => updateForm("owner", event.target.value)}
                  onBlur={() => setFormErrors((current) => ({ ...current, owner: validateField("owner", form.owner) }))}
                  aria-invalid={Boolean(formErrors.owner)}
                  maxLength={100}
                  placeholder="Team member responsible"
                />
                <FieldError message={formErrors.owner} />
              </label>

              <label className="ssa-form-category">
                <span className="ssa-field-label">Category</span>
                <span className="ssa-select-wrap">
                  <select value={form.category} onChange={(event) => updateForm("category", event.target.value as ActivityCategory)}>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
                  </select>
                  <PiCaretDownDuotone aria-hidden="true" />
                </span>
              </label>

              <label className="ssa-form-status">
                <span className="ssa-field-label">Status</span>
                <span className="ssa-select-wrap">
                  <select value={form.status} onChange={(event) => updateForm("status", event.target.value as ActivityStatus)}>
                    {Object.entries(statusText).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <PiCaretDownDuotone aria-hidden="true" />
                </span>
              </label>

              <label className="ssa-form-notes">
                <span className="ssa-field-label">Notes / remark <span className="ssa-optional">optional</span></span>
                <textarea value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} maxLength={2000} rows={1} placeholder="Add a useful hand-off note" />
              </label>

              {formError ? <p className="ssa-form-error" role="alert"><PiWarningCircleDuotone aria-hidden="true" />{formError}</p> : null}
              <div className="ssa-form-actions">
                {editingId ? <button className="ssa-cancel-edit" type="button" onClick={cancelEditing} disabled={saving}>Cancel</button> : null}
                <button className="ssa-save" type="submit" disabled={saving}>
                  {saving ? <PiCircleNotchDuotone className="ssa-spin" aria-hidden="true" /> : editingId ? <PiPencilSimpleDuotone aria-hidden="true" /> : <PiPlusDuotone aria-hidden="true" />}
                  {saving ? "Saving activity" : editingId ? "Save changes" : "Add activity"}
                </button>
              </div>
            </form>
          </section>

          <div id="ssa-activity-list" ref={activitySheetRef} className="ssa-sheet">
            <div className="ssa-sheet-header">
              <div><p className="eyebrow">{activeGroupLabel} sheet</p><h2>Activity workboard</h2><p>Every logged activity for this sheet, across all categories.</p></div>
              <button className="ssa-add-shortcut" type="button" onClick={() => { cancelEditing(); focusForm(); }}><PiPlusDuotone aria-hidden="true" />Add activity</button>
            </div>

            <div className="ssa-list-tools">
              <label className="ssa-search">
                <span className="sr-only">Search activities</span>
                <PiMagnifyingGlassDuotone aria-hidden="true" />
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search task, owner, or note" />
                {searchQuery ? <button type="button" onClick={() => setSearchQuery("")} aria-label="Clear search"><PiXDuotone aria-hidden="true" /></button> : null}
              </label>

              <div className="ssa-tool-actions">
                <button className="ssa-refresh" type="button" onClick={() => void loadActivities()} disabled={loading}>
                  <PiArrowClockwiseDuotone className={loading ? "ssa-spin" : ""} aria-hidden="true" />Refresh
                </button>
                <div className="ssa-settings-wrap">
                  <button className="ssa-settings-button" type="button" onClick={() => setSettingsOpen((open) => !open)} aria-expanded={settingsOpen} aria-haspopup="dialog">
                    <PiSlidersHorizontalDuotone aria-hidden="true" />List settings
                  </button>
                  {settingsOpen ? (
                    <div className="ssa-settings-panel" role="dialog" aria-label="Activity list settings">
                      <div><strong>Visible columns</strong><span>Applies to every activity list</span></div>
                      {optionalColumns.map((column) => (
                        <label key={column.id}>
                          <input type="checkbox" checked={visibleColumns[column.id]} onChange={(event) => setVisibleColumns((current) => ({ ...current, [column.id]: event.target.checked }))} />
                          {column.label}
                        </label>
                      ))}
                      <label className="ssa-density-setting">
                        <input type="checkbox" checked={compactRows} onChange={(event) => setCompactRows(event.target.checked)} />
                        Use compact rows
                      </label>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="ssa-filter-row" aria-label="Filter activities by status">
              {statusFilters.map((status) => (
                <button key={status} type="button" className={statusFilter === status ? "is-active" : ""} onClick={() => setStatusFilter(status)}>
                  {status === "all" ? "All work" : statusText[status]} <span>{status === "all" ? groupActivities.length : counts[status]}</span>
                </button>
              ))}
            </div>

            {loading ? (
              <div className="ssa-loading" aria-label="Loading activities"><span /><span /><span /></div>
            ) : error ? (
              <div className="ssa-state ssa-state-error" role="alert"><PiWarningCircleDuotone aria-hidden="true" /><p>{error}</p><button type="button" onClick={() => void loadActivities()}>Try again</button></div>
            ) : visibleActivities.length === 0 ? (
              <div className="ssa-state">
                <PiClipboardTextDuotone aria-hidden="true" />
                <h3>{groupActivities.length ? "No matching activities" : `Start the ${activeGroupLabel.toLowerCase()} list`}</h3>
                <p>{groupActivities.length ? "Try another search or return to all work." : "Use the form to add the first activity and assign its owner."}</p>
                {groupActivities.length
                  ? <button type="button" onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}>Clear filters</button>
                  : <button type="button" onClick={focusForm}>Add activity</button>}
              </div>
            ) : (
              <div className="ssa-table-wrap">
                <table className={`ssa-table${compactRows ? " is-compact" : ""}`}>
                  <caption className="sr-only">{activeGroupLabel} activities</caption>
                  <thead><tr>
                    <th>SL</th><th>Task / activity name</th>
                    {visibleColumns.start_date ? <th>Start date</th> : null}
                    {visibleColumns.owner ? <th>Owner</th> : null}
                    {visibleColumns.category ? <th>Category</th> : null}
                    {visibleColumns.status ? <th>Status</th> : null}
                    {visibleColumns.notes ? <th>Notes / remark</th> : null}
                    <th className="ssa-actions-heading"><span className="sr-only">Actions</span></th>
                  </tr></thead>
                  <tbody>{visibleActivities.map((activity, index) => (
                    <tr key={activity.id}>
                      <td className="ssa-row-number">{String(index + 1).padStart(2, "0")}</td>
                      <td className="ssa-task-cell"><strong>{activity.title}</strong></td>
                      {visibleColumns.start_date ? <td>{formatDate(activity.start_date)}</td> : null}
                      {visibleColumns.owner ? <td>{activity.owner}</td> : null}
                      {visibleColumns.category ? <td>{(categories.find((category) => category.id === activity.category) ?? categories[1]).label}</td> : null}
                      {visibleColumns.status ? <td><span className={`ssa-status ssa-status-${activity.status}`}>{statusText[activity.status]}</span></td> : null}
                      {visibleColumns.notes ? <td>{activity.notes || "—"}</td> : null}
                      <td className="ssa-actions-cell">
                        <div className="ssa-row-actions">
                          <button className="ssa-edit-button" type="button" onClick={() => editActivity(activity)}><PiPencilSimpleDuotone aria-hidden="true" />Edit</button>
                        </div>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}

            {!loading && !error ? (
              <div className="ssa-table-footer"><span>{visibleActivities.length} of {groupActivities.length} activities shown</span><span><PiSlidersHorizontalDuotone aria-hidden="true" />One column setup for all lists</span></div>
            ) : null}
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
