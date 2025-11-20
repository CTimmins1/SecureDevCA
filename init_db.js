// In this file I'm setting up the insecure SQLite database
// that the assignment requirements ask for. I'm intentionally
// using plaintext passwords and no input validation because
// this branch is supposed to demonstrate insecure practices.

const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

// I store the database in a "data" folder to keep things tidy.
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// This will be the insecure DB file.
const dbPath = path.join(dataDir, "insecure.db");
const db = new sqlite3.Database(dbPath);

// I use serialize so the DB commands run in order.
db.serialize(() => {
  // I drop tables so I can quickly reset during development.
  db.run("DROP TABLE IF EXISTS users");
  db.run("DROP TABLE IF EXISTS tasks");
  db.run("DROP TABLE IF EXISTS comments");

  // USERS TABLE — intentionally insecure:
  // - storing password as plaintext
  // - no salt, no hash
  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT,
      display_name TEXT
    )
  `);

  // Simple tasks table with a title + description.
  db.run(`
    CREATE TABLE tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT
    )
  `);

  // Comments table — body will later be used for stored XSS.
  db.run(`
    CREATE TABLE comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER,
      body TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // I seed a test user so I can immediately log in.
  db.run(
    "INSERT INTO users (email, password, display_name) VALUES (?, ?, ?)",
    ["conor@test.com", "Pass123", "conor"]
  );

  // I also add a sample task to interact with.
  db.run(
    "INSERT INTO tasks (title, description) VALUES (?, ?)",
    ["Sample Task", "This seeded task will be used later for XSS demos."]
  );
});

// Once the DB is created, I close the connection.
db.close(() => {
  console.log("Insecure DB created at:", dbPath);
});
