# Bug Fixes Documentation

This document lists all bugs found in the Field Force Tracker application, along with their locations, descriptions, and fixes.

---

## Bug 1: Missing `await` on bcrypt.compare

**File:** `backend/routes/auth.js`  
**Line:** 28

### What was wrong
The `bcrypt.compare()` function returns a Promise, but the code was missing the `await` keyword. This caused `isValidPassword` to always be truthy (a Promise object), allowing any password to successfully authenticate.

### How it was fixed
```diff
- const isValidPassword = bcrypt.compare(password, user.password);
+ const isValidPassword = await bcrypt.compare(password, user.password);
```

### Why the fix is correct
Adding `await` ensures the Promise is resolved and the actual boolean result of the password comparison is used for authentication.

---

## Bug 2: Password stored in JWT payload

**File:** `backend/routes/auth.js`  
**Line:** 35

### What was wrong
The user's hashed password was being included in the JWT token payload. This is a major security vulnerability as:
1. Anyone with the token can see the hashed password
2. Tokens can be decoded without the secret key (they're just base64 encoded)
3. The hashed password could be used for offline brute-force attacks

### How it was fixed
```diff
- { id: user.id, email: user.email, role: user.role, name: user.name, password: user.password },
+ { id: user.id, email: user.email, role: user.role, name: user.name },
```

### Why the fix is correct
JWTs should only contain the minimum necessary information for authentication and authorization. The password (even hashed) should never be included.

---

## Bug 3: Wrong status code for validation error

**File:** `backend/routes/checkin.js`  
**Line:** 30

### What was wrong
When client_id was missing, the API returned status code 200 (OK) instead of 400 (Bad Request). This made it impossible for the frontend to properly distinguish between success and validation errors.

### How it was fixed
```diff
- return res.status(200).json({ success: false, message: 'Client ID is required' });
+ return res.status(400).json({ success: false, message: 'Client ID is required' });
```

### Why the fix is correct
HTTP 400 Bad Request is the appropriate status code for client-side validation errors. This follows REST API best practices.

---

## Bug 4: Wrong column names in INSERT statement

**File:** `backend/routes/checkin.js`  
**Line:** 57

### What was wrong
The INSERT statement used column names `lat` and `lng`, but the actual database columns are named `latitude` and `longitude`. This caused location data to fail to save.

### How it was fixed
```diff
- INSERT INTO checkins (employee_id, client_id, lat, lng, notes, status)
+ INSERT INTO checkins (employee_id, client_id, latitude, longitude, notes, status)
```

### Why the fix is correct
Column names must exactly match the database schema for the INSERT to work correctly.

---

## Bug 5: SQL Injection vulnerability

**File:** `backend/routes/checkin.js`  
**Lines:** 113-116

### What was wrong
Date parameters were being directly concatenated into the SQL query string, creating a SQL injection vulnerability:
```javascript
query += ` AND DATE(ch.checkin_time) >= '${start_date}'`;
query += ` AND DATE(ch.checkin_time) <= '${end_date}'`;
```

### How it was fixed
```javascript
query += ` AND DATE(ch.checkin_time) >= ?`;
params.push(start_date);
query += ` AND DATE(ch.checkin_time) <= ?`;
params.push(end_date);
```

### Why the fix is correct
Using parameterized queries prevents SQL injection by properly escaping user input. The database driver handles sanitization automatically.

---

## Bug 6: Missing status filter in checkout query

**File:** `backend/routes/checkin.js`  
**Line:** 79

### What was wrong
The checkout query only ordered by time without filtering by status. This could cause an already checked-out record to be "checked out" again.

### How it was fixed
```diff
- 'SELECT * FROM checkins WHERE employee_id = ? ORDER BY checkin_time DESC LIMIT 1'
+ 'SELECT * FROM checkins WHERE employee_id = ? AND status = "checked_in" ORDER BY checkin_time DESC LIMIT 1'
```

### Why the fix is correct
Only records with status "checked_in" should be available for checkout. This prevents duplicate checkout operations.

---

## Bug 7: MySQL functions used in SQLite

**File:** `backend/routes/checkin.js` (Line 88) and `backend/routes/dashboard.js` (Line 80)

### What was wrong
MySQL-specific functions were used that don't exist in SQLite:
- `NOW()` → SQLite uses `datetime('now')`
- `DATE_SUB(NOW(), INTERVAL 7 DAY)` → SQLite uses `datetime('now', '-7 days')`

### How it was fixed
**checkin.js:**
```diff
- 'UPDATE checkins SET checkout_time = NOW(), status = "checked_out" WHERE id = ?'
+ 'UPDATE checkins SET checkout_time = datetime("now"), status = "checked_out" WHERE id = ?'
```

**dashboard.js:**
```diff
- WHERE employee_id = ? AND checkin_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
+ WHERE employee_id = ? AND checkin_time >= datetime('now', '-7 days')
```

### Why the fix is correct
The application uses SQLite, so SQLite-compatible date/time functions must be used.

---

## Bug 8: Frontend History.jsx crashes on load

**File:** `frontend/src/pages/History.jsx`  
**Line:** 45

### What was wrong
The `totalHours` calculation using `.reduce()` was placed outside the loading check. When the component first renders, `checkins` is `null`, and calling `.reduce()` on `null` throws a TypeError, crashing the page.

### How it was fixed
```diff
- const totalHours = checkins.reduce((total, checkin) => {
+ const totalHours = (checkins || []).reduce((total, checkin) => {
```

### Why the fix is correct
Using `(checkins || [])` provides a fallback empty array when `checkins` is null, preventing the crash while still correctly calculating 0 hours.

---

## Bug 9: Wrong role check in Dashboard

**File:** `frontend/src/pages/Dashboard.jsx`  
**Line:** 15

### What was wrong
The code used `user.id === 1` to determine if a user is a manager. This is incorrect because:
1. It assumes the manager always has ID 1
2. If a new manager is created, they won't see the manager dashboard
3. Multiple managers would need ID 1

### How it was fixed
```diff
- const endpoint = user.id === 1 ? '/dashboard/stats' : '/dashboard/employee';
+ const endpoint = user.role === 'manager' ? '/dashboard/stats' : '/dashboard/employee';
```

### Why the fix is correct
Using `user.role === 'manager'` correctly checks the user's role from the JWT token, making the dashboard work for any manager regardless of their ID.

---

## Summary

| # | Bug | Severity | Type |
|---|-----|----------|------|
| 1 | Missing await on bcrypt.compare | Critical | Authentication bypass |
| 2 | Password in JWT payload | High | Security vulnerability |
| 3 | Wrong status code | Low | API design |
| 4 | Wrong column names | High | Data not saving |
| 5 | SQL injection | Critical | Security vulnerability |
| 6 | Missing status filter | Medium | Logic error |
| 7 | MySQL functions in SQLite | High | Database compatibility |
| 8 | History.jsx crash | High | Frontend crash |
| 9 | Wrong role check | Medium | Logic error |
