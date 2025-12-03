# JSDoc Notes for El Pollo Loco

## Purpose

This document summarizes how JSDoc-style documentation is used in the core
game code. It is mainly a reminder for future changes and for other
developers who read the code.

## Scope

The following files are currently covered by JSDoc comments or have been
cleaned up for documentation and structure:

- `js/class.models/character-movement.class.js`
- `js/class.models/character-state.class.js`
- `js/class.models/character.class.js`
- `js/class.models/world.class.js`
- `js/responsive.js`
- `js/touch-controls.js`
- `js/ui-frame.js`
- `tools/scan-repo.js`
- `tools/file-inventory.js`

Other classes should follow the same style when they are touched in the
future.

## JSDoc style and conventions

- Top-level summary comment above each class:
  - Describe what the class is responsible for.
  - Mention important game concepts (world, keyboard, audio, overlays, etc.).
- Methods and functions:
  - Use `@param` and `@returns` (or `@returns {void}`) where it helps
    understanding.
  - Keep descriptions short and action-oriented, e.g. "Starts movement loop
    at 60 FPS".
  - Only document parameters that are actually used.
- Types:
  - Use simple types: `number`, `boolean`, `string`, `object`, or specific
    class names like `World`.
  - Optional parameters use `[name]` syntax (e.g. `@param {number} [amount=5]`).
- Behaviour:
  - Documentation must not change behaviour.
  - Comments explain *why* the code exists or *how* it is supposed to be used,
    not every single line.
- Language:
  - All comments and JSDoc are written in English so the code base stays
    consistent and accessible.

## File size and structure (≈400 LOC rule)

In addition to JSDoc, the project follows a simple structural guideline:

- No file should grow far beyond **~400 lines of code**, unless there is a
  strong reason and the responsibility is still clearly focused.
- When a file approaches 400+ lines and starts mixing different concerns
  (input handling, physics, state management, UI hooks, audio, etc.), it
  should be refactored into smaller, focused modules.
- The preferred approach is:
  - one class / file per main responsibility,
  - plus thin “composition” or “configuration” classes that wire things
    together.

The **character refactor** is the main example of this rule: the original
`character.class.js` was a ~700 line file that did everything at once.
It has now been split into three layers with clear, separate roles:

- `CharacterMovement` (`character-movement.class.js`):
  - base physics, movement and camera behaviour,
  - 60 FPS movement loop and 20 FPS animation trigger,
  - no knowledge about idle/sleep, damage or sprite sets.
- `CharacterState` (`character-state.class.js`):
  - idle / sleep state machine and audio hooks (snore, wake-up),
  - invulnerability and damage / hit handling,
  - state-driven animation selection (dead, hurt, idle, walking, jump).
- `Character` (`character.class.js`):
  - Pepe-specific sprite lists (IMAGES_*),
  - concrete audio instances for snore and wake-up,
  - small constructor that wires everything together.

This keeps each file well below the 400 line limit and makes the code easier
to understand, test and extend in the future.

## Character classes as main example

The character implementation is the primary reference for the current JSDoc
style and for the 400-LOC structural rule.

### CharacterMovement (`character-movement.class.js`)

- Class-level JSDoc explains that this class is responsible for:
  - base physics and gravity,
  - horizontal movement and level bounds,
  - jump handling,
  - camera tracking,
  - starting the core movement and animation loops.
- Movement-related methods (e.g. `handleHorizontalMovement`,
  `handleRightMovement`, `handleLeftMovement`, `handleJumpInput`) are small
  and focused. Each method name reads like a sentence and the JSDoc comments
  describe the behaviour in one line.
- The animation timer (`startAnimationLoop`) does not decide *what* to draw.
  It only calls into higher-level animation logic (implemented in
  `CharacterState`) when available. This keeps responsibilities separated.

### CharacterState (`character-state.class.js`)

- Extends `CharacterMovement` with:
  - idle / snore state based on inactivity time,
  - audio hooks (`stopSnore`, `onWakeFromSnore`),
  - game state awareness (`handlePausedState`, `handleGameOverState`,
    `handleGameWonState`),
  - damage and invulnerability handling (`hit`, `makeInvulnerable`, helper
    methods for resolving and applying damage).
- State-related methods (`shouldSkipStateAnimation`, `handleHighPriorityStates`,
  `handleIdleAnimations`, `handleWalkingAnimation`) decide which animation
  to play but do not know about concrete sprite paths. The sprite arrays are
  provided by the concrete `Character` class.
- The `hit()` method documents how:
  - damage is normalised,
  - energy is clamped to the `[0, 100]` range,
  - the classic hurt state (`lastHit`) is kept in sync,
  - the main status bar is updated,
  - the game over flow is triggered via `world.onPlayerDeath()`.

### Character (`character.class.js`)

- Extends `CharacterState` and only provides:
  - concrete IMAGES_* sprite arrays for idle, long idle, walking, jumping,
    hurt and dead states,
  - the audio instances (`snoreAudio`, `wakeAudio`),
  - a small constructor that:
    - loads a default sprite,
    - preloads all images via `initAnimations()`,
    - configures audio via `initAudio()`.
- The class-level JSDoc explains that this is the main player character
  (Pepe) and clarifies that movement/state logic lives in the base classes.

When in doubt, other classes should follow the same pattern:
small, focused responsibilities and short, well-named methods with
JSDoc blocks where they actually add value.

## How to extend the documentation

When you add new features or refactor existing code:

1. Add or update a short class-level JSDoc block describing the responsibility
   of the class.
2. For non-trivial methods, add a JSDoc block with:
   - one summary sentence,
   - `@param` tags for important parameters,
   - `@returns` (especially for booleans or helper functions that can
     early-exit).
3. Keep comments in English and in the same tone as this document.
4. If a file grows towards ~400 lines and mixes multiple concerns, consider
   splitting it into separate classes / files and documenting the new
   structure in this document.

Small helper functions that are obvious from their name can stay without JSDoc,
to keep the code readable.
