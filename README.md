This branch contains the secured implementation of the TaskPad application for the Secure Application Programming CA.
All vulnerabilities from the insecure branch have been remediated using secure coding practices aligned with OWASP guidelines.

How to Run the Secure Version
1. Install Dependencies

Run the following inside the project folder:

```npm install```

This installs the required modules:

express

express-session

ejs / express-ejs-layouts

sqlite3

bcrypt

csurf

2. Initialise the Secure Database

Generate the secure database:

```node init_db.js```

This creates:

/data/secure.db

The secure database contains:

A user seeded with a bcrypt-hashed password

Sample tasks

Sample comments

A schema using parameterised SQL queries

3. Start the Server

Start the secure backend:

```node server.js```

You should see:

Secure app running at http://localhost:5000

Open the application in your browser:

http://localhost:5000

Secure Branch Test Login

Use the seeded credentials:

Email: conor@test.com

Password: Pass123

Security Features Implemented

The secure branch includes the following protections:

1. Parameterised SQL Queries

All SQL statements now use placeholder parameters (?) to prevent SQL Injection.
User input is always treated as data, never executable SQL.

2. XSS Protection

The following protections have been implemented:

All EJS rendering uses escaped syntax: <%= instead of <%-

Reflected XSS in the search route has been removed

Stored XSS in comments has been removed

DOM-based XSS has been eliminated by replacing innerHTML with textContent

Example of safe output encoding:

<%= comment.body %>

This ensures user input is rendered as text rather than HTML.

3. CSRF Protection

All POST routes now use the csurf middleware.
Each form includes a hidden CSRF token field:

<input type="hidden" name="_csrf" value="<%= csrfToken %>">

Requests without a valid token are rejected.

4. Secure Session Management

Session handling has been hardened:

httpOnly cookies (JavaScript cannot read them)

sameSite=lax to prevent cross-site attacks

reasonable maxAge for session expiry

no sensitive data is stored inside session objects

5. Security Headers

A strict Content-Security-Policy (CSP) header is applied:

default-src 'self'

This prevents execution of inline scripts, external scripts, or injected code.

6. Logging and Monitoring

Authentication attempts, searches, task views, and errors are logged server-side with timestamps.
Stack traces are no longer exposed to users; only generic error messages are shown.

Summary

This branch mirrors the insecure branch but with every major vulnerability corrected.
