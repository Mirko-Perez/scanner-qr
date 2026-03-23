import { EventEmitter } from "events";

const globalForEvents = globalThis as unknown as {
  scanEmitter: EventEmitter | undefined;
};

export const scanEmitter =
  globalForEvents.scanEmitter ?? new EventEmitter();

if (process.env.NODE_ENV !== "production")
  globalForEvents.scanEmitter = scanEmitter;

export type ScanEvent = {
  guestId: string;
  guestName: string;
  tableNumber: number;
  videoPath: string | null;
};
