# SubmissionArchives

![Submission Archives](public/images/submission-archives-logo.png)

**SubmissionArchives** is a comprehensive media archive preserving the work of **Dr. Rashad Khalifa**, the Messenger of the Covenant. This platform serves as a digital library for his audio recordings, video programs, and written publications, featuring advanced search capabilities across transcripts and texts.

## Archive Categories

### Audio & Video
- **Quran Studies**: Complete collection of 52 MP3 audio studies conducted by Dr. Khalifa and the masjid.
- **Messenger Audios**: Extensive archive of sermons, discussions, and studies from the 1980s.
- **Video Programs**: Restored MP4 video programs including *King of Chaos*, *Old Message New Messenger*, and other seminal works.
- **Sermons**: A curated compilation of sermons, including the pivotal "God Is Doing Everything."

### Written Works
- **Submitters Perspectives**: Complete newsletter archive from February 1985 to March 1990.
- **Appendices**: In-depth elaborations on Quranic topics, including the *Introduction* and *Proclamation* from Dr. Khalifa's translation.
- **Other Publications**: Various works including books (*Quran, Hadith, Islam*), brochures (e.g., *Contact Prayer/Salat*), and articles.

## Features

- **Deep Search**: Full-text search across all video/audio transcripts and written materials.
- **Smart Filtering**: Filter results by media type, year, or category.
- **Transcript Synchronization**: Read along with audio/video playback.
- **Responsive Design**: Optimized for desktop and mobile devices.

## Roadmap

### Quick Notes (Coming Soon)
A topical aggregation engine designed to compile all mentions of specific subjects across the entire archive.
*   *Example*: A "Contact Prayer (Salat)" note would aggregate every sermon clip, Quran study remark, and newsletter article mentioning Salat details (e.g., the correction on numbering units from Quran Study 52) into a single, organized view.

## Architecture & Technology

Built on a modern stack designed for performance and longevity:

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Media Playback**: All video and audio streams directly from YouTube. Nothing is self-hosted or proxied.
- **Transcripts**: Sourced from timestamped CSV exports (`public/playlist_1`, `public/playlist_2`) and compiled into `public/data/generated_indices/MASTER_INDEX.json` by `scripts/generate/generate_catalog_search_indices.mjs`.
- **Documents**: Appendix and newsletter PDFs, thumbnails, and books are served locally from `public/content/`.
- **Search**: Custom client-side engine with fuzzy matching and phonetic scoring.
- **Deployment**: Self-hosted via [Coolify](https://coolify.io/) using the included `Dockerfile` (Next.js standalone output).

## Local Development

### Prerequisites
- Node.js 20+
- NPM

### Setup

1.  **Clone & Install**:
    ```bash
    git clone https://github.com/WikiSubmission/SubmissionArchives.git
    cd SubmissionArchives
    npm install
    ```

2.  **Configure Environment**:
    Copy `.env.example` to `.env.local`. Override `SITE_URL` when developing metadata or deploying under a different public origin:
    ```bash
    cp .env.example .env.local
    ```

3.  **Run Dev Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000).

4.  **Regenerate Search Indices** (after editing catalog lists or playlist CSVs):
    ```bash
    npm run generate:catalog
    ```

5.  **Production Build**:
    ```bash
    npm run build
    npm start
    ```

    `npm start` prepares Next.js's standalone directory with the required `public/`, `.next/static/`, and `data/` assets, then launches the same server artifact used by the container image.

### Docker

A multi-stage `Dockerfile` is included for self-hosted deployment (e.g. Coolify):
```bash
docker build -t submissionarchives .
docker run -p 3000:3000 submissionarchives
```

The production image runs as an unprivileged user and exposes `/api/health` for Coolify or container-orchestrator readiness checks. A healthy response includes the validated catalog record and segment counts. The image also contains a Docker `HEALTHCHECK` that polls this endpoint every 30 seconds.

### Deployment verification

Before deployment, run:

```bash
npm run verify:deploy
npm run test:e2e
```

The first command verifies the lockfile, linting, TypeScript, unit and content contracts, deterministic catalog generation, production dependencies, and the standalone production build. The browser suite verifies representative archive, document, search, Qur'an, accessibility, and health-check flows against that build.

---

*Dedicated to the preservation and dissemination of the message of God alone.*
