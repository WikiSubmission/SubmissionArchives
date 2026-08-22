'use client';

import { useEffect } from 'react';

const ENDPOINT = '/api/crash';

// One report per message per session. A render loop that throws every frame would
// otherwise turn a bug into a flood.
const reported = new Set<string>();

function report(message: string, source: 'error' | 'unhandledrejection', stack?: string) {
    if (!message || reported.has(message)) return;
    reported.add(message);

    try {
        const body = JSON.stringify({
            message,
            source,
            stack,
            // Path only — the query string can contain what someone searched for.
            url: window.location.pathname,
        });
        if (navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: 'application/json' }))) {
            return;
        }
        void fetch(ENDPOINT, {
            method: 'POST',
            body,
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
        }).catch(() => undefined);
    } catch {
        // Reporting must never itself throw.
    }
}

export default function ErrorReporter() {
    useEffect(() => {
        const onError = (event: ErrorEvent) => {
            report(event.message, 'error', event.error instanceof Error ? event.error.stack : undefined);
        };

        const onRejection = (event: PromiseRejectionEvent) => {
            const reason: unknown = event.reason;
            report(
                reason instanceof Error ? reason.message : String(reason),
                'unhandledrejection',
                reason instanceof Error ? reason.stack : undefined,
            );
        };

        window.addEventListener('error', onError);
        window.addEventListener('unhandledrejection', onRejection);
        return () => {
            window.removeEventListener('error', onError);
            window.removeEventListener('unhandledrejection', onRejection);
        };
    }, []);

    return null;
}
