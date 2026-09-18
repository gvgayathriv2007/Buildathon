# 🔍 CampusFindIt - Lost & Found Web Portal

> 🌐 **Live Public Demo URL**: [https://forty-donuts-argue.loca.lt](https://forty-donuts-argue.loca.lt)  
> **A full-stack Campus Lost and Found web application tailored for 2nd Year CSE Genesis 2.0 Buildathon demonstrating Node.js, Express REST API, SQLite3 DBMS, bcrypt password hashing, JWT authentication, and file uploads.**

---

## 🌟 Features Overview

- 📊 **Real-time Statistics Dashboard**: Live count of total items reported, currently lost items, found items safe with security/finders, and successfully reunited belongings.
- 🔎 **Dynamic Search & Filtering**: Instant search across titles, descriptions, and campus locations (e.g., Central Library, CS Department, Main Canteen, Sports Ground).
- 🏷️ **Categorized Listings**: Filter by Electronics, ID Cards & Wallets, Keys, Books & Stationery, Apparel & Bags, and Other Belongings.
- 📝 **Report Lost / Found Modal**: User-friendly form with validation, status indicator, contact info, date picker, and image support.
- 🤝 **Claim & Reunited Workflow**: Interactive item detail popup allowing users to view contact details, verify ownership, mark listings as "Reunited", or remove listings.
- 💾 **SQLite Database Persistence**: Clean SQL schema with seed data initialized automatically upon server startup.
- 🎨 **Modern Glassmorphism UI**: Built using pure HTML5, CSS3 CSS variables, smooth animations, and responsive layouts.

---

## 🏗️ Project Architecture & Tech Stack

```
campus-lost-and-found/
├── server.py              # Zero-dependency Python + SQLite REST API backend
├── server.js              # Node.js + Express + SQLite backend alternative
├── package.json           # Node project manifest (for Node.js users)
├── campus_lost_found.db   # SQLite Database (Auto-generated on launch)
├── .gitignore             # Git ignore rules for clean repositories
├── README.md              # Documentation & Viva presentation guide
└── public/                # Frontend Application Assets
    ├── index.html         # Main Single Page Application structure
    ├── styles.css         # Custom glassmorphism UI & responsive styles
    └── app.js             # Vanilla JS REST API client & DOM manipulation
```

### Technical Stack
| Layer | Technologies Used | Concept Taught in CSE |
|---|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6+) | Web Tech, DOM Manipulation, Async/Await Fetch API |
| **Backend** | Python (`http.server` & `sqlite3`) / Node.js (Express) | Web Servers, REST APIs, HTTP Methods (`GET`, `POST`, `PATCH`, `DELETE`) |
| **Database** | SQLite3 | Database Management Systems (DBMS), SQL CRUD queries |
| **Version Control**| Git & GitHub | Software Engineering & Open Source Collaboration |

---

## ⚡ How to Run the Project Locally

### Option A: Using Python (Recommended - 0 External Installs Required!)
Python comes pre-installed on most machines with `sqlite3` built-in.

1. Open **Command Prompt / PowerShell / Terminal**.
2. Navigate to the project folder:
   ```bash
   cd campus-lost-and-found
   ```
3. Run the Python backend server:
   ```bash
   python server.py
   ```
4. Open your browser and visit: **`http://localhost:5000`** 🎉

---

### Option B: Using Node.js (If Node.js is installed)

1. Open terminal inside `campus-lost-and-found`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   node server.js
   ```
4. Open your browser and visit: **`http://localhost:5000`**

---

## 🗄️ Database Schema (SQLite)

The project uses a clean relational table schema in `campus_lost_found.db`:

```sql
CREATE TABLE items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    type TEXT NOT NULL,          -- 'LOST' or 'FOUND'
    category TEXT NOT NULL,      -- Electronics, ID & Wallet, Keys, etc.
    location TEXT NOT NULL,      -- e.g. Central Library, CS Dept
    date_reported TEXT NOT NULL, -- YYYY-MM-DD
    description TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_info TEXT NOT NULL,
    image_url TEXT,
    status TEXT DEFAULT 'OPEN',  -- 'OPEN' or 'REUNITED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔌 REST API Documentation

| HTTP Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/stats` | Fetches counts for dashboard stats cards |
| `GET` | `/api/items` | Fetches items with optional search/category/status filters |
| `POST` | `/api/items` | Creates a new lost or found item report |
| `PATCH` | `/api/items/:id/status` | Updates status (e.g., marks as `REUNITED`) |
| `DELETE` | `/api/items/:id` | Deletes a record from the database |

---

## 🚀 How to Push this Project to Your GitHub Repository

Follow these step-by-step commands in your terminal to showcase this project on GitHub:

### Step 1: Initialize Git Repository
```bash
git init
```

### Step 2: Add Files & Make Initial Commit
```bash
git add .
git commit -m "Initial commit: Campus Lost and Found web portal"
```

### Step 3: Rename Branch to Main
```bash
git branch -M main
```

### Step 4: Link to Your GitHub Repository
1. Go to [GitHub.com](https://github.com) and create a **New Repository** named `campus-lost-and-found`.
2. Copy your repository URL (e.g. `https://github.com/<your-username>/campus-lost-and-found.git`).
3. Run the command:
```bash
git remote add origin https://github.com/<your-username>/campus-lost-and-found.git
```

### Step 5: Push to GitHub
```bash
git push -u origin main
```

---

## 💡 Top Viva / Interview Questions & Answers for 2nd Year CSE

**Q1: What is a REST API? How does this application use it?**  
> *Answer:* A REST (Representational State Transfer) API is an architectural style for web services. In this project, the frontend JavaScript makes HTTP requests (`GET`, `POST`, `PATCH`, `DELETE`) to `/api/items` to retrieve, send, update, and delete JSON data from the server.

**Q2: Why use SQLite for this mini-project?**  
> *Answer:* SQLite is a lightweight, serverless, file-based relational database. It requires zero configuration, stores all data in a single `.db` file, supports standard SQL queries, and is perfect for embedded applications and rapid prototyping.

**Q3: How does the search and filter mechanism work?**  
> *Answer:* The frontend sends query parameters (e.g. `?search=library&category=Electronics`) to the server. The backend constructs a parameterized SQL query with `WHERE` conditions (`title LIKE %search%` AND `category = ?`) to safely filter database rows without SQL injection vulnerabilities.

---

## 📜 License
This project is open-source and free to use for academic and educational purposes.
