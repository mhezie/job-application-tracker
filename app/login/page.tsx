"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const DEMO_EMAIL = "demo@tracker.app";
const DEMO_PASSWORD = "Demo1234!";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn(eMail: string, pwd: string) {
    setError("");
    setLoading(true);
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        setError("Missing NEXT_PUBLIC_SUPABASE_URL on Vercel.");
        return;
      }
      const timed = new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                "Login timed out. Add the Vercel URL in Supabase → Authentication → URL configuration."
              )
            ),
          12000
        )
      );
      const login = supabase.auth.signInWithPassword({
        email: eMail,
        password: pwd,
      });
      const { error: authError } = await Promise.race([login, timed]);
      if (authError) {
        setError(authError.message);
        return;
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await signIn(email, password);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-center text-3xl font-bold text-gray-900">
          Job Tracker
        </h1>
        <p className="mt-2 text-center text-sm text-gray-500">
          Track applications. Same account as the finance app.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="Enter your password"
              required
            />
          </div>
          {error && (
            <p className="text-center text-sm text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-3 font-medium text-white disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <button
          type="button"
          disabled={loading}
          onClick={() => signIn(DEMO_EMAIL, DEMO_PASSWORD)}
          className="mt-3 w-full rounded-lg border border-gray-300 py-3 text-gray-700 disabled:opacity-40"
        >
          Try demo
        </button>
        <p className="mt-2 text-center text-xs text-gray-400">
          Recruiter shortcut — shared demo account
        </p>
        <p className="mt-6 text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="text-indigo-600">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}