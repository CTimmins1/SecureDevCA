// This is the insecure Express backend for the SecureDevCa project.
// Everything in this file is intentionally flawed because this branch
// is supposed to demonstrate OWASP Top 10 style issues: SQLi, XSS,
// sensitive data exposure, weak sessions, etc.

const express = require("express");
const session = require("express-session");
const ejsLayouts = require("express-ejs-layouts");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();

// Here I'm loading the insecure SQLite database.
// The schema and data are defined in init_db.js.
const db = new sqlite3.Database(
  path.join(__dirname, "data", "insecure.db")
);

// I’m using EJS templates because they make it easy to show reflected
// and stored XSS in the insecure branch.
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// I enable the EJS layout middleware so I can have a common layout
// file (views/layout.ejs) that wraps all my pages.
app.use(ejsLayouts);
app.set("layout", "layout"); // this maps to views/layout.ejs

// I enable URL-encoded form parsing to handle login form input.
app.use(express.urlencoded({ extended: true }));

// INSECURE SESSION CONFIG:
// - hardcoded secret
// - no secure cookie flags (no secure / httpOnly / sameSite)
// - no session expiry logic
// This is deliberately weak for the insecure branch.
app.use(
  session({
    secret: "insecure-secret",
    resave: false,
    saveUninitialized: true
  })
);

// This middleware makes the current user available in all templates,
// so layout.ejs can show the logged-in email in the nav bar.
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// When someone hits the root URL I just send them to /login.
app.get("/", (req, res) => {
  res.redirect("/login");
});

// GET /login — basic insecure login page.
app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

// POST /login — SQL Injection vulnerability lives here.
app.post("/login", (req, res) => {
  const email = req.body.email || "";
  const password = req.body.password || "";

  // INTENTIONALLY INSECURE:
  // I build the SQL query using string concatenation, which means
  // an attacker can inject SQL via the email or password fields.
  const sql =
    "SELECT id, email, display_name FROM users WHERE email = '" +
    email +
    "' AND password = '" +
    password +
    "'";

  db.get(sql, (err, user) => {
    if (err) {
      // I keep this error simple, but in the insecure branch I could
      // also leak error details later to show sensitive data exposure.
      return res.status(500).send("Database error (insecure branch).");
    }

    // If no user is found, I just re-render the login page with a message.
    if (!user) {
      return res.render("login", { error: "Invalid credentials" });
    }

    // INSECURE: I store the raw user object in the session without
    // any extra checks. This is enough for demonstrating weak session
    // handling in the insecure branch.
    req.session.user = user;
    req.session.justLoggedIn = true;

    res.redirect("/tasks");
  });
});

// GET /logout — clears the session and sends the user back to login.
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

// GET /tasks — very basic tasks page for now.
// I’ll hang SQL injection, reflected XSS, DOM XSS and stored XSS off this later.
app.get("/tasks", (req, res) => {
  const banner = req.session.justLoggedIn;
  delete req.session.justLoggedIn;

  db.all("SELECT id, title FROM tasks", (err, tasks) => {
    if (err) {
      return res.status(500).send("Error loading tasks.");
    }

    res.render("tasks", { tasks, banner });
  });
});

// Start the insecure backend.
// I run it on port 5000 to keep it consistent with my browser URL.
app.listen(5000, () => {
  console.log("Insecure app running at http://localhost:5000");
});