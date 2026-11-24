// Injected so time-dependent logic (cache expiry, ...) is testable.
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = { now: () => new Date() };
