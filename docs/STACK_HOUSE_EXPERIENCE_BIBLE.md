# Stack House — Experience Bible

_Last updated: 2026-09-05_

This is the canonical creative source of truth for the **Stack House interactive portfolio/game**: spatial intent, room identities, story, lore, encounters, progression, and postgame.

Technical architecture and exact geometry remain grounded in `lib/interior-layout.ts` plus the architecture docs. If this document assigns a new room identity without changing geometry, preserve the geometry and implement the new identity unless a deliberate architectural change is required.

## Decision language

- **LOCKED** = approved direction. Do not replace it with a different concept without explicit user direction.
- **OPEN** = unresolved. Codex may prototype or propose, but should not silently canonize one answer.
- **IMPLEMENTATION DETAIL** = mechanics/visual specifics may change while preserving the locked intent.

---

# 1. What Stack House is — LOCKED

Stack House is simultaneously:

- a public portfolio,
- the user's first game,
- an autobiographical/environmental story,
- a ridiculous house-maintenance adventure,
- a place where projects are encountered through objects/interfaces that naturally belong in the rooms.

It should feel like a **real inhabited house first**, not a museum or dashboard divided into categories.

The recurring line is:

> **THIS ISN’T EVEN MY HOUSE.**

At first it is a joke: the visitor keeps fixing breakers, moving records, dealing with plumbing, debugging software, surviving monsters, and eventually fighting someone else’s bills.

Underneath the joke is the philosophy: build things that may help somebody else even when the builder is not the final beneficiary. The player spends the entire game maintaining a house that is not theirs; Stack House itself is built around projects intended to help other people learn, create, understand, or gain access.

Do not explain that philosophy in a speech. Let it emerge from clues, projects, failed attempts, reused ideas, and the player's actions.

Tone:

- clever + absurd + mechanically meaningful,
- horror can be legitimately scary,
- humor should be specific to Stack House rather than generic game jokes,
- fourth-wall humor is welcome,
- the real-house epilogue becomes quiet, safe, strange, and sincere.

---

# 2. Master arc — LOCKED

**Arrival → Day → Night → Final Boss → Secret Door → Secret Street → Real House → Eras → Diorama → Stack House → Dawn → Stay Awhile / Exit**

The thematic shape is:

**DAY → NIGHT → PAST → DAWN**

## Arrival

The story begins in **daytime**. The front door is locked. The outdoor terminal is the tutorial/first puzzle.

Opening sequence concept:

> HUMAN VERIFICATION REQUIRED  
> CAPTCHA  
> BOT-LIKE BEHAVIOR DETECTED  
> TOUCH GRASS

The player must literally touch/interact with the grass outside.

Possible response:

> HUMANITY: 37% CONFIRMED

This teaches the rules: read, explore, interact with mundane things, and expect stupid/literal environmental instructions to sometimes be genuine solutions.

## Day

Longest initial exploration phase. Player encounters portfolio work, terminals, rooms, music, walls/artifacts, household problems, and seemingly mundane chores.

Game quietly tracks preparation. Avoid HUD-heavy “SIDE QUEST +100 XP” language.

Signature example: a note says records need to be staged outside before dawn for an out-of-town show. If the player moves the crate, later world state knows `records_staged = true`.

## Night

At a significant checkpoint/milestone the house transitions to **Night**. The current dark Stack House aesthetic becomes narratively justified.

Night changes more than lighting: doors, terminals, music, objects, power, hazards, enemies, and room states may differ.

## Final boss → secret route

The final major danger is **FINAL NOTICE**. Defeating it unlocks the secret passage.

From the secret room / secret street onward there are **no enemies and no combat**.

## Dawn

After the real-house eras and miniature-Stack-House sequence, the player returns outside at dawn.

The original front terminal now reads approximately:

> STACK HOUSE  
> STATUS: COMPLETE  
> > EXIT  
> > STAY A WHILE

- **EXIT** = credits/end.
- **STAY A WHILE** = permanent free-roam/postgame portfolio mode.

---

# 3. Locked architectural / spatial intent

These are not merely content tags. They describe how the relevant spaces should read and what their architectural/furnishing identity is.

The current plan is four interior levels: **basement, ground, second, attic**. `PLAN_SCALE = 1.0` remains the technical source of truth unless deliberately changed for a new architectural reason.

## Second floor room re-identifications — LOCKED

### `gallery`: Gallery / Library → **Library / Study**

This is the education/research/knowledge room.

Primary content:

- ReLearn,
- Diaspora Atlas,
- Citizen Science where appropriate,
- educational/research projects,
- books and knowledge artifacts.

It should read as a real library/study, not as a generic project gallery.

### `nook`: Nook / Flex Space → **Writing Room / Sunroom**

The previous “Lab” idea is rejected.

This room should be spatially designed around **writing + the view**:

- large/important windows,
- strong skyline/sky view,
- plants,
- writing desk oriented toward the view where feasible,
- comfortable chair,
- possible window seat,
- manuscripts/notebooks,
- simple laptop/typewriter rather than another multi-monitor developer station.

Day should be bright/calm; Night should frame Minneapolis lights/reflections and possibly weather ambience.

Primary content:

- blog,
- essays,
- book concepts,
- manuscripts,
- research writing,
- unfinished writing ideas.

This room may include a simple “sit and look out the window” interaction with no puzzle requirement.

### `guest-room`: Guest Room → **Master Bedroom / Grey Key Merch**

The house otherwise had no bedroom, so this is not a guest room. It is the actual master bedroom.

Merch should be integrated as bedroom objects rather than presented as a storefront:

- shirts/hoodies in wardrobe,
- hat on dresser,
- branded blanket/comforter,
- framed prints/designs,
- bags/accessories naturally placed.

Interactions can reveal collections/designs/purchase info.

Optional polish: full-length mirror/mannequin for previewing selected merch.

## Secret route / second house — LOCKED

Basement secret door → secret room → secret street → **second house**.

The second house is based on the user's current real house and already has a Meshy model direction. It is not another portfolio showroom.

It begins abandoned/empty, then transforms through eras of the user's life. Furniture, technology, lighting, sound, and occupied rooms change by era while the house remains recognizable.

No enemies exist in this sequence.

## Normal rooms remain normal — LOCKED

Do not force a portfolio category into every room. Half bath, bathroom, mudroom, pantry, laundry, linen, storage, and circulation spaces can remain mundane and gain jokes, secrets, clues, and practical puzzle functions.

That normality is part of what makes Stack House feel like a house.

---

# 4. Full room program — LOCKED

## Basement

**Landing / Storage** — records, crates, equipment, inventory/history, preparation objects.

**Stair Hall** — traversal/environmental state.

**Mechanical** — power, breaker, water, furnace/HVAC, pressure/service infrastructure; major preparation/puzzle room.

**Grey Key Studios** — music, instruments, Grey Key catalog, GK Plugins, GK DAW/GK Studio, music interactions, boss-music system.

**Secret Room** — progression to secret street/real house; not portfolio display.

## Ground

**Half Bath** — real room, jokes/secrets/clues.

**Mudroom / Coats** — real transition/storage room.

**Kitchen / Dining** — cookbook, restaurant concept, recipes, food/meal ideas. Cookbook stays here rather than “Writing” because house organizes by context.

**Foyer / Stair Hall** — orientation, house state, environmental storytelling.

**Pantry** — real pantry + possible clues/supplies.

**Laundry** — real laundry + possible clues/jokes.

**Client Room / Living** — TV/video, weird broadcasts, client work laptop, normal living/client space. Laptop can double as terminal.

**Game Room / Lounge** — console/TV for game prototypes; posters/concept art for games that do not yet have playable builds.

## Second

**Library / Study** — ReLearn, Diaspora Atlas, research/education.

**Writing Room / Sunroom** — blog/books/essays/manuscripts + skyline view.

**Stair Landing / Hall** — traversal/state.

**Storage** — normal storage/clues.

**Linen** — normal linen closet.

**Home Office** — live websites/apps, software/dev work, code terminals, Bug encounter diagnosis.

**Bathroom** — normal bathroom + jokes/secrets/clues.

**Master Bedroom / Merch** — bedroom first; Grey Key merch integrated into wardrobe/bedding/walls/objects.

## Attic

**Archive** — project graveyard + archaeology:

- Trellis,
- AI orchestrator,
- abandoned prototypes,
- old drives/computers,
- burned CDs,
- old logos,
- diagrams,
- childhood objects,
- earlier forms of ideas that later evolved elsewhere.

Important: attic does not mean “failure.” It also holds ancestors of living projects.

---

# 5. Portfolio presentation rule — LOCKED

Projects should not all be displayed through the same card/browser UI.

Use interfaces that belong in the room:

- Office computers → websites/apps currently in development.
- Living-room TV → videos / YouTube / strange broadcasts.
- Client laptop → client work + terminal functionality.
- Game-room console/TV → playable game prototypes.
- Game posters → concepts with no prototype yet.
- Studio computer → GK Plugins + GK DAW/GK Studio.
- GK DAW → preloaded Grey Key catalog sessions the visitor can inspect/play.
- Kitchen object/appliance/TV → cookbook/restaurant/food work.
- Library → education/research.
- Writing-room desk → blog/books/essays.
- Bedroom wardrobe/walls → merch/design.
- Attic artifacts → abandoned/evolved projects.

Projects may cross categories. Example: ReLearn lives primarily in the Library, while a studio MIDI keyboard may launch a small ReLearn piano lesson.

Walls are a major surface: posters, artwork, photos, certificates, diagrams, album covers, fake ads, maps, flyers, blueprints, newspaper clippings. Some are decoration, some lore, some portfolio, some clues. The player should not immediately know which.

---

# 6. Clue / lore system — LOCKED

The house tells the story indirectly. Avoid exposition dumps.

A clue may:

- tell story,
- lead to another clue,
- be a riddle,
- progress a puzzle,
- contain part of an answer elsewhere,
- foreshadow a later event,
- reveal house state,
- exist only as lore.

Possible media:

- household notes,
- notebooks,
- newspaper/magazine clippings,
- printed messages/emails,
- receipts,
- terminal logs,
- old screenshots,
- labels,
- diagrams,
- photos,
- flyers,
- old folders/drives/builds.

Some clues must have **no gameplay payoff** so reading does not become synonymous with “this is definitely a puzzle item.”

Connections should often be inferred rather than explained.

Example: Bridge Academy artifacts in attic + ReLearn alive in Library. Never place a plaque that says “Bridge Academy became ReLearn.”

## Funny learning notes — LOCKED

Preserve real-time confusion, wrong first models, and weird analogies.

Examples of tone:

> Stack Overflow = Okayplayer for tech people?

> Hugging Face is like... Cloudflare? GitHub? App Store for AI shit? I don't know yet.

Later documents simply use the concepts correctly. Optional future annotation:

> This analogy is insane, but I still know exactly what I meant.

Other useful note patterns:

- “oh THAT’S what an API is,”
- “localhost is literally my computer??”,
- “WHY ISN’T IT UPDATING” → later “restart server dumbass,”
- “this should take two days” beside evidence it took months.

Do not rewrite the archive into polished founder mythology.

---

# 7. Personal/project history threads — LOCKED

## Music predates everything

Before code, AI-assisted building, and software projects, there was music.

Old childhood keyboards are continuity artifacts. Some physical objects seen in Stack House should reappear in the real-house eras with recognizable scratches/stickers/imperfections.

Examples:

- one old keyboard appears set up in the bedroom in a later childhood/teen era,
- the Muppet keyboard appears in an earlier era.

General rule: a handful of Stack House objects should later be revealed as real objects that survived earlier life periods.

## 2022: early ChatGPT / first plugin attempt

Personal AI starting point is **2022**, original ChatGPT/GPT-3.5 era.

The user was not yet routinely building software. Early use was primarily:

- songwriting help,
- ideas,
- conversation,
- learning what might be possible.

Origin chain:

1. wanted help writing songs,
2. wanted something like Scaler but better at actually helping compose,
3. composition-plugin idea,
4. suggestion that AI could power it,
5. “what the fuck do you mean?” / did not yet know what an API key was,
6. installed JUCE + CMake,
7. primitive project partially launched,
8. warning/problem appeared,
9. neither user nor AI could fully resolve it at the time,
10. user found Stack Overflow articles and learned what Stack Overflow was,
11. reached out to a software engineer for help and did not receive the help hoped for,
12. attempt stalled.

The key is not success. It provided enough proof that building software might actually be possible.

If the original plugin folder is recovered, preserve it as-is. It is an archaeological artifact / first brick.

## The idea era

Do not compress history into “first plugin → developer.”

There was a long period of ideas, songwriting help, banter, and “what if” concepts before real products started getting built.

## Builder-era threshold: personal website → SBM Inc.

The real build acceleration comes later:

- user had been laid off and out of work roughly 4–5 months,
- was taking the CCST Cybersecurity course,
- discovered v0,
- used v0 + ChatGPT + Cursor to revamp his own website,
- learned practical deployment/debugging lessons, often through tiny mistakes that consumed huge amounts of time.

Then the user saw a Discord post from someone looking for a web developer. Having only recently proven he could redo his own site, he offered to build the site for free. They paid anyway.

That project was **SBM Inc., a nonprofit in Florida**.

This is the threshold artifact:

- personal website proved “I can build something for myself,”
- SBM proved “I can build something someone else needs.”

The payment also mattered because of the unemployment period.

Visual history rule:

- Before SBM: lots of ideas and incomplete attempts.
- At SBM: threshold.
- After SBM: rapidly increasing density of repos, deployments, prototypes, failures, designs, and working projects.

## Bridge Academy → ReLearn

Bridge Academy was an earlier school/academy idea in the music/STEM/STEAM/education direction. At one point the user believed an app might be easier than opening a school; that assumption proved very wrong.

Represent Bridge Academy in the attic through artifacts such as:

- old newspaper clipping about trying to start the program,
- early logo,
- curriculum notes,
- possible grant/funding material,
- planning documents.

Then let the player encounter ReLearn alive in the Library and infer the lineage.

A separate learning-app idea for kids stalled; Python material was later incorporated into ReLearn so it would remain ready whether those specific kids ever returned or somebody else used it instead.

## Problems become projects

Recurring autobiographical pattern:

> problem → attempt → project/system

Examples:

- lifelong weight concerns + need to save money + need to cook at home → cookbook/meal ideas,
- disorganization + dislike of a recurring ~$35/month solution → “maybe I can build one,”
- unsatisfying learning tools → ReLearn,
- music tools that do not teach enough → GK Studio/learning-oriented music systems,
- frustration with Black-history misinformation → Diaspora Atlas,
- need somewhere to show all the work → Stack House.

Do not falsely turn every thread into “problem solved.” The honest form is often:

> “I had a problem. I tried something.”

Real household problems are also roots for gameplay:

- breaker/electrical problem,
- plumbing problem,
- money pressure,
- anxiety/overthinking/organization pressure.

---

# 8. AI progression timeline — LOCKED CONCEPT / FACTS MUST BE VERIFIED

News clippings throughout the house should document the evolution of AI from the user's **2022 original ChatGPT/GPT-3.5 era** through whatever the real state of AI is when Stack House is completed.

This creates a second timeline alongside the personal timeline:

1. what AI could do,
2. what the user knew how to do with it.

Early era:

- conversation,
- songwriting/writing help,
- explanations,
- code snippets,
- first plugin experiment.

Later eras:

- stronger coding/reasoning,
- multimodality,
- tool use,
- computer use,
- coding agents modifying repos,
- agents using files/tools/apps,
- multi-agent workflows,
- whatever is genuinely current at launch.

Final in-world articles should be **original fictionalized clippings based on real milestones**, not copied article screenshots. Verify dates/events at asset-authoring time.

The present-day real-house era should make the punchline environmental: the player sees the modern AI-assisted workflow that is literally being used to build Stack House.

---

# 9. Encounter/gameplay spine — LOCKED where specified

Stack House intentionally touches multiple genres: walking sim, environmental storytelling, puzzle/escape-room, liminal/backrooms horror, survival horror, stealth/chase, zombie arcade combat, house-defense/tower-defense-like systems, immersive-sim preparation/consequence, rhythm/music combat, debugging, mystery, autobiographical exploration, and postgame sandbox.

The house is the unifier: each genre is a different kind of problem happening to the same place.

## First zombie — LOCKED CONCEPT

A single zombie appears during Day and proves the player can die.

**Garden hose** is the preferred signature solution. The player can use the hose to knock/stagger/escape the zombie rather than introducing a normal videogame weapon.

The hose later returns during FINAL NOTICE.

## The Bug — LOCKED

The Bug is **not another chaser**. It corrupts the house itself.

The player urgently needs access to one or more rooms, but a software bug causes impossible behavior:

- stairs/doors warp player to wrong floor,
- a needed door zaps/throws the player back,
- hallway/room routing becomes wrong,
- labels may disagree with actual rooms,
- rooms can briefly load the wrong state,
- unrelated interactions can trigger wrong systems.

Throughout the incident a freaky glowing insect is visible **inside the computer/terminal UI**, crawling over text/windows/buttons and growing more prominent as corruption worsens.

The solution is not combat. Player learns a simplified debugging loop:

**reproduce → observe → isolate → patch**

The house can become violently glitchy during deployment, then reload normally after the patch.

Possible post-fix joke:

> 0 BUGS FOUND

then a tiny bug crosses the screen and disappears.

The debugging/admin knowledge can later help inspect/dispute a FINAL NOTICE subsystem/request.

## Night chaser — OPEN IDENTITY, LOCKED ROLE

There is a distinct Night chase/stealth threat. Its identity remains unresolved.

Previously brainstormed candidates, not canon:

- The Cursor,
- The Dummy/mannequin,
- The Placeholder/default unfinished humanoid asset,
- a Clippy-like aggressively cheerful assistant (not literal Microsoft IP).

Do not revive the generic “Observer” concept as if it were locked.

## Zombie horde / records — LOCKED

The early zombie returns with friends at Night.

If records were staged during Day, player opens/mounts the crate and throws spinning vinyl records in an intentionally overproduced arcade-like horde encounter.

If records were not prepared, the loading area is empty and the player must survive through a harder alternative/run/reset route.

This is the signature example of mundane preparation paying off later.

## FINAL NOTICE — LOCKED

Final boss name: **FINAL NOTICE**.

The boss is literally a giant stack/paper monstrosity of bills attacking Stack House itself.

Possible components:

- utilities,
- subscriptions,
- credit cards,
- insurance,
- server invoices,
- domain renewals,
- other recurring costs.

Boss health bar is:

> **AMOUNT DUE: $XX,XXX.XX**

not HP.

Successful actions pay the balance down.

FINAL NOTICE attacks house systems through service termination/nonpayment effects: lights, network, studio equipment, doors, etc.

At `$0.00`:

> PAID IN FULL

Then silence/printer noise and:

> ADDITIONAL CHARGES HAVE BEEN APPLIED  
> LATE FEE: $35.00

The final $35 phase should be absurdly furious/unreasonably difficult/funny.

End:

> BALANCE: $0.00  
> ACCOUNT CLOSED

This unlocks the secret passage.

### Hose callback — LOCKED

Records can shred/expose layers of FINAL NOTICE. The same garden hose used against the first zombie can then soak the exposed bills, making them heavy/sagging/papier-mâché-like and opening another damage/control state.

Water pressure can depend on earlier Mechanical-room preparation.

### Studio boss music — LOCKED

Player can choose their own boss music in Grey Key Studios before the final fight.

Different musical sections temporarily create different buffs. Exact mapping is implementation-tunable, but examples include:

- fast/double-time section → movement/recovery speed,
- large bass section/drop → strength/knockback/record or hose force,
- strings/choir/lush harmonic section → brief immunity/shield,
- large drums → stagger/interrupt,
- lead/solo → precision/weak-point help,
- breakdown → temporary vulnerable period,
- final drop/chorus → stacked cinematic window.

Preferred behavior: buffs occur naturally as the song arrangement changes rather than requiring the player to manually activate each one during combat.

The GK DAW may optionally let the visitor alter/add parts beforehand, causing corresponding buff windows later. If implemented, constrain this so the player cannot make one instrument sustain an infinite buff.

### Unprepared boss-music fallback — LOCKED

If the studio/boss track was not prepared, the player character supplies **boss music with their mouth**.

Example tone:

> BOSS MUSIC: UNAVAILABLE  
> VOCAL BACKUP MODE ENABLED

The character performs committed, terrible “duh dunna dun dun...” boss music. It can still grant a reduced/embarrassing version of the buff system.

Getting hit can interrupt the vocalization; low health can make it breathless/frantic.

This is intentionally stupid and should remain.

---

# 10. Preparation / consequence — LOCKED PRINCIPLE

Use major preparation payoffs sparingly (roughly 3–7 major systems; exact count remains tunable). The player should not feel like every spoon in the house is secretly mandatory.

Immediately before FINAL NOTICE, use a mundane physical checklist sheet as the point-of-no-return interface.

Example:

> BEFORE YOU LEAVE  
> ~~Power restored~~  
> ~~Studio monitors online~~  
> ????????  
> ~~Backup drive mounted~~  
> ????????  
> ~~Records loaded~~  
> 4 / 7  
> Continue?

Rules:

- completed prep is crossed out,
- encountered-but-incomplete prep may be named,
- never-discovered prep remains `????????`,
- player may proceed underprepared,
- every configuration should theoretically be beatable,
- difficulty comes from missing battlefield control/options rather than simple boss HP inflation.

Core final-boss idea:

> **STACK HOUSE ITSELF IS THE WEAPON.**

The player spends the game unknowingly bringing the house online. During the final fight, the player finally uses those systems together.

---

# 11. Real-house epilogue — LOCKED

After FINAL NOTICE, danger ends permanently.

The secret route reaches the user's real/current house. It first appears abandoned/empty. Clues trigger transitions through eras of the user living there.

Possible/known era imagery:

- younger version in a back room making music,
- later version making beats in dining room with progressively more gear,
- childhood keyboards appearing in their original contexts,
- late-high-school beats used as period-authentic source music.

Prefer the user's actual music from the relevant periods over newly composed nostalgic score where possible.

## Stack House formation — LOCKED

As the real-house eras progress, representations of Stack House gradually form:

- early crude drawing/poster,
- cardboard/model/diorama stages,
- later architectural/electronic miniature,
- present-day completed miniature.

It should feel handmade: mixed materials, LEDs, wires, tiny screens, pieces from different life periods.

Recognizable pieces correspond to things the player already encountered: rooms, studio, attic, basement, exterior, secret passage, etc.

At present day the miniature completes. Player interacts with it. It powers on in a sequence consistent with the actual architecture:

**basement → ground → second → attic → exterior → tiny terminal**

Camera moves into the miniature until it fills the screen, transitioning back outside the full-size Stack House at dawn.

Meaning: the impossible Stack House is the manifestation of everything accumulated across the user's life.

Do not explain this directly.

---

# 12. Postgame — LOCKED

Choosing **STAY A WHILE** unlocks permanent free-roam portfolio mode.

After beating the game, completed major minigames/encounters should be replayable from natural locations or a sensible postgame interface without replaying the entire story.

Examples:

- Studio → boss-music experimentation,
- basement/yard → record zombie horde,
- Office → Bug corruption/debug scenario,
- FINAL NOTICE arena → house-defense boss replay,
- terminals → hacking/logic/music minigames,
- Night chaser → possible challenge/stealth replay.

This preserves the inversion:

> **the first game is a portfolio; the portfolio is a game.**

---

# 13. Still open / do not silently canonize

The following remain unresolved unless later docs explicitly lock them:

- exact identity/visual design of the Night chaser,
- exact set/count of preparation systems beyond the already strong candidates (power, water, studio/audio, records, network, backup/storage, etc.),
- exact puzzle chain and critical path between entering Day and triggering Night,
- exact real-house era dates/ages,
- exact music-to-buff mapping/balance,
- exact checkpoint/death/save behavior,
- exact accessibility/recruiter bypass design,
- exact clue placement map,
- exact portfolio asset inventory per room,
- final credits presentation,
- optional Easter eggs/deep secrets.

---

# 14. Codex implementation guidance

Before implementing Stack House gameplay/content, read:

1. `docs/STACK_HOUSE_EXPERIENCE_BIBLE.md` — creative/spatial/game canon.
2. `lib/interior-layout.ts` — exact floor-plan source of truth.
3. `STATUS.md` — current technical state/work front.
4. relevant architecture docs under `docs/ARCHITECTURE_*.md`.

Do not treat the current lack of furniture/gameplay as evidence that a room has no approved purpose. This document records the intended purpose.

When implementing a locked concept, preserve its core joke/meaning even if technical details need to change.

When discovering a conflict between this bible and current code, do not silently overwrite either side: preserve the current stable architecture and surface the conflict in `STATUS.md` or the work report unless the resolution is obvious and non-destructive.