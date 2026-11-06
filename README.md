# Tracker Money

A modern, minimal personal finance tracker for students and young people. Log spending in a few taps, see where your money goes, and know how much you can spend today.

Tracker Money is a Progressive Web App (PWA). It installs on Android and iOS, works offline, and keeps all data on your own device. There is no server and no account.

> **Status:** MVP, being tested with its first users.

<!-- Add after deploying:
**Live demo:** https://your-app.vercel.app
-->

<!-- Add screenshots to docs/screenshots and link them here:
![Dashboard](docs/screenshots/dashboard.png)
-->

## Why this app

Many students run out of pocket money before the week or month ends, without knowing where it went. Most finance apps feel slow and spreadsheet-like, so people stop using them. Tracker Money aims for the opposite: fast input, a friendly look, and gentle reminders.

## Features

- **Quick transaction entry.** Amount, category, and source in three taps. The date defaults to today, and a note is optional.
- **Pick a date.** "Today" and "Yesterday" shortcuts plus a date field, for expenses you forgot to log. Future dates are rejected.
- **Edit, delete, and undo.** Tap any transaction in the history. After deleting, an Undo button stays for a few seconds.
- **History.** Grouped by day, with filters for all, expenses, and income.
- **Separate categories for expenses and income.** Income needs only an amount, because its first category is preselected.
- **Custom categories.** Add, rename, and delete categories. A category still used by transactions is deleted by moving those transactions to a replacement of the same kind.
- **Budgets.** Weekly or monthly total, with optional limits per category. The budget can be deleted without touching transactions.
- **"Boleh dipakai hari ini" (safe to spend today).** A daily allowance computed from what is left of your budget.
- **Dashboard.** Remaining budget, daily allowance, spending by category (donut chart), and the last 7 days (bar chart).
- **Spending alerts.** In-app banners at 80% and 100% of a budget, and when today's spending passes the daily allowance. Can be turned off in Settings.
- **Light and dark themes.** Follow the system, or choose one. The choice is remembered.
- **Onboarding.** Three steps: pick a period, enter your allowance, choose favorite categories.
- **JSON backup.** Export all data to a file and import it back. Imports are validated before anything is replaced, and backups from older versions still work.
- **Excel report.** Export an `.xlsx` file with three sheets: Transactions, Summary (per month and per category), and Budget. It is one-way and meant for reading, not for importing back.
- **Reset.** Delete all data and start over, guarded by a backup prompt and typing a confirmation word.
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
| Local database | Dexie.js (IndexedDB), with versioned migrations |
| Dates | date-fns |
| Charts | Hand-drawn SVG and CSS, no chart library |
| Icons | lucide-react |
| Excel export | write-excel-file, loaded only when the export button is pressed |
| PWA | vite-plugin-pwa (Workbox) |
| Font | Plus Jakarta Sans, bundled through Fontsource |
| Tests | Vitest, with fake-indexeddb for database tests |

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
| `npm test` | Run the unit and database tests |
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
  db/           Dexie schema and migration, repositories that write data,
                backup import and export, Excel export
  pages/        Screens: Beranda (dashboard), Riwayat (history), Anggaran (budget),
                Pengaturan (settings), TambahTransaksi (add and edit),
                Kategori (manage categories), Onboarding
  services/     Pure functions with unit tests: budget math, alert rules,
                category rules, report and sheet builders
  utils/        Formatting, theme handling, file download
public/         PWA icons
```

### Architecture rules

- **Screens never talk to the database directly.** They call repository functions in `src/db`.
- **Business rules live in `src/services` as pure functions.** They take data and return results, with no database or UI code, which makes them easy to test.
- **Money is stored as whole rupiah (integers),** never decimals, to avoid rounding errors.
- **Dates are stored as `YYYY-MM-DD` text** in the device's local time, so a day never shifts with the time zone.
- **Colors are design tokens.** Components use token-based classes such as `bg-card` and `text-teks`, and the theme switches by changing `data-theme` on the `<html>` element.
- **Schema changes are migrations.** The database is at version 2 (categories have a kind: expense or income). The upgrade runs automatically, is shared with the import of older backups, and is tested against a database created by the old version.

## Data and privacy

- All data is stored **locally in your browser** (IndexedDB). Nothing is sent to a server.
- Because of that, data does **not** sync between devices, and clearing your browser data removes it.
- Use **Settings > Export backup** regularly. On a new device, use **Import backup** to restore.
- Backup files and Excel reports are plain files and are not encrypted. Keep them somewhere safe.
- The app asks the browser for persistent storage to reduce the chance of automatic cleanup.

## Install on your phone

- **Android (Chrome):** open the site, then menu **> Install app**.
- **iPhone (Safari):** tap **Share > Add to Home Screen**. This must be done in Safari.
- **Samsung phones:** install through Chrome. Samsung Internet can force its own dark mode, which overrides the Light theme.

## Roadmap

Planned for later versions:

- Recurring transactions and a savings goal
- Category icons and colors, and manual ordering
- Import from Excel or CSV (waiting for evidence that people need it)
- Accounts and cross-device sync
- Shared wallets for couples
- Receipt scanning
- Connecting digital wallets, if technically and legally possible

## Contributing

This is a personal learning project. Suggestions and bug reports are welcome through issues.

## License

No license has been chosen yet. Until one is added, all rights are reserved by the author.
