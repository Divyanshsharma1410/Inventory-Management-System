# 📦 Inventory Manager

A full-stack inventory management application: track products and categories, manage
stock in/out with low-stock alerts, and view a dashboard with reports and CSV export.

Built with **React (Vite)** + **Node.js/Express** + **PostgreSQL (Prisma)**, fully
containerized with **Docker Compose**.

---

## ✨ Features

- 🔐 **Authentication** — register/login with JWT; first user becomes admin (role-based).
- 📦 **Products CRUD** — create, edit, delete, search, filter by category, sort, paginate.
- 🏷️ **Categories CRUD** — group products; product counts per category.
- 🔁 **Stock movements** — record stock IN / OUT / ADJUST; quantities update atomically; full history.
- 🚨 **Low-stock alerts** — per-product threshold; dashboard flags low and out-of-stock items.
- 📊 **Dashboard & reports** — totals (products, units, inventory value, profit), stock-by-category chart, recent activity, **CSV export**.
- ⚙️ **Config via env vars** — no hardcoded secrets/credentials.

---

## 🧱 Tech stack

| Layer     | Tech                                             |
| --------- | ------------------------------------------------ |
| Frontend  | React 18, Vite, React Router, Axios, Recharts    |
| Backend   | Node.js 20, Express, Prisma ORM, JWT, bcrypt, Zod |
| Database  | PostgreSQL 16                                    |
| Container | Docker, Docker Compose, nginx (serves frontend + proxies API) |

---

## 🚀 Quick start (Docker — recommended)

**Prerequisites:** Docker Desktop (or Docker Engine + Compose).

```bash
# 1. Configure environment
cp .env.example .env          # optionally edit secrets

# 2. Build & run everything (db + backend + frontend)
docker compose up --build
```

Then open **http://localhost:8080**

The backend automatically syncs the database schema and seeds demo data on first boot.

**Default admin login** (also pre-filled on the login screen):

```
Email:    admin@inventory.local
Password: Admin@123
```

To stop: `Ctrl+C`, then `docker compose down` (add `-v` to also wipe the database volume).

| Service   | URL                          |
| --------- | ---------------------------- |
| Frontend  | http://localhost:8080        |
| Backend   | http://localhost:4000/api    |
| Health    | http://localhost:4000/health |

---

## 🛠️ Local development (without Docker)

You need Node.js 20+ and a running PostgreSQL instance (or just run the DB via
`docker compose up db`).

**Backend**

```bash
cd backend
cp .env.example .env           # set DATABASE_URL + JWT_SECRET
npm install
npm run db:push                # create tables
npm run db:seed                # seed admin + demo data
npm run dev                    # http://localhost:4000
```

**Frontend** (in a second terminal)

```bash
cd frontend
npm install
npm run dev                    # http://localhost:5173 (proxies /api -> :4000)
```

---

## 🔑 Environment variables

All configuration is via environment variables — **nothing is hardcoded**.

**Root `.env`** (used by docker-compose): `POSTGRES_USER`, `POSTGRES_PASSWORD`,
`POSTGRES_DB`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`, `SEED_ADMIN_EMAIL`,
`SEED_ADMIN_PASSWORD`, `FRONTEND_PORT`, `BACKEND_PORT`.

See `.env.example`, `backend/.env.example`, and `frontend/.env.example` for the full list and defaults.

> ⚠️ Set a strong, random `JWT_SECRET` and change the seed admin password for any real deployment.

---

## 📡 API reference

Base URL: `/api`. All routes except register/login require `Authorization: Bearer <token>`.

| Method | Endpoint                       | Description                          |
| ------ | ------------------------------ | ------------------------------------ |
| POST   | `/auth/register`               | Register (first user = admin)        |
| POST   | `/auth/login`                  | Login, returns JWT                   |
| GET    | `/auth/me`                     | Current user                         |
| GET    | `/dashboard`                   | Stats, low-stock, chart, activity    |
| GET    | `/categories`                  | List categories (+ product counts)   |
| POST   | `/categories`                  | Create category                      |
| PUT    | `/categories/:id`              | Update category                      |
| DELETE | `/categories/:id`              | Delete category                      |
| GET    | `/products`                    | List (search, filter, sort, paginate)|
| POST   | `/products`                    | Create product                       |
| GET    | `/products/:id`                | Product detail + recent movements    |
| PUT    | `/products/:id`                | Update product                       |
| DELETE | `/products/:id`                | Delete product                       |
| POST   | `/products/:id/movements`      | Record stock IN / OUT / ADJUST       |
| GET    | `/movements`                   | Stock movement history               |

`GET /products` query params: `search`, `categoryId`, `lowStock=true`, `sort` (`createdAt|name|quantity|price`), `page`, `limit`.

---

## 🗂️ Project structure

```
invManger/
├── docker-compose.yml         # db + backend + frontend
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── docker-entrypoint.sh   # waits for DB, syncs schema, seeds, starts
│   ├── prisma/
│   │   ├── schema.prisma      # User, Category, Product, StockMovement
│   │   └── seed.js
│   └── src/
│       ├── app.js  index.js   # express app + server
│       ├── config/env.js      # env loading/validation
│       ├── middleware/        # auth (JWT), error handling
│       ├── controllers/       # auth, category, product, stock, dashboard
│       ├── routes/
│       └── lib/prisma.js
└── frontend/
    ├── Dockerfile  nginx.conf
    └── src/
        ├── api/client.js      # axios + JWT interceptor
        ├── context/AuthContext.jsx
        ├── components/        # Layout, Modal
        └── pages/             # Login, Register, Dashboard, Products, Categories, Movements
```

---

## 🐳 Docker image (publishing)

The compose file builds images locally. To publish to a registry (e.g. Docker Hub)
for submission:

```bash
# Backend
docker build -t <your-dockerhub-user>/invmanager-backend:latest ./backend
docker push <your-dockerhub-user>/invmanager-backend:latest

# Frontend
docker build -t <your-dockerhub-user>/invmanager-frontend:latest ./frontend
docker push <your-dockerhub-user>/invmanager-frontend:latest
```

---

## ☁️ Deploying to free hosting (optional)

This repo runs locally via Docker out of the box. To put it on public URLs:

- **Database** — [Neon](https://neon.tech) or [Supabase](https://supabase.com) (free Postgres). Copy the connection string into `DATABASE_URL`.
- **Backend** — [Render](https://render.com) (Web Service from `./backend`, free tier) or [Railway](https://railway.app). Set the env vars from `backend/.env.example`. Build runs `npm install`; start command `npm run db:push && npm run db:seed && npm start`.
- **Frontend** — [Vercel](https://vercel.com) or [Netlify](https://netlify.com) (static build from `./frontend`). Set `VITE_API_URL` to your deployed backend URL (e.g. `https://your-api.onrender.com/api`) and run `npm run build` (output dir `dist`).

After deploying, set the backend's `CORS_ORIGIN` to your frontend URL.

---

## 📋 Submission checklist

- ✅ GitHub repository link — push this repo (`git init && git add . && git commit && git remote add origin … && git push`)
- ✅ Docker image link — publish to Docker Hub (see above)
- ✅ Live application URL — deploy per the section above

---

## 📝 License

MIT — for assessment/educational use.
