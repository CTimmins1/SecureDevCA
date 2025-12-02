SecureDevCA — Insecure Branch

This branch contains the intentionally vulnerable version of the TaskPad application for the Secure Application Programming CA.
Its purpose is to demonstrate how common web application vulnerabilities occur before being remediated in the secure branch.

1. Install Dependencies

Run the following inside the project folder:

npm install

This installs:

express

express-session

ejs / express-ejs-layouts

sqlite3

2. Initialise the Insecure Database

Run:

node init_db.js

This creates the insecure database located at:

/data/insecure.db

The database contains:

A seeded user with a plaintext password

Sample tasks

Sample comments

No hashing and intentionally unsafe schema design

3. Start the Server

Run:

node server.js

If successful, the console will show:

Insecure app running at http://localhost:5000

Open the application in your browser:

http://localhost:5000

Insecure Branch Test Login

Use the following seeded credentials:

Email: conor@test.com

Password: Pass123

Or use an SQLi payload eg: 'OR 1=1 -- & a nonsense password.

These are stored in plaintext to demonstrate sensitive data exposure.

Vulnerabilities Present in the Insecure Branch

This branch intentionally contains the following vulnerabilities for educational and assessment purposes.

1. SQL Injection

Vulnerable routes:

POST /login

GET /search

GET /task/:id

These endpoints use direct string concatenation with user input.

Example payloads:
```' OR 1=1 --```
```" OR "" = "```
```1 OR 1=1```

These allow logging in without a password or exposing task data.

2. Reflected XSS

Occurs when user-controlled search input is written directly to the rendered page without escaping.

Example:
```/search?q=<script>alert('reflected')</script>```

3. Stored XSS

Occurs in the comments feature:

Go to /task/1

Submit a comment such as:

```<img src=x onerror="alert('stored XSS')">```

The payload is stored in the database and executed every time the task page loads.

4. DOM-Based XSS

Triggered via an unsafe innerHTML assignment on the tasks page.

Example:
```/tasks?banner=<img src=x onerror="alert('DOM XSS')">```

This executes immediately in the browser.

5. Sensitive Data Exposure

The insecure branch contains:

Plaintext passwords stored in the database

A /debug endpoint that leaks user details and session data

Hard-coded secrets

No security headers

6. Weak Session Management

Insecure session behaviours include:

Hard-coded session secret

No httpOnly or sameSite cookie flags

No logout functionality

Long-lived sessions with no expiry control

Notes

The insecure branch is intentionally unsafe and should not be used in production.
It exists purely to demonstrate insecure coding practices that are corrected in the secure branch of this project.
