export interface FieldResolvers {
  id: string[] | ((t: any) => string);
  name: string[] | ((t: any) => string);
  wbsId: string[] | ((t: any) => string);
  start: string[] | ((t: any) => string | number | Date);
  finish: string[] | ((t: any) => string | number | Date);
  durationDays?: string[] | ((t: any) => number);
  durationHours?: string[] | ((t: any) => number);
  percentComplete?: string[] | ((t: any) => number);
  critical?: string[] | ((t: any) => boolean);
  predecessors?: string[] | ((t: any) => string[]);
  activityId?: string[] | ((t: any) => string);
}

export interface RelationshipResolvers {
  source: string[] | ((r: any) => string);
  target: string[] | ((r: any) => string);
  type: string[] | ((r: any) => string);
  lagHours?: string[] | ((r: any) => number);
}

export interface WbsResolvers {
  id: string[] | ((w: any) => string);
  parentId?: string[] | ((w: any) => string | null);
  name: string[] | ((w: any) => string);
}

export interface FieldMap {
  task: FieldResolvers;
  rel: RelationshipResolvers;
  wbs: WbsResolvers;
}

export const defaultFieldMap: FieldMap = {
  task: {
    id: ['task_id'],
    name: ['task_name'],
    wbsId: ['wbs_id'],
    start: ['act_start_date', 'early_start_date', 'target_start_date'],
    finish: ['act_end_date', 'early_end_date', 'target_end_date'],
    durationDays: ['task_drtn_days'],
    durationHours: ['target_drtn_hr_cnt', 'orig_duration_hr_cnt'],
    percentComplete: ['phys_complete_pct'],
    critical: ['critical_path'],
    predecessors: ['predecessors'],
    activityId: ['activity_id']
  },
  rel: {
    source: ['pred_task_id'],
    target: ['task_id'],
    type: ['pred_type'],
    lagHours: ['lag_hr_cnt']
  },
  wbs: {
    id: ['wbs_id'],
    parentId: ['parent_wbs_id'],
    name: ['wbs_name']
  }
};

export type NormalizedTask = {
  id: string;
  name: string;
  wbsId: string;
  start: number;
  finish: number;
  duration: number; // in days
  percentComplete?: number;
  critical?: boolean;
  predecessors: string[];
  activityId?: string;
};

export type NormalizedRelationship = {
  source: string;
  target: string;
  type: string; // FS, SS, FF, SF
  lag: number; // in hours
};

export type NormalizedWbs = {
  id: string;
  parentId: string | null;
  name: string;
};

function resolve<T>(obj: any, r: string[] | ((o: any) => T) | undefined): T | undefined {
  if (!r) return undefined as any;
  if (Array.isArray(r)) {
    for (const key of r) {
      const v = obj[key];
      if (v !== undefined && v !== null && v !== '') return v as T;
    }
    return undefined as any;
  }
  return (r as any)(obj);
}

function parseDate(v: any): number | undefined {
  if (!v) return undefined;
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const iso = v.includes('T') ? v : v.replace(' ', 'T');
    const d = Date.parse(iso);
    if (isNaN(d)) return undefined;
    return d;
  }
  return undefined;
}

function toNumber(v: any): number | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  const n = typeof v === 'number' ? v : parseFloat(v);
  return isNaN(n) ? undefined : n;
}

function normalizeRelType(t: string): string {
  if (!t) return t;
  const idx = t.lastIndexOf('_');
  return idx === -1 ? t : t.slice(idx + 1);
}

export function mergeFieldMap(partial?: Partial<FieldMap>): FieldMap {
  if (!partial) return JSON.parse(JSON.stringify(defaultFieldMap));
  const res: FieldMap = {
    task: { ...defaultFieldMap.task, ...(partial.task || {}) },
    rel: { ...defaultFieldMap.rel, ...(partial.rel || {}) },
    wbs: { ...defaultFieldMap.wbs, ...(partial.wbs || {}) }
  };
  return res;
}

export interface NormalizeOptions {
  hoursPerDay?: number;
}

export function normalizeTasks(raw: any[], map: FieldResolvers, opts: NormalizeOptions = {}): NormalizedTask[] {
  const hoursPerDay = opts.hoursPerDay ?? 8;
  return raw.map((t) => {
    const id = resolve<string>(t, map.id)!;
    const name = resolve<string>(t, map.name)!;
    const wbsId = resolve<string>(t, map.wbsId)!;
    const startVal = resolve<any>(t, map.start);
    const finishVal = resolve<any>(t, map.finish);
    const start = parseDate(startVal) ?? 0;
    const finish = parseDate(finishVal) ?? start;
    const dDays = toNumber(resolve<any>(t, map.durationDays));
    const dHours = toNumber(resolve<any>(t, map.durationHours));
    const duration = dDays !== undefined ? dDays : (dHours !== undefined ? dHours / hoursPerDay : 0);
    const pc = toNumber(resolve<any>(t, map.percentComplete));
    const critVal = resolve<any>(t, map.critical);
    const critical = critVal === undefined ? undefined : Boolean(critVal);
    const preds = resolve<string[]>(t, map.predecessors) ?? [];
    const activityId = resolve<string>(t, map.activityId);
    return {
      id,
      name,
      wbsId,
      start,
      finish,
      duration,
      percentComplete: pc,
      critical,
      predecessors: preds,
      activityId
    };
  });
}

export function normalizeRelationships(raw: any[], map: RelationshipResolvers): NormalizedRelationship[] {
  return raw.map((r) => {
    const source = resolve<string>(r, map.source)!;
    const target = resolve<string>(r, map.target)!;
    const typeRaw = resolve<string>(r, map.type)!;
    const type = normalizeRelType(typeRaw);
    const lag = toNumber(resolve<any>(r, map.lagHours)) ?? 0;
    return { source, target, type, lag };
  });
}

export function normalizeWbs(raw: any[], map: WbsResolvers): NormalizedWbs[] {
  return raw.map((w) => {
    const id = resolve<string>(w, map.id)!;
    const parentId = resolve<string | null>(w, map.parentId) ?? null;
    const name = resolve<string>(w, map.name)!;
    return { id, parentId, name };
  });
}

export interface NormalizedSnapshot {
  tasks: NormalizedTask[];
  wbs: NormalizedWbs[];
  relationships: NormalizedRelationship[];
  metadata?: any;
}

export function normalizeSnapshot(snapshot: any, map: FieldMap, opts: NormalizeOptions = {}): NormalizedSnapshot {
  const tasks = normalizeTasks(snapshot.tasks || [], map.task, opts);
  const wbs = normalizeWbs(snapshot.wbs || [], map.wbs);
  const relationships = normalizeRelationships(snapshot.relationships || [], map.rel);
  return { tasks, wbs, relationships, metadata: snapshot.metadata };
}

export type ValidationIssue = {
  level: 'error' | 'warn';
  message: string;
};

export interface ValidationReport {
  valid: boolean;
  issues: ValidationIssue[];
}

export function validateSnapshot(snapshot: any, map: FieldMap): ValidationReport {
  const issues: ValidationIssue[] = [];
  const tasks = snapshot.tasks || [];
  for (const t of tasks) {
    const id = resolve<string>(t, map.task.id);
    if (!id) issues.push({ level: 'error', message: 'Task missing id' });
    const name = resolve<string>(t, map.task.name);
    if (!name) issues.push({ level: 'warn', message: `Task ${id ?? '?'} missing name` });
  }
  const rels = snapshot.relationships || [];
  for (const r of rels) {
    const src = resolve<string>(r, map.rel.source);
    const tgt = resolve<string>(r, map.rel.target);
    if (!src || !tgt) {
      issues.push({ level: 'warn', message: 'Relationship missing endpoints' });
    }
  }
  return { valid: !issues.some(i => i.level === 'error'), issues };
}
