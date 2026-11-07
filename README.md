# Project workspace target

A small, dependency-free Node.js 22 target for the Switch App Feedback demo. It has two fictional projects, a task-list API, and a downloadable CSV export. It is separate from the feedback automation repository and contains no credentials or real user data.

Run `npm start`, then compare:

```bash
curl 'http://127.0.0.1:3000/api/tasks?projectId=atlas&status=done'
curl 'http://127.0.0.1:3000/api/export?projectId=atlas&status=done'
```

The baseline intentionally contains the reported defect: the list shows three completed tasks, while the CSV contains all ten tasks in Atlas. The fix branch adds a regression test and restores the export filter. This is a backend-only demo; API responses and tests provide verification evidence.
