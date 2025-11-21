// This is the insecure Express backend for my SecureDevCa project.
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

// I enable URL-encoded form parsing to handle login form input
// and later the insecure comment form.
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
// I hang SQL injection, reflected XSS and DOM XSS off this.
app.get("/tasks", (req, res) => {
  const banner = req.session.justLoggedIn;
  delete req.session.justLoggedIn;

  db.all("SELECT id, title FROM tasks", (err, tasks) => {
    if (err) {
      return res.status(500).send("Error loading tasks.");
    }

    // I pass an empty search query here so the template can reuse the
    // same markup for both the normal tasks view and the /search results.
    res.render("tasks", { tasks, banner, q: "" });
  });
});

// GET /search — intentionally vulnerable to SQL injection + reflected XSS.
app.get("/search", (req, res) => {
  const q = req.query.q || "";

  const sql =
    "SELECT id, title FROM tasks WHERE title LIKE '%" +
    q +
    "%' OR description LIKE '%" +
    q +
    "%'";

  db.all(sql, (err, tasks) => {
    // If SQL injection breaks the query, I still want to show the page
    // so the reflected XSS can be demonstrated.
    if (err) {
      console.log("SQL error (expected in insecure branch):", err.message);
      return res.render("tasks", {
        tasks: [],      // empty result set
        banner: false,
        q               // STILL reflect the payload → XSS fires
      });
    }

    res.render("tasks", { tasks, banner: false, q });
  });
});

// GET /task/:id — insecure task detail page with stored XSS in comments.
app.get("/task/:id", (req, res) => {
  // I grab the id straight from the URL without validating it.
  const taskId = req.params.id;

  // INSECURE: I build the SQL using string concatenation again.
  // This is vulnerable to SQL injection on the id parameter.
  const taskSql =
    "SELECT id, title, description FROM tasks WHERE id = " + taskId;
  const commentsSql =
    "SELECT id, body, created_at FROM comments WHERE task_id = " +
    taskId +
    " ORDER BY created_at DESC";

  db.get(taskSql, (err, task) => {
    if (err || !task) {
      return res.status(404).send("Task not found or DB error (insecure).");
    }

    db.all(commentsSql, (err2, comments) => {
      if (err2) {
        return res.status(500).send("Error loading comments.");
      }

      // I render a separate template for the task detail and comments.
      // The comments themselves will be rendered using raw HTML in task.ejs,
      // which is where the stored XSS happens.
      res.render("task", {
        task,
        comments
      });
    });
  });
});

// POST /task/:id/comment — stores raw comment body (stored XSS).
app.post("/task/:id/comment", (req, res) => {
  const taskId = req.params.id;

  // I take the body exactly as the user typed it, including any HTML/JS.
  const body = req.body.body || "";

  // INSECURE: I concatenate directly into the SQL string again.
  // This means a malicious comment can both break the query and be stored
  // as-is in the database. Combined with raw HTML rendering in task.ejs,
  // this becomes a classic stored XSS example.
  const insertSql =
    "INSERT INTO comments (task_id, body) VALUES (" +
    taskId +
    ", '" +
    body +
    "')";

  db.run(insertSql, function (err) {
    if (err) {
      return res.status(500).send("Error saving comment (insecure).");
    }

    // After storing the comment I redirect back to the same task page.
    res.redirect("/task/" + taskId);
  });
});

// INSECURE DEBUG ENDPOINT:
// This route deliberately exposes sensitive data so I can demonstrate
// the "Sensitive Data Exposure" risk in my CA write-up.
// In a real application something like this should never exist.
app.get("/debug", (req, res) => {
  // Pulls out all users including their plaintext passwords.
  db.all("SELECT id, email, password FROM users", (err, users) => {
    if (err) {
      // Even this error message is vague, but more could be leaked easily.
      return res.status(500).send("Debug DB error (insecure).");
    }

    //Returns the raw session object and the full users table,
    // which is a clear confidentiality flaw.
    res.type("json").send({
      session: req.session,
      users
    });
  });
});

// INSECURE: route that intentionally crashes so I can demo verbose error output.
app.get("/crash", (req, res, next) => {
  // I throw an error on purpose so my error handler (below) will run.
  next(new Error("Simulated server crash for insecure verbose error"));
});

// INSECURE ERROR HANDLER:
// Instead of a safe, generic error message, I dump the full stack trace
// to the browser. This leaks internal file paths and implementation
// details and is a good example of sensitive data exposure / poor
// error handling for the insecure branch.
app.use((err, req, res, next) => {
  console.error("Insecure error handler:", err.stack);

  res.status(500).send(
    "<h1>Server Error (Insecure)</h1>" +
      "<p>This environment is intentionally misconfigured for the CA, " +
      "so I am returning the full stack trace to the client:</p>" +
      "<pre>" +
      err.stack +
      "</pre>"
  );
});

// Start the insecure backend.
// I run it on port 5000 to keep it consistent with my browser URL and its a nice even number.
app.listen(5000, () => {
  console.log("Insecure app running at http://localhost:5000");
});
