# HIREZEN JobTracker v2

Consultancy job application tracker — employees log daily applications, admin monitors everything.

## Deploy to Vercel

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project → Import the repo
3. Framework: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy

## Local Development

```bash
npm install
npm run dev
```

## Firebase

Already configured with `hirezen-tracker` project. Firestore stores shared data at `tracker/appdata`.

**Important:** Update Firestore security rules before the 30-day test mode expires:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tracker/{doc} { allow read, write: if true; }
    match /backups/{doc} { allow read, write: if true; }
  }
}
```

## Features

- Employee portal: log applications, track pipeline (Call→Interview→Offer→Hired)
- Admin dashboard: today's status, leaderboard, team performance
- Avg/day calculation: per person, excludes weekends + holidays
- Holiday management: admin declares holidays in Settings
- Soft-delete employees with restore
- Reassign people between employees
- 2-day edit window for employees
- Dark/light theme
- PDF reports, CSV export
- 15-second auto-refresh, 15-minute session timeout
- US Eastern timezone (America/New_York)

## Default Credentials

- Admin password: `admin123` (change in Settings after first login)
