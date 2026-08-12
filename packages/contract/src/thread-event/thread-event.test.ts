import { describe, it, expect } from 'vitest';
import { ThreadEventResponse } from './thread-event.js';

describe('ThreadEventResponse', () => {
  it('menerima bentuk event yang valid', () => {
    const hasil = ThreadEventResponse.safeParse({
      id: 1, ticketId: 1, agentId: 7, eventType: 'status_changed',
      oldValue: 'New', newValue: 'Work In Progress', createdAt: new Date().toISOString(),
    });
    expect(hasil.success).toBe(true);
  });

  it('menerima agentId null (event dari sistem)', () => {
    const hasil = ThreadEventResponse.safeParse({
      id: 1, ticketId: 1, agentId: null, eventType: 'status_changed',
      oldValue: 'Open', newValue: 'Overdue', createdAt: new Date().toISOString(),
    });
    expect(hasil.success).toBe(true);
  });
});