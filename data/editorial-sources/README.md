# Editorial Primary Sources

Every document an editorial cites lives here, under the editorial's own slug, so that a
footnote can be checked against the thing it came from without leaving the repository.

```
data/editorial-sources/
└── <slug>/
    ├── SOURCES.md      # maps each footnote and quotation to the file it came from
    └── <group>/        # the documents themselves, grouped by origin
```

The slug matches `src/content/editorials/<slug>/index.mdx` and
`public/editorials/<slug>/`, following the rule in the editorials authoring guide that
nothing is shared between articles.

## What belongs here and what does not

This tree holds **evidence**, not **presentation**. The cropped, rotated and
web-optimised derivatives that an article actually displays live in
`public/editorials/<slug>/` and are served to readers. What sits here is the unmodified
source each of those derivatives was made from, plus every document that is quoted or
relied on without being displayed.

Nothing in this directory is served over the web. It is a provenance record for editors
and for anyone auditing a claim.

## Tracking

PDFs under this path are exempted from the repository's blanket `*.pdf` ignore rule,
because the footnotes point at them. Video is not exempted: `.mp4` files copied here for
completeness stay untracked, in line with the repository's rule that recordings play from
their hosted source rather than living in git. Where an article quotes a recording, the
transcript beside it is tracked and carries the timestamps.

## Upstream

These files are copies. The canonical archive, including full FOIA productions and the
complete Discord exports that only excerpts are needed from here, is held separately in
the Server Librarian archive. Where only part of a large production is cited, the extract
kept here says so in that editorial's `SOURCES.md`.
