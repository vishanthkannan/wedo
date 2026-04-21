# WeDo Web Application

A full-stack Todo Web Application with a premium, modern, product-level UI. Built with React (Vite), Node.js, Express, and MongoDB.

## 🎨 Design System

**Primary Palette:**
* `#FBF8F1` (Main background)
* `#F7ECDE` (Secondary background / cards)
* `#E9DAC1` (Borders / subtle sections)
* `#54BAB9` (Primary accent / actions)

## 🏗️ Folder Structure

```
TODO/
│
├── backend/                  # Node.js + Express backend
│   ├── models/               # Mongoose schemas
│   │   ├── User.js           # User schema with streak tracking
│   │   └── Task.js           # Task schema (daily/todo types)
│   ├── routes/               # API Endpoints
│   │   ├── auth.js           # Authentication routes
│   │   └── tasks.js          # CRUD tasks & analytics
│   ├── middleware/           # Express middlewares
│   │   └── authMiddleware.js # JWT Protection
│   ├── server.js             # Main server entrypoint
│   └── .env                  # Environment variables
│
└── frontend/                 # React + Vite frontend
    ├── src/
    │   ├── components/       # Reusable UI components
    │   │   ├── ProductivityChart.jsx # Recharts line chart
    │   │   └── TaskItem.jsx  # Individual task row with animations
    │   ├── context/          # React Context
    │   │   └── AuthContext.jsx # JWT State management
    │   ├── pages/            # Main application pages
    │   │   ├── Dashboard.jsx # Main view with task lists & chart
    │   │   ├── Login.jsx     # Login page
    │   │   └── Register.jsx  # Sign-up page
    │   ├── utils/            # Helper functions
    │   │   ├── api.js        # Axios instance with interceptors
    │   │   └── audio.js      # Web Audio API synthesizers
    │   ├── App.jsx           # Routing wrapper
    │   ├── main.jsx          # React entrypoint
    │   └── index.css         # Custom CSS Design System
```

## 🛠️ Setup Steps

### 1. Start Database
Ensure MongoDB is running locally on port 27017 or update the `MONGO_URI` in `backend/.env`.

### 2. Run Backend
```bash
cd backend
npm install
node server.js
```
The server will start on `http://localhost:5000`.

### 3. Run Frontend
```bash
cd frontend
npm install
npm run dev
```
The client will be accessible at `http://localhost:5173`.

## 🗄️ MongoDB Schemas

### User Schema (`backend/models/User.js`)
* `name` (String, Required)
* `email` (String, Required, Unique)
* `password` (String, Required)
* `dailyStreak` (Number, Default: 0)
* `longestStreak` (Number, Default: 0)
* `lastLoginDate` (Date)

### Task Schema (`backend/models/Task.js`)
* `user` (ObjectId, Ref: 'User')
* `title` (String, Required)
* `type` (String, Enum: ['daily', 'todo'])
* `completed` (Boolean, Default: false)
* `date` (String, Format: YYYY-MM-DD)

## 📡 API Routes

### Authentication (`/api/auth`)
* `POST /register`: Create a new account
* `POST /login`: Authenticate and receive JWT
* `GET /me`: Get current authenticated user details

### Tasks (`/api/tasks`)
* `GET /?date=YYYY-MM-DD`: Get tasks for a specific date (auto-creates dailies if missing)
* `POST /`: Create a new task
* `PUT /:id`: Update task (handles completion and streak logic)
* `DELETE /:id`: Delete a task
* `GET /analytics/weekly`: Returns weekly completion percentage, chart data, and current streak

## ✨ Key Features Logic

1. **Authentication:** 
   - Uses JWT stored in `localStorage`. Automatically attaches token to subsequent Axios requests.
   - Redirects to `/login` if unauthenticated.
2. **Date Scrolling:**
   - Shows 10 days context around the current day (3 days past, 6 days future).
   - "Today" is prioritized and scrolled to automatically.
3. **Daily Routine vs Todos:**
   - Todos are one-time entries.
   - Daily routines are tracked back to past entries. If today has no dailies but they existed in the past, they auto-generate on load for the new date!
4. **Streak System:**
   - Evaluated on login (if missed > 1 day, resets to 0).
   - Increments when all "daily routines" for today are completed.
5. **Productivity Chart:**
   - Driven by Recharts, tracks past 7 days of tasks completion ratio.
   - Updates dynamically on task completion.
6. **Sound System:**
   - Synthesizes organic interface sounds via Web Audio API (so no assets required). Provides a soft click for tasks and an arpeggio "reward" when all daily tasks are clear.
