import { describe, it, expect } from 'vitest';
import { CreatePriorityRequest, UpdatePriorityRequest } from './priority.js';

describe('CreatePriorityRequest', () => {
  it('menerima nama valid', () => {
    expect(CreatePriorityRequest.safeParse({ name: 'Tinggi' }).success).toBe(true);
  });

  it('menolak nama kosong', () => {
    expect(CreatePriorityRequest.safeParse({ name: '' }).success).toBe(false);
  });
});

describe('UpdatePriorityRequest', () => {
  it('menerima objek kosong', () => {
    expect(UpdatePriorityRequest.safeParse({}).success).toBe(true);
  });
});