export type GanttronMode = 'view' | 'compare';

export interface MetronSnapshot {
  [key: string]: any;
}

export interface CompareInput {
  baseline: MetronSnapshot;
  update: MetronSnapshot;
}

export interface GanttronOptions {
  container: HTMLElement;
  mode: GanttronMode;
  data: MetronSnapshot | CompareInput;
  fieldMap?: Partial<FieldMap>;
  hoursPerDay?: number;
  baselineMatch?: 'task_id' | 'activity_id' | 'name_wbs';
  initialZoom?: 'day' | 'week' | 'month' | 'quarter';
  leftPaneWidth?: number;
  rowHeight?: number;
  showLinks?: boolean;
  showBaseline?: boolean;
  theme?: Partial<Record<string, string>>;
  locale?: string;
  dateFormat?: Intl.DateTimeFormatOptions;
  nonWorking?: { weekdays?: number[]; dates?: string[] };
  onTaskHover?: (taskId: string) => void;
  onRowFocus?: (taskId: string) => void;
  onError?: (e: Error) => void;
}

export interface GanttronInstance {
  destroy(): void;
  setZoom(z: 'day' | 'week' | 'month' | 'quarter'): void;
  resizeLeftPane(px: number): void;
  setShowLinks(show: boolean): void;
  setShowBaseline(show: boolean): void;
  scrollToTask(taskId: string): void;
  updateData(data: MetronSnapshot | CompareInput): void;
  updateFieldMap(map: Partial<FieldMap>): void;
  highlightCritical(on: boolean): void;
  filter(predicate: (t: any) => boolean): void;
  clearFilter(): void;
  expandAll(): void;
  collapseAll(): void;
  toPNG(): Promise<Blob>;
  toSVG(): string;
  fit(target: 'tasks' | 'range' | 'all'): void;
}

import {
  FieldMap,
  mergeFieldMap,
  normalizeSnapshot,
  NormalizedSnapshot,
  validateSnapshot,
} from './adapters/field-map.js';

class Ganttron implements GanttronInstance {
  private options: GanttronOptions;
  private fieldMap: FieldMap;
  private data: NormalizedSnapshot | { baseline: NormalizedSnapshot; update: NormalizedSnapshot };

  constructor(opts: GanttronOptions) {
    this.options = opts;
    this.fieldMap = mergeFieldMap(opts.fieldMap);
    this.data = this.normalizeInput(opts.data);
    const report = validateSnapshot('baseline' in this.data ? this.data.update : this.data, this.fieldMap);
    if (!report.valid && this.options.onError) {
      this.options.onError(new Error('Snapshot validation failed'));
    }
    // Rendering is out of scope for this stub implementation.
  }

  private normalizeInput(data: MetronSnapshot | CompareInput) {
    if (this.options.mode === 'compare') {
      const cmp = data as CompareInput;
      return {
        baseline: normalizeSnapshot(cmp.baseline, this.fieldMap, { hoursPerDay: this.options.hoursPerDay }),
        update: normalizeSnapshot(cmp.update, this.fieldMap, { hoursPerDay: this.options.hoursPerDay }),
      };
    }
    return normalizeSnapshot(data as MetronSnapshot, this.fieldMap, { hoursPerDay: this.options.hoursPerDay });
  }

  destroy(): void {}
  setZoom(): void {}
  resizeLeftPane(): void {}
  setShowLinks(): void {}
  setShowBaseline(): void {}
  scrollToTask(): void {}
  updateData(data: MetronSnapshot | CompareInput): void {
    this.data = this.normalizeInput(data);
  }
  updateFieldMap(map: Partial<FieldMap>): void {
    this.fieldMap = mergeFieldMap(map);
    this.data = this.normalizeInput(this.options.data);
  }
  highlightCritical(): void {}
  filter(): void {}
  clearFilter(): void {}
  expandAll(): void {}
  collapseAll(): void {}
  async toPNG(): Promise<Blob> {
    throw new Error('toPNG not implemented in stub');
  }
  toSVG(): string {
    return '<svg></svg>';
  }
  fit(): void {}
}

export function createGanttron(opts: GanttronOptions): GanttronInstance {
  return new Ganttron(opts);
}

export {
  FieldMap,
  mergeFieldMap,
  normalizeSnapshot,
  validateSnapshot,
} from './adapters/field-map.js';
