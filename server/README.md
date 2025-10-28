# Server (Node.js + Express + MongoDB)

## Prerequisites
- Node.js 18+
- MongoDB Atlas URI

## Setup
1. Copy `.env.example` to `.env` and fill in your values.
2. Install dependencies and start in watch mode:

```powershell
npm install
npm run dev
```

Health check: http://localhost:4000/health

## Environment variables
- `PORT` (default 4000)
- `MONGODB_URI` — MongoDB/Atlas connection string

## Configure MongoDB Atlas
- Create a free cluster at https://cloud.mongodb.com/
- Create a Database User and password
- Network Access: allow your IP (or 0.0.0.0/0 for dev)
- Get the SRV URI and set in `.env`:

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/?retryWrites=true&w=majority
```

## Routes
- `GET /health`
- `POST /api/messes`
- `GET /api/messes/:id`
- `GET /api/messes/:id/summary?month=YYYY-MM`
- `POST /api/members`
- `GET /api/members?messId=...`
- `PATCH /api/members/:id`
- `DELETE /api/members/:id`
- `POST /api/meals`
- `GET /api/meals?messId=...&month=YYYY-MM`
- `DELETE /api/meals/:id`
- `POST /api/expenses`
- `GET /api/expenses?messId=...&month=YYYY-MM`
- `DELETE /api/expenses/:id`

## Notes
- Validation uses Zod
- Calculation lives in `src/services/summaryService.ts`

