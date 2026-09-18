/**
 * Campus Lost & Found Web Portal - Node.js Express Backend
 * Enhanced for 2nd Year CSE Competition & Viva Presentation
 * Features: REST API, SQLite, User Authentication (bcrypt + JWT), File Uploads (Multer), Pagination & Environment Variables
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'campus_findit_genesis_2026_super_secret_key_98765';
const DB_FILE = path.join(__dirname, 'campus_lost_found.db');

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Storage Setup for Local File Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'item-' + uniqueSuffix + ext);
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp|gif/;
        const mimeMatch = allowedTypes.test(file.mimetype);
        const extMatch = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (mimeMatch && extMatch) {
            return cb(null, true);
        }
        cb(new Error('Only image files (jpg, jpeg, png, webp, gif) are allowed!'));
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------------------
// Validation rules
// ---------------------------------------------------------------------------
const VALID_TYPES = new Set(['LOST', 'FOUND']);
const VALID_CATEGORIES = new Set(['Electronics', 'ID & Wallet', 'Keys', 'Books', 'Apparel', 'Other']);
const VALID_STATUSES = new Set(['OPEN', 'REUNITED']);

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_RE = /^[0-9+\-\s()]{7,20}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const URL_RE = /^https?:\/\/\S+$|^\/uploads\/\S+$/;

const MAX_TITLE_LEN = 150;
const MAX_LOCATION_LEN = 150;
const MAX_DESCRIPTION_LEN = 1000;
const MAX_CONTACT_NAME_LEN = 100;
const MAX_CONTACT_INFO_LEN = 150;

function isValidCalendarDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

function looksLikeContact(value) {
    return value.split('|').some(part => {
        const trimmed = part.trim();
        return EMAIL_RE.test(trimmed) || PHONE_RE.test(trimmed);
    }) || EMAIL_RE.test(value) || PHONE_RE.test(value);
}

function validateItemPayload(data) {
    const errors = [];

    if (!data || typeof data !== 'object') {
        return ['Request body must be a JSON object'];
    }

    const getStr = (field) => (typeof data[field] === 'string' ? data[field].trim() : data[field]);

    const title = getStr('title');
    const type = getStr('type');
    const category = getStr('category');
    const location = getStr('location');
    const dateReported = getStr('date_reported');
    const description = getStr('description');
    const contactName = getStr('contact_name');
    const contactInfo = getStr('contact_info');
    const imageUrl = getStr('image_url');

    const required = { title, type, category, location, date_reported: dateReported, description, contact_name: contactName, contact_info: contactInfo };
    for (const [field, value] of Object.entries(required)) {
        if (!value) errors.push(`Field '${field}' is required`);
    }

    if (errors.length) return errors;

    if (title.length > MAX_TITLE_LEN) errors.push(`Title must be ${MAX_TITLE_LEN} characters or fewer`);
    if (!VALID_TYPES.has(type.toUpperCase())) errors.push("Type must be either 'LOST' or 'FOUND'");
    if (!VALID_CATEGORIES.has(category)) errors.push(`Category must be one of: ${[...VALID_CATEGORIES].sort().join(', ')}`);
    if (location.length > MAX_LOCATION_LEN) errors.push(`Location must be ${MAX_LOCATION_LEN} characters or fewer`);

    if (!DATE_RE.test(dateReported)) {
        errors.push('Date reported must be in YYYY-MM-DD format');
    } else if (!isValidCalendarDate(dateReported)) {
        errors.push('Date reported is not a valid calendar date');
    }

    if (description.length > MAX_DESCRIPTION_LEN) errors.push(`Description must be ${MAX_DESCRIPTION_LEN} characters or fewer`);
    if (contactName.length > MAX_CONTACT_NAME_LEN) errors.push(`Contact name must be ${MAX_CONTACT_NAME_LEN} characters or fewer`);

    if (contactInfo.length > MAX_CONTACT_INFO_LEN) {
        errors.push(`Contact info must be ${MAX_CONTACT_INFO_LEN} characters or fewer`);
    } else if (!looksLikeContact(contactInfo)) {
        errors.push('Contact info must include a valid email or phone number');
    }

    if (imageUrl && !URL_RE.test(imageUrl)) errors.push('Image link must be a valid http://, https://, or /uploads/ URL');

    return errors;
}

// JWT Authentication Middlewares
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. Please log in to perform this action.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired session token. Please log in again.' });
        }
        req.user = user;
        next();
    });
}

function optionalToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (!err) req.user = user;
            next();
        });
    } else {
        next();
    }
}

// Database Connection & Initialization
const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        initDatabase();
    }
});

function initDatabase() {
    // 1. Create Users Table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `, () => {
        // Seed initial admin/demo user if empty
        db.get('SELECT COUNT(*) as count FROM users', [], async (err, row) => {
            if (row && row.count === 0) {
                const hashedPassword = await bcrypt.hash('student123', 10);
                db.run(
                    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
                    ['Demo Student', 'student@campus.edu', hashedPassword],
                    () => console.log('Seeded demo user: student@campus.edu / student123')
                );
            }
        });
    });

    // 2. Create Items Table
    db.run(`
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER DEFAULT 0,
            title TEXT NOT NULL,
            type TEXT NOT NULL,
            category TEXT NOT NULL,
            location TEXT NOT NULL,
            date_reported TEXT NOT NULL,
            description TEXT NOT NULL,
            contact_name TEXT NOT NULL,
            contact_info TEXT NOT NULL,
            image_url TEXT,
            status TEXT DEFAULT 'OPEN',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `, () => {
        // Ensure user_id column exists if table was created previously without it
        db.all("PRAGMA table_info(items)", [], (err, columns) => {
            if (columns && !columns.some(col => col.name === 'user_id')) {
                db.run("ALTER TABLE items ADD COLUMN user_id INTEGER DEFAULT 0");
            }
        });

        // Seed initial data if table is empty
        db.get('SELECT COUNT(*) as count FROM items', [], (err, row) => {
            if (row && row.count === 0) {
                const sampleItems = [
                    [1, "Wireless Boat Airdopes (Black)", "LOST", "Electronics", "Central Library Reading Room 2", "2026-09-15", "Left in a black charging case near table 14. Serial number ending in 89.", "Rahul Sharma", "rahul.cs23@campus.edu | Ph: 9876543210", "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&q=80", "OPEN"],
                    [1, "College ID Card (CSE 2nd Year)", "FOUND", "ID & Wallet", "Main Canteen Counter", "2026-09-16", "Found near juice counter. Name on card: Ananya Verma, Reg No: 2024CSE104.", "Security Desk Gate 1", "security@campus.edu | Ext: 401", "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&q=80", "OPEN"],
                    [1, "Casio FX-991EX Scientific Calculator", "LOST", "Electronics", "CS Department Lab 3", "2026-09-14", "Has a yellow sticker on the back with name 'Karthik'. Essential for upcoming exams!", "Karthik R.", "karthik.r@campus.edu", "https://images.unsplash.com/photo-1611125832047-1d7ad1e8e48a?w=500&q=80", "OPEN"],
                    [1, "Bunch of 3 Keys with Batman Keychain", "FOUND", "Keys", "Sports Complex Court B", "2026-09-17", "Found on bench near badminton court. 2 brass keys and 1 bike key.", "Priya Nair", "priya.nair@campus.edu", "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=500&q=80", "OPEN"],
                    [1, "Blue Denim Jacket (Size M)", "FOUND", "Apparel", "Auditorium Block A", "2026-09-12", "Left behind after Freshman Orientation event. Contains a college library slip in pocket.", "Volunteers Helpdesk", "events@campus.edu", "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&q=80", "REUNITED"]
                ];

                const stmt = db.prepare(`
                    INSERT INTO items (user_id, title, type, category, location, date_reported, description, contact_name, contact_info, image_url, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                sampleItems.forEach(item => stmt.run(item));
                stmt.finalize();
                console.log('Seeded database with initial campus items.');
            }
        });
    });
}

// ---------------------------------------------------------------------------
// AUTHENTICATION API ENDPOINTS
// ---------------------------------------------------------------------------

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (!EMAIL_RE.test(email)) {
        return res.status(400).json({ error: 'Please provide a valid campus email address.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name.trim(), email.trim().toLowerCase(), hashedPassword],
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'An account with this email already exists.' });
                    }
                    return res.status(500).json({ error: err.message });
                }

                const userId = this.lastID;
                const token = jwt.sign({ id: userId, name: name.trim(), email: email.trim().toLowerCase() }, JWT_SECRET, { expiresIn: '7d' });

                res.status(201).json({
                    message: 'Registration successful!',
                    token,
                    user: { id: userId, name: name.trim(), email: email.trim().toLowerCase() }
                });
            }
        );
    } catch (err) {
        res.status(500).json({ error: 'Internal server error during password hashing.' });
    }
});

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'Login successful!',
            token,
            user: { id: user.id, name: user.name, email: user.email }
        });
    });
});

// GET /api/auth/me (Get current logged-in user)
app.get('/api/auth/me', authenticateToken, (req, res) => {
    res.json({ user: req.user });
});

// ---------------------------------------------------------------------------
// FILE UPLOAD API ENDPOINT
// ---------------------------------------------------------------------------

// POST /api/upload
app.post('/api/upload', optionalToken, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded.' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ message: 'File uploaded successfully', url: fileUrl });
});

// ---------------------------------------------------------------------------
// ITEMS REST API ENDPOINTS
// ---------------------------------------------------------------------------

// GET /api/stats
app.get('/api/stats', (req, res) => {
    db.all(`
        SELECT 
            (SELECT COUNT(*) FROM items) as total,
            (SELECT COUNT(*) FROM items WHERE type='LOST' AND status='OPEN') as lost,
            (SELECT COUNT(*) FROM items WHERE type='FOUND' AND status='OPEN') as found,
            (SELECT COUNT(*) FROM items WHERE status='REUNITED') as reunited
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows[0]);
    });
});

// GET /api/items (with filtering & pagination support)
app.get('/api/items', (req, res) => {
    let sql = "SELECT * FROM items WHERE 1=1";
    let countSql = "SELECT COUNT(*) as count FROM items WHERE 1=1";
    const params = [];
    const countParams = [];

    const { type, status, category, search, page, limit, my_items } = req.query;

    if (type) {
        sql += " AND type = ?";
        countSql += " AND type = ?";
        params.push(type);
        countParams.push(type);
    }
    if (status) {
        sql += " AND status = ?";
        countSql += " AND status = ?";
        params.push(status);
        countParams.push(status);
    }
    if (category && category !== 'All') {
        sql += " AND category = ?";
        countSql += " AND category = ?";
        params.push(category);
        countParams.push(category);
    }
    if (search) {
        sql += " AND (title LIKE ? OR description LIKE ? OR location LIKE ?)";
        countSql += " AND (title LIKE ? OR description LIKE ? OR location LIKE ?)";
        const term = `%${search}%`;
        params.push(term, term, term);
        countParams.push(term, term, term);
    }
    if (my_items && req.headers['authorization']) {
        const token = req.headers['authorization'].split(' ')[1];
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            sql += " AND user_id = ?";
            countSql += " AND user_id = ?";
            params.push(decoded.id);
            countParams.push(decoded.id);
        } catch (e) {}
    }

    sql += " ORDER BY id DESC";

    // Handle Pagination
    if (page && limit) {
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 6;
        const offset = (pageNum - 1) * limitNum;

        db.get(countSql, countParams, (err, countRow) => {
            if (err) return res.status(500).json({ error: err.message });

            const totalItems = countRow ? countRow.count : 0;
            const totalPages = Math.ceil(totalItems / limitNum) || 1;

            sql += " LIMIT ? OFFSET ?";
            params.push(limitNum, offset);

            db.all(sql, params, (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({
                    items: rows,
                    pagination: {
                        total: totalItems,
                        page: pageNum,
                        limit: limitNum,
                        totalPages: totalPages
                    }
                });
            });
        });
    } else {
        db.all(sql, params, (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    }
});

// POST /api/items (Create new report)
app.post('/api/items', optionalToken, (req, res) => {
    const { title, type, category, location, date_reported, description, contact_name, contact_info, image_url } = req.body;

    const validationErrors = validateItemPayload(req.body);
    if (validationErrors.length) {
        return res.status(400).json({ error: 'Validation failed', details: validationErrors });
    }

    const defaultImg = "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=500&q=80";
    const userId = req.user ? req.user.id : 0;

    db.run(`
        INSERT INTO items (user_id, title, type, category, location, date_reported, description, contact_name, contact_info, image_url, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')
    `, [userId, title, type.toUpperCase(), category, location, date_reported, description, contact_name, contact_info, image_url || defaultImg], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Item reported successfully', id: this.lastID });
    });
});

// PUT /api/items/:id (Full edit item report)
app.put('/api/items/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { title, type, category, location, date_reported, description, contact_name, contact_info, image_url } = req.body;

    if (!/^\d+$/.test(id)) {
        return res.status(400).json({ error: 'Item id must be a positive integer' });
    }

    const validationErrors = validateItemPayload(req.body);
    if (validationErrors.length) {
        return res.status(400).json({ error: 'Validation failed', details: validationErrors });
    }

    // Check ownership
    db.get('SELECT * FROM items WHERE id = ?', [id], (err, item) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!item) return res.status(404).json({ error: 'Item not found.' });

        if (item.user_id !== 0 && item.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Permission denied. You can only edit your own listings.' });
        }

        db.run(`
            UPDATE items 
            SET title = ?, type = ?, category = ?, location = ?, date_reported = ?, description = ?, contact_name = ?, contact_info = ?, image_url = ?
            WHERE id = ?
        `, [title, type.toUpperCase(), category, location, date_reported, description, contact_name, contact_info, image_url, id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Item updated successfully!' });
        });
    });
});

// PATCH /api/items/:id/status (Mark as Reunited or Open)
app.patch('/api/items/:id/status', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const newStatus = status || 'REUNITED';

    if (!/^\d+$/.test(id)) {
        return res.status(400).json({ error: 'Item id must be a positive integer' });
    }
    if (!VALID_STATUSES.has(newStatus)) {
        return res.status(400).json({ error: `Status must be one of: ${[...VALID_STATUSES].sort().join(', ')}` });
    }

    db.get('SELECT * FROM items WHERE id = ?', [id], (err, item) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!item) return res.status(404).json({ error: 'Item not found.' });

        if (item.user_id !== 0 && item.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Permission denied. Only the listing owner can change item status.' });
        }

        db.run("UPDATE items SET status = ? WHERE id = ?", [newStatus, id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: `Status updated to ${newStatus}` });
        });
    });
});

// DELETE /api/items/:id
app.delete('/api/items/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
        return res.status(400).json({ error: 'Item id must be a positive integer' });
    }

    db.get('SELECT * FROM items WHERE id = ?', [id], (err, item) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!item) return res.status(404).json({ error: 'Item not found.' });

        if (item.user_id !== 0 && item.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Permission denied. Only the listing owner can delete this post.' });
        }

        db.run("DELETE FROM items WHERE id = ?", [id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Item deleted successfully' });
        });
    });
});

// Start Express Server
app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 CAMPUSFINDIT SERVER RUNNING IN 2ND YEAR TRACK MODE!`);
    console.log(`🌐 Local Access: http://localhost:${PORT}`);
    console.log(`🔐 Authentication: JWT + bcrypt Password Hashing Enabled`);
    console.log(`📁 File Uploads: Saved locally to /uploads/`);
    console.log(`=======================================================`);
});
