// In this file I'm setting up the secure SQLite database
// for the secure branch of the assignment. Here I fix the
// insecure practices from the other version by hashing passwords
// and still keeping the schema simple for the write-up.

const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");  // I use bcrypt here as well so my seeded users match the secure backend.
const HASH_ROUNDS = 10;            // Same cost factor as in server.js so the behaviour is consistent.

// I store the database in a "data" folder to keep things tidy.
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// This will be the secure DB file for the secure branch.
const dbPath = path.join(dataDir, "secure.db");
const db = new sqlite3.Database(dbPath);

// I use serialize so the DB commands run in order.
db.serialize(() => {
  // I drop tables so I can quickly reset during development.
  db.run("DROP TABLE IF EXISTS users");
  db.run("DROP TABLE IF EXISTS tasks");
  db.run("DROP TABLE IF EXISTS comments");

  // USERS TABLE — secure version:
  // - I now store bcrypt password hashes instead of plaintext.
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

  // Comments table — body will still be used to demonstrate XSS,
  // but the secure branch will escape output in the templates.
  db.run(`
    CREATE TABLE comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER,
      body TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // I seed a test user so I can immediately log in on the secure branch.
  // Here I hash the password with bcrypt so it matches the secure login logic.
  const plainPassword = "Pass123";
  const hashedPassword = bcrypt.hashSync(plainPassword, HASH_ROUNDS);

  db.run(
    "INSERT INTO users (email, password, display_name) VALUES (?, ?, ?)",
    ["conor@test.com", hashedPassword, "conor"]
  );

  // I also add a sample task to interact with.
  db.run(
    "INSERT INTO tasks (title, description) VALUES (?, ?)",
    ["Sample Task", "This seeded task is reused in the secure branch for XSS demos, but the output is escaped."]
  );
});

// Once the DB is created, I close the connection.
db.close(() => {
  console.log("Secure DB created at:", dbPath);
});
