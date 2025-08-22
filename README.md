# Ganttron

Ganttron is a TypeScript library for rendering view only Gantt charts for Metron
schedule snapshots.  The goal of the project is to provide a fast and accessible
Gantt viewer that consumes the server generated JSON directly.  The initial
implementation included here focuses on the **Field Map Adapter** used to keep
the library schema‑evolution safe.

## Field Map Adapter

Metron snapshot JSON may evolve over time.  Ganttron exposes a configurable
`FieldMap` that describes how to read important fields from tasks, WBS nodes and
relationships.  Each field can provide a list of aliases or a resolver function.
When new field names are introduced callers can pass a partial map with the new
aliases without upgrading the library.

```ts
import { mergeFieldMap, normalizeSnapshot } from 'ganttron';

const snapshot = fetch('/snapshot.json');
const map = mergeFieldMap({
  task: { id: ['task_id', 'id'], name: ['task_name', 'name'] }
});
const norm = normalizeSnapshot(snapshot, map);
```

The default map supports today’s Metron field names and the adapter resolves the
first non‑empty alias in each list.

## Creating a Ganttron instance

```ts
import { createGanttron } from 'ganttron';

const gt = createGanttron({
  container: document.getElementById('gantt')!,
  mode: 'view',
  data: snapshotJson
});
```

The current build contains stub implementations for the rendering layer but
establishes the public API and data normalisation logic described in the design
specification.
