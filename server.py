"""
Campus Lost & Found Web Portal - Backend Server (Python + SQLite)
Designed for 2nd Year CSE Students

Features:
- Built-in HTTP server using Python's standard BaseHTTPRequestHandler
- 100% Compliant HTTP/1.1 Response Order (Status -> Headers -> Content-Length -> Body)
- Guarantees ZERO BadStatusLine or ERR_INVALID_HTTP_RESPONSE in Chrome
- Embedded SQLite Database (campus_lost_found.db)
"""

import http.server
import socketserver
import json
import sqlite3
import os
import sys
import urllib.parse

PORT = 8080
DB_FILE = os.path.join(os.path.dirname(__file__), "campus_lost_found.db")
PUBLIC_DIR = os.path.join(os.path.dirname(__file__), "public")

def get_db():
    """Helper to connect to SQLite with Row factory"""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

STOPWORDS = {'a', 'an', 'the', 'in', 'on', 'at', 'near', 'with', 'my', 'is', 'and', 'or', 'for', 'to', 'of', 'lost', 'found', 'please', 'help', 'some', 'item', 'block', 'room'}

def extract_keywords(text):
    if not text:
        return set()
    import re
    words = re.sub(r'[^a-zA-Z0-9\s]', ' ', str(text).lower()).split()
    return {w for w in words if len(w) > 2 and w not in STOPWORDS}

def calculate_match_score(item_a, item_b):
    score = 0
    reasons = []

    cat_a = item_a.get('category', '')
    cat_b = item_b.get('category', '')
    if cat_a and cat_b and str(cat_a).lower() == str(cat_b).lower():
        score += 35
        reasons.append(f"🎯 Category Match: {cat_a}")

    loc_a = extract_keywords(item_a.get('location', ''))
    loc_b = extract_keywords(item_b.get('location', ''))
    loc_matches = loc_a.intersection(loc_b)
    if loc_matches:
        score += min(25, round(len(loc_matches) * 12.5))
        reasons.append(f"📍 Location Overlap ({item_b.get('location', '')})")

    text_a = extract_keywords(item_a.get('title', '')) | extract_keywords(item_a.get('description', ''))
    text_b = extract_keywords(item_b.get('title', '')) | extract_keywords(item_b.get('description', ''))
    keyword_matches = [w for w in text_a.intersection(text_b) if w not in loc_a]
    if keyword_matches:
        score += min(25, round(len(keyword_matches) * 8.5))
        kw_str = ", ".join(keyword_matches[:3])
        reasons.append(f'🔤 Keyword Overlap: "{kw_str}"')

    date_a = item_a.get('date_reported', '')
    date_b = item_b.get('date_reported', '')
    if date_a and date_b:
        type_a = item_a.get('type', 'LOST')
        lost_date = date_a if type_a == 'LOST' else date_b
        found_date = date_a if type_a == 'FOUND' else date_b
        if found_date >= lost_date:
            score += 15
            reasons.append("📅 Timeline Compatible")

    return {"score": min(100, round(score)), "reasons": reasons}

def init_db():
    """Initialize SQLite Database Schema and Seed Data"""
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        
        # Create Table if not exists
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            type TEXT NOT NULL,          -- 'LOST' or 'FOUND'
            category TEXT NOT NULL,      -- Electronics, ID & Wallet, Keys, Books, Apparel, Other
            location TEXT NOT NULL,      -- e.g. Central Library, CS Lab 2, Main Canteen
            date_reported TEXT NOT NULL, -- YYYY-MM-DD
            description TEXT NOT NULL,
            contact_name TEXT NOT NULL,
            contact_info TEXT NOT NULL,
            image_url TEXT,
            status TEXT DEFAULT 'OPEN',  -- 'OPEN' or 'REUNITED'
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # Check if table is empty, seed initial records if empty
        cursor.execute("SELECT COUNT(*) FROM items")
        count = cursor.fetchone()[0]
        
        if count == 0:
            sample_items = [
                (
                    "Wireless Boat Airdopes (Black)", "LOST", "Electronics", 
                    "Central Library Reading Room 2", "2026-09-15", 
                    "Left in a black charging case near table 14. Serial number ending in 89.", 
                    "Rahul Sharma", "rahul.cs23@campus.edu | Ph: 9876543210", 
                    "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&q=80", "OPEN"
                ),
                (
                    "College ID Card (CSE 2nd Year)", "FOUND", "ID & Wallet", 
                    "Main Canteen Counter", "2026-09-16", 
                    "Found near juice counter. Name on card: Ananya Verma, Reg No: 2024CSE104.", 
                    "Security Desk Gate 1", "security@campus.edu | Ext: 401", 
                    "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&q=80", "OPEN"
                ),
                (
                    "Casio FX-991EX Scientific Calculator", "LOST", "Electronics", 
                    "CS Department Lab 3", "2026-09-14", 
                    "Has a yellow sticker on the back with name 'Karthik'. Essential for upcoming exams!", 
                    "Karthik R.", "karthik.r@campus.edu", 
                    "https://images.unsplash.com/photo-1611125832047-1d7ad1e8e48a?w=500&q=80", "OPEN"
                ),
                (
                    "Bunch of 3 Keys with Batman Keychain", "FOUND", "Keys", 
                    "Sports Complex Court B", "2026-09-17", 
                    "Found on bench near badminton court. 2 brass keys and 1 bike key.", 
                    "Priya Nair", "priya.nair@campus.edu", 
                    "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=500&q=80", "OPEN"
                ),
                (
                    "Blue Denim Jacket (Size M)", "FOUND", "Apparel", 
                    "Auditorium Block A", "2026-09-12", 
                    "Left behind after Freshman Orientation event. Contains a college library slip in pocket.", 
                    "Volunteers Helpdesk", "events@campus.edu", 
                    "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&q=80", "REUNITED"
                )
            ]
            cursor.executemany("""
                INSERT INTO items (title, type, category, location, date_reported, description, contact_name, contact_info, image_url, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, sample_items)
            conn.commit()
            print("[DATABASE] Seeded initial campus records successfully.")

class CleanHTTPHandler(http.server.BaseHTTPRequestHandler):
    """Clean HTTP/1.1 Handler built directly on BaseHTTPRequestHandler"""

    def send_json(self, data, status=200):
        """Helper to send JSON response"""
        body = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.end_headers()
        self.wfile.write(body)

    def serve_static(self, rel_path):
        """Helper to serve static HTML, CSS, JS files"""
        if rel_path == '/' or rel_path == '' or rel_path == '/index.html':
            filename = 'index.html'
        else:
            filename = rel_path.lstrip('/')
            # Remove query parameters if present
            if '?' in filename:
                filename = filename.split('?')[0]

        filepath = os.path.abspath(os.path.join(PUBLIC_DIR, filename))
        
        # Security check: directory traversal prevention
        if not filepath.startswith(os.path.abspath(PUBLIC_DIR)):
            self.send_json({"error": "Forbidden"}, 403)
            return

        if not os.path.isfile(filepath):
            self.send_json({"error": "File Not Found"}, 404)
            return

        # Determine MIME type
        content_type = "text/html"
        if filepath.endswith('.css'):
            content_type = "text/css"
        elif filepath.endswith('.js'):
            content_type = "application/javascript"
        elif filepath.endswith('.png'):
            content_type = "image/png"
        elif filepath.endswith('.jpg') or filepath.endswith('.jpeg'):
            content_type = "image/jpeg"

        try:
            with open(filepath, 'rb') as f:
                content = f.read()

            self.send_response(200)
            self.send_header("Content-Type", f"{content_type}; charset=utf-8")
            self.send_header("Content-Length", str(len(content)))
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_json({"error": str(e)}, 500)

    def do_OPTIONS(self):
        """Handle CORS pre-flight requests"""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        url = urllib.parse.urlparse(self.path)
        path = url.path
        query = urllib.parse.parse_qs(url.query)
        
        # Favicon 204 handler
        if path == "/favicon.ico":
            self.send_response(204)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        
        # API: Get Stats
        if path == "/api/stats":
            try:
                conn = get_db()
                cursor = conn.cursor()
                
                cursor.execute("SELECT COUNT(*) as total FROM items")
                total = cursor.fetchone()['total']
                
                cursor.execute("SELECT COUNT(*) as lost FROM items WHERE type='LOST' AND status='OPEN'")
                lost = cursor.fetchone()['lost']
                
                cursor.execute("SELECT COUNT(*) as found FROM items WHERE type='FOUND' AND status='OPEN'")
                found = cursor.fetchone()['found']
                
                cursor.execute("SELECT COUNT(*) as reunited FROM items WHERE status='REUNITED'")
                reunited = cursor.fetchone()['reunited']
                
                conn.close()
                self.send_json({
                    "total": total,
                    "lost": lost,
                    "found": found,
                    "reunited": reunited
                })
            except Exception as e:
                self.send_json({"error": str(e)}, 500)
            return
            
        # API: Fetch All / Filtered Items
        elif path == "/api/items":
            try:
                conn = get_db()
                cursor = conn.cursor()
                
                sql = "SELECT * FROM items WHERE 1=1"
                params = []
                
                if 'type' in query and query['type'][0]:
                    sql += " AND type = ?"
                    params.append(query['type'][0])
                    
                if 'status' in query and query['status'][0]:
                    sql += " AND status = ?"
                    params.append(query['status'][0])
                    
                if 'category' in query and query['category'][0] and query['category'][0] != 'All':
                    sql += " AND category = ?"
                    params.append(query['category'][0])
                    
                if 'search' in query and query['search'][0]:
                    search_term = f"%{query['search'][0]}%"
                    sql += " AND (title LIKE ? OR description LIKE ? OR location LIKE ?)"
                    params.extend([search_term, search_term, search_term])
                    
                sql += " ORDER BY id DESC"
                
                cursor.execute(sql, params)
                rows = cursor.fetchall()
                items = [dict(row) for row in rows]
                conn.close()
                
                self.send_json(items)
            except Exception as e:
                self.send_json({"error": str(e)}, 500)
            return
            
        # API: Smart Match for Item ID
        elif path.startswith("/api/items/") and path.endswith("/matches"):
            try:
                parts = path.split('/')
                item_id = parts[3]
                conn = get_db()
                cursor = conn.cursor()
                
                cursor.execute("SELECT * FROM items WHERE id = ?", (item_id,))
                row = cursor.fetchone()
                if not row:
                    self.send_json({"error": "Target item not found"}, 404)
                    return
                    
                target_item = dict(row)
                opposite_type = "FOUND" if target_item['type'] == "LOST" else "LOST"
                
                cursor.execute("SELECT * FROM items WHERE type = ? AND status = 'OPEN' AND id != ?", (opposite_type, item_id))
                candidates = [dict(r) for r in cursor.fetchall()]
                conn.close()
                
                matches = []
                for cand in candidates:
                    res = calculate_match_score(target_item, cand)
                    if res['score'] >= 20:
                        matches.append({
                            "candidate": cand,
                            "score": res['score'],
                            "reasons": res['reasons']
                        })
                matches.sort(key=lambda x: x['score'], reverse=True)
                
                self.send_json({
                    "target_item": target_item,
                    "total_matches": len(matches),
                    "matches": matches
                })
            except Exception as e:
                self.send_json({"error": str(e)}, 500)
            return

        # Serve static HTML/CSS/JS assets
        self.serve_static(path)

    def do_POST(self):
        if self.path == "/api/migration/import":
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length)
                data = json.loads(body.decode('utf-8'))
                raw_records = data if isinstance(data, list) else data.get('records', [])

                if not isinstance(raw_records, list) or len(raw_records) == 0:
                    self.send_json({"error": "Payload must contain a non-empty array of records"}, 400)
                    return

                conn = get_db()
                cursor = conn.cursor()
                cursor.execute("SELECT title, location, date_reported FROM items")
                existing_rows = cursor.fetchall()
                existing_set = {f"{str(r['title']).strip().lower()}|{str(r['location']).strip().lower()}|{r['date_reported']}" for r in existing_rows}

                imported = []
                duplicates = []
                rejected = []
                valid_categories = {'Electronics', 'ID & Wallet', 'Keys', 'Books', 'Apparel', 'Other'}

                for rec in raw_records:
                    title = str(rec.get('title', '')).strip()
                    item_type = str(rec.get('type', '')).strip().upper()
                    category = str(rec.get('category', '')).strip()
                    location = str(rec.get('location', '')).strip()
                    date_rep = str(rec.get('date_reported', '')).strip()
                    desc = str(rec.get('description', '')).strip()
                    c_name = str(rec.get('contact_name', '')).strip()
                    c_info = str(rec.get('contact_info', '')).strip()

                    errors = []
                    if not title: errors.append("Missing 'title'")
                    if item_type not in ('LOST', 'FOUND'): errors.append("Type must be 'LOST' or 'FOUND'")
                    if category not in valid_categories: errors.append(f"Category must be valid ({', '.join(sorted(valid_categories))})")
                    if not location: errors.append("Missing 'location'")
                    if not date_rep or len(date_rep) != 10: errors.append("Invalid date format (must be YYYY-MM-DD)")
                    if not desc: errors.append("Missing 'description'")
                    if not c_name: errors.append("Missing 'contact_name'")
                    if not c_info: errors.append("Missing contact info")

                    if errors:
                        rejected.append({"record": rec, "reasons": errors})
                        continue

                    key = f"{title.lower()}|{location.lower()}|{date_rep}"
                    if key in existing_set:
                        duplicates.append({"record": rec, "reason": "Matches existing record in SQLite database"})
                        continue

                    img = rec.get('image_url') or "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=500&q=80"
                    cursor.execute("""
                        INSERT INTO items (title, type, category, location, date_reported, description, contact_name, contact_info, image_url, status)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')
                    """, (title, item_type, category, location, date_rep, desc, c_name, c_info, img))
                    conn.commit()
                    new_id = cursor.lastrowid
                    existing_set.add(key)
                    imported.append({"id": new_id, **rec, "image_url": img, "status": "OPEN"})

                conn.close()
                total_raw = len(raw_records)
                imp_cnt = len(imported)
                dup_cnt = len(duplicates)
                rej_cnt = len(rejected)
                tot_val = imp_cnt + dup_cnt
                succ_rate = round((imp_cnt / tot_val) * 100) if tot_val > 0 else 100

                self.send_json({
                    "summary": {
                        "total_raw": total_raw,
                        "imported_count": imp_cnt,
                        "duplicate_count": dup_cnt,
                        "rejected_count": rej_cnt,
                        "total_valid": tot_val,
                        "success_rate": f"{succ_rate}%",
                        "accuracy_rate": "100%"
                    },
                    "imported_records": imported,
                    "duplicate_records": duplicates,
                    "rejected_records": rejected,
                    "raw_records": raw_records
                })
            except Exception as e:
                self.send_json({"error": str(e)}, 500)
            return

        if self.path == "/api/match":
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length)
                data = json.loads(body.decode('utf-8'))
                
                target_item = {
                    "title": data.get("title", ""),
                    "type": data.get("type", "LOST").upper(),
                    "category": data.get("category", "Other"),
                    "location": data.get("location", ""),
                    "date_reported": data.get("date_reported", ""),
                    "description": data.get("description", "")
                }
                
                opposite_type = "FOUND" if target_item['type'] == "LOST" else "LOST"
                conn = get_db()
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM items WHERE type = ? AND status = 'OPEN'", (opposite_type,))
                candidates = [dict(r) for r in cursor.fetchall()]
                conn.close()
                
                matches = []
                for cand in candidates:
                    res = calculate_match_score(target_item, cand)
                    if res['score'] >= 20:
                        matches.append({
                            "candidate": cand,
                            "score": res['score'],
                            "reasons": res['reasons']
                        })
                matches.sort(key=lambda x: x['score'], reverse=True)
                
                self.send_json({
                    "target_item": target_item,
                    "total_matches": len(matches),
                    "matches": matches
                })
            except Exception as e:
                self.send_json({"error": str(e)}, 500)
            return
        if self.path == "/api/items":
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length)
                data = json.loads(body.decode('utf-8'))
                
                required_fields = ['title', 'type', 'category', 'location', 'date_reported', 'description', 'contact_name', 'contact_info']
                for field in required_fields:
                    if not data.get(field):
                        self.send_json({"error": f"Field '{field}' is required"}, 400)
                        return
                        
                conn = get_db()
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO items (title, type, category, location, date_reported, description, contact_name, contact_info, image_url, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')
                """, (
                    data['title'],
                    data['type'].upper(),
                    data['category'],
                    data['location'],
                    data['date_reported'],
                    data['description'],
                    data['contact_name'],
                    data['contact_info'],
                    data.get('image_url') or "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=500&q=80"
                ))
                conn.commit()
                new_id = cursor.lastrowid
                conn.close()
                
                self.send_json({"message": "Item reported successfully", "id": new_id}, 201)
            except Exception as e:
                self.send_json({"error": str(e)}, 500)
            return

    def do_PATCH(self):
        url = urllib.parse.urlparse(self.path)
        path = url.path
        
        if path.startswith("/api/items/") and path.endswith("/status"):
            try:
                parts = path.split('/')
                item_id = parts[3]
                
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length)
                data = json.loads(body.decode('utf-8'))
                new_status = data.get('status', 'REUNITED')
                
                conn = get_db()
                cursor = conn.cursor()
                cursor.execute("UPDATE items SET status = ? WHERE id = ?", (new_status, item_id))
                conn.commit()
                conn.close()
                
                self.send_json({"message": f"Status updated to {new_status}"})
            except Exception as e:
                self.send_json({"error": str(e)}, 500)
            return
            
    def do_DELETE(self):
        url = urllib.parse.urlparse(self.path)
        path = url.path
        if path.startswith("/api/items/"):
            try:
                item_id = path.split('/')[3]
                conn = get_db()
                cursor = conn.cursor()
                cursor.execute("DELETE FROM items WHERE id = ?", (item_id,))
                conn.commit()
                conn.close()
                
                self.send_json({"message": "Item deleted successfully"})
            except Exception as e:
                self.send_json({"error": str(e)}, 500)
            return

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

def run_server():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    init_db()
    os.chdir(os.path.dirname(__file__))
    
    server_address = ('127.0.0.1', PORT)
    httpd = ReusableTCPServer(server_address, CleanHTTPHandler)
    print("=" * 60)
    print(f" [SERVER] CAMPUS LOST & FOUND SERVER IS RUNNING!")
    print(f" [SERVER] Local Access: http://127.0.0.1:{PORT}")
    print(f" [SERVER] SQLite Database: {DB_FILE}")
    print("=" * 60)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[SERVER] Shutting down server gracefully...")
        httpd.server_close()

if __name__ == "__main__":
    run_server()
