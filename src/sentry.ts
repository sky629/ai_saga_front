import * as Sentry from '@sentry/react';

type SentryUser = {
    id?: string;
    email?: string;
    username?: string;
} | null;

const appEnv = import.meta.env.VITE_APP_ENV ?? import.meta.env.MODE;
const dsn = import.meta.env.VITE_SENTRY_DSN;
const release = import.meta.env.VITE_RELEASE;

const isProd = appEnv === 'production' || appEnv === 'prod';
const isBeta = appEnv === 'beta' || appEnv === 'staging';

const tracesSampleRate = isProd ? 0.1 : isBeta ? 0.3 : 1.0;
const replaysSessionSampleRate = isProd ? 0.01 : isBeta ? 0.05 : 0.1;

if (dsn) {
    Sentry.init({
        dsn,
        environment: appEnv,
        release: release || undefined,
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({
                maskAllText: true,
                blockAllMedia: true
            })
        ],
        tracesSampleRate,
        replaysSessionSampleRate,
        replaysOnErrorSampleRate: 1.0
    });
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
    Sentry.captureException(error, {
        extra: context
    });
}

export function addSentryBreadcrumb(
    message: string,
    category: string,
    level: Sentry.SeverityLevel = 'info',
    data?: Record<string, unknown>
) {
    Sentry.addBreadcrumb({
        message,
        category,
        level,
        data
    });
}

export function setSentryUser(user: SentryUser) {
    Sentry.setUser(user);
}
