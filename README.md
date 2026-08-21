# Task Tracker - Full Stack Web Application

A full-stack Task Management System with authentication, advanced search/filtering, real-time analytics dashboard, dark mode, and MongoDB optimization.

---

**#Live Demo **
**Frontend:** https://tasktracker-frontend-hup9.onrender.com
**Backend API:** https://tasktracker-so3v.onrender.com

##  Features

### 1. Authentication & Security
- **Signup & Login**: User registration and login with input validation (email format, password min 6 chars).
- **JWT Authorization**: Token-based protected routes; tokens stored in `localStorage` and sent with `Authorization: Bearer <token>` on all requests.
- **Session Management**: Logged-in user badge, email display, and one-click Logout.

### 2. Task Management (CRUD)
- **User-Scoped Tasks**: Each user can only view, create, edit, and delete their own tasks.
- **Task Attributes**:
  - `title` (Required, trimmed)
  - `description` (Optional multiline details)
  - `status` (`Todo`, `In Progress`, `Done`)
  - `priority` (`Low`, `Medium`, `High`)
  - `dueDate` (Date picker with past date validation)
- **Quick Status Toggle**: 1-click buttons to mark tasks as `Done`, `Todo`, or `In Progress`.

### 3. Search, Filtering & Sorting
- **Live Title Search**: Server-side case-insensitive regex search.
- **Status Filter**: `All`, `Todo`, `In Progress`, `Done`.
- **Priority Filter**: `All`, `High`, `Medium`, `Low`.
- **Sorting**: Due Soonest, Highest Priority, Newest First, Oldest First, Title (A-Z).
- **Pagination**: Configurable items per page (5, 10, 20), page indicators, and Prev/Next buttons.

### 4. Analytics & Insights
- **Dedicated Aggregation Endpoint**: `GET /api/tasks/analytics` using MongoDB `$facet` aggregation.
- **Real-Time Stat Cards**:
  - Total Tasks
  - Completed Tasks
  - Pending Tasks (`Todo` + `In Progress`)
  - In Progress Tasks
  - High Priority Tasks
  - Overdue Tasks
  - Completion Rate (%)
- **Visual Progress Bars**:
  - Overall completion percentage bar.
  - Segmented status distribution meter (`Todo` vs `In Progress` vs `Done`).

### 5. UI & Product Enhancements
- **Dark Mode**: Toggle between Light and Dark themes with `localStorage` persistence.
- **Responsive Design**: Optimized for desktop, tablet, and mobile layouts.
- **Feedback & States**: Loading spinners, empty states with call-to-action, and dismissible error/success alerts.
- **Database Optimization**: Compound MongoDB indexes on `{ user: 1, createdAt: -1 }`, `{ user: 1, status: 1 }`, `{ user: 1, priority: 1 }`, `{ user: 1, dueDate: 1 }`, `{ user: 1, title: 1 }`.
- **Error Handling**: Global centralized error handling middleware.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, React Router DOM, CSS3 (Custom Design System) |
| **Backend** | Node.js, Express 5, Mongoose 9, jsonwebtoken, bcryptjs, cors, dotenv |
| **Database** | MongoDB |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or MongoDB Atlas URI)

### 1. Clone & Setup Backend
```bash
cd backend
npm install
```

Create a `.env` file in `backend/` with:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/task_tracker
JWT_SECRET=my_task_tracker_secret_2026
```

Start the backend server:
```bash
npm start
# or for auto-reloading during development:
npm run dev
```
Backend runs at `http://localhost:5000`.

### 2. Setup Frontend
```bash
cd ../frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

---

## 📡 API Endpoints Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Register new user | No |
| `POST` | `/api/auth/login` | Login user & return JWT | No |
| `GET` | `/api/auth/me` | Get current user profile | Yes (Bearer) |

### Task Management (`/api/tasks`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/tasks` | Get paginated, filtered & sorted tasks | Yes (Bearer) |
| `GET` | `/api/tasks/analytics` | Get task statistics & insights | Yes (Bearer) |
| `GET` | `/api/tasks/:id` | Get single task by ID | Yes (Bearer) |
| `POST` | `/api/tasks` | Create new task | Yes (Bearer) |
| `PUT` | `/api/tasks/:id` | Update task details / status | Yes (Bearer) |
| `DELETE` | `/api/tasks/:id` | Delete task | Yes (Bearer) |

---

## 🧪 Database Indexes
To ensure optimal query performance for user-scoped filtering, searching, and sorting, the following indexes are defined on the `Task` collection:
```javascript
taskSchema.index({ user: 1, createdAt: -1 });
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, priority: 1 });
taskSchema.index({ user: 1, dueDate: 1 });
taskSchema.index({ user: 1, title: 1 });
```
