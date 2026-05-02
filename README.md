# PDF Tracker

A full-stack PDF tracking dashboard built with Next.js 14, Supabase, and Tailwind CSS.

## Features

- Upload PDFs and get a unique tracking link per document
- Bot detection via IP datacenter check, user-agent analysis, and canvas fingerprinting
- Every open (human + bot) logged with full device/geo metadata
- Individual JSON event files saved to Supabase Storage
- Real-time toast notifications on the dashboard via Supabase Realtime
- Filter events by Human / Bot on the events page
- Downloadable JSON per event

---

## Step-by-Step Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for it to provision (~1 minute)

### 2. Run the Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Open `supabase/schema.sql` from this repo
3. Paste the full contents and click **Run**

This creates the `pdfs` and `tracking_events` tables and enables Realtime on `tracking_events`.

### 3. Create Storage Buckets

In your Supabase dashboard go to **Storage** and create two buckets:

| Bucket name | Public |
|-------------|--------|
| `pdfs`      | No (private) |
| `events`    | No (private) |

### 4. Set Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

Find your values in the Supabase dashboard under **Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=https://your-vercel-deployment.vercel.app
```

> For local dev set `NEXT_PUBLIC_APP_URL=http://localhost:3000`

### 5. Install Dependencies

```bash
npm install
```

### 6. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/dashboard`.

### 7. Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
3. In **Environment Variables**, add the four variables from step 4 (use your production Vercel URL for `NEXT_PUBLIC_APP_URL`)
4. Click **Deploy**

---

## Architecture

```
/dashboard          — view all PDFs, copy links, real-time open toasts
/upload             — upload a PDF + set campaign name
/track/[trackingId] — client-side JS fingerprint → POST to /api/track → redirect to PDF
/events/[trackingId]— all opens for one PDF with filter (All / Humans / Bots)

/api/upload         — server: store PDF in Supabase, insert pdfs row
/api/track          — server: geolocate IP, detect bots, save event + JSON file
```

## Bot Detection

1. **IP check** — `ip-api.com` `hosting` field: datacenters/VPNs/proxies flagged as bot
2. **User-agent check** — blocks `axios`, `curl`, `python`, `java`, `bot`, `crawler`, etc.
3. **Canvas fingerprint** — browser must successfully render a canvas element with a data URL > 500 chars

All events are saved regardless of bot status. The `is_bot` field controls display only.
# deligatr
