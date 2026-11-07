import assert from "node:assert/strict";
import test from "node:test";
import { handle } from "../app.mjs";

const request = (path) => handle(new Request(`http://workspace.test${path}`));

test("completed-task export includes exactly the three matching Atlas tasks", async () => {
  const query = "?projectId=atlas&status=done";
  const expected = ["AT-103", "AT-107", "AT-109"];
  const listed = await request(`/api/tasks${query}`).json();
  assert.deepEqual(listed.tasks.map(({ id }) => id), expected);

  const response = request(`/api/export${query}`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /^text\/csv/);
  const rows = (await response.text()).trimEnd().split("\r\n");
  assert.equal(rows.shift(), "id,title,status,projectId");
  assert.deepEqual(rows.map((row) => row.match(/^"([^"]+)"/)?.[1]), expected);
  assert.equal(rows[1], '"AT-107","Review labels, titles and IDs","done","atlas"');
  assert.equal(rows[2], '"AT-109","Verify ""Completed"" status","done","atlas"');
});
