import { defineConfig, devices } from '@playwright/test';

const port = process.env.PLAYWRIGHT_PORT || '3000';
const baseURL = `http://127.0.0.1:${port}`;
export default defineConfig({
    testDir: './tests/e2e',
    updateSnapshots: 'none',
    fullyParallel: false,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    expect: {
        timeout: 15_000,
    },
    // Screenshot baselines are platform-specific (font rasterisation differs), so they are
    // stored per platform rather than overwriting each other.
    snapshotPathTemplate: '{testDir}/__snapshots__/{testFileName}/{platform}/{arg}{ext}',
    reporter: process.env.CI
        ? [['github'], ['html', { open: 'never' }]]
        : [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: 'npm run start',
        // The suite runs many searches from one IP well inside the limiter's 60s
        // window; without this the later specs get 429s and fail spuriously.
        env: { SEARCH_RATE_LIMIT: '1000', PORT: port },
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        stdout: 'ignore',
        stderr: 'pipe',
    },
});
