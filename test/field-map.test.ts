import { describe, it, expect } from 'vitest';
import { mergeFieldMap, normalizeSnapshot } from '../src/adapters/field-map.js';

const sample = {
  metadata: { schedule_id: 3, data_date: '2021-11-08' },
  tasks: [
    {
      task_id: '1',
      task_name: 'Task A',
      wbs_id: 'w1',
      act_start_date: '2023-08-02 08:00',
      act_end_date: '2023-08-03 17:00',
      task_drtn_days: 1,
      phys_complete_pct: '50',
      critical_path: true,
      predecessors: ['0']
    }
  ],
  wbs: [
    { wbs_id: 'w1', wbs_name: 'Root', parent_wbs_id: null }
  ],
  relationships: [
    { pred_task_id: '0', task_id: '1', pred_type: 'PR_FS', lag_hr_cnt: 0 }
  ]
};

describe('field map normalization', () => {
  it('normalizes snapshot with default map', () => {
    const map = mergeFieldMap();
    const normalized = normalizeSnapshot(sample, map);
    expect(normalized.tasks).toHaveLength(1);
    const t = normalized.tasks[0];
    expect(t.id).toBe('1');
    expect(t.name).toBe('Task A');
    expect(t.duration).toBe(1);
    expect(t.critical).toBe(true);
    expect(t.predecessors).toEqual(['0']);
    expect(t.start).toBeTypeOf('number');
    expect(normalized.relationships[0].type).toBe('FS');
  });

  it('supports custom field aliases and resolver functions', () => {
    const snapshot = {
      tasks: [
        { id: 't', name: 'Custom', wbs: 'w', start: '2023-01-01 00:00', end: '2023-01-02 00:00', hours: 8 }
      ],
      wbs: [],
      relationships: []
    };
    const map = mergeFieldMap({
      task: {
        id: ['id'],
        name: ['name'],
        wbsId: ['wbs'],
        start: ['start'],
        finish: ['end'],
        durationHours: ['hours']
      }
    });
    const normalized = normalizeSnapshot(snapshot, map);
    expect(normalized.tasks[0].duration).toBe(1);
  });
});
