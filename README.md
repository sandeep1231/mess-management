# Mess Management
## Deployment plan

### 1) CI with GitHub Actions

We added `.github/workflows/ci.yml` that:
- Checks out the repo
- Sets up Node 20 with npm caching
- Installs and builds the server (TypeScript -> dist)
- Installs and builds the client (Angular production)
- Lints the server

This validates every push/PR to `main`.

### 2) Render deployment (single Node service)

We added a `render.yaml` blueprint:
- Build command installs/builds both `server` and `client`
- Start command runs `node server/dist/index.js`
- Server serves API on `/api` and static Angular app from `client/dist/client/browser` with SPA fallback
- Set `MONGODB_URI` and `JWT_SECRET` env vars in Render dashboard; `PORT` is managed by Render

Steps:
1. Push this repo to GitHub (see below)
2. In Render, create a new Web Service from this repo
3. Choose Node environment; Render will detect the blueprint and build
4. Add env vars `MONGODB_URI` and `JWT_SECRET`
5. Deploy

### 3) Create GitHub repo and push (PowerShell)

Optional: initialize a new repo and push current code to GitHub.

```
git init
git branch -M main
git add .
git commit -m "Initial import: server+client, CI, Render config"
# Create a new empty repo in GitHub UI (e.g., https://github.com/<you>/<repo>)
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

### 4) Production configuration

- Client `environment.prod.ts` points `apiBase` to `/api` to work on same host
- Server serves static files and SPA fallback; ensure build artifacts exist in `client/dist/client/browser`
- Set strong `JWT_SECRET` and valid `MONGODB_URI` in production

### 5) Local production-like run

```
# In PowerShell
npm --prefix server ci; npm --prefix server run build
npm --prefix client ci; npm --prefix client run build -- --configuration production
$env:PORT=4001; $env:JWT_SECRET="change-me"; # set MONGODB_URI if using Atlas
node server/dist/index.js
# Open http://localhost:4001
```

# Mess Management Monorepo

Full-stack app to manage monthly mess expenses and meals, and compute per-member balances.

## Folders
- `server/`: Node.js API (Express + TypeScript + Mongoose)
- `client/`: Angular app, packaged for Android via Capacitor

## Run the backend
See `server/README.md` for environment setup. In short: create `server/.env` with `MONGODB_URI` and `PORT=4001`, then start the server.

## Run the web client
From `client/`:
- `npm install`
- `npm start` (dev server) or `npm run build` (production build to `dist/client`)

## Android app (no Android Studio required)
We use Capacitor to wrap the Angular build. If your device doesn't support Android Studio, you can build the APK in GitHub Actions:

1) Push your changes to GitHub. The workflow at `.github/workflows/android-build.yml` builds a debug APK.
2) In GitHub → Actions → "Android Debug APK" → latest run → download artifact `mess-management-debug-apk`.
3) Install `app-debug.apk` on your Android device (enable installing from unknown sources).

If you do have Android Studio locally, from `client/` you can run:
- `npm run build` → `npx cap copy` → `npx cap open android`

### API base on Android
The app defaults to `http://localhost:4001/api` for web. On Android, use one of:
- Emulator talking to your PC: `http://10.0.2.2:4001/api`
- Physical device on same Wi‑Fi: `http://<YOUR_PC_LAN_IP>:4001/api`

You can change this inside the app: open Settings → API Base URL. This value is stored in `localStorage` under `mm.apiBase`.

Android manifest allows cleartext HTTP during development.

