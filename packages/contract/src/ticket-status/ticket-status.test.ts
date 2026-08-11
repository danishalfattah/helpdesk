import { describe, it, expect } from 'vitest';
import { CreateTicketStatusRequest, UpdateTicketStatusRequest } from './ticket-status.js';

describe('CreateTicketStatusRequest', () => {
  it('menerima nama valid', () => {
    expect(CreateTicketStatusRequest.safeParse({ name: 'Open' }).success).toBe(true);
  });

  it('menolak nama kosong', () => {
    expect(CreateTicketStatusRequest.safeParse({ name: '' }).success).toBe(false);
  });
});

describe('UpdateTicketStatusRequest', () => {
  it('menerima objek kosong', () => {
    expect(UpdateTicketStatusRequest.safeParse({}).success).toBe(true);
  });
});