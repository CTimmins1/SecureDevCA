# SecureDevCa — Secure Branch

This branch contains the secured implementation of the TaskPad application for the Secure Application Programming CA.  
All vulnerabilities from the insecure branch have been fixed and replaced with secure equivalents following modern best practices.

---

## How to Run the Secure Version

### 1. Install Dependencies

Run this inside the project folder:

```bash
npm install
This installs the required modules:

express

express-session

ejs / express-ejs-layouts

sqlite3

bcrypt

csurf

2. Initialise the Secure Database
Before starting the app, generate the secure database:


node init_db.js
This creates:


/data/secure.db
The secure database includes:

a bcrypt-hashed seeded test user

sample tasks

sample comments

a schema using secure parameterised queries

3. Start the Server
Launch the backend:

node server.js
If successful, you will see:


Secure app running at http://localhost:5000
Open the application in your browser:

arduino
Copy code
http://localhost:5000
Secure Branch Test Login
Use the seeded account:

Email:    conor@test.com
Password: Pass123
Security Features Implemented
Parameterised SQL Queries
All SQL queries now use placeholders (?), preventing SQL injection.

XSS Protection
All EJS output uses escaped rendering (<%= %>).

Reflected XSS removed from search.

Stored XSS removed from comments.

DOM-based XSS removed by replacing innerHTML with textContent.

CSRF Token Added
All POST routes now use the csurf middleware.
Forms include a hidden csrfToken field to prevent CSRF attacks.

Secure Session Management
httpOnly cookies

sameSite=lax

reasonable maxAge

no sensitive data stored in session

Security Headers
A strict Content-Security-Policy (CSP) header is applied:

default-src 'self'
Logging and Monitoring
Authentication events, searches, task views, and errors are logged with timestamps for auditing.

This branch mirrors the insecure branch but with all vulnerabilities remediated.
Use the insecure branch to demonstrate:

SQL Injection

XSS (reflected, stored, DOM)

Weak session handling

Sensitive data exposure

Use the secure branch to show how each one was fixed.