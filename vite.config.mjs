import { fileURLToPath } from "node:url";
import tailwind from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { handle } from "./app.mjs";

async function taskApi(request, response, next) {
  if (!request.url?.startsWith("/api/")) return next();

  try {
    const result = handle(new Request(new URL(request.url, "http://localhost"), {
      method: request.method,
    }));
    response.writeHead(result.status, Object.fromEntries(result.headers));
    response.end(Buffer.from(await result.arrayBuffer()));
  } catch (error) {
    next(error);
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwind(),
    {
      name: "taskroom-api",
      configureServer(server) {
        server.middlewares.use(taskApi);
      },
      configurePreviewServer(server) {
        server.middlewares.use(taskApi);
      },
    },
  ],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
