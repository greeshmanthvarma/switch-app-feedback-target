import { readFileSync } from "node:fs";

const tasks = JSON.parse(readFileSync(new URL("./fixtures/tasks.json", import.meta.url), "utf8"));
const statuses = new Set(["todo", "in_progress", "done"]);

function selectTasks(projectId, status) {
  return tasks.filter((task) => task.projectId === projectId && (!status || task.status === status));
}

function csvCell(value) {
  const safe = /^[\t\r\n ]*[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function handle(request) {
  const { pathname, searchParams } = new URL(request.url);
  if (!['/api/tasks', '/api/export', '/api/health'].includes(pathname)) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (request.method !== "GET") {
    return Response.json({ error: "Only GET is supported" }, { status: 405, headers: { Allow: "GET" } });
  }
  if (pathname === "/api/health") return Response.json({ ok: true });

  const projectId = searchParams.get("projectId");
  const status = searchParams.get("status");
  if (!projectId || (status !== null && !statuses.has(status))) {
    return Response.json({ error: "A projectId and valid optional status are required" }, { status: 400 });
  }
  if (!tasks.some((task) => task.projectId === projectId)) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }
  if (pathname === "/api/tasks") return Response.json({ tasks: selectTasks(projectId, status) });

  const columns = ["id", "title", "status", "projectId"];
  const rows = selectTasks(projectId).map((task) => columns.map((key) => csvCell(task[key])).join(","));
  return new Response([columns.join(","), ...rows, ""].join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="tasks.csv"',
    },
  });
}
