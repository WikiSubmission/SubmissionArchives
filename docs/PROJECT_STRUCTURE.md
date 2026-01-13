# RK-Media Project Structure

## Overview

This document describes the reorganized structure of the RK-Media project.

## Directory Structure

```
RK-Media/
├── rk-media-platform/          # Main Next.js application
│   ├── src/                    # Source code
│   │   ├── app/                # Next.js app router pages
│   │   ├── components/         # Shared React components
│   │   └── lib/                # Utility functions
│   ├── public/                 # Public assets
│   │   └── data/               # Public data files
│   ├── data-sources/           # Raw data files (90 items)
│   │   ├── bible/              # Bible USFM files (70+ files)
│   │   ├── quran/              # Quran translations and studies
│   │   ├── newsletters/        # Newsletter source data
│   │   └── transcripts/        # Audio transcripts
│   ├── docs/                   # Documentation (3 files)
│   │   ├── README.md
│   │   └── SETUP_QURAN_COMPARE.md
│   ├── scripts/                # Build/processing scripts
│   └── transcripts/            # Processed transcripts
│
├── legacy/                     # Old/deprecated files (7 items)
│   ├── index.html              # Old standalone HTML
│   └── temp-files/             # Temporary HTML files
│
├── media-assets/               # Large media files (145 items, gitignored)
│   ├── messenger_audios/       # Audio files
│   ├── Messenger Quran Studies/# Video files
│   └── Messenger Sermons/      # Sermon files
│
├── data/                       # Root-level data (374 items)
├── scripts/                    # Root-level scripts (131 items)
└── tools/                      # Utility tools (11 items)
```

## Key Improvements

### Before Reorganization
- **rk-media-platform root**: 110+ files including 70+ USFM files
- Bible files, temp files, and data mixed together
- No clear separation of concerns
- Large media files in git

### After Reorganization
- **rk-media-platform root**: 13 files only
- Clear separation: `data-sources/`, `docs/`, `legacy/`
- Media files moved to gitignored `media-assets/`
- Much easier to navigate and maintain

## File Locations

### Bible Data
- **Location**: `rk-media-platform/data-sources/bible/`
- **Contents**: 70+ USFM files, Gospel of Thomas PDF, raw text files

### Quran Data
- **Location**: `rk-media-platform/data-sources/quran/`
- **Contents**: Quran studies JSON, titles, translations

### Transcripts
- **Location**: `rk-media-platform/data-sources/transcripts/`
- **Contents**: Quran study transcripts JSON files

### Documentation
- **Location**: `rk-media-platform/docs/`
- **Contents**: README, setup guides

### Legacy Files
- **Location**: `legacy/`
- **Contents**: Old index.html, temp HTML files for review/deletion

### Media Assets
- **Location**: `media-assets/` (gitignored)
- **Contents**: Audio files, video files, sermon files

## Next Steps

1. **Verify the application still works** - Run `npm run dev` in rk-media-platform
2. **Update any broken import paths** - Check if scripts reference moved files
3. **Review legacy files** - Decide what to keep/delete from `legacy/temp-files/`
4. **Commit changes** - Add the reorganization to git
5. **Fix dark mode issues** - Now that structure is clean, revisit color conflicts

## Notes

- The `media-assets/` directory is excluded from git via `.gitignore`
- All source code remains in `rk-media-platform/src/`
- Public data files remain in `rk-media-platform/public/data/`
- Processing scripts remain in `rk-media-platform/scripts/`
