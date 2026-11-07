import assert from "node:assert/strict";
import test from "node:test";
import { handle } from "./app.mjs";

for (const projectId of ["atlas", "orbit"]) {
  for (const status of ["done", "todo", "in_progress", null]) {
    test(`${projectId} CSV matches the task list for ${status ?? "all statuses"}`, async () => {
      const query = new URLSearchParams({ projectId });
      if (status) query.set("status", status);
      const list = handle(new Request(`http://localhost/api/tasks?${query}`));
      const { tasks } = await list.json();
      const response = handle(new Request(`http://localhost/api/export?${query}`));
      assert.equal(response.status, 200);
      assert.match(response.headers.get("Content-Type"), /^text\/csv/);
      const [header, ...rows] = (await response.text()).trimEnd().split("\r\n");
      assert.equal(header, "id,title,status,projectId");
      assert.deepEqual(rows.map((row) => row.split(",")[0]), tasks.map((task) => `"${task.id}"`));
      for (const row of rows) {
        assert.ok(row.endsWith(`,"${projectId}"`));
        if (status) assert.ok(row.endsWith(`,"${status}","${projectId}"`));
      }
      if (projectId === "atlas" && status === "done") assert.equal(rows.length, 3);
    });
  }
}
