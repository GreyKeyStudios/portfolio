# Codex Instructions — Stack House

For any work touching `/house`, the Stack House interior, gameplay, lore, room furnishing, encounters, terminals, or portfolio interactions, read these sources before making design decisions:

1. `docs/STACK_HOUSE_EXPERIENCE_BIBLE.md` — canonical creative/spatial/gameplay decisions.
2. `lib/interior-layout.ts` — exact architectural floor-plan source of truth.
3. `STATUS.md` — current implementation state and active work front.
4. `docs/ARCHITECTURE_V002.md` and newer architecture docs when relevant.

Rules:

- Preserve anything marked **LOCKED** in the experience bible unless the user explicitly changes it.
- Do not silently canonize items marked **OPEN**.
- Do not undo the approved room identities just because current code labels still use older names. In particular:
  - `gallery` is **Library / Study**.
  - `nook` is **Writing Room / Sunroom**, not a lab.
  - `guest-room` is **Master Bedroom / Grey Key Merch**, not a guest room.
- `PLAN_SCALE = 1.0` and the current geometry remain authoritative unless a deliberate architectural change is requested.
- Normal service rooms may remain normal rooms; do not force portfolio displays into every space.
- Keep the portfolio usable as a portfolio even as gameplay is added.
- If implementation constraints conflict with a locked design beat, preserve stable code/geometry and report the conflict instead of silently rewriting canon.
- Update `STATUS.md` when a locked Stack House design element is implemented or when implementation reveals a meaningful conflict with the bible.
