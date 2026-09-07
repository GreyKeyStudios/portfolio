# Codex Instructions — Stack House

For any work touching `/house`, the Stack House interior, gameplay, lore, room furnishing, encounters, terminals, or portfolio interactions, read these sources before making design decisions:

1. `docs/STACK_HOUSE_EXPERIENCE_BIBLE.md` — canonical creative/spatial/gameplay decisions.
2. `docs/STACK_HOUSE_WORK_DISPLAY.md` — canonical rules for how portfolio work is surfaced through in-world devices/rooms.
3. `lib/interior-layout.ts` — exact architectural floor-plan source of truth.
4. `STATUS.md` — current implementation state and active work front.
5. `docs/ARCHITECTURE_V002.md` and newer architecture docs when relevant.

Rules:

- Preserve anything marked **LOCKED** in the experience bible or work-display doc unless the user explicitly changes it.
- Do not silently canonize items marked **OPEN**.
- Do not undo the approved room identities just because current code labels still use older names. In particular:
  - `gallery` is **Library / Study**.
  - `nook` is **Writing Room / Sunroom**, not a lab.
  - `guest-room` is **Master Bedroom / Grey Key Merch**, not a guest room.
- `PLAN_SCALE = 1.0` and the current geometry remain authoritative unless a deliberate architectural change is requested.
- Normal service rooms may remain normal rooms; do not force portfolio displays into every space.
- Keep the portfolio usable as a portfolio even as gameplay is added.
- Preserve the distinction between in-world work surfaces: do not collapse living-room laptop, office PC, studio DAW, game console, etc. into one generic project browser.
- If implementation constraints conflict with a locked design beat, preserve stable code/geometry and report the conflict instead of silently rewriting canon.
- Update `STATUS.md` when a locked Stack House design element is implemented or when implementation reveals a meaningful conflict with the bible.
