// server.js
// Entry point for the TaskFlow API server.
//
// TaskFlow is a small distributed web/API application built for the
// COMP713 Individual Project (Option A). A static HTML/JS client
// (in ../client) talks to this Express API over HTTP/JSON, and the
// API persists data to a SQLite database (data-persistence layer).

const path = require('path');
const express = require('express');
const cors = require('cors');

const projectsRouter = require('./routes/projects');
const tasksRouter = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve the static client (simple client interface)
app.use(express.static(path.join(__dirname, '..', 'client')));

// API routes
app.use('/api/projects', projectsRouter);
app.use('/api', tasksRouter); // handles /api/projects/:projectId/tasks and /api/tasks/:id

// Health check endpoint - useful for quickly testing the server is up
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Fallback 404 handler for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Unknown API route.' });
});

// Generic error handler (catches unexpected exceptions from route handlers)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`TaskFlow server running at http://localhost:${PORT}`);
});
