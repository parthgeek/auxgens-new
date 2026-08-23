"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
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
  PiTrashDuotone,
  PiWarningCircleDuotone,
  PiXDuotone,
} from "react-icons/pi";

type ActivityStatus = "planned" | "in_progress" | "blocked" | "done";
type ActivityCategory = "marketing" | "website" | "admissions_events";
type StatusFilter = "all" | ActivityStatus;

type Activity = {
  id: string;
  title: string;
  owner: string;
  category: ActivityCategory;
  status: ActivityStatus;
  start_date: string | null;
  end_date: string | null;
  dependency: string;
  detail_status: string;
  notes: string;
  created_at: string;
};

type ActivityForm = {
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

type FormErrors = Partial<Record<keyof ActivityForm, string>>;
type OptionalColumn = "start_date" | "end_date" | "owner" | "dependency" | "status" | "detail_status" | "notes";

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
  { id: "end_date", label: "End date" },
  { id: "owner", label: "Owner" },
  { id: "dependency", label: "Dependency" },
  { id: "status", label: "Status" },
  { id: "detail_status", label: "Detail status" },
  { id: "notes", label: "Notes / remark" },
];

function createInitialForm(category: ActivityCategory): ActivityForm {
  return {
    title: "",
    owner: "",
    category,
    status: "planned",
    start_date: "",
    end_date: "",
    dependency: "",
    detail_status: "",
    notes: "",
  };
}

function formFromActivity(activity: Activity): ActivityForm {
  return {
    title: activity.title,
    owner: activity.owner,
    category: activity.category,
    status: activity.status,
    start_date: activity.start_date ?? "",
    end_date: activity.end_date ?? "",
    dependency: activity.dependency,
    detail_status: activity.detail_status,
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

function validateField(field: keyof ActivityForm, value: string, form: ActivityForm) {
  if (field === "title" && !value.trim()) return "Add a task or activity.";
  if (field === "owner" && !value.trim()) return "Add the person responsible.";
  if (field === "start_date" && !value) return "Select a start date.";
  if (field === "end_date") {
    if (!value) return "Select an end date.";
    if (form.start_date && value < form.start_date) return "End date must be after the start date.";
  }
  return undefined;
}

function FieldError({ message }: { message?: string }) {
  return message ? <span className="ssa-field-error">{message}</span> : null;
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
  const [activeCategory, setActiveCategory] = useState<ActivityCategory>("website");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [form, setForm] = useState<ActivityForm>(() => createInitialForm("website"));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [compactRows, setCompactRows] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<OptionalColumn, boolean>>({
    start_date: true,
    end_date: true,
    owner: true,
    dependency: true,
    status: true,
    detail_status: true,
    notes: true,
  });
  const formPanelRef = useRef<HTMLElement>(null);
  const activityInputRef = useRef<HTMLInputElement>(null);

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

  const activeCategoryData = categories.find((category) => category.id === activeCategory) ?? categories[1];
  const categoryActivities = useMemo(
    () => activities.filter((activity) => activity.category === activeCategory),
    [activeCategory, activities],
  );
  const counts = useMemo(
    () => categoryActivities.reduce(
      (current, activity) => ({ ...current, [activity.status]: current[activity.status] + 1 }),
      { planned: 0, in_progress: 0, blocked: 0, done: 0 } as Record<ActivityStatus, number>,
    ),
    [categoryActivities],
  );
  const visibleActivities = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return categoryActivities.filter((activity) => {
      const matchesStatus = statusFilter === "all" || activity.status === statusFilter;
      const matchesSearch = !normalizedQuery || [
        activity.title,
        activity.owner,
        activity.dependency,
        activity.detail_status,
        activity.notes,
      ].join(" ").toLowerCase().includes(normalizedQuery);
      return matchesStatus && matchesSearch;
    });
  }, [categoryActivities, searchQuery, statusFilter]);

  const updateForm = <K extends keyof ActivityForm>(field: K, value: ActivityForm[K]) => {
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);
    setFormErrors((current) => ({
      ...current,
      [field]: validateField(field, String(value), nextForm),
      ...(field === "start_date" && nextForm.end_date
        ? { end_date: validateField("end_date", nextForm.end_date, nextForm) }
        : {}),
    }));
    setFormError("");
    setSuccessMessage("");
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};
    (Object.keys(form) as Array<keyof ActivityForm>).forEach((field) => {
      const fieldError = validateField(field, String(form[field]), form);
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
      setActiveCategory(result.activity.category);
      setForm(createInitialForm(result.activity.category));
      setEditingId(null);
      setFormErrors({});
      setStatusFilter("all");
      setSuccessMessage(isEditing ? "Activity updated." : `Added to ${activeCategoryData.label.toLowerCase()}.`);
      activityInputRef.current?.focus();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Unable to save activity.");
    } finally {
      setSaving(false);
    }
  };

  const chooseCategory = (category: ActivityCategory) => {
    setActiveCategory(category);
    if (!editingId) setForm((current) => ({ ...current, category }));
    setStatusFilter("all");
    setSearchQuery("");
    setSuccessMessage("");
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
    setActiveCategory(activity.category);
    formPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => activityInputRef.current?.focus(), 350);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setForm(createInitialForm(activeCategory));
    setFormErrors({});
    setFormError("");
  };

  const deleteActivity = async (activity: Activity) => {
    if (!window.confirm(`Delete "${activity.title}"? This action cannot be undone.`)) return;

    setDeletingId(activity.id);
    setSuccessMessage("");
    try {
      const response = await fetchWithTimeout("/api/ssa-activities", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: activity.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to delete activity.");
      setActivities((current) => current.filter((item) => item.id !== activity.id));
      if (editingId === activity.id) cancelEditing();
      setSuccessMessage(`"${activity.title}" deleted.`);
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Unable to delete activity.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="ssa-activity-page">
      {successMessage ? <div className="ssa-success-toast" role="status"><PiCheckCircleDuotone aria-hidden="true" />{successMessage}</div> : null}
      <section className="ssa-hero">
        <div className="ssa-wrap ssa-hero-grid">
          <div className="ssa-hero-copy">
            <span className="eyebrow">SSA team workboard</span>
            <h1>Team activity desk</h1>
            <p className="ssa-hero-lead">Plan clearly. Move work forward.</p>
            <p>Log the team&apos;s activity, record dependencies, and keep every task moving from plan to completion.</p>
          </div>
          <div className="ssa-summary" aria-label={`${activeCategoryData.label} summary`}>
            <div><PiListChecksDuotone aria-hidden="true" /><span><strong>{categoryActivities.length}</strong>All work</span></div>
            <div><PiCalendarBlankDuotone aria-hidden="true" /><span><strong>{counts.planned}</strong>Planned</span></div>
            <div><PiClockDuotone aria-hidden="true" /><span><strong>{counts.in_progress}</strong>In progress</span></div>
            <div><PiFlagDuotone aria-hidden="true" /><span><strong>{counts.done}</strong>Done</span></div>
          </div>
        </div>
      </section>

      <nav className="ssa-category-nav" aria-label="Activity categories">
        <div className="ssa-wrap ssa-category-tabs" role="tablist">
          {categories.map((category) => {
            const isActive = category.id === activeCategory;
            return (
              <button
                key={category.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls="ssa-workboard-panel"
                className={isActive ? "is-active" : ""}
                onClick={() => chooseCategory(category.id)}
              >
                <strong><span className="ssa-tab-full">{category.label}</span><span className="ssa-tab-short">{category.shortLabel}</span></strong>
                <span>{category.description}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <section id="ssa-workboard-panel" role="tabpanel" className="ssa-workspace">
        <div className="ssa-wrap ssa-workspace-grid">
          <section ref={formPanelRef} className="ssa-entry-panel" aria-labelledby="ssa-entry-title">
            <div className="ssa-panel-heading">
              <div><p className="eyebrow">{editingId ? "Editing activity" : "New update"}</p><h2 id="ssa-entry-title">{editingId ? "Edit activity" : "Add activity"}</h2></div>
              <span className="ssa-panel-icon">{editingId ? <PiPencilSimpleDuotone aria-hidden="true" /> : <PiPlusDuotone aria-hidden="true" />}</span>
            </div>
            <p className="ssa-form-context">{editingId ? "Change any detail below, then save your update." : <>Adding to <strong>{activeCategoryData.label}</strong></>}</p>

            <form className="ssa-form" onSubmit={submitActivity} noValidate>
              <label className="ssa-form-title">
                Task / activity <span aria-hidden="true">*</span>
                <input
                  ref={activityInputRef}
                  value={form.title}
                  onChange={(event) => updateForm("title", event.target.value)}
                  onBlur={() => setFormErrors((current) => ({ ...current, title: validateField("title", form.title, form) }))}
                  aria-invalid={Boolean(formErrors.title)}
                  maxLength={180}
                  placeholder={activeCategoryData.placeholder}
                />
                <FieldError message={formErrors.title} />
              </label>

              <label className="ssa-form-owner">
                Owner <span aria-hidden="true">*</span>
                <input
                  value={form.owner}
                  onChange={(event) => updateForm("owner", event.target.value)}
                  onBlur={() => setFormErrors((current) => ({ ...current, owner: validateField("owner", form.owner, form) }))}
                  aria-invalid={Boolean(formErrors.owner)}
                  maxLength={100}
                  placeholder="Team member responsible"
                />
                <FieldError message={formErrors.owner} />
              </label>

              <label className="ssa-form-category">
                Category
                <span className="ssa-select-wrap">
                  <select value={form.category} onChange={(event) => updateForm("category", event.target.value as ActivityCategory)}>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
                  </select>
                  <PiCaretDownDuotone aria-hidden="true" />
                </span>
              </label>

              <label className="ssa-form-status">
                Status
                <span className="ssa-select-wrap">
                  <select value={form.status} onChange={(event) => updateForm("status", event.target.value as ActivityStatus)}>
                    {Object.entries(statusText).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <PiCaretDownDuotone aria-hidden="true" />
                </span>
              </label>

              <div className="ssa-form-two-column ssa-form-dates">
                <label>
                  Start date <span aria-hidden="true">*</span>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(event) => updateForm("start_date", event.target.value)}
                    onBlur={() => setFormErrors((current) => ({ ...current, start_date: validateField("start_date", form.start_date, form) }))}
                    aria-invalid={Boolean(formErrors.start_date)}
                  />
                  <FieldError message={formErrors.start_date} />
                </label>
                <label>
                  End date <span aria-hidden="true">*</span>
                  <input
                    type="date"
                    min={form.start_date || undefined}
                    value={form.end_date}
                    onChange={(event) => updateForm("end_date", event.target.value)}
                    onBlur={() => setFormErrors((current) => ({ ...current, end_date: validateField("end_date", form.end_date, form) }))}
                    aria-invalid={Boolean(formErrors.end_date)}
                  />
                  <FieldError message={formErrors.end_date} />
                </label>
              </div>

              <label className="ssa-form-dependency">
                Dependency <span className="ssa-optional">optional</span>
                <input value={form.dependency} onChange={(event) => updateForm("dependency", event.target.value)} maxLength={300} placeholder="What must happen first?" />
              </label>

              <label className="ssa-form-detail-status">
                Detail status <span className="ssa-optional">optional</span>
                <input value={form.detail_status} onChange={(event) => updateForm("detail_status", event.target.value)} maxLength={400} placeholder="e.g. Design review in progress" />
              </label>

              <label className="ssa-form-notes">
                Notes / remark <span className="ssa-optional">optional</span>
                <textarea value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} maxLength={2000} rows={3} placeholder="Add a useful hand-off note" />
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

          <div className="ssa-sheet">
            <div className="ssa-sheet-header">
              <div><p className="eyebrow">Live activity sheet</p><h2>{activeCategoryData.shortLabel} workboard</h2><p>{activeCategoryData.description}.</p></div>
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
                  {status === "all" ? "All work" : statusText[status]} <span>{status === "all" ? categoryActivities.length : counts[status]}</span>
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
                <h3>{categoryActivities.length ? "No matching activities" : `Start the ${activeCategoryData.shortLabel.toLowerCase()} list`}</h3>
                <p>{categoryActivities.length ? "Try another search or return to all work." : "Use the form to add the first activity and assign its owner."}</p>
                {categoryActivities.length
                  ? <button type="button" onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}>Clear filters</button>
                  : <button type="button" onClick={focusForm}>Add activity</button>}
              </div>
            ) : (
              <div className="ssa-table-wrap">
                <table className={`ssa-table${compactRows ? " is-compact" : ""}`}>
                  <caption className="sr-only">{activeCategoryData.label}</caption>
                  <thead><tr>
                    <th>SL</th><th>Task / activity name</th>
                    {visibleColumns.start_date ? <th>Start date</th> : null}
                    {visibleColumns.end_date ? <th>End date</th> : null}
                    {visibleColumns.owner ? <th>Owner</th> : null}
                    {visibleColumns.dependency ? <th>Dependency</th> : null}
                    {visibleColumns.status ? <th>Status</th> : null}
                    {visibleColumns.detail_status ? <th>Detail status</th> : null}
                    {visibleColumns.notes ? <th>Notes / remark</th> : null}
                    <th className="ssa-actions-heading"><span className="sr-only">Actions</span></th>
                  </tr></thead>
                  <tbody>{visibleActivities.map((activity, index) => (
                    <tr key={activity.id}>
                      <td className="ssa-row-number">{String(index + 1).padStart(2, "0")}</td>
                      <td className="ssa-task-cell"><strong>{activity.title}</strong></td>
                      {visibleColumns.start_date ? <td>{formatDate(activity.start_date)}</td> : null}
                      {visibleColumns.end_date ? <td>{formatDate(activity.end_date)}</td> : null}
                      {visibleColumns.owner ? <td>{activity.owner}</td> : null}
                      {visibleColumns.dependency ? <td>{activity.dependency || "—"}</td> : null}
                      {visibleColumns.status ? <td><span className={`ssa-status ssa-status-${activity.status}`}>{statusText[activity.status]}</span></td> : null}
                      {visibleColumns.detail_status ? <td>{activity.detail_status || "—"}</td> : null}
                      {visibleColumns.notes ? <td>{activity.notes || "—"}</td> : null}
                      <td className="ssa-actions-cell">
                        <div className="ssa-row-actions">
                          <button className="ssa-edit-button" type="button" onClick={() => editActivity(activity)} disabled={deletingId === activity.id}><PiPencilSimpleDuotone aria-hidden="true" />Edit</button>
                          <button className="ssa-delete-button" type="button" onClick={() => void deleteActivity(activity)} disabled={deletingId === activity.id}>
                            {deletingId === activity.id ? <PiCircleNotchDuotone className="ssa-spin" aria-hidden="true" /> : <PiTrashDuotone aria-hidden="true" />}
                            {deletingId === activity.id ? "Deleting" : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}

            {!loading && !error ? (
              <div className="ssa-table-footer"><span>{visibleActivities.length} of {categoryActivities.length} activities shown</span><span><PiSlidersHorizontalDuotone aria-hidden="true" />One column setup for all lists</span></div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
