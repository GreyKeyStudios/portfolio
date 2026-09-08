# Stack House — Layout Updates (2026-09-08)

This document records **LOCKED architectural/program changes decided on 2026-09-08**. It is a current overlay on top of `docs/STACK_HOUSE_EXPERIENCE_BIBLE.md` and older room labels. Where this document conflicts with an older room-purpose mapping, **this document wins** until the bible and code labels are reconciled.

Technical geometry remains grounded in `lib/interior-layout.ts`; implement these changes deliberately rather than silently forcing old labels to remain true.

---

## 1. Ground floor — LOCKED

The ground-floor plan is considered **set once the laundry move and new back-entry conversion are implemented**.

### Preserve the pantry → dining-room connection

The current pantry connection into the dining room looks good and should **not be redesigned or rerouted**.

Locked circulation intent:

**Kitchen → Pantry → Dining Room** remains intact.

The pantry stays a pantry/service passage. Do not absorb it into the former laundry room or turn it into a dining/breakfast nook.

### Ground-floor Laundry → Back Entry / Mudroom

The room currently functioning/labeled as the ground-floor **Laundry**, directly adjoining the Kitchen, is no longer laundry.

Convert it to a **Back Entry / Mudroom**.

Required architectural change:

- add a real **exterior back door** from this room to the rear/yard side of the house.

Room identity / furnishing direction:

- entry mat,
- bench,
- coat hooks / jackets,
- shoe or boot storage,
- umbrella stand,
- shelf/cubbies for bags, gloves, hats, etc.,
- practical outdoor/household clutter where useful,
- cleaning items may live here in a secondary role but this is primarily an entry transition space.

This should read as a believable back entrance, not another project-display room.

### Why this matters for gameplay

The new back door gives the house a second exterior route separate from the front-door arrival path. This can later support yard access, records/zombie/hose sequences, Night-state routing, and household-task gameplay without weakening the front door's narrative importance.

Do not overbuild those mechanics during the architectural change; preserve the route so gameplay can use it later.

---

## 2. Laundry relocation — LOCKED

Laundry moves **to the basement**.

The user specifically wants the ground-floor laundry removed and the laundry function placed in the basement, where it makes more architectural sense alongside utility/mechanical infrastructure.

Preferred current target is the basement room presently associated with the **Secret Room**, if the floor plan supports it.

Important constraint:

- **Do not delete the secret-route gameplay requirement.**
- The basement still needs the eventual hidden/secret progression that leads toward the artist/secret-room sequence and real-house route.
- If the room currently labeled `Secret Room` becomes the laundry room, relocate or re-express the secret-room entrance/function elsewhere in the basement rather than removing it.

Basement functional relationship should read naturally as something like:

**laundry + mechanical/utility infrastructure + Grey Key Studios + hidden secret access**.

The exact final hidden-door placement can remain unresolved until the secret-room/studio pass if changing it now would force premature gameplay design.

---

## 3. Second floor — latest locked program

The older mapping in the experience bible (`gallery` = Library/Study, `nook` = standalone Writing Room/Sunroom, `guest-room` = Master Bedroom/Merch) is now superseded by the following **conceptual room program**. Exact room-ID remapping should be verified against the current visual geometry before editing walls.

### Office wing

Keep the side of the floor containing the Home Office as:

- **Home Office**
- **small Guest / Gag Bedroom**
- **Bathroom**

The small bedroom opening from/near the office is acceptable and can later carry a joke/guest-room concept. It is **not** the master bedroom.

### Library side

Combine the former **Library / Study** and standalone **Writing Room / Sunroom** concept into **one larger Library / Study / Writing room**.

Reason:

- writing is part of the user's work, but not a large enough body of work to justify a dedicated room,
- a writing desk can live naturally inside the larger library/study,
- this gives the education/research room more presence and avoids manufacturing a fake manuscript-heavy writing identity.

The combined room can contain:

- Diaspora Atlas globe,
- ReLearn study surface,
- Citizen Science research material,
- books / research / maps,
- AI-history periodicals/clippings,
- a writing desk for blog, notes, essays, future book ideas, and a small number of real drafts.

Do **not** fabricate shelves of nonexistent manuscripts just to fill the room.

### Master Bedroom

The back room on this side becomes the **Master Bedroom**.

### Storage + Linen → Walk-in Closet / Dressing Room

The two small adjoining rooms currently used as **Storage** and **Linen** should be combined by removing the separating wall, creating a **walk-in closet / dressing room** attached to the Master Bedroom.

This becomes the natural home of the Grey Key merch system:

- shirts,
- hoodies,
- hats,
- accessories,
- wardrobe/loadout interactions,
- full-length mirror where feasible.

This solves the awkward storage/linen adjacency and gives merch a dedicated physical space without turning the bedroom into a storefront.

---

## 4. First-floor completion condition — LOCKED

For layout purposes, the user considers the first floor essentially complete once these two changes land:

1. move Laundry to the basement,
2. convert the former Laundry into Back Entry / Mudroom and add the back door.

Do not reopen first-floor room planning without a concrete implementation problem or explicit user request.

The pantry-to-dining circulation is specifically approved and should remain.

---

## 5. Implementation guidance

Before editing geometry:

1. inspect `lib/interior-layout.ts` and current deployed room relationships,
2. preserve the working pantry → dining-room connection,
3. identify the correct exterior wall for the new mudroom back door,
4. ensure door collision/opening generation stays derived from the same source of truth,
5. regenerate/update elevation drawings after adding the back door if the architecture tooling expects them,
6. verify ground-floor traversal after the room-purpose swap,
7. verify basement circulation before committing the laundry relocation,
8. do not destroy or orphan the future secret-route path,
9. visually verify the second-floor room IDs before combining walls or renaming spaces.

If an exact code-room mapping conflicts with the visual interpretation described above, stop and report the conflict rather than guessing.
