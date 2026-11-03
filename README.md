# Tracker Money

A modern, minimal personal finance tracker for students and young people. Log spending in a few taps, see where your money goes, and know how much you can spend today.

Tracker Money is a Progressive Web App (PWA). It installs on Android and iOS, works offline, and keeps all data on your own device. There is no server and no account.

> **Status:** MVP. Under active development.

<!-- Add after deploying:
**Live demo:** https://your-app.vercel.app
-->

<!-- Add screenshots to docs/screenshots and link them here:
![Dashboard](docs/screenshots/dashboard.png)
-->

## Why this app

Many students run out of pocket money before the week or month ends, without knowing where it went. Most finance apps feel slow and spreadsheet-like, so people stop using them. Tracker Money aims for the opposite: fast input, a friendly look, and gentle reminders.

## Features

- **Quick transaction entry.** Amount, category, and source in three taps. Optional note.
- **Edit and delete.** Tap any transaction in the history. Deleting asks for confirmation.
- **History.** Grouped by day, with filters for all, expenses, and income.
- **Budgets.** Weekly or monthly total, with optional limits per category.
- **"Boleh dipakai hari ini" (safe to spend today).** A daily allowance computed from what is left of your budget.
- **Dashboard.** Remaining budget, daily allowance, spending by category (donut chart), and the last 7 days (bar chart).
- **Spending alerts.** In-app banners at 80% and 100% of a budget, and when today's spending passes the daily allowance. Can be turned off in Settings.
- **Light and dark themes.** Follow the system, or choose one. The choice is remembered.
- **Onboarding.** Three steps: pick a period, enter your allowance, choose favorite categories.
- **JSON backup.** Export all data to a file and import it back. Imports are validated before anything is replaced.
- **Installable and offline.** Add it to the home screen and use it without internet.

## How the daily allowance works

```
allowance today = (total budget - spending before today) / days left, including today
```

The result is rounded down and never negative. Spending made today does not change today's allowance during the day. It only reduces what is left of it.

## Tech stack

| Area | Choice |
|---|---|
| UI | React with TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS with CSS variables as design tokens |
| Local database | Dexie.js (IndexedDB) |
| Dates | date-fns |
| Charts | Hand-drawn SVG and CSS, no chart library |
| PWA | vite-plugin-pwa (Workbox) |
| Font | Plus Jakarta Sans, bundled through Fontsource |
| Tests | Vitest |

## Getting started

### Requirements

- Node.js, a recent LTS version (22 or newer is recommended)
- npm

### Install and run

```bash
git clone https://github.com/<your-username>/tracker-money.git
cd tracker-money
npm install
npm run dev
```

Open the address shown in the terminal, usually `http://localhost:5173`.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run unit tests for the budget calculations |
| `npm run lint` | Run ESLint |

### Testing the PWA

The service worker is only active in the production build, so test it like this:

```bash
npm run build
npm run preview
```

Then open the address in Chrome or Edge and check **DevTools > Application**: the manifest should load, the service worker should be activated, and the app should still open when you tick **Offline**.

When testing a new build, tick **Update on reload** under **Service Workers**. Otherwise the browser may keep showing the cached version.

## Project structure

Names in the code use Indonesian domain terms (for example `anggaran` for budget and `transaksi` for transaction).

```
src/
  components/   Reusable UI: bottom navigation, donut chart, bar chart, amount input
  db/           Dexie schema, repositories that write data, backup import and export
  pages/        Screens: Beranda (dashboard), Riwayat (history), Anggaran (budget),
                Pengaturan (settings), TambahTransaksi (add and edit), Onboarding
  services/     Pure functions for budget math and alert rules, with unit tests
  utils/        Formatting helpers and theme handling
public/         PWA icons
```

### Architecture rules

- **Screens never talk to the database directly.** They call repository functions in `src/db`.
- **Budget math lives in `src/services/anggaran.ts` as pure functions.** They take data and return results, with no database or UI code, which makes them easy to test.
- **Money is stored as whole rupiah (integers),** never decimals, to avoid rounding errors.
- **Colors are design tokens.** Components use token-based classes such as `bg-card` and `text-teks`, and the theme switches by changing `data-theme` on the `<html>` element.

## Data and privacy

- All data is stored **locally in your browser** (IndexedDB). Nothing is sent to a server.
- Because of that, data does **not** sync between devices, and clearing your browser data removes it.
- Use **Settings > Export data** regularly. On a new device, use **Import data** to restore.
- Backup files are plain text JSON and are not encrypted. Keep them somewhere safe.
- The app asks the browser for persistent storage to reduce the chance of automatic cleanup.

## Install on your phone

- **Android (Chrome):** open the site, then menu **> Install app**.
- **iPhone (Safari):** tap **Share > Add to Home Screen**. This must be done in Safari.

## Roadmap

Planned for later versions:

- Custom categories and editable favorite categories
- Date picker when adding a transaction
- Recurring transactions and a savings goal
- Accounts and cross-device sync
- Shared wallets for couples
- Receipt scanning
- Connecting digital wallets, if technically and legally possible

## Contributing

This is a personal learning project. Suggestions and bug reports are welcome through issues.

## License

No license has been chosen yet. Until one is added, all rights are reserved by the author.
