export interface RateLimitNotice {
  retryAfterSec: number;
  resetAt: number;
}

type Listener = (notice: RateLimitNotice) => void;

/** Broadcasts 429 responses so one banner can show a countdown app-wide. */
export class RateLimitMonitor {
  private readonly listeners = new Set<Listener>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  report(retryAfterSec: number, now = Date.now()): void {
    const notice = { retryAfterSec, resetAt: now + retryAfterSec * 1000 };
    this.listeners.forEach(listener => listener(notice));
  }
}
