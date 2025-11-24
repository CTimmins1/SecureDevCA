# SecureDevCa — Secure Branch

This branch contains the secured implementation of the TaskPad application for the Secure Application Programming CA.  
All identified vulnerabilities from the insecure branch have been fixed, and industry-standard protections have been added.

---

## How to Run the Secure Version

### 1. Install Dependencies

Run this inside the project folder:

```bash
npm install
This installs all required modules:

express

express-session

ejs / express-ejs-layouts

sqlite3

bcrypt

csurf

2. Initialise the Secure Database
Before starting the app, you must create secure.db:

bash:
node init_db.js
This generates:

/data/secure.db

The database includes:

a bcrypt-hashed seeded test user

sample tasks

sample comments

a schema using secure parameterised queries

3. Start the Server
Launch the Express backend:


node server.js
If successful, you will see:

Secure app running at http://localhost:5000
Open the application in your browser:


http://localhost:5000
```
Secure Branch Test Login
Use the following seeded credentials:


Email:    conor@test.com
Password: Pass123


### Security Features Implemented:

# Parameterised SQL Queries
All database queries now use placeholders, preventing SQL injection.

# XSS Protection
Escaped output in all EJS templates

Reflected, stored, and DOM-based XSS removed

No unsafe innerHTML or unescaped rendering

# CSRF Token Added
All state-changing POST routes use the csurf middleware.

# Secure Session Management

httpOnly cookies

SameSite=Lax

Reasonable session expiry time

Minimal user data stored in the session

# Security Headers
A Content-Security-Policy (CSP) header is applied:

# Logging and Monitoring
Authentication events, searches, session actions, and errors are logged with timestamps for monitoring.

The application runs locally on localhost; no hosting is required.

This branch mirrors the structure of the insecure branch but with all vulnerabilities remediated.

The insecure branch should be used to demonstrate SQL injection, XSS, weak session handling, and sensitive data exposure.
