# Stack House — Work Display System

_Last updated: 2026-09-07_

This document is the canonical source of truth for **how portfolio work is presented inside Stack House**. It complements `docs/STACK_HOUSE_EXPERIENCE_BIBLE.md`.

## Decision language

- **LOCKED** = approved direction. Do not replace it with a generic portfolio UI without explicit user direction.
- **OPEN** = unresolved and still being designed.

---

# Core rule — LOCKED

Work should be encountered through objects and interfaces that naturally belong in the room. Stack House should not repeatedly fall back to generic project cards, kiosks, or a single portfolio menu.

Different rooms should expose work differently. The player should feel like they are using someone’s actual devices, shelves, instruments, walls, media, and workspaces.

Main-story progression may use light quest guidance. Optional work, lore, jokes, and deep Easter eggs can remain discoverable without markers.

---

# Living Room / Client Room laptop — LOCKED

The living-room laptop is a **real browser session**, not a portfolio menu.

When the player interacts, the character sits down and comments approximately:

> “Damn. This guy sure has a lot of tabs open. Let’s check ’em out.”

The browser already has all projects appropriate to this laptop open in tabs. The player can freely click between them.

The tab bar should feel lived-in rather than curated:

- real project tabs,
- client work where appropriate,
- actual websites/previews,
- a few joke or mundane tabs,
- possible Stack Overflow/search/YouTube/music/random tabs,
- occasional lore or puzzle-relevant tab later in the game.

Do not force the player through a fake `PROJECTS` home page first.

The laptop should feel like the owner walked away from it five minutes ago.

Day/Night state may alter tabs or browser behavior. A Night-state tab the player did not open is acceptable if used deliberately for story/horror.

---

# Home Office computer — LOCKED

The office machine is a **real desktop/workstation environment** with folders, files, shortcuts, icons, windows, and an ordinary desktop metaphor.

This machine shows more of **how the work is made**, whereas the living-room laptop primarily exposes work through already-open browser tabs.

The office desktop may contain:

- project folders,
- shortcuts to active builds,
- local/dev previews,
- source/repo-related artifacts,
- screenshots and exports,
- notes/readmes,
- terminal/dev-tool shortcuts,
- unfinished work,
- ordinary desktop clutter,
- jokes and embarrassing filenames,
- recycle bin/trash,
- downloads,
- stale shortcuts or old versions where funny or narratively useful.

Examples of acceptable joke/clutter tone:

- `final_final_v7_REAL`
- too many similarly named folders,
- an absurdly full Downloads folder,
- a desktop shortcut whose purpose is no longer clear,
- files that reflect real beginner/debugging history.

Actual projects should be accessible through this desktop in forms that fit them. Opening a project folder can expose a mix of artifacts such as its README/notes, screenshots, build/demo shortcut, design files, or local preview. Do not force every project into the exact same presentation template.

The desktop must still be understandable to a casual visitor. It should feel messy/lived-in, not become an unusable parody of clutter.

---

# Office computer + Bug encounter — LOCKED RELATIONSHIP

The office computer is also the natural diagnostic surface for **The Bug** encounter.

The Bug corrupts Stack House rather than simply chasing the player. During that sequence, the office desktop can visibly degrade or behave incorrectly while a freaky glowing insect appears on-screen.

Possible corruption includes:

- wrong folders/windows opening,
- duplicated icons,
- labels changing,
- windows returning impossible information,
- desktop objects moving or appearing in the wrong state,
- diagnostics that help the player reproduce/isolate/patch the house bug.

The underlying normal desktop should therefore be established before the Bug sequence, so the player can recognize when it is wrong.

---

# Presentation contrast — LOCKED

**Living room laptop:** finished/active work encountered through an already-running browser session.

**Home office PC:** work-in-progress, files, folders, development artifacts, local builds, debugging, process.

They should not be reskins of the same interface.

---

# Kitchen / Breakfast — LOCKED

The kitchen is not another computer-based portfolio display. It is its own **recipe collection + cooking gameplay space**.

## Active cookbook — LOCKED

A physical cookbook/binder lives in the kitchen on a counter, stand, or other believable working surface. It should look **actively in progress**, not like a polished published book.

Pages may include:

- finished recipes,
- handwritten substitutions,
- crossed-out measurements,
- cost-per-serving notes,
- food photos,
- taped-in scraps,
- notes such as “needs more garlic,”
- healthier/cheaper revisions,
- partially developed recipes,
- blank placeholders for recipes not yet discovered.

Existing real recipes should be used where available. **Strawberry Lemonade Cake** is a locked early example of a real recipe that belongs in the book.

The cookbook communicates the autobiographical root indirectly: wanting to save money, cook at home more, eat better, and turn that effort into something reusable.

## Recipe discovery loop — LOCKED

Recipes are collectible discoveries placed throughout Stack House rather than all being available from the start.

A recipe may be found as:

- handwritten card,
- loose notebook page,
- clipping,
- note in another room,
- family/personal artifact,
- puzzle reward,
- hidden Easter egg,
- other context-appropriate object.

When a recipe is found, it is added to the kitchen cookbook. This gives the kitchen its own collection/minigame progression.

Some recipe discoveries may be main-path or lightly guided; deep/optional recipes can remain completely unmarked.

A recurring note/quest may explicitly direct the player to recover or organize missing recipes, consistent with Stack House’s running house-chore structure.

## Cooking minigame — LOCKED

Discovered recipes can actually be cooked in the Stack House kitchen.

Cooking should use the kitchen/pantry/stove/counter as a small interactive minigame rather than reducing the action to clicking “CRAFT.” Exact control design remains open, but the player should feel like they are preparing the recipe.

Successful dishes grant **temporary gameplay effects/buffs**. Different recipes can produce different effects, creating a reason to explore for recipes beyond lore/completion.

Potential buff categories remain implementation details until individually approved, but can include things such as movement, recovery, resistance, strength, focus, or other encounter-relevant effects.

Cooking becomes especially useful later in the game and in postgame replay/challenge modes.

Failure/comedy is welcome. Example tone:

> CULINARY STATUS: TECHNICALLY FOOD

Do not make failed cooking permanently punitive.

## Refrigerator — LOCKED SURFACE

The refrigerator is a dense personal/lore surface rather than a project screen.

It may hold:

- grocery lists,
- meal plans,
- magnets,
- coupons,
- photos,
- reminders,
- appointment cards,
- takeout menus,
- food/weight/fitness notes,
- household jokes,
- occasional gameplay clues.

It should feel accumulated and personal. Some fridge artifacts can change between Day/Night or carry clue significance, but most should simply make the house feel lived in.

## Restaurant concept — LOCKED DIRECTION

The restaurant idea should be represented through a kitchen-native display rather than another laptop. A believable wall-mounted smart kitchen display / restaurant order screen / KDS-style interface can expose:

- restaurant concept,
- menu ideas,
- branding,
- dish concepts,
- planning artifacts,
- status as an idea/concept rather than pretending it is an operating restaurant.

This display is separate from the physical cookbook: the cookbook is personal/home cooking in progress; the kitchen display represents the restaurant concept.

---

# Previously locked room display directions

These remain governed by the Experience Bible and should continue to differ from the two computer interfaces above:

- Living-room TV → video/YouTube/strange broadcasts.
- Basement game-room console + TV → playable game prototypes.
- Basement game-room posters → game concepts without playable builds.
- Grey Key Studios computer → GK Plugins + GK DAW/GK Studio.
- GK DAW/GK Studio → inspect/play Grey Key catalog sessions and later boss-music preparation.
- Kitchen → physical working cookbook + recipe collection/cooking minigame + fridge lore + restaurant kitchen display.
- Library/Study → ReLearn, Diaspora Atlas, research/education through a study/library context.
- Writing Room/Sunroom → blog, essays, books, drafts, manuscripts through the writing desk and surrounding artifacts.
- Master Bedroom → Grey Key merch integrated into wardrobe, dresser, bedding, walls, and room objects rather than a storefront.
- Attic/Archive → project archaeology: old machines, drives, folders, clippings, physical artifacts, abandoned/evolved ideas.

---

# OPEN

Still to design in detail:

- exact office desktop OS visual language,
- exact projects assigned to the living-room laptop versus office PC,
- which joke tabs/files are canonical,
- whether project folders expose simulated file trees, curated snapshots, or both,
- how much of the desktop remains functional in postgame free-roam,
- exact Day/Night browser/desktop state changes,
- exact kitchen cooking controls,
- final recipe list and placement,
- exact temporary effect assigned to each recipe,
- whether ingredients are fully collectible resources or abstracted at the point of cooking,
- exact restaurant-display interface.
