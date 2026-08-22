import 'server-only';

import pino from 'pino';

// One JSON line per event, so logs are queryable by field rather than by grepping
// interpolated strings.
//
// Deliberately no pino-pretty transport: pino transports run in worker threads, which
// Next's bundler resolves unreliably, and a logger that can crash a route is worse than
// one that is a little harder to read locally.
export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    base: { service: 'submission-archives' },
});
