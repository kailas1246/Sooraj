# Habit Tracker Server

This is an Express + Mongoose backend for the Habit Tracker frontend. It exposes the endpoints the frontend expects at `http://localhost:5000/api/habits`.

Quick start

1. Copy environment variables:

```powershell
cd server
cp .env.example .env
```

2. Install dependencies:

```powershell
cd server
npm install
```

3. Start MongoDB (choose one):

- Run locally if you have MongoDB installed, or
- Start via Docker Compose:

```powershell
cd server
docker compose up -d
```

4. Start the server:

```powershell
cd server
npm run start
```

Development (auto-restart):

```powershell
npm run dev
```

The frontend expects the API at `http://localhost:5000` by default. If you change the port or MongoDB URI, update the frontend or set the `BASE_URL` appropriately.
