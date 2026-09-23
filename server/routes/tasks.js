// routes/tasks.js
// API operations for the "tasks" resource, always scoped to a parent project.

const express = require('express');
const router = express.Router();
const db = require('../db');

const VALID_STATUSES = ['todo', 'in-progress', 'done'];

function projectExists(projectId) {
  return !!db.prepare('SELECT id FROM projects WHERE id = ?').get(projectId);
}

// GET /api/projects/:projectId/tasks
// List all tasks belonging to a project.
router.get('/projects/:projectId/tasks', (req, res) => {
  const projectId = Number(req.params.projectId);
  if (!Number.isInteger(projectId)) {
    return res.status(400).json({ error: 'Project id must be an integer.' });
  }
  if (!projectExists(projectId)) {
    return res.status(404).json({ error: `Project ${projectId} not found.` });
  }

  try {
    const tasks = db.prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at').all(projectId);
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
});

// POST /api/projects/:projectId/tasks
// Create a task under a project. Body: { title, description, status }
router.post('/projects/:projectId/tasks', (req, res) => {
  const projectId = Number(req.params.projectId);
  const { title, description, status } = req.body || {};

  if (!Number.isInteger(projectId)) {
    return res.status(400).json({ error: 'Project id must be an integer.' });
  }
  if (!projectExists(projectId)) {
    return res.status(404).json({ error: `Project ${projectId} not found.` });
  }
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Field "title" is required and must be a non-empty string.' });
  }
  const taskStatus = status || 'todo';
  if (!VALID_STATUSES.includes(taskStatus)) {
    return res.status(400).json({ error: `Field "status" must be one of: ${VALID_STATUSES.join(', ')}.` });
  }

  try {
    const stmt = db.prepare(
      'INSERT INTO tasks (project_id, title, description, status) VALUES (?, ?, ?, ?)'
    );
    const info = stmt.run(projectId, title.trim(), description ? String(description).trim() : '', taskStatus);
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

// PUT /api/tasks/:id
// Update a task's title/description/status (e.g. moving it to "done").
router.put('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const { title, description, status } = req.body || {};

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Task id must be an integer.' });
  }

  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: `Task ${id} not found.` });
  }
  if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
    return res.status(400).json({ error: 'Field "title" must be a non-empty string when provided.' });
  }
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Field "status" must be one of: ${VALID_STATUSES.join(', ')}.` });
  }

  try {
    db.prepare('UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?').run(
      title !== undefined ? title.trim() : existing.title,
      description !== undefined ? String(description).trim() : existing.description,
      status !== undefined ? status : existing.status,
      id
    );
    const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

// DELETE /api/tasks/:id
router.delete('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Task id must be an integer.' });
  }

  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: `Task ${id} not found.` });
  }

  try {
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

module.exports = router;
