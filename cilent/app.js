// app.js
// Minimal vanilla-JS client. Talks to the TaskFlow API using fetch().
// No build step or framework is required - this is intentionally a
// "simple client interface" per the assignment scope.

const API_BASE = '/api';

let selectedProjectId = null;

const projectListEl = document.getElementById('project-list');
const taskListEl = document.getElementById('task-list');
const tasksTitleEl = document.getElementById('tasks-title');
const newTaskForm = document.getElementById('new-task-form');
const statusLine = document.getElementById('status-line');

// ---------- helpers ----------

async function api(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  let body = null;
  if (res.status !== 204) {
    body = await res.json().catch(() => null);
  }

  if (!res.ok) {
    const message = (body && body.error) || `Request failed (HTTP ${res.status})`;
    throw new Error(message);
  }
  return body;
}

function showError(el, message) {
  el.textContent = message;
  el.hidden = false;
  setTimeout(() => { el.hidden = true; }, 4000);
}

// ---------- projects ----------

async function loadProjects() {
  try {
    const projects = await api('/projects');
    renderProjects(projects);
    statusLine.textContent = `Connected — ${projects.length} project(s) loaded.`;
  } catch (err) {
    statusLine.textContent = `Could not reach API: ${err.message}`;
  }
}

function renderProjects(projects) {
  projectListEl.innerHTML = '';

  if (projects.length === 0) {
    projectListEl.innerHTML = '<li class="empty-hint">No projects yet. Add one above.</li>';
    return;
  }

  projects.forEach((project) => {
    const li = document.createElement('li');
    li.className = 'project-item' + (project.id === selectedProjectId ? ' selected' : '');
    li.innerHTML = `
      <div>
        <div>${escapeHtml(project.name)}</div>
        <div class="meta">${project.task_count} task(s)</div>
      </div>
      <button class="icon-btn" data-action="delete-project" data-id="${project.id}" title="Delete project">✕</button>
    `;
    li.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="delete-project"]')) return;
      selectProject(project.id, project.name);
    });
    li.querySelector('[data-action="delete-project"]').addEventListener('click', async () => {
      if (!confirm(`Delete project "${project.name}" and all its tasks?`)) return;
      try {
        await api(`/projects/${project.id}`, { method: 'DELETE' });
        if (selectedProjectId === project.id) {
          selectedProjectId = null;
          tasksTitleEl.textContent = 'Select a project';
          newTaskForm.hidden = true;
          taskListEl.innerHTML = '';
        }
        loadProjects();
      } catch (err) {
        alert(`Could not delete project: ${err.message}`);
      }
    });
    projectListEl.appendChild(li);
  });
}

function selectProject(id, name) {
  selectedProjectId = id;
  tasksTitleEl.textContent = `Tasks — ${name}`;
  newTaskForm.hidden = false;
  loadProjects();
  loadTasks(id);
}

// ---------- tasks ----------

async function loadTasks(projectId) {
  try {
    const tasks = await api(`/projects/${projectId}/tasks`);
    renderTasks(tasks);
  } catch (err) {
    statusLine.textContent = `Could not load tasks: ${err.message}`;
  }
}

function renderTasks(tasks) {
  taskListEl.innerHTML = '';

  if (tasks.length === 0) {
    taskListEl.innerHTML = '<li class="empty-hint">No tasks yet for this project.</li>';
    return;
  }

  tasks.forEach((task) => {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.innerHTML = `
      <div class="task-main">
        <span class="task-title">${escapeHtml(task.title)}</span>
        ${task.description ? `<span class="task-desc">${escapeHtml(task.description)}</span>` : ''}
      </div>
      <div class="task-actions">
        <select class="status-select" data-id="${task.id}">
          <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>To do</option>
          <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>In progress</option>
          <option value="done" ${task.status === 'done' ? 'selected' : ''}>Done</option>
        </select>
        <button class="icon-btn" data-action="delete-task" data-id="${task.id}" title="Delete task">✕</button>
      </div>
    `;
    li.querySelector('.status-select').addEventListener('change', async (e) => {
      try {
        await api(`/tasks/${task.id}`, {
          method: 'PUT',
          body: JSON.stringify({ status: e.target.value }),
        });
      } catch (err) {
        alert(`Could not update task: ${err.message}`);
        loadTasks(selectedProjectId);
      }
    });
    li.querySelector('[data-action="delete-task"]').addEventListener('click', async () => {
      try {
        await api(`/tasks/${task.id}`, { method: 'DELETE' });
        loadTasks(selectedProjectId);
        loadProjects();
      } catch (err) {
        alert(`Could not delete task: ${err.message}`);
      }
    });
    taskListEl.appendChild(li);
  });
}

// ---------- forms ----------

document.getElementById('new-project-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nameInput = document.getElementById('project-name');
  const descInput = document.getElementById('project-description');
  const errorEl = document.getElementById('project-form-error');

  try {
    await api('/projects', {
      method: 'POST',
      body: JSON.stringify({ name: nameInput.value, description: descInput.value }),
    });
    nameInput.value = '';
    descInput.value = '';
    loadProjects();
  } catch (err) {
    showError(errorEl, err.message);
  }
});

newTaskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!selectedProjectId) return;

  const titleInput = document.getElementById('task-title');
  const descInput = document.getElementById('task-description');
  const errorEl = document.getElementById('task-form-error');

  try {
    await api(`/projects/${selectedProjectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify({ title: titleInput.value, description: descInput.value }),
    });
    titleInput.value = '';
    descInput.value = '';
    loadTasks(selectedProjectId);
    loadProjects();
  } catch (err) {
    showError(errorEl, err.message);
  }
});

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------- init ----------

loadProjects();
