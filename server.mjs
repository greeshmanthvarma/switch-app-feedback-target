import { createServer } from "node:http";
import { handle } from "./app.mjs";

const port = Number(process.env.PORT ?? "3000");
createServer(async (req, res) => {
  try {
    const response = handle(new Request(new URL(req.url ?? "/", "http://localhost"), { method: req.method }));
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Request failed" }));
  }
}).listen(port, "127.0.0.1", () => console.log(`Project workspace API: http://127.0.0.1:${port}`));
