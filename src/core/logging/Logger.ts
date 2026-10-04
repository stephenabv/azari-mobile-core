export type LogContext = Record<string, unknown>;

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
}

/** Keys whose values must never reach a log line, whatever the caller passes. */
const REDACTED_KEYS =
  /(token|secret|password|attestation|assertion|email|phone|name|location|challenge)/i;

function redact(context: LogContext | undefined): LogContext | undefined {
  if (!context) return undefined;
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [
      key,
      REDACTED_KEYS.test(key) ? '[redacted]' : value,
    ]),
  );
}

/**
 * Console logger that drops debug/info output in release builds and redacts
 * personal or security-sensitive fields before anything is written.
 */
export class ConsoleLogger implements Logger {
  constructor(private readonly verbose: boolean) {}

  debug(message: string, context?: LogContext): void {
    if (this.verbose) console.warn(`[debug] ${message}`, redact(context) ?? '');
  }

  info(message: string, context?: LogContext): void {
    if (this.verbose) console.warn(`[info] ${message}`, redact(context) ?? '');
  }

  warn(message: string, context?: LogContext): void {
    console.warn(message, redact(context) ?? '');
  }

  error(message: string, context?: LogContext): void {
    console.error(message, redact(context) ?? '');
  }
}
