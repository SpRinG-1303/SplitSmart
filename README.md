# SplitSmart

SplitSmart is a expense-splitting app built for the way people actually spend money — in groups, on trips, at dinners, with flatmates. No more awkward "hey you owe me" texts. Just add what was spent, who paid, and let the app figure out the rest.

Built in 24 hours as part of a hackathon project.

---

## What it does

- Create groups for any occasion — trips, flatmates, office lunches, weddings
- Add expenses with equal, percentage, or exact splits
- Track who owes whom across multiple groups at once
- Settle up with one click and mark debts as paid
- Personal finance tracker — log your own expenses, set monthly budgets, track savings goals
- Full dark/light mode
- Each user's data is completely isolated — no one sees anyone else's stuff

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Supabase Auth |
| Data | localStorage (namespaced per user) |
| Routing | React Router v6 |
| State | TanStack Query + custom event-driven store |
| Charts | Recharts + custom SVG sparklines |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (free tier works fine)

### 1. Clone the repo

```bash
git clone https://github.com/SpRinG-1303/SplitSmart.git
cd SplitSmart
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key
```

You can find both values in your Supabase dashboard under **Project Settings → API**.

### 4. Configure Supabase Auth

In your Supabase dashboard:
- Go to **Authentication → Providers → Email**
- Turn off **"Confirm email"** so users can sign up and log in instantly

### 5. Run the dev server

```bash
npm run dev
```

Open `http://localhost:8080` and you're good to go.

---

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/              # shadcn/ui primitives
│   ├── AppShell.tsx     # Main layout wrapper with sidebar/nav
│   ├── AddExpenseDialog.tsx
│   ├── CreateGroupDialog.tsx
│   ├── SettleUpDialog.tsx
│   └── ProtectedRoute.tsx
├── pages/
│   ├── Cover.tsx        # Landing/cover page
│   ├── Login.tsx        # Auth page (login, signup, reset)
│   ├── Home.tsx         # Main dashboard
│   ├── GroupDashboard.tsx
│   ├── Personal.tsx     # Personal finance tracker
│   └── Settings.tsx
├── lib/
│   ├── store.ts         # Group/expense data store (localStorage)
│   ├── personalStore.ts # Personal finance store
│   ├── balance.ts       # Debt simplification algorithm
│   ├── smartParser.ts   # Natural language expense parsing
│   ├── types.ts         # Shared TypeScript types
│   └── theme.tsx        # Dark/light mode context
└── integrations/
    └── supabase/        # Supabase client + generated types
```

---

## Architecture

### Data layer

All group and expense data lives in `localStorage`, namespaced by the logged-in user's Supabase UID (`splitsmart_v1_<user_id>`). This means:

- Data persists across sessions without a backend
- Each user's data is completely isolated from others on the same device
- No API calls needed for reads/writes — everything is instant

When auth state changes (login/logout), a custom `splitsmart:change` event fires and all subscribed components re-render with the correct user's data.

### Auth flow

```
Cover (/) → Login (/login) → App (/app)
                ↑
         ProtectedRoute
         (redirects to /login if no session)
```

Supabase handles the auth session. On login, the user's `full_name` from signup metadata is automatically seeded into the store as their display name.

### Debt simplification

The balance calculation in `lib/balance.ts` uses a greedy debt simplification algorithm — it takes the raw net balances across all members and reduces them to the minimum number of transactions needed to settle everything. So instead of 6 people each paying each other back, it figures out the 3-4 payments that clear all debts at once.

### Split types

Three ways to split any expense:
- **Equal** — divide evenly among selected members
- **Percentage** — assign custom percentages (must total 100%)
- **Exact** — enter specific amounts per person (must total the expense amount)

---

## Features in detail

### Groups
Create a group, pick a tag (Trip, Home, Work, etc.), choose a color, add members, and set your currency. Everything from ₹ to $ to € is supported.

### Expense tracking
Add expenses with a title, amount, category, who paid, and how to split. Categories are auto-suggested based on the title. The activity feed inside each group logs every action — expenses added, members joined, debts settled.

### Settle up
The settle up dialog shows the minimum set of payments needed to clear all debts in a group. Mark a payment as done and it's recorded in the activity log.

### Personal finance
Separate from group expenses — track your own spending, set monthly budgets per category, and manage savings goals. All personal data is also user-isolated.

### Dashboard
The home dashboard aggregates data across all your groups — total spent this month, what you owe, what you're owed, spending breakdown by category, recent activity, and a visual "who owes whom" orbit chart.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server at localhost:8080 |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm test` | Run tests |

---

## Notes

- The app works fully offline after first load — no network needed for reading/writing data
- Supabase is only used for authentication, not data storage
- The `.env` file is gitignored — never commit your keys
