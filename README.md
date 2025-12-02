# SecureDevCa — Insecure Branch

This branch contains the intentionally vulnerable implementation of the TaskPad application for the Secure Application Programming CA.  
The goal of this branch is to demonstrate how common web application vulnerabilities occur in real-world code before they are remediated on the secure branch.

---

## How to Run the Insecure Version

### 1. Install Dependencies

Run this inside the project folder:

```bash
npm install
This installs all required modules:

express
express-session
ejs / express-ejs-layouts
sqlite3

2. Initialise the Insecure Database
Before starting the app, you must create insecure.db:

node init_db.js
This generates:

/data/insecure.db

The database includes:

a test user with a plaintext password

sample tasks

sample comments

no hashing, no security, and intentionally unsafe schema design

3. Start the Server
Launch the Express backend:

node server.js
If successful, you will see:

Insecure app running at http://localhost:5000
```
Open the application in your browser:

http://localhost:5000

Insecure Branch Test Login
Use the following seeded credentials:

Email: conor@test.com
Password: Pass123

These credentials are stored in the database in plaintext to demonstrate sensitive data exposure.

Vulnerabilities Present in the Insecure Branch
This branch intentionally includes the following insecure features as required by the assignment:

SQL Injection
The following routes are vulnerable due to string concatenation combined with unsanitised user input:

POST /login

GET /search

GET /task/:id

Example payloads:

' OR 1=1 --
" OR "" = "
1 OR 1=1
These will log you in without a password, or expose task data.

Reflected XSS
Reflected XSS appears in the task search feature:


/search?q=<script>alert('reflected')</script>
Because user input is written directly into the EJS output without escaping.

Stored XSS
Stored XSS occurs in the comments section of a task:

Go to:

/task/1
Submit a comment containing:


<img src=x onerror="alert('stored XSS')">
The payload is stored in the database and executed whenever the task page is viewed.

DOM-Based XSS
DOM XSS appears in the insecure tasks page where the banner query parameter is written to innerHTML without sanitisation.

Example payload:


/tasks?banner=<img src=x onerror="alert('DOM XSS')">
The browser executes it immediately.

Sensitive Data Exposure
The insecure branch contains:

Plaintext passwords stored directly in the database

A /debug route that leaks all users and session data

Hard-coded secrets

No security headers

These issues intentionally remain unfixed for demonstration purposes.

Weak Session Management
The insecure branch uses:

Hard-coded session secret

No cookie flags (no httpOnly, no sameSite)

No logout button

Sessions that do not expire in a reasonable timeframe

This allows session hijacking and poor session lifecycle control.

Notes
The insecure branch is not designed for production use.
It exists solely to demonstrate vulnerabilities that are later remediated in the secure branch.
The secure branch should be used to study secure coding practices and defensive programming techniques.
