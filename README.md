# 🏥 Mediverse — Your Trusted Healthcare Companion

> A full-stack healthcare platform bridging the gap between patients and hospitals through technology.

---

## 🚨 Problem Statement

Healthcare management in India remains fragmented and inefficient:

- Patients **lose medical records** and forget medications with no centralized system
- **Finding the right hospital** based on specialization is time-consuming
- Hospitals struggle to **manage appointments** and communicate with patients efficiently
- There is **no single platform** where patients and hospitals can interact seamlessly

---

## ✅ How Mediverse Solves It

Mediverse is a role-based healthcare platform with **two separate portals**:

### 👤 Patient Portal
- Register & log in securely
- Book appointments with hospitals by specialization
- Track and manage medications with reminders
- Upload and store medical documents securely
- Get AI-powered health assistance via chat

### 🏨 Hospital Portal
- Manage incoming patient appointments (confirm / cancel)
- Update hospital profile, specializations, and doctor details
- View patient details for booked appointments

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, React Router, CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Authentication | JWT (JSON Web Tokens), Passport.js, passport-local-mongoose |
| AI Chat | Integrated AI API |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |

---

## 🌐 Live Deployment

| | Link |
|--|--|
| 🚀 Live App | [https://mediverse-sigma.vercel.app](https://mediverse-sigma.vercel.app) |
| 📦 GitHub | [https://github.com/vidhiii1711/Mediverse](https://github.com/vidhiii1711/Mediverse) |

> ⚠️ **Note:** The backend is hosted on Render's free tier. The first request after a period of inactivity may take **30–60 seconds** while the server wakes up. This is expected behavior — please wait and try again.

---

## ⚙️ Local Setup

Follow these steps to run Mediverse on your local machine:

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas URI)
- Git

---

### 1. Clone the Repository

```bash
git clone https://github.com/vidhiii1711/Mediverse.git
cd Mediverse
```

---

### 2. Setup Backend

```bash
# From root directory
npm install
```

Create a `.env` file in the root directory:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

Start the backend:

```bash
npm start
```

Backend runs on: `http://localhost:5000`

---

### 3. Setup Frontend

```bash
cd Frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

---

### 4. Connect Frontend to Backend

In your frontend API calls, make sure the base URL points to:

```
http://localhost:5000
```

> In production, this is already set to the Render backend URL.

---

## 📁 Project Structure

```
Mediverse/
├── app.js                  # Express app setup
├── bin/
│   └── www                 # Server entry point
├── models/
│   ├── patient.js          # Patient schema
│   ├── hospital.js         # Hospital schema
│   └── ...
├── routes/
│   ├── users.js            # Auth routes (login/register)
│   ├── hospitals.js        # Hospital search
│   ├── appointments.js     # Patient appointments
│   ├── medications.js      # Medication tracking
│   ├── documents.js        # Document management
│   └── ...
├── Frontend/
│   ├── src/
│   │   ├── pages/          # Login, Register, Dashboard, etc.
│   │   ├── components/     # Reusable UI components
│   │   └── App.jsx
│   └── package.json
└── package.json
```

---

## 🔐 Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for JWT token signing |

---

## ✨ Key Features

- 🔐 **Secure Auth** — Role-based login for patients and hospitals using JWT
- 📅 **Appointment Booking** — Patients book, hospitals confirm or cancel
- 💊 **Medication Tracker** — Mark medications as taken, track history
- 📄 **Document Storage** — Upload and manage medical records
- 🤖 **AI Health Chat** — AI-powered assistant for health queries
- 🏥 **Hospital Discovery** — Find hospitals by specialization and area

---

## 🙌 Author

**Vidhi** — [GitHub](https://github.com/vidhiii1711)

---

> Built with ❤️ to make healthcare more accessible and organized.
