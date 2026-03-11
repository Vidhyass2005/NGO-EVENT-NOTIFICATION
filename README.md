# 🌍 NGO Event Management Platform — MERN Stack (Create React App)

Full-stack MERN app with JWT auth, admin approval, real-time Socket.io notifications,
PDF certificate generation, Chart.js analytics, and dark/light theme.

---

## 📁 Project Structure

```
ngo-mern/
├── backend/
│   ├── config/db.js                  ← MongoDB connection
│   ├── models/                       ← User, Event, Participation, Notification
│   ├── controllers/                  ← auth, event, participation, certificate, notification
│   ├── routes/                       ← authRoutes, eventRoutes, participationRoutes, certificateRoutes, notificationRoutes
│   ├── middleware/                   ← authMiddleware, adminMiddleware, errorMiddleware
│   ├── services/                     ← certificateService (PDFKit+QR), emailService (Nodemailer)
│   ├── server.js                     ← Express + Socket.io entry point
│   └── package.json
│
└── frontend/
    ├── public/index.html             ← CRA HTML template
    ├── src/
    │   ├── index.js                  ← CRA entry point (ReactDOM.createRoot)
    │   ├── App.js                    ← All providers + React Router routes
    │   ├── index.css                 ← Tailwind directives + global styles
    │   ├── context/
    │   │   ├── AuthContext.js        ← JWT session state
    │   │   ├── ThemeContext.js       ← Dark/light theme
    │   │   ├── SocketContext.js      ← Socket.io connection
    │   │   └── NotificationContext.js← Real-time notification state
    │   ├── components/
    │   │   ├── Navbar.js             ← Responsive nav with theme toggle
    │   │   ├── Notification.js       ← Bell icon + notification dropdown
    │   │   ├── EventCard.js          ← Event display + action buttons
    │   │   ├── ParticipationGraph.js ← Chart.js: Bar, Line, Doughnut
    │   │   └── ProtectedRoute.js     ← Auth + role guard
    │   ├── pages/
    │   │   ├── Login.js
    │   │   ├── Signup.js
    │   │   ├── Home.js               ← Events list + create modal
    │   │   ├── History.js            ← User participation history
    │   │   ├── Certificates.js       ← PDF cert generation
    │   │   └── Analytics.js          ← Charts + CSV export
    │   ├── services/api.js           ← Axios + all API helpers
    │   └── utils/helpers.js          ← Formatting, CSV export
    └── package.json
```

---

## 🚀 Step-by-Step Setup

### Step 1 — Install backend packages

```bash
cd backend
npm install
```

### Step 2 — Create backend `.env`

Create a file named `.env` inside the `backend/` folder:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ngo_events
JWT_SECRET=supersecretkey123
CLIENT_URL=http://localhost:3000
EMAIL_USER=placeholder@gmail.com
EMAIL_PASS=placeholder
NODE_ENV=development
```

### Step 3 — Install frontend packages

```bash
cd frontend
npm install
```

> This installs react-scripts (Create React App), Tailwind CSS, Chart.js,
> Socket.io client, Axios, React Router, and all other dependencies.

### Step 4 — Start MongoDB

```bash
# Windows (run as Administrator)
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### Step 5 — Start backend

```bash
cd backend
npm run dev
# Should show:
# ✅ MongoDB Connected: localhost
# 🚀 Server running on port 5000
```

### Step 6 — Start frontend

```bash
cd frontend
npm start
# Opens http://localhost:3000 automatically
```

---

## 👤 Creating an Admin Account

1. Sign up at `http://localhost:3000/signup`
2. Open MongoDB Compass or shell:
```js
use ngo_events
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```
3. Log out and log back in — admin tabs appear automatically

---

## ✨ Features

| Feature | Details |
|---|---|
| JWT Auth | Login/Register, 7-day tokens |
| Role-based Access | User + Admin roles |
| Event CRUD | Create, approve, cancel, delete |
| Admin Approval Flow | Pending → Approved → Live |
| Real-time Notifications | Socket.io push notifications |
| PDF Certificates | PDFKit + QR code verification |
| Chart.js Analytics | Bar, Line, Doughnut charts |
| Dark/Light Theme | Tailwind dark mode + localStorage |
| Responsive Design | Mobile-first Tailwind CSS |
| CSV Export | Client-side analytics export |
| Email Notifications | Nodemailer (optional) |

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | No | Register |
| POST | /api/auth/login | No | Login |
| GET | /api/auth/me | Yes | Current user |
| GET | /api/events | Yes | List events |
| POST | /api/events | Yes | Create event |
| PUT | /api/events/:id/approve | Admin | Approve |
| PUT | /api/events/:id/cancel | Yes | Cancel |
| GET | /api/events/analytics | Yes | Analytics data |
| POST | /api/participation/register/:id | Yes | Register |
| DELETE | /api/participation/unregister/:id | Yes | Unregister |
| GET | /api/participation/my-history | Yes | History |
| POST | /api/certificates/generate/:id | Yes | Generate PDF |
| GET | /api/notifications | Yes | Get notifications |
| PUT | /api/notifications/read | Yes | Mark read |
"# NGO-EVENT-NOTIFICATION" 
