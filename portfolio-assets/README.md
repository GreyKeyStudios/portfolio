# Portfolio Asset Production Library

This folder is the working library for portfolio media. It is separate from
`public/`, so adding raw files here does not automatically publish them on the
website.

## Buckets

- `real/` — authentic screenshots, photographs, prototype captures, and other
  evidence of existing work.
- `concept/` — generated or commissioned concept art and presentation mockups.
- `audio/` — selected music excerpts and final web-ready audio exports.
- `source/` — editable originals, project files, layered artwork, large masters,
  and other material that should not ship directly to the website.

Never place generated concept art in `real/`. The distinction is what allows
the site to label material honestly.

## Placeholder workflow

Use one of these states while gathering media:

- **HAVE IT** — locate and organize an existing asset.
- **CAPTURE IT** — create a screenshot or recording from real working software.
- **GENERATE IT** — create clearly labeled concept imagery.
- **SELECT IT** — choose an existing music excerpt.

## Naming

Use descriptive lowercase filenames with hyphens:

```text
lifeos-dashboard-real-v1.png
cooleys-revenge-character-select-concept-v1.jpg
mr-e-builders-of-the-future-excerpt-v1.mp3
```

Avoid names such as `image-final-final2.png`. Keep original editable files in
`source/`, and place only web-ready selections in the other buckets.

## Adding an asset to the site

When an asset is approved, it will be copied into `public/portfolio/` (or a
more specific public media folder), then connected to the corresponding typed
record in `lib/portfolio-projects.ts` or the Grey Key identity registry.

