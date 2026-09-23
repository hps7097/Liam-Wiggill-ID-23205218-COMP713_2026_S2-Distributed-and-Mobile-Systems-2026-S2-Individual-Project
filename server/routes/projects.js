// routes/projects.js
// API operations for the "projects" resource.

const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/projects
// List every project, with a count of its tasks.
router.get('/', (req, res) => {
  try {
    const projects = db.prepare(`
      SELECT p.*,
             (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) AS task_count
      FROM projects p
      ORDER BY p.created_at DESC
    `).all();
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch projects.' });
  }
});

// GET /api/projects/:id
// Get one project together with its tasks.
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Project id must be an integer.' });
  }

  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    if (!project) {
      return res.status(404).json({ error: `Project ${id} not found.` });
    }
    const tasks = db.prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at').all(id);
    res.json({ ...project, tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch project.' });
  }
});

// POST /api/projects
// Create a new project. Body: { name, description }
router.post('/', (req, res) => {
  const { name, description } = req.body || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Field "name" is required and must be a non-empty string.' });
  }

  try {
    const stmt = db.prepare('INSERT INTO projects (name, description) VALUES (?, ?)');
    const info = stmt.run(name.trim(), description ? String(description).trim() : '');
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create project.' });
  }
});

// PUT /api/projects/:id
// Update an existing project's name/description.
router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const { name, description } = req.body || {};

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Project id must be an integer.' });
  }
  if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
    return res.status(400).json({ error: 'Field "name" must be a non-empty string when provided.' });
  }

  try {
    const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: `Project ${id} not found.` });
    }

    db.prepare('UPDATE projects SET name = ?, description = ? WHERE id = ?').run(
      name !== undefined ? name.trim() : existing.name,
      description !== undefined ? String(description).trim() : existing.description,
      id
    );

    const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update project.' });
  }
});

// DELETE /api/projects/:id
// Delete a project and (via ON DELETE CASCADE) its tasks.
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Project id must be an integer.' });
  }

  try {
    const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: `Project ${id} not found.` });
    }
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete project.' });
  }
});

module.exports = router;
