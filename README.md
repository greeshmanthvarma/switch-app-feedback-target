# Taskroom

Taskroom is a small React workspace with two fictional projects, status filters,
and a CSV preview and download. It uses Vite, Tailwind CSS, and shadcn/ui. Both the
browser and the standalone Node server use the same task API.

## Run locally

Use Node.js 22.19 or later on the Node 22 release line.

```sh
npm ci
npm run dev
```

Open the local URL shown by Vite. Run `npm run build` to type-check and build the
client, then `npm run preview` to serve the built app with the same demo API.
`npm start` starts the standalone API on port 3000.

## Reproduce the export defect

1. Open Atlas and set **Status** to **Completed**. The list shows three tasks.
2. Select **Preview CSV**. The preview reads the actual CSV from the export API,
   which returns all ten Atlas tasks on this branch.
3. Select **Download CSV** to save that same export as a file.

The expected result is three rows, all completed. The sample data is fictional.
