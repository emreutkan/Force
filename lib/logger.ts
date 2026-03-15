import * as Sentry from '@sentry/react-native';

type LogLevel = 'debug' | 'info' | 'warning' | 'error';
type LogContext = Record<string, unknown> | undefined;

const MAX_DEPTH = 4;
const MAX_ENTRIES = 20;
const MAX_STRING_LENGTH = 500;
const REDACTED_VALUE = '[REDACTED]';
const TRUNCATED_VALUE = '[TRUNCATED]';
const SENSITIVE_KEY_PATTERN =
  /token|authorization|password|secret|cookie|session|api[-_]?key|refresh|access/i;

function truncateString(value: string): string {
  if (value.length <= MAX_STRING_LENGTH) return value;
  return `${value.slice(0, MAX_STRING_LENGTH)}…`;
}

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (value == null) return value;

  if (typeof value === 'string') {
    return truncateString(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: truncateString(value.message),
      stack: value.stack ? truncateString(value.stack) : undefined,
    };
  }

  if (Array.isArray(value)) {
    if (depth >= MAX_DEPTH) return TRUNCATED_VALUE;
    return value.slice(0, MAX_ENTRIES).map((item) => sanitizeValue(item, depth + 1));
  }

  if (typeof value === 'object') {
    if (depth >= MAX_DEPTH) return TRUNCATED_VALUE;

    const entries = Object.entries(value as Record<string, unknown>).slice(0, MAX_ENTRIES);
    return entries.reduce<Record<string, unknown>>((acc, [key, nestedValue]) => {
      acc[key] = SENSITIVE_KEY_PATTERN.test(key)
        ? REDACTED_VALUE
        : sanitizeValue(nestedValue, depth + 1);
      return acc;
    }, {});
  }

  return String(value);
}

function normalizeContext(context?: unknown): LogContext {
  if (context === undefined) return undefined;

  if (typeof context === 'object' && context !== null && !Array.isArray(context)) {
    return sanitizeValue(context) as Record<string, unknown>;
  }

  return { value: sanitizeValue(context) };
}

function addBreadcrumb(level: LogLevel, message: string, context?: unknown): void {
  Sentry.addBreadcrumb({
    category: 'app.log',
    level,
    message,
    data: normalizeContext(context),
  });
}

function withScope(level: Exclude<LogLevel, 'debug'>, message: string, context?: unknown): void {
  Sentry.withScope((scope) => {
    scope.setLevel(level);

    const normalizedContext = normalizeContext(context);
    if (normalizedContext) {
      scope.setContext('log', normalizedContext);
    }

    Sentry.captureMessage(message, level);
  });
}

export const logger = {
  debug(message: string, context?: unknown): void {
    addBreadcrumb('debug', message, context);
  },

  info(message: string, context?: unknown): void {
    addBreadcrumb('info', message, context);
  },

  warn(message: string, context?: unknown): void {
    addBreadcrumb('warning', message, context);
    withScope('warning', message, context);
  },

  error(message: string, error?: unknown, context?: unknown): void {
    const breadcrumbContext =
      error === undefined
        ? context
        : {
            error: sanitizeValue(error),
            ...(normalizeContext(context) ?? {}),
          };

    addBreadcrumb('error', message, breadcrumbContext);

    if (error instanceof Error) {
      Sentry.withScope((scope) => {
        scope.setLevel('error');
        scope.setExtra('logMessage', message);

        const normalizedContext = normalizeContext(context);
        if (normalizedContext) {
          scope.setContext('log', normalizedContext);
        }

        Sentry.captureException(error);
      });
      return;
    }

    const mergedContext =
      error === undefined
        ? context
        : {
            detail: sanitizeValue(error),
            ...(normalizeContext(context) ?? {}),
          };

    withScope('error', message, mergedContext);
  },
};
