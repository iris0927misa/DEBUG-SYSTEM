# DEBUG: SYSTEM RESTORE

## Project Overview

This is a browser-based 2D action runner game for a school club exhibition.

The game is designed to be playable on both desktop browsers and tablet/mobile touch screens.

The game's theme is debugging a corrupted digital system.

The player controls a Debug Agent moving through a continuously scrolling digital environment.

---

## Core Game Concept

The game has two major phases:

1. RUN MODE
2. BOSS MODE

The current development target is only RUN MODE prototype v0.1.

Do NOT implement the Boss system, skills, complex artwork, or audio yet unless explicitly requested.

---

## RUN MODE

The game is an auto-scrolling runner.

The player does not manually control horizontal movement.

The environment and objects move from right to left, creating the feeling that the player is moving forward.

The player has two primary vertical positions:

- upper position
- lower position

The player switches between these positions by tapping/clicking the game screen.

Keyboard Space should also switch the player's vertical position for desktop testing.

---

## IMPORTANT: NO TRACK LINES

The game must NOT visually contain:

- a horizontal line separating upper and lower areas
- two visible lanes
- railway-like tracks
- obvious Muse Dash-style lanes
- a fixed central divider

The upper and lower positions exist only as gameplay positions.

Visually, the entire playfield should be one continuous environment.

The player should feel like they are moving vertically through a digital space rather than switching between two visible tracks.

The transition between upper and lower positions should feel smooth and responsive.

---

## Player

The player should initially use a simple placeholder shape.

Do not spend time creating detailed character art.

The player should:

- remain near the left side of the screen
- switch between upper and lower positions
- have a simple movement animation or visual feedback
- support mouse/touch input
- support Space key for desktop testing

---

## ERROR

ERROR is the primary obstacle.

ERROR objects appear from the right side of the screen and move toward the player.

If the player collides with an ERROR:

- lose 1 HP
- provide visual feedback
- remove or destroy the ERROR

The player starts with:

3 HP

Display:

❤️❤️❤️

Do not implement instant death from one collision.

The player should only lose after three successful ERROR collisions.

---

## DATA

DATA is a collectible object.

When the player touches DATA:

- increase score
- increase the future skill resource
- remove the DATA object
- provide visual feedback

For the prototype, the skill resource can simply be represented as a DATA counter.

Do NOT create a separate ENERGY resource.

---

## Score

Display the score clearly.

Example:

SCORE: 0000

Collecting DATA increases the score.

The exact scoring balance can be adjusted later.

---

## Prototype UI

The screen should contain:

- SCORE
- DATA amount
- HP
- game area

Keep the UI simple and clean.

Do not create a complicated menu system yet.

---

## Responsive Design

The game must work on:

- desktop browsers
- tablet browsers
- mobile browsers

Use responsive canvas sizing or an equivalent responsive game rendering system.

Touch input is important.

A tap anywhere on the main game area should switch the player between the upper and lower gameplay positions.

Do not require small buttons for the core movement action.

---

## Technology

Use:

- HTML
- CSS
- JavaScript
- HTML5 Canvas

Do not use a large game engine.

Keep the project lightweight and suitable for deployment through GitHub Pages.

Avoid external dependencies unless they are genuinely necessary.

---

## Code Structure

Keep the architecture modular enough for future expansion.

At minimum separate responsibilities conceptually into:

- game state
- player
- obstacles
- collectibles
- collision detection
- rendering
- input
- score
- health

Do not create unnecessary complexity for the prototype.

---

## Future Features

The final game will eventually include:

### S1 — ERROR CONVERT

In RUN MODE:

Convert all ERROR objects currently visible on screen into DATA.

### S2 — OVERDRIVE

Temporarily enter an invincible dash state.

ERROR objects touched during the dash are converted into DATA.

### BOSS MODE

After reaching a required score, enter a Boss battle.

The Boss fires ERROR projectiles.

The player does NOT automatically fire projectiles.

The player can attack only by using skills.

### Boss S1

Convert all visible ERROR projectiles into attack programs that damage the Boss.

### Boss S2

Enter an invincible state.

ERROR projectiles touched during the skill are converted into attack programs that damage the Boss.

### Boss S3

Fire a direct debugging program beam at the Boss.

These systems are future features and should NOT be implemented in v0.1 unless explicitly requested.

---

## Visual Direction

The visual style should communicate:

- digital system
- debugging
- corrupted data
- futuristic interface
- clean readable gameplay

Use placeholder geometric graphics during prototyping.

Do not imitate copyrighted characters, artwork, or assets from other games.

The game may take inspiration from the general concept of a fast action runner with vertical position switching, but its visual identity and mechanics should be original.

---

## Development Rules

Prioritize:

1. Playability
2. Responsive controls
3. Collision reliability
4. Tablet compatibility
5. Clear feedback
6. Simple maintainable code

Do not over-engineer the prototype.

Do not rewrite unrelated files when implementing a small feature.

Do not add large libraries without asking.

Before making major architectural changes, explain why they are needed.

---

## Current Goal

Build RUN MODE prototype v0.1.

Required:

- responsive game canvas
- player
- upper/lower vertical positions
- tap/click switching
- Space key switching
- automatic scrolling
- ERROR obstacles
- DATA collectibles
- collision detection
- 3 HP
- score
- DATA counter
- Game Over
- restart functionality

Do NOT implement Boss Mode or S1/S2/S3 yet.