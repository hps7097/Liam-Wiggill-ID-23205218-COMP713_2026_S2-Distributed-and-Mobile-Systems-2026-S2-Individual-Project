// db.js
// Sets up the SQLite database connection and applies the schema on startup.
// Using better-sqlite3 because it is synchronous and simple, which keeps the
// route handlers easy to read for a small teaching project like this one.

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'taskflow.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

const db = new Database(DB_PATH);

// Enforce foreign key constraints (off by default in SQLite)
db.pragma('foreign_keys = ON');

// Apply schema (idempotent - uses CREATE TABLE IF NOT EXISTS)
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
db.exec(schema);

module.exports = db;
