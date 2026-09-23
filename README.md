TaskFlow — Project & Task Manager

COMP713 Individual Project — Option A: Distributed Web/API Application
TaskFlow is a small distributed web application: a browser-based client
communicates over HTTP/JSON with a server-side REST API, which persists
data to a SQLite database. A project can contain many tasks
(project → task, one-to-many).

1. Software and tools required
Node.js v18 or later (tested on v22)
npm (installed with Node.js)
A modern web browser (Chrome, Firefox, Edge)
No external database server is required — SQLite is a local file
created automatically on first run.

2. Project structure
```
taskflow/
├── server/            Express API + SQLite persistence
│   ├── server.js       entry point
│   ├── db.js            database connection/setup
│   ├── schema.sql       table definitions
│   └── routes/
│       ├── projects.js  /api/projects endpoints
│       └── tasks.js     /api/.../tasks and /api/tasks endpoints
└── client/            Static browser client (served by the API)
    ├── index.html
    ├── style.css
    └── app.js
```
3. Installation / setup instructions
```bash
cd server
npm install
```
This installs `express`, `better-sqlite3`, and `cors`. No `.env` file,
database server, or extra configuration is needed — the SQLite database
file (`server/taskflow.db`) is created automatically the first time the
server starts.

4. Starting the system
```bash
cd server
npm start
```
You should see:
```
TaskFlow server running at http://localhost:3000
```
Open http://localhost:3000 in a browser. The server serves both the
static client and the JSON API from the same origin, so there is nothing
else to start separately.
To use a different port: `PORT=4000 npm start`.

5. Testing the main functions
Through the browser client
Open http://localhost:3000
Add a project using the "New project name" field on the left.
Click a project to select it — its tasks load on the right.
Add a task using the "New task title" field.
Change a task's status using the dropdown (todo / in-progress / done).
Delete a task or project with the ✕ button (deleting a project also
deletes its tasks).
Try submitting an empty project or task name — the form shows a
validation error and no request that would fail server-side is sent.
Directly against the API (e.g. with curl or Postman)
```bash
# Create a project
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"Website Redesign","description":"Redesign the marketing site"}'

# List projects
curl http://localhost:3000/api/projects

# Create a task under project 1
curl -X POST http://localhost:3000/api/projects/1/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Design homepage mockup"}'

# Trigger a validation error (missing required field)
curl -i -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" -d '{}'

# Trigger a not-found error
curl -i http://localhost:3000/api/projects/9999
```
API reference
Method	Path	Description
GET	/api/health	Health check
GET	/api/projects	List all projects (with task counts)
POST	/api/projects	Create a project
GET	/api/projects/:id	Get one project with its tasks
PUT	/api/projects/:id	Update a project
DELETE	/api/projects/:id	Delete a project (cascades tasks)
GET	/api/projects/:id/tasks	List tasks for a project
POST	/api/projects/:id/tasks	Create a task under a project
PUT	/api/tasks/:id	Update a task (title/description/status)
DELETE	/api/tasks/:id	Delete a task

6. Database setup, configuration values, ports, environment variables
Database: SQLite, file-based, no server process. Schema is defined
in `server/schema.sql` and applied automatically on startup
(`CREATE TABLE IF NOT EXISTS`, so it is safe to restart repeatedly).
Port: defaults to `3000`; override with the `PORT` environment
variable.

No API keys or secrets are required for this project.

7. Known limitations / unresolved problems
No authentication/authorization — anyone with network access to the
server can read and modify all projects and tasks. Acceptable for the
scope of this assignment, but would need addressing for real use.
No pagination — `GET /api/projects` returns all projects at once,
which would not scale to a very large number of projects.
Task reassignment between projects is not supported (a task cannot be
moved to a different project once created).
Concurrent edits from multiple browser tabs are not merged — the last
write wins, and other open tabs must be refreshed to see the change.
