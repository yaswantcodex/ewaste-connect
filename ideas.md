# E-Waste Connect — Design Direction

## Three possible directions

### Theme Name: Civic Repair Ledger
**Very Brief Intro:** An editorial, civic-minded interface inspired by municipal wayfinding, repair manuals, and printed dispatch sheets. It makes responsible disposal feel grounded, legible, and local rather than corporate or alarmist.
**Probability:** 0.07

### Theme Name: Bright Loop Commons
**Very Brief Intro:** A light, optimistic community board with cheerful color blocks, friendly illustrations, and a high-energy neighborhood feel. It would emphasize approachability and participation.
**Probability:** 0.04

### Theme Name: Night Shift Recycler
**Very Brief Intro:** A dark operations-console aesthetic for the people who move devices through the recovery network. High-contrast type, luminous status indicators, and tactical map cues would create a more technical tone.
**Probability:** 0.02

## Chosen approach: Civic Repair Ledger

### Design Movement
Swiss editorial design meets soft-industrial service design: disciplined information hierarchy, generous paper-like space, monospace utility labels, and humanist display typography.

### Core Principles
1. **Make the next responsible action obvious.** Every section should answer what the user can do now.
2. **Show the network, not a black box.** People, places, and handoffs are visible and named.
3. **Treat reuse as a civic ritual.** The language should feel warm, specific, and dignified.
4. **Use visual restraint to create trust.** Texture, lines, and signal color provide character without clutter.

### Color Philosophy
Warm recycled-paper ivory is the canvas; deep forest ink communicates stewardship and permanence; mineral grey supports metadata; and one ownable citrus color, **citrus signal #E7FF5A**, marks live actions and movement through the system. The palette should feel found in a well-used repair shop, not a generic tech dashboard.

### Layout Paradigm
An asymmetric editorial composition: a compact left rail for brand and orientation, a wide main canvas for the current task, and offset cards that resemble a physical work order. On mobile, the rail becomes a compact top band and the task remains first in the reading order.

### Signature Elements
- A vertical “dispatch” rail with numbered process markers.
- Thin ruled lines and bracketed metadata labels, like a repair ticket.
- Citrus signal tabs and oversized circular progress numerals.

### Interaction Philosophy
Interactions should feel like passing a device from one capable hand to another. Buttons confirm with a slight physical press; selecting a device changes the work-order details; accepting a nearby request advances the dispatch stage; the collection state celebrates completion without confetti or noise.

### Animation
Use short, tactile transitions under 240ms with cubic-bezier(0.23, 1, 0.32, 1). Stage changes slide the work-order detail upward by a few pixels and fade in; cards lift 2px on hover; the dispatch line draws from one marker to the next; success uses a single orbiting ring, not an explosion of particles. Respect prefers-reduced-motion.

### Typography System
Display: **DM Serif Display** for declarative headlines and editorial emphasis. Body: **Manrope** for clear, rounded reading. Utility: **IBM Plex Mono** for labels, coordinates, timestamps, and status. Headline hierarchy uses contrast between serif statements and mono action labels; avoid all-caps body copy.

### Brand Essence
**Positioning:** A neighborhood recovery network for people who want their old devices to keep doing useful work. **Personality:** practical, generous, quietly optimistic.

### Brand Voice
Headlines are direct, human, and slightly editorial. CTAs are verbs with a clear outcome; microcopy names what will happen next. Never use generic filler such as “Welcome to our website.”

Example lines:
- “Your drawer is full. The next useful life is closer than you think.”
- “Post the device. We’ll find the right hands for it.”

### Wordmark & Logo
A custom wordmark built from a compact serif “E” paired with a circular arrow glyph that wraps around a small circuit node. The mark should be recognizable without the name and work as a visible header symbol and favicon.

### Signature Brand Color
**Citrus Signal — #E7FF5A**, used sparingly for live actions, selected states, and the active handoff indicator.

## Implementation reminder
Ask of every choice: **Does this reinforce or dilute the Civic Repair Ledger philosophy?**

## Style Decisions

- Desktop orientation is governed by a visible vertical dispatch rail with numbered stage markers; the horizontal stage row is only a compact summary.
- Citrus Signal `#E7FF5A` is the only high-energy accent. It marks live actions, selected states, active handoff indicators, and key numerals; no coral/orange accent competes with it.
- The logo treatment is presented as a civic recovery stamp: the generated arrow/circuit mark sits inside a ruled seal frame and is always paired with the compact utility descriptor.
- Work-order material language carries through the dispatch, request, and footer surfaces via ruled divisions, bracketed metadata, and quiet paper cards.
