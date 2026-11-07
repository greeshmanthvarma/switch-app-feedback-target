import { useEffect, useRef, useState } from "react";
import { ArrowDownToLine, ArrowUpRight, Circle, CircleCheck, CircleDot, FileSpreadsheet, Layers3, ListChecks, X } from "lucide-react";
import { parse } from "papaparse";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const projects = {
  atlas: { name: "Atlas", description: "Import and export improvements" },
  orbit: { name: "Orbit", description: "Project planning and release notes" },
} as const;

const statuses = {
  todo: { label: "To do", icon: Circle },
  in_progress: { label: "In progress", icon: CircleDot },
  done: { label: "Completed", icon: CircleCheck },
} as const;

type Project = keyof typeof projects;
type Status = keyof typeof statuses;
type Filter = "" | Status;
type Task = { id: string; title: string; status: Status; projectId: Project };
type Load<T> = { state: "loading" } | { state: "error" } | { state: "ready"; value: T };

async function fetchData(path: string, signal: AbortSignal) {
  const response = await fetch(path, { signal });
  if (!response.ok) throw new Error("Request failed");
  return response;
}

function TaskStatus({ status }: { status: Status }) {
  const { label, icon: Icon } = statuses[status];
  return (
    <Badge variant={status === "done" ? "default" : "outline"} className="gap-1.5 rounded-md px-2 py-1 font-medium">
      <Icon aria-hidden="true" />
      {label}
    </Badge>
  );
}

function TaskTable({ tasks, label }: { tasks: Task[]; label: string }) {
  if (!tasks.length) {
    return <p className="p-6 text-sm text-muted-foreground">No tasks match this filter.</p>;
  }

  return (
    <Table aria-label={label}>
      <TableHeader className="bg-neutral-50">
        <TableRow>
          <TableHead className="pl-5">Task ID</TableHead>
          <TableHead>Title</TableHead>
          <TableHead className="pr-5">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task.id}>
            <TableCell className="py-4 pl-5 font-mono text-xs text-muted-foreground">{task.id}</TableCell>
            <TableCell className="min-w-44 whitespace-normal font-medium">{task.title}</TableCell>
            <TableCell className="pr-5"><TaskStatus status={task.status} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ProjectTasks({ project }: { project: Project }) {
  const [status, setStatus] = useState<Filter>("");
  const [tasks, setTasks] = useState<Load<Task[]>>({ state: "loading" });
  const [preview, setPreview] = useState<Load<Task[]> | null>(null);
  const [refresh, setRefresh] = useState(0);
  const request = useRef<AbortController | null>(null);
  const previewButton = useRef<HTMLButtonElement>(null);
  const query = new URLSearchParams({ projectId: project });
  if (status) query.set("status", status);
  const taskUrl = "/api/tasks?" + query;
  const exportUrl = "/api/export?" + query;
  const filterLabel = status ? statuses[status].label : "All statuses";

  useEffect(() => {
    const controller = new AbortController();
    fetchData(taskUrl, controller.signal)
      .then((response) => response.json())
      .then(({ tasks }: { tasks: Task[] }) => setTasks({ state: "ready", value: tasks }))
      .catch(() => {
        if (!controller.signal.aborted) setTasks({ state: "error" });
      });
    return () => controller.abort();
  }, [taskUrl, refresh]);

  useEffect(() => () => request.current?.abort(), []);

  async function previewExport() {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setPreview({ state: "loading" });
    try {
      const response = await fetchData(exportUrl, controller.signal);
      const csv = parse<Task>(await response.text(), { header: true, skipEmptyLines: true });
      if (csv.errors.length) throw new Error("Invalid CSV");
      if (!controller.signal.aborted) setPreview({ state: "ready", value: csv.data });
    } catch {
      if (!controller.signal.aborted) setPreview({ state: "error" });
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-[.16em] text-muted-foreground uppercase">
            <span className="size-1.5 rounded-full bg-neutral-800" /> Project workspace
          </p>
          <h1 className="text-5xl leading-none font-semibold tracking-[-.065em] sm:text-6xl">{projects[project].name} tasks</h1>
          <p className="mt-4 text-base text-muted-foreground">{projects[project].description}</p>
        </div>
        <div className="flex gap-2">
          <Button ref={previewButton} variant="outline" onClick={previewExport}>
            <FileSpreadsheet aria-hidden="true" /> Preview CSV
          </Button>
          <Button asChild>
            <a href={exportUrl} download><ArrowDownToLine aria-hidden="true" /> Download CSV</a>
          </Button>
        </div>
      </div>

      <div className="mt-10 grid items-start gap-5 lg:grid-cols-2">
        <Card className="gap-0 overflow-hidden rounded-2xl py-0 shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold"><ListChecks className="size-4" aria-hidden="true" /> Task list</h2>
              <p className="mt-1 text-sm text-muted-foreground" role="status">
                {tasks.state === "ready" ? `${tasks.value.length} tasks shown` : tasks.state === "loading" ? "Loading tasks…" : "Task list unavailable"}
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              Status
              <NativeSelect
                value={status}
                onChange={(event) => {
                  request.current?.abort();
                  setTasks({ state: "loading" });
                  setPreview(null);
                  setStatus(event.target.value as Filter);
                }}
              >
                <NativeSelectOption value="">All statuses</NativeSelectOption>
                <NativeSelectOption value="todo">To do</NativeSelectOption>
                <NativeSelectOption value="in_progress">In progress</NativeSelectOption>
                <NativeSelectOption value="done">Completed</NativeSelectOption>
              </NativeSelect>
            </label>
          </div>
          <div className="border-t">
            {tasks.state === "ready" && <TaskTable tasks={tasks.value} label="Filtered task list" />}
            {tasks.state === "loading" && <div className="min-h-28" />}
            {tasks.state === "error" && (
              <div className="p-5" role="alert">
                <p className="mb-3 text-sm">Couldn’t load project tasks.</p>
                <Button variant="outline" onClick={() => { setTasks({ state: "loading" }); setRefresh((value) => value + 1); }}>Retry</Button>
              </div>
            )}
          </div>
        </Card>

        <Card className="gap-0 overflow-hidden rounded-2xl py-0 shadow-none">
          <div className="flex items-center justify-between gap-3 px-5 py-5">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold"><FileSpreadsheet className="size-4" aria-hidden="true" /> CSV preview</h2>
              <p className="mt-1 text-sm text-muted-foreground" role="status">
                {preview?.state === "ready" ? `${preview.value.length} rows in the export` : preview?.state === "loading" ? "Loading export…" : "Inspect the file before downloading"}
              </p>
            </div>
            {preview && (
              <Button size="icon" variant="ghost" aria-label="Close CSV preview" onClick={() => {
                request.current?.abort();
                setPreview(null);
                previewButton.current?.focus();
              }}><X aria-hidden="true" /></Button>
            )}
          </div>
          <div className="border-t">
            {preview?.state === "ready" && (
              <>
                <p className="border-b px-5 py-3 text-xs text-muted-foreground">Requested filter <strong className="ml-1 font-semibold text-foreground">{filterLabel}</strong></p>
                <div className="max-h-[29rem] overflow-auto"><TaskTable tasks={preview.value} label="CSV export rows" /></div>
              </>
            )}
            {preview?.state === "error" && (
              <p className="p-5 text-sm" role="alert">Couldn’t load the CSV. Select Preview CSV to try again.</p>
            )}
            {(!preview || preview.state === "loading") && (
              <div className="flex min-h-52 flex-col items-center justify-center gap-3 bg-neutral-50 px-6 text-center">
                <div className="grid size-10 place-items-center rounded-lg border bg-white"><FileSpreadsheet className="size-4" aria-hidden="true" /></div>
                <p className="max-w-xs text-sm text-muted-foreground">
                  {preview ? "Fetching the CSV…" : "Select Preview CSV to see what the export contains for the current filter."}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}

export function App() {
  const [project, setProject] = useState<Project>("atlas");
  return (
    <>
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-10">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-neutral-900 text-white"><Layers3 className="size-4" aria-hidden="true" /></div>
            <div>
              <div className="text-[15px] leading-5 font-bold tracking-tight">Taskroom</div>
              <div className="text-xs text-muted-foreground">Project workspace</div>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            Project
            <NativeSelect value={project} onChange={(event) => setProject(event.target.value as Project)}>
              <NativeSelectOption value="atlas">Atlas</NativeSelectOption>
              <NativeSelectOption value="orbit">Orbit</NativeSelectOption>
            </NativeSelect>
          </label>
        </div>
      </header>
      <main className="mx-auto max-w-[1440px] px-5 pt-12 pb-16 sm:px-10 sm:pt-16">
        <ProjectTasks key={project} project={project} />
        <footer className="mt-8 flex items-center gap-2 border-t pt-4 text-xs text-muted-foreground">
          Taskroom demo workspace <ArrowUpRight className="size-3" aria-hidden="true" /> Sample project data
        </footer>
      </main>
    </>
  );
}
