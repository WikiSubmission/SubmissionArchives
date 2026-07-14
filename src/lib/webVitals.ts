const WEB_VITAL_NAMES = new Set(['CLS', 'FCP', 'INP', 'LCP', 'TTFB']);
const WEB_VITAL_RATINGS = new Set(['good', 'needs-improvement', 'poor']);

export type WebVitalMetric = {
  id: string;
  name: string;
  value: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
  navigationType?: string;
};

export function parseWebVitalMetric(value: unknown): WebVitalMetric | null {
  if (!isRecord(value)) {
    return null;
  }

  const { id, name, rating, navigationType } = value;
  if (
    typeof id !== 'string' ||
    id.length === 0 ||
    id.length > 128 ||
    typeof name !== 'string' ||
    !WEB_VITAL_NAMES.has(name) ||
    typeof value.value !== 'number' ||
    !Number.isFinite(value.value) ||
    value.value < 0
  ) {
    return null;
  }

  if (rating !== undefined && (typeof rating !== 'string' || !WEB_VITAL_RATINGS.has(rating))) {
    return null;
  }

  if (
    navigationType !== undefined &&
    (typeof navigationType !== 'string' || navigationType.length === 0 || navigationType.length > 64)
  ) {
    return null;
  }

  return {
    id,
    name,
    value: value.value,
    ...(rating ? { rating: rating as WebVitalMetric['rating'] } : {}),
    ...(navigationType ? { navigationType } : {}),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
