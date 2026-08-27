"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Status =
  | "saved"
  | "applied"
  | "oa"
  | "interview"
  | "offer"
  | "rejected";

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
  saved: "bg-slate-200 text-slate-800",
  applied: "bg-indigo-100 text-indigo-800",
  oa: "bg-amber-100 text-amber-800",
  interview: "bg-violet-100 text-violet-800",
  offer: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

export default function HomePage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [loading, setLoading] = useState(true);

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<Status>("applied");
  const [appliedDate, setAppliedDate] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setEmail(user.email ?? null);

      const { data, error } = await supabase
        .from("applications")
        .select("id, company, job_title, status, applied_date, job_url, notes")
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setApps((data as Application[]) || []);
      }

      setLoading(false);
    };

    load();
  }, [router]);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("applications")
        .insert({
          user_id: user.id,
          company,
          job_title: role,
          status,
          applied_date: appliedDate || null,
          job_url: jobUrl || null,
          notes: notes || null,
        })
        .select("id, company, job_title, status, applied_date, job_url, notes")
        .single();

      if (error) {
        setError(error.message);
        return;
      }

      if (data) {
        setApps((prev) => [data as Application, ...prev]);
      }

      setCompany("");
      setRole("");
      setStatus("applied");
      setAppliedDate("");
      setJobUrl("");
      setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (id: number, next: Status) => {
    const { error } = await supabase
      .from("applications")
      .update({ status: next })
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    setApps((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: next } : a))
    );
  };

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from("applications").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setApps((prev) => prev.filter((a) => a.id !== id));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const visible =
    filter === "all" ? apps : apps.filter((a) => a.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Job Tracker</h1>
            <p className="text-xs text-gray-500">{email}</p>
          </div>
          <button
            onClick={logout}
            className="text-sm bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Add application</h2>
          <form
            onSubmit={handleAdd}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <input
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company (e.g. Amazon)"
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Role (e.g. SDE intern)"
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
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
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="Job URL (optional)"
              className="px-3 py-2 border border-gray-300 rounded-lg md:col-span-2"
            />
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              className="px-3 py-2 border border-gray-300 rounded-lg md:col-span-2"
            />
            <button
              type="submit"
              disabled={saving}
              className="md:col-span-2 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Add"}
            </button>
          </form>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </section>

        <section>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                filter === "all"
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-300"
              }`}
            >
              All ({apps.length})
            </button>
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  filter === s
                    ? "bg-gray-900 text-white"
                    : "bg-white border border-gray-300"
                }`}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No applications here yet. Add Amazon / Meta above.
            </p>
          ) : (
            <ul className="space-y-3">
              {visible.map((a) => (
                <li
                  key={a.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">
                      {a.company}{" "}
                      <span className="font-normal text-gray-600">
                        · {a.job_title}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {a.applied_date ?? "No date"}
                      {a.job_url ? (
                        <>
                          {" · "}
                          <a
                            href={a.job_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline"
                          >
                            Listing
                          </a>
                        </>
                      ) : null}
                    </p>
                    {a.notes ? (
                      <p className="text-sm text-gray-600 mt-1">{a.notes}</p>
                    ) : null}
                  </div>

                  <select
                    value={a.status}
                    onChange={(e) =>
                      handleStatus(a.id, e.target.value as Status)
                    }
                    className={`px-2 py-1.5 rounded-lg text-sm ${STATUS_CLASS[a.status]}`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => handleDelete(a.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}