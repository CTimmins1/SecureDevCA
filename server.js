// This is the Secure Express backend for my SecureDevCa project.
// Everything in this file is to fix the issues from the 'insecure' backend.
// I will be incrementally fixing things in this branch, so]
// leaving 'Insecure:' above the sections I know I have to fix and will remove them as required/needed.

const express = require("express");
const session = require("express-session");
const ejsLayouts = require("express-ejs-layouts");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const app = express();
const bcrypt = require("bcrypt");  // I use bcrypt to hash and verify passwords, similar to the last CA, only this is not in python.
const HASH_ROUNDS = 10;              // Cost factor; 10 is fine for this demo, computational overhead is fine for this instance.
// Now in the secure branch im loading th e'secure' db with hashed passwords for the seedeed account.
const db = new sqlite3.Database(
  path.join(__dirname, "data", "secure.db")
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

// Setting Content-Security Policy here, this makes it so
// inline scripts will be blocked.
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'");
  next();
});


// Secure session configuration:
// I turn on httpOnly / sameSite to make cookies harder to steal.
// Set a reasonable maxAge so sessions are not valid forever.
app.use(
  session({
    secret: "my-very-secure-secret-string",  // Hard-coded for CA demo so the app runs without .env
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      // secure: true would be enabled behind HTTPS in a production setup.
      maxAge: 1000 * 60 * 30 
    }
  })
);

// CSRF Protection:
// I enable the csurf middleware here so POST requests such as login,
// registration, and comment submission cannot be forged by another site.
// This protects against Cross Site Request Forgery attacks.
const csrf = require("csurf");
  app.use(csrf());

// This middleware makes the current user available in all templates,
// so layout.ejs can show the logged-in email in the nav bar.
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// Simple auth guard used in the secure branch to block unauthenticated access.
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

// When someone hits the root URL I just send them to /login.
app.get("/", (req, res) => {
  res.redirect("/login");
});

// GET /login — secure login page for the hardened branch.
app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

// Secure login: I use a parameterised query instead of string concatenation.
// This blocks SQL injection on the email and password fields.
app.post("/login", (req, res) => {
  const email = (req.body.email || "").trim();
  const password = req.body.password || "";

  // I only query by email. The password check happens in code, which keeps
  // the SQL simple and avoids concatenating user input into the query text.
  const sql =
    "SELECT id, email, display_name, password FROM users WHERE email = ?";

  db.get(sql, [email], (err, user) => {
    if (err) {
      // Generic error so I do not leak DB details.
      return res.status(500).send("Unexpected error during login.");
    }

    if (!user) {
      // Same message for bad email or password to avoid user enumeration.
      console.log(
        "[AUTH] Login failed for email " +
          email +
          " at " +
          new Date().toISOString()
      );
      return res.render("login", { error: "Invalid email or password" });
    }

       // On the secure branch the DB stores bcrypt password hashes,
      // so I verify using bcrypt.compare instead of a direct string comparison.
    bcrypt.compare(password, user.password, (compareErr, match) => {
      if (compareErr || !match) {
        console.log(
          "[AUTH] Login failed for email " +
            email +
            " at " +
            new Date().toISOString()
        );
        return res.render("login", { error: "Invalid email or password" });
      }

      // I only store a minimal user object in the session.
      req.session.user = {
        id: user.id,
        email: user.email,
        displayName: user.display_name
      };
      req.session.justLoggedIn = true;

      console.log(
        "[AUTH] Login success for user id " +
          user.id +
          " at " +
          new Date().toISOString()
      );

      res.redirect("/tasks");
    });
  });
});

// GET /logout — clears the session and sends the user back to login.
// on the insecure branch there was no logout button, poor session management.
app.get("/logout", (req, res) => {
  if (req.session.user) {
    console.log(
      "[AUTH] Logout for user id " +
        req.session.user.id +
        " at " +
        new Date().toISOString()
    );
  }
  req.session.destroy(() => res.redirect("/login"));
});

// GET /tasks — very basic tasks page for now.
// I hang SQL injection, reflected XSS and DOM XSS off this.
app.get("/tasks", requireAuth, (req, res) => {
  const banner = req.session.justLoggedIn;
  delete req.session.justLoggedIn;

  db.all("SELECT id, title FROM tasks", (err, tasks) => {
    if (err) {
      console.error(
        "[SECURITY] Error loading tasks for user id " +
          req.session.user.id +
          " at " +
          new Date().toISOString() +
          ": " +
          err.message
      );
      return res.status(500).send("Error loading tasks.");
    }

    console.log(
      "[SECURITY] User id " +
        req.session.user.id +
        " viewed /tasks at " +
        new Date().toISOString()
    );

    // I pass an empty search query here so the template can reuse the
    // same markup for both the normal tasks view and the /search results.
    res.render("tasks", { tasks, banner, q: "" });
  });
});

// Secure search: I keep LIKE-based searching but use placeholders,
// so the q parameter can't inject SQL anymore.
app.get("/search", requireAuth, (req, res) => {
  const q = (req.query.q || "").trim();

  // If q is empty I just reuse the normal tasks listing.
  if (!q) {
    return res.redirect("/tasks");
  }

  const like = `%${q}%`;
  const sql = `
    SELECT id, title
    FROM tasks
    WHERE title LIKE ? OR description LIKE ?
  `;

  db.all(sql, [like, like], (err, tasks) => {
    if (err) {
      console.error(
        "Search error (secure branch):",
        err.message
      );
      console.error(
        "[SECURITY] Search error for user id " +
          req.session.user.id +
          " with query '" +
          q +
          "' at " +
          new Date().toISOString()
      );
      // I avoid exposing SQL errors to the user here.
      return res.render("tasks", {
        tasks: [],
        banner: false,
        q
      });
    }

    console.log(
      "[SECURITY] User id " +
        req.session.user.id +
        " searched for '" +
        q +
        "' at " +
        new Date().toISOString()
    );

    // Still sending q to the template here, but the secure template uses normal
    // EJS escaping (<%= q %>) so reflected XSS is no longer possible, Savage!.
    res.render("tasks", { tasks, banner: false, q });
  });
});

// GET /task/:id — task detail page.
// On the insecure branch this was used to demo stored XSS in comments.
app.get("/task/:id", requireAuth, (req, res) => {
  // grabbed the id straight from the URL and coerce it to an integer.
  // On the secure branch I reject bad values early.
  const taskId = parseInt(req.params.id, 10);

  if (Number.isNaN(taskId)) {
    return res.status(400).send("Invalid task id.");
  }

  // Secure: I use a parameterised query so taskId is treated as data,
  // which removes SQL injection on this route.
  const taskSql =
    "SELECT id, title, description FROM tasks WHERE id = ?";
  const commentsSql =
    "SELECT id, body, created_at FROM comments WHERE task_id = ? " +
    "ORDER BY created_at DESC";

  db.get(taskSql, [taskId], (err, task) => {
    if (err || !task) {
      return res.status(404).send("Task not found or DB error.");
    }

    db.all(commentsSql, [taskId], (err2, comments) => {
      if (err2) {
        return res.status(500).send("Error loading comments.");
      }

    // I render a separate template for the task detail and comments.
    // On the insecure branch the comments were rendered using raw HTML in task.ejs,
    // which caused stored XSS. On the secure branch I switched task.ejs to escaped
    // output (<%= c.body %>) so stored XSS payloads are printed as text instead of executing.
      res.render("task", {
        task,
        comments
      });
    });
  });
});

// POST /task/:id/comment — stores raw comment body.
// On the secure branch the output is escaped in task.ejs, so stored XSS is prevented.
app.post("/task/:id/comment", requireAuth, (req, res) => {
  const taskId = req.params.id;

  // I take the body exactly as the user typed it, including any HTML/JS.
  const body = req.body.body || "";

  // Secure: I use a parameterised query so taskId is treated as data,
  // removing SQL injection from the task lookup.
  const insertSql =
    "INSERT INTO comments (task_id, body) VALUES (?, ?)";

  db.run(insertSql, [taskId, body], function (err) {
    if (err) {
      return res.status(500).send("Error saving comment.");
    }

    // After storing the comment I redirect back to the same task page.
    res.redirect("/task/" + taskId);
  });
});

// Secure error handler:
// I log the full error server-side, but I only send a generic message to the client.
// This prevents leaking stack traces, file paths or other sensitive implementation details as it did in the inseucre branch.
app.use((err, req, res, next) => {
  console.error("Secure error handler:", err.stack);
  res
    .status(500)
    .send("An unexpected error occurred. I have logged the details server-side.");
});

// Secure registration: I hash the password with bcrypt before storing it.
// This means the database never sees a plaintext password.
app.get("/register", (req, res) => {
  res.render("register", { error: null });
});

app.post("/register", (req, res) => {
  const email = (req.body.email || "").trim();
  const password = req.body.password || "";

  if (!email || !password) {
    return res.render("register", { error: "Email and password are required." });
  }

  // I hash the password with bcrypt before inserting it.
  bcrypt.hash(password, HASH_ROUNDS, (err, hash) => {
    if (err) {
      return res.status(500).send("Error hashing password.");
    }

    const sql =
      "INSERT INTO users (email, password, display_name) VALUES (?, ?, ?)";

    // I reuse the email prefix as a simple display name.
    const displayName = email.split("@")[0];

    db.run(sql, [email, hash, displayName], function (dbErr) {
      if (dbErr) {
        // In a real app I'd handle unique email checks. For this CA a generic error is enough.
        return res.render("register", { error: "Could not create user." });
      }

      console.log(
        "[AUTH] Registration success for email " +
          email +
          " at " +
          new Date().toISOString()
      );

      res.redirect("/login");
    });
  });
});

// Start the now secure backend.
// I run it on port 5000 to keep it consistent with my browser URL and its a nice even number.
app.listen(5000, () => {
  console.log("Secure app running at http://localhost:5000");
});
