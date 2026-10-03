# 💰 Expensy — Personal Expense Tracker

A full-stack personal expense tracker with authentication, income/expense management,
category filters, search, and animated analytics — built with **React + FastAPI + MongoDB**.

## ✨ Features

- 🔐 JWT-based Login/Signup
- ➕ Add / edit / delete expenses
- 💵 Add / delete income
- 🏷️ Category tagging with icons
- 🔍 Search & filter by category
- 📊 Animated charts (pie + line) via Recharts
- 📱 Fully responsive, animated UI (Framer Motion)
- 🍃 MongoDB database via Motor (async driver)

## 🗂️ Project Structure

See the `frontend/` and `backend/` folders — structured by feature (components, pages,
services, context on the frontend; routes, models, schemas, services on the backend).

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB running locally (or a MongoDB Atlas connection string)

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate

pip install -r requirements.txt
```

Edit `.env` (already created with defaults) if your MongoDB URI is different:

```
MONGO_URI=mongodb://localhost:27017
DB_NAME=expense_tracker_db
JWT_SECRET=change_this_super_secret_key_in_production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

Run the API:

```bash
uvicorn app.main:app --reload --port 8000
```

Backend runs at **http://localhost:8000** — interactive docs at **http://localhost:8000/docs**

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173** — API calls are proxied to `localhost:8000`.

### 4. Open the app

Go to `http://localhost:5173`, sign up for an account, and start tracking! 🌱

## 📦 Libraries Used

**Backend:** fastapi, uvicorn, motor, pymongo, python-jose, passlib[bcrypt], python-dotenv, pydantic

**Frontend:** react, react-router-dom, axios, framer-motion, recharts, react-icons, react-hot-toast, vite

## 🔒 Notes

- Passwords are hashed with bcrypt, never stored in plain text.
- JWT tokens expire after 24 hours by default (configurable in `.env`).
- Change `JWT_SECRET` before deploying to production.
