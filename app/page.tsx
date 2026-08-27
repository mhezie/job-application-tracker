"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Status = "saved" | "applied" | "oa" | "interview" | "offer" | "rejected";

type Application = {
  id: number;
  company: string;
  job_title: string;
  status: Status;
  applied_date: string | null;
  job_url: string | null;
  notes: string | null;
};

const STATUSES: Status[] = [
  "saved",
  "applied",
  "oa",
  "interview",
  "offer",
  "rejected",
];

const STATUS_LABEL: Record<Status, string> = {
  saved: "Saved",
  applied: "Applied",
  oa: "OA",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

const STATUS_CLASS: Record<Status, string> = {
  saved: "bg-gray-100 text-gray-700",
  applied: "bg-blue-100 text-blue-700",
  oa: "bg-yellow-100 text-yellow-800",
  interview: "bg-purple-100 text-purple-700",
  offer: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function HomePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [rows, setRows] = useState<Application[]>([]);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<Status>("applied");
  const [appliedDate, setAppliedDate] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [notes, setNotes] = useState("");

  async function load() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      router.push("/login");
      return;
    }
    setEmail(user.email ?? "");
    const { data, error: qErr } = await supabase
      .from("applications")
      .select("id, company, job_title, status, applied_date, job_url, notes")
      .order("created_at", { ascending: false });
    if (qErr) setError(qErr.message);
    else setRows((data as Application[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [router]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        router.push("/login");
        return;
      }
      const { error: insErr } = await supabase.from("applications").insert({
        user_id: user.id,
        company,
        job_title: role,
        status,
        applied_date: appliedDate || null,
        job_url: jobUrl || null,
        notes: notes || null,
      });
      if (insErr) {
        setError(insErr.message);
        return;
      }
      setCompany("");
      setRole("");
      setStatus("applied");
      setAppliedDate("");
      setJobUrl("");
      setNotes("");
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(id: number, next: Status) {
    const { error: uErr } = await supabase
      .from("applications")
      .update({ status: next })
      .eq("id", id);
    if (uErr) setError(uErr.message);
    else setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)));
  }

  async function handleDelete(id: number) {
    const { error: dErr } = await supabase.from("applications").delete().eq("id", id);
    if (dErr) setError(dErr.message);
    else setRows((prev) => prev.filter((r) => r.id !== id));
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const visible =
    filter === "all" ? rows : rows.filter((r) => r.status === filter);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold">Job Tracker</h1>
            <p className="text-sm text-gray-500">{email}</p>
          </div>
          <button
            onClick={logout}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <form
          onSubmit={handleAdd}
          className="mb-8 space-y-3 rounded-2xl border bg-white p-6"
        >
          <h2 className="font-semibold">Add application</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company (e.g. Amazon)"
              className="rounded-lg border px-3 py-2"
              required
            />
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Role (e.g. SDE intern)"
              className="rounded-lg border px-3 py-2"
              required
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              className="rounded-lg border px-3 py-2"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={appliedDate}
              onChange={(e) => setAppliedDate(e.target.value)}
              className="rounded-lg border px-3 py-2"
            />
            <input
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="Job URL (optional)"
              className="rounded-lg border px-3 py-2 md:col-span-2"
            />
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              className="rounded-lg border px-3 py-2 md:col-span-2"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-indigo-600 py-3 text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Add"}
          </button>
        </form>

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-full px-3 py-1 text-sm ${
              filter === "all" ? "bg-gray-900 text-white" : "bg-white border"
            }`}
          >
            All ({rows.length})
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-3 py-1 text-sm ${
                filter === s ? "bg-gray-900 text-white" : "bg-white border"
              }`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {visible.map((row) => (
            <div
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4"
            >
              <div>
                <p className="font-semibold">
                  {row.company} · {row.job_title}
                </p>
                {row.applied_date && (
                  <p className="text-xs text-gray-500">{row.applied_date}</p>
                )}
                {row.notes && (
                  <p className="text-sm text-gray-600">{row.notes}</p>
                )}
                {row.job_url && (
                  <a
                    href={row.job_url}
                    className="text-sm text-indigo-600"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Listing
                  </a>
                )}
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={row.status}
                  onChange={(e) =>
                    handleStatus(row.id, e.target.value as Status)
                  }
                  className={`rounded-lg px-2 py-1 text-sm ${STATUS_CLASS[row.status]}`}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleDelete(row.id)}
                  className="text-sm text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}