import { SchedulerEvent, SchedulerResource } from '@mui/x-scheduler/models';

// Anchor the demos to a fixed date so they always look good
export const defaultVisibleDate = new Date('2025-07-14T00:00:00');

// =============================================================================
// EVENT CALENDAR – Personal work agenda (week view with recurring + all-day)
// =============================================================================

export const calendarResources: SchedulerResource[] = [
  { title: 'Work', id: 'work', eventColor: 'blue' },
  { title: 'Personal', id: 'personal', eventColor: 'orange' },
  { title: 'Fitness', id: 'fitness', eventColor: 'teal' },
];

export const calendarEvents: SchedulerEvent[] = [
  // ── Recurring events ───────────────────────────────────────
  {
    id: 'standup',
    title: 'Daily Standup',
    start: '2025-07-14T09:00:00',
    end: '2025-07-14T09:15:00',
    resource: 'work',
    rrule: { freq: 'WEEKLY', interval: 1, byDay: ['MO', 'TU', 'WE', 'TH', 'FR'] },
  },
  {
    id: 'team-sync',
    title: 'Team Sync',
    start: '2025-07-15T10:00:00',
    end: '2025-07-15T11:00:00',
    resource: 'work',
    rrule: { freq: 'WEEKLY', interval: 1, byDay: ['TU', 'TH'] },
  },
  {
    id: '1on1-manager',
    title: '1-on-1 with Sarah',
    start: '2025-07-16T14:00:00',
    end: '2025-07-16T14:45:00',
    resource: 'work',
    rrule: { freq: 'WEEKLY', interval: 2, byDay: ['WE'] },
  },
  {
    id: 'morning-run',
    title: 'Morning Run',
    start: '2025-07-14T06:30:00',
    end: '2025-07-14T07:15:00',
    resource: 'fitness',
    rrule: { freq: 'WEEKLY', interval: 1, byDay: ['MO', 'WE', 'FR'] },
  },
  {
    id: 'yoga',
    title: 'Yoga Class',
    start: '2025-07-15T18:00:00',
    end: '2025-07-15T19:00:00',
    resource: 'fitness',
    rrule: { freq: 'WEEKLY', interval: 1, byDay: ['TU', 'TH'] },
  },

  // ── All-day events ─────────────────────────────────────────
  {
    id: 'sprint-week',
    title: 'Sprint 14',
    start: '2025-07-14T00:00:00',
    end: '2025-07-25T00:00:00',
    allDay: true,
    resource: 'work',
    color: 'indigo',
  },
  {
    id: 'alice-birthday',
    title: "Alice's Birthday",
    start: '2025-07-17T00:00:00',
    end: '2025-07-17T01:00:00',
    allDay: true,
    resource: 'personal',
    readOnly: true,
    color: 'pink',
    rrule: { freq: 'YEARLY', interval: 1 },
  },

  // ── One-off events (Mon 14) ────────────────────────────────
  {
    id: 'sprint-planning',
    title: 'Sprint Planning',
    start: '2025-07-14T09:30:00',
    end: '2025-07-14T11:00:00',
    resource: 'work',
    color: 'purple',
  },
  {
    id: 'arch-review',
    title: 'Architecture Review',
    start: '2025-07-14T13:00:00',
    end: '2025-07-14T14:30:00',
    resource: 'work',
  },
  {
    id: 'dentist',
    title: 'Dentist Appointment',
    start: '2025-07-14T16:00:00',
    end: '2025-07-14T17:00:00',
    resource: 'personal',
  },

  // ── Tue 15 ─────────────────────────────────────────────────
  {
    id: 'user-research',
    title: 'User Research Session',
    start: '2025-07-15T11:00:00',
    end: '2025-07-15T12:30:00',
    resource: 'work',
    color: 'teal',
  },
  {
    id: 'api-design',
    title: 'API Design Workshop',
    start: '2025-07-15T14:00:00',
    end: '2025-07-15T16:00:00',
    resource: 'work',
  },

  // ── Wed 16 ─────────────────────────────────────────────────
  {
    id: 'design-review',
    title: 'Design Review',
    start: '2025-07-16T10:00:00',
    end: '2025-07-16T11:30:00',
    resource: 'work',
    color: 'purple',
  },
  {
    id: 'lunch-mentor',
    title: 'Lunch with Mentor',
    start: '2025-07-16T12:00:00',
    end: '2025-07-16T13:00:00',
    resource: 'personal',
  },
  {
    id: 'code-review',
    title: 'Code Review – Auth Module',
    start: '2025-07-16T15:00:00',
    end: '2025-07-16T16:30:00',
    resource: 'work',
  },

  // ── Thu 17 ─────────────────────────────────────────────────
  {
    id: 'client-demo',
    title: 'Client Demo',
    start: '2025-07-17T11:00:00',
    end: '2025-07-17T12:00:00',
    resource: 'work',
    color: 'green',
  },
  {
    id: 'perf-opt',
    title: 'Performance Optimization',
    start: '2025-07-17T13:00:00',
    end: '2025-07-17T15:30:00',
    resource: 'work',
  },
  {
    id: 'dinner-friends',
    title: 'Dinner with Friends',
    start: '2025-07-17T19:00:00',
    end: '2025-07-17T21:00:00',
    resource: 'personal',
  },

  // ── Fri 18 ─────────────────────────────────────────────────
  {
    id: 'retro',
    title: 'Sprint Retrospective',
    start: '2025-07-18T10:00:00',
    end: '2025-07-18T11:00:00',
    resource: 'work',
    color: 'green',
  },
  {
    id: 'knowledge-share',
    title: 'Knowledge Sharing',
    start: '2025-07-18T14:00:00',
    end: '2025-07-18T15:00:00',
    resource: 'work',
  },
];

// =============================================================================
// EVENT TIMELINE – Company product roadmap (multi-week spans across teams)
// =============================================================================

export const timelineResources: SchedulerResource[] = [
  { id: 'product', title: 'Product', eventColor: 'purple' },
  { id: 'design', title: 'Design', eventColor: 'pink' },
  { id: 'engineering', title: 'Engineering', eventColor: 'blue' },
  { id: 'qa', title: 'QA', eventColor: 'teal' },
  { id: 'marketing', title: 'Marketing', eventColor: 'orange' },
  { id: 'devops', title: 'DevOps', eventColor: 'green' },
];

export const timelineEvents: SchedulerEvent[] = [
  // ── Product ────────────────────────────────────────────────
  {
    id: 'p-1',
    title: 'Q3 Strategic Planning',
    start: '2025-07-01T00:00:00',
    end: '2025-07-11T00:00:00',
    resource: 'product',
    allDay: true,
  },
  {
    id: 'p-2',
    title: 'Analytics Dashboard PRD',
    start: '2025-07-14T00:00:00',
    end: '2025-07-31T00:00:00',
    resource: 'product',
    allDay: true,
  },
  {
    id: 'p-3',
    title: 'Mobile App Specification',
    start: '2025-08-01T00:00:00',
    end: '2025-08-22T00:00:00',
    resource: 'product',
    allDay: true,
  },
  {
    id: 'p-4',
    title: 'API V3 Requirements',
    start: '2025-08-25T00:00:00',
    end: '2025-09-12T00:00:00',
    resource: 'product',
    allDay: true,
  },
  {
    id: 'p-5',
    title: 'Q4 Planning',
    start: '2025-09-15T00:00:00',
    end: '2025-09-30T00:00:00',
    resource: 'product',
    allDay: true,
  },

  // ── Design ─────────────────────────────────────────────────
  {
    id: 'd-1',
    title: 'Dashboard Redesign',
    start: '2025-07-07T00:00:00',
    end: '2025-07-25T00:00:00',
    resource: 'design',
    allDay: true,
  },
  {
    id: 'd-2',
    title: 'Mobile App UI/UX',
    start: '2025-08-04T00:00:00',
    end: '2025-08-29T00:00:00',
    resource: 'design',
    allDay: true,
  },
  {
    id: 'd-3',
    title: 'Design System V2',
    start: '2025-09-01T00:00:00',
    end: '2025-09-19T00:00:00',
    resource: 'design',
    allDay: true,
  },
  {
    id: 'd-4',
    title: 'Onboarding Flow Redesign',
    start: '2025-09-22T00:00:00',
    end: '2025-10-10T00:00:00',
    resource: 'design',
    allDay: true,
  },

  // ── Engineering ────────────────────────────────────────────
  {
    id: 'e-1',
    title: 'Analytics Dashboard Dev',
    start: '2025-07-14T00:00:00',
    end: '2025-08-22T00:00:00',
    resource: 'engineering',
    allDay: true,
  },
  {
    id: 'e-2',
    title: 'Mobile App Backend',
    start: '2025-08-25T00:00:00',
    end: '2025-09-30T00:00:00',
    resource: 'engineering',
    allDay: true,
  },
  {
    id: 'e-3',
    title: 'API V3 Development',
    start: '2025-10-01T00:00:00',
    end: '2025-10-31T00:00:00',
    resource: 'engineering',
    allDay: true,
  },
  {
    id: 'e-4',
    title: 'Technical Debt Sprint',
    start: '2025-07-21T00:00:00',
    end: '2025-07-28T00:00:00',
    resource: 'engineering',
    allDay: true,
  },
  {
    id: 'e-5',
    title: 'Performance Optimization',
    start: '2025-09-08T00:00:00',
    end: '2025-09-19T00:00:00',
    resource: 'engineering',
    allDay: true,
  },

  // ── QA ─────────────────────────────────────────────────────
  {
    id: 'q-1',
    title: 'Dashboard Testing',
    start: '2025-08-11T00:00:00',
    end: '2025-08-29T00:00:00',
    resource: 'qa',
    allDay: true,
  },
  {
    id: 'q-2',
    title: 'Mobile App Testing',
    start: '2025-09-15T00:00:00',
    end: '2025-10-03T00:00:00',
    resource: 'qa',
    allDay: true,
  },
  {
    id: 'q-3',
    title: 'API V3 Testing',
    start: '2025-10-20T00:00:00',
    end: '2025-11-07T00:00:00',
    resource: 'qa',
    allDay: true,
  },
  {
    id: 'q-4',
    title: 'Integration Testing',
    start: '2025-09-01T00:00:00',
    end: '2025-09-12T00:00:00',
    resource: 'qa',
    allDay: true,
  },

  // ── Marketing ──────────────────────────────────────────────
  {
    id: 'm-1',
    title: 'Q3 Campaign Planning',
    start: '2025-07-01T00:00:00',
    end: '2025-07-18T00:00:00',
    resource: 'marketing',
    allDay: true,
  },
  {
    id: 'm-2',
    title: 'Analytics Launch Campaign',
    start: '2025-08-25T00:00:00',
    end: '2025-09-12T00:00:00',
    resource: 'marketing',
    allDay: true,
  },
  {
    id: 'm-3',
    title: 'Mobile App Launch',
    start: '2025-10-06T00:00:00',
    end: '2025-10-24T00:00:00',
    resource: 'marketing',
    allDay: true,
  },
  {
    id: 'm-4',
    title: 'Conference Prep',
    start: '2025-09-01T00:00:00',
    end: '2025-09-19T00:00:00',
    resource: 'marketing',
    allDay: true,
  },

  // ── DevOps ─────────────────────────────────────────────────
  {
    id: 'do-1',
    title: 'Infrastructure Assessment',
    start: '2025-07-01T00:00:00',
    end: '2025-07-18T00:00:00',
    resource: 'devops',
    allDay: true,
  },
  {
    id: 'do-2',
    title: 'CI/CD Pipeline Overhaul',
    start: '2025-08-04T00:00:00',
    end: '2025-08-22T00:00:00',
    resource: 'devops',
    allDay: true,
  },
  {
    id: 'do-3',
    title: 'Monitoring & Alerting',
    start: '2025-09-01T00:00:00',
    end: '2025-09-19T00:00:00',
    resource: 'devops',
    allDay: true,
  },
  {
    id: 'do-4',
    title: 'Kubernetes Migration',
    start: '2025-10-01T00:00:00',
    end: '2025-10-31T00:00:00',
    resource: 'devops',
    allDay: true,
  },
];
