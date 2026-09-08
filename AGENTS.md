# Codex Instructions — Stack House

For any work touching `/house`, the Stack House interior, gameplay, lore, room furnishing, encounters, terminals, or portfolio interactions, read these sources before making design decisions:

1. `docs/STACK_HOUSE_LAYOUT_UPDATES_2026-09-08.md` — newest locked architectural/program changes; this supersedes older room-purpose mappings where they conflict.
2. `docs/STACK_HOUSE_EXPERIENCE_BIBLE.md` — canonical creative/spatial/gameplay decisions.
3. `docs/STACK_HOUSE_WORK_DISPLAY.md` — canonical rules for how portfolio work is surfaced through in-world devices/rooms.
4. `lib/interior-layout.ts` — exact architectural floor-plan source of truth.
5. `STATUS.md` — current implementation state and active work front.
6. `docs/ARCHITECTURE_V002.md` and newer architecture docs when relevant.

Rules:

- Preserve anything marked **LOCKED** in the experience bible, layout-update doc, or work-display doc unless the user explicitly changes it.
- Do not silently canonize items marked **OPEN**.
- Apply the newest approved room program even when current code labels still use older names. In particular:
  - Ground-floor `Laundry` is now **Back Entry / Mudroom** and needs a real exterior back door.
  - Laundry moves to the **basement**; if the current Secret Room space is reused, preserve and relocate/re-express the future hidden secret-route function rather than deleting it.
  - Preserve **Kitchen → Pantry → Dining Room** circulation exactly unless a concrete implementation issue requires discussion.
  - The second-floor **Library / Study + Writing** functions are now one larger combined room, not two dedicated rooms.
  - The back room on that side becomes the **Master Bedroom**.
  - The two adjoining **Storage + Linen** rooms are to be combined into a **walk-in closet / dressing room** for merch/wardrobe use.
  - The office wing keeps **Home Office + small Guest/Gag Bedroom + Bathroom**.
- Older mappings such as `nook` = standalone Writing Room/Sunroom and `guest-room` = Master Bedroom are superseded by `docs/STACK_HOUSE_LAYOUT_UPDATES_2026-09-08.md`; verify current room IDs visually before editing geometry.
- `PLAN_SCALE = 1.0` and the current geometry remain authoritative unless a deliberate architectural change is requested.
- Normal service rooms may remain normal rooms; do not force portfolio displays into every space.
- Keep the portfolio usable as a portfolio even as gameplay is added.
- Preserve the distinction between in-world work surfaces: do not collapse living-room laptop, office PC, studio DAW, game console, etc. into one generic project browser.
- If implementation constraints conflict with a locked design beat, preserve stable code/geometry and report the conflict instead of silently rewriting canon.
- Update `STATUS.md` when a locked Stack House design element is implemented or when implementation reveals a meaningful conflict with the bible/layout update.
