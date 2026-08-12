import { setupServer } from 'msw/node';

// Tanpa handler default — tiap berkas test mendaftarkan handler-nya sendiri
// lewat server.use(), supaya jelas endpoint mana yang dipakai test mana.
export const server = setupServer();
