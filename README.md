# Job Application Tracker

Full-stack board for graduate job hunting. Log applications, update status, and see the pipeline in one place — same auth as the finance tracker so a recruiter can click through without signing up.

**Live:** https://job-application-tracker-jade-alpha.vercel.app

**Demo login:** `demo@tracker.app` / `Demo1234!`

## What it does

- Email/password auth (Supabase) — shared with the Personal Finance Tracker
- Create, edit, and delete applications (company, role, status, date, URL, notes)
- Dashboard filtered by status (applied, interviewing, offer, rejected)
- Row-level security: each user only sees their own rows
- Dark mode, indigo UI aligned with the finance app

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, Supabase (Auth + Postgres), Vercel.

## Why this exists

After an Amazon OA I needed a tool I would actually use, not a todo clone. The interesting part is not the form — it is **RLS + shared auth** on one Postgres project: two products, one identity, no `localStorage` fake users.

`applications` is scoped with `auth.uid() = user_id` for select / insert / update / delete. Column is `job_title` (not `role` — `role` is reserved in Postgres).

## Run locally

```bash
npm install
npm run dev