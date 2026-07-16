'use client';

import { useReportWebVitals } from 'next/web-vitals';

type WebVitalMetric = {
    id: string;
    name: string;
    value: number;
    delta?: number;
    rating?: 'good' | 'needs-improvement' | 'poor';
    navigationType?: string;
};

function reportWebVitals(metric: WebVitalMetric) {
    if (process.env.NODE_ENV !== 'production') {
        console.debug('[web-vitals]', metric);
        return;
    }

    const payload = JSON.stringify({
        id: metric.id,
        name: metric.name,
        value: metric.value,
        delta: metric.delta,
        rating: metric.rating,
        navigationType: metric.navigationType,
        pathname: window.location.pathname,
    });

    const blob = new Blob([payload], { type: 'application/json' });
    if (navigator.sendBeacon?.('/api/vitals', blob)) return;

    void fetch('/api/vitals', {
        method: 'POST',
        body: payload,
        keepalive: true,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
    }).catch(() => {
        // Analytics must never interrupt the user path.
    });
}

export function WebVitals() {
    useReportWebVitals(reportWebVitals);
    return null;
}
