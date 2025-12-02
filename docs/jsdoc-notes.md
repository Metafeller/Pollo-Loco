# JSDoc Notes for El Pollo Loco

## Purpose

This document summarizes how JSDoc-style documentation is used in the core
game code. It is mainly a reminder for future changes and for other
developers who read the code.

## Scope

The following files are currently covered by JSDoc comments or have been
cleaned up for documentation:

- `js/class.models/character.class.js` (main reference example)
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

## Character class as main example

`js/class.models/character.class.js` is the primary reference for the current
JSDoc style:

- The class-level comment explains that this is the main player character
  (Pepe) and lists the key responsibilities (movement, idle/sleep, jump,
  damage, invulnerability).
- Movement and animation are split into clear helper methods, each documented
  with a short summary.
- Game state handlers (`handlePauseAndEndStates`, `handleGameOverState`,
  `handleGameWonState`) describe when the character logic should early-exit.
- Idle / snore logic (`updateIdleState`, `enterIdle`, `enterSnore`,
  `onWakeFromSnore`) is separated from movement and documented as its own flow.
- The damage method `hit()` documents how HP is clamped and how the world is
  notified via `world.onPlayerDeath()`.

When in doubt, new classes and methods should be documented in a similar way.

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

Small helper functions that are obvious from their name can stay without JSDoc,
to keep the code readable.
