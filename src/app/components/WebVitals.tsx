'use client';

import { useReportWebVitals } from 'next/web-vitals';

const reportWebVitals = (metric: {
    id: string;
    name: string;
    value: number;
    rating?: 'good' | 'needs-improvement' | 'poor';
    attribution?: unknown;
}) => {
    if (process.env.NODE_ENV !== 'production') {
        console.debug('[web-vitals]', metric);
        return;
    }

    const body = JSON.stringify(metric);
    if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/vitals', body);
        return;
    }

    fetch('/api/vitals', {
        body,
        method: 'POST',
        keepalive: true,
        headers: {
            'Content-Type': 'application/json',
        },
    }).catch(() => {
        // Metrics must never affect the user path.
    });
};

export function WebVitals() {
    useReportWebVitals(reportWebVitals);
    return null;
}
