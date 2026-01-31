# Technical Questions & Answers

## Question 1: Scaling to 10,000 Simultaneous Employees

**If this app had 10,000 employees checking in simultaneously, what would break first? How would you fix it?**

### What Would Break First

1. **SQLite Database**: SQLite uses file-level locking. With 10,000 concurrent write operations (check-ins), requests would queue up and timeout. SQLite is designed for single-writer scenarios.

2. **Single Node.js Process**: A single Node.js process can only handle limited concurrent connections. CPU-bound operations would create bottlenecks.

3. **Memory**: Storing all active connections and processing large query results could exhaust server memory.

### How to Fix It

1. **Database Migration**: 
   - Move to PostgreSQL or MySQL for proper concurrent write handling
   - Implement connection pooling (e.g., using `pg-pool`)
   - Add database replicas for read operations

2. **Horizontal Scaling**:
   - Deploy multiple Node.js instances behind a load balancer (NGINX, HAProxy)
   - Use PM2 cluster mode to utilize multiple CPU cores
   - Containerize with Docker and orchestrate with Kubernetes

3. **Caching**:
   - Add Redis for session management and frequently accessed data
   - Cache client lists and user data to reduce database reads

4. **Message Queue**:
   - Use RabbitMQ or Redis for async processing
   - Queue non-critical operations like logging and notifications

---

## Question 2: JWT Security Issue

**The current JWT implementation has a security issue. What is it and how would you improve it?**

### Security Issues Found

1. **Password in JWT Payload** (Fixed): The hashed password was stored in the JWT token. JWTs are base64-encoded and can be decoded by anyone. This exposed password hashes.

2. **No Token Refresh Mechanism**: The 24-hour expiry means users stay logged in too long, and if a token is stolen, it's valid for 24 hours.

3. **No Token Revocation**: There's no way to invalidate tokens (e.g., for logout or password change).

4. **Hardcoded Secret Fallback**: `middleware/auth.js` has a fallback secret key if `JWT_SECRET` env variable is not set.

### Improvements

1. **Short-lived Access Tokens + Refresh Tokens**:
   ```javascript
   // Access token: 15 minutes
   const accessToken = jwt.sign(payload, secret, { expiresIn: '15m' });
   // Refresh token: 7 days, stored in httpOnly cookie
   const refreshToken = jwt.sign({ id: user.id }, refreshSecret, { expiresIn: '7d' });
   ```

2. **Token Blacklist**: Store invalidated tokens in Redis to enable logout/revocation.

3. **Remove Secret Fallback**: Fail hard if `JWT_SECRET` is not configured.

4. **Add Token Rotation**: Issue new refresh tokens with each refresh request.

---

## Question 3: Offline Check-in Support

**How would you implement offline check-in support?**

### Implementation Approach

1. **Service Workers**: 
   - Register a service worker to intercept network requests
   - Use the Cache API to store static assets

2. **IndexedDB for Offline Data**:
   ```javascript
   // Store pending check-ins when offline
   const db = await openDB('fieldTracker', 1, {
     upgrade(db) {
       db.createObjectStore('pendingCheckins', { keyPath: 'localId' });
     }
   });
   
   // Save check-in locally
   await db.add('pendingCheckins', {
     localId: Date.now(),
     client_id,
     latitude,
     longitude,
     timestamp: new Date().toISOString(),
     synced: false
   });
   ```

3. **Background Sync API**:
   ```javascript
   // Register sync when online
   navigator.serviceWorker.ready.then(registration => {
     registration.sync.register('sync-checkins');
   });
   
   // In service worker
   self.addEventListener('sync', event => {
     if (event.tag === 'sync-checkins') {
       event.waitUntil(syncPendingCheckins());
     }
   });
   ```

4. **Conflict Resolution**: Use timestamps and device IDs to handle conflicts. Server timestamp should be authoritative for ordering.

5. **Visual Feedback**: Show "Pending sync" indicator on offline check-ins.

---

## Question 4: SQL vs NoSQL Databases

**Explain the difference between SQL and NoSQL. For this application, which would you recommend?**

### SQL Databases (e.g., PostgreSQL, MySQL)
- **Structure**: Relational, fixed schema with tables, rows, columns
- **Query**: Structured Query Language (SQL), powerful JOINs
- **ACID**: Full transaction support
- **Scaling**: Primarily vertical, horizontal with sharding is complex
- **Best for**: Complex relationships, structured data, transactions

### NoSQL Databases (e.g., MongoDB, DynamoDB)
- **Structure**: Flexible schema, documents/key-value/graph/column-family
- **Query**: Database-specific query languages
- **BASE**: Eventually consistent (typically), but some offer ACID
- **Scaling**: Designed for horizontal scaling
- **Best for**: Unstructured data, high write throughput, rapid iteration

### Recommendation for Field Force Tracker

**I recommend PostgreSQL (SQL)** for the following reasons:

1. **Relational Data**: Users → Check-ins → Clients relationships are inherently relational. SQL JOINs make queries like "get all check-ins with client names" efficient.

2. **Data Integrity**: ACID compliance ensures check-in/checkout operations are atomic.

3. **Geographic Queries**: PostgreSQL with PostGIS extension provides powerful geospatial functions for distance calculations and location-based queries.

4. **Reporting**: The daily summary API requires aggregations (COUNT, SUM, AVG) which SQL handles elegantly.

5. **Mature Ecosystem**: Well-documented, excellent tooling, easy to find developers.

---

## Question 5: Authentication vs Authorization

**What is the difference? Identify where each is implemented in this codebase.**

### Definitions

- **Authentication**: Verifying WHO a user is (identity verification)
- **Authorization**: Verifying WHAT a user can do (permission verification)

### Implementation in Codebase

#### Authentication
| Location | Description |
|----------|-------------|
| `routes/auth.js:9-55` | Login endpoint - verifies email/password |
| `routes/auth.js:28` | `bcrypt.compare()` validates password |
| `routes/auth.js:34-38` | JWT token generation |
| `middleware/auth.js:5-19` | `authenticateToken` middleware verifies JWT |

#### Authorization
| Location | Description |
|----------|-------------|
| `middleware/auth.js:22-27` | `requireManager` middleware checks role |
| `routes/dashboard.js:8` | Manager stats route uses `requireManager` |
| `routes/checkin.js:34-41` | Checks if employee is assigned to client |
| `routes/reports.js:15` | Daily summary requires manager role |

---

## Question 6: Race Conditions

**Explain what a race condition is. Can you identify any potential race conditions in this codebase?**

### What is a Race Condition?

A race condition occurs when the behavior of a system depends on the timing or sequence of uncontrollable events (like thread/process scheduling). In web applications, this often happens when multiple requests try to read and modify shared data concurrently.

### Potential Race Conditions in This Codebase

#### 1. Double Check-in Race Condition
**Location**: `routes/checkin.js:43-54`

```javascript
// Check for existing active check-in
const [activeCheckins] = await pool.execute(
    'SELECT * FROM checkins WHERE employee_id = ? AND status = "checked_in"'
);

if (activeCheckins.length > 0) {
    return res.status(400).json({ /* error */ });
}

// Time gap here! Another request could pass the check
const [result] = await pool.execute('INSERT INTO checkins...');
```

**Problem**: Two simultaneous check-in requests could both pass the "no active check-in" check and create duplicate active records.

**Fix**: Use database transaction with row-level locking:
```javascript
await pool.execute('BEGIN');
const [active] = await pool.execute(
    'SELECT * FROM checkins WHERE employee_id = ? AND status = "checked_in" FOR UPDATE'
);
// ... proceed with insert if no active check-in
await pool.execute('COMMIT');
```

#### 2. Checkout Race Condition
**Location**: `routes/checkin.js:78-90`

**Problem**: Similar issue where two checkout requests could query the same active check-in before either updates it.

**Fix**: Use `UPDATE ... WHERE status = 'checked_in'` and check `affectedRows`:
```javascript
const [result] = await pool.execute(
    'UPDATE checkins SET checkout_time = datetime("now"), status = "checked_out" WHERE employee_id = ? AND status = "checked_in"'
);
if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'No active check-in found' });
}
```

### Prevention Strategies

1. **Database Transactions**: Wrap read-modify-write operations in transactions
2. **Optimistic Locking**: Use version numbers to detect concurrent modifications
3. **Atomic Operations**: Use single UPDATE statements with WHERE conditions
4. **Unique Constraints**: Database-level constraints to prevent duplicates
