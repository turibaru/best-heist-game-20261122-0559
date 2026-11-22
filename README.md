# FORTE — Steal the Music

**"Tonight, the loudest thing in the opera house is silence."**

A top-down stealth heist game. Hush Marlowe, a fired foley artist, sneaks
into the Teatro del Silenzio on the opening night of "The Nightingale Aria"
— not to steal jewels, but to steal **sound itself**. Every footstep, creak
and alarm gets sucked into his Mute Bag, leaving impossible silence behind.

Cross the foyer, the stage and the under-stage vault across 3 acts, slip
between the vision cones of 9 ushers, 6 sweeping dome cameras and the Diva
herself, and steal 8 named sound-artifacts — including the Conductor's
Diamond Tuning Fork — before the curtain falls.

## How to play

- **WASD / Arrow keys** — move
- **Shift (hold)** — run (faster, louder: raises the alarm unless you swallow sound)
- **Space (hold)** — swallow sound into the Mute Bag (silences your steps, drinks −15 alarm per slot)
- **Mouse click** — throw a stored sound at the clicked spot: guards turn to investigate, cameras are gagged for 8s
- **Q / right-click** — discard one stored sound
- **E** — pick up loot / open doors
- **C** — crouch / hide behind low props (harder to see)
- **P / Esc** — pause · **R** — restart act · **M** — mute audio

## The alarm (VU meter, top right)

Green 0–39 *Pianissimo*, yellow 40–69 *Mezzo-Forte*, red 70–99
*Fortissimo*, 100 = **CURTAIN CALL** (caught). Being seen by a guard or a
camera raises it; standing still and unseen, hiding behind curtains, and
swallowing alarm into the Mute Bag lower it. Finishing an act drops it by 20.

## Win / lose

Win: steal the Diamond Tuning Fork **and** the Nightingale Aria Wax
Cylinder, then reach the emergency exit in the lobby before the curtain
falls (5 minutes per act). Steal all 8 artifacts for the best score and the
*Silent Virtuoso* rank. Lose: alarm hits 100, the act timer runs out, or
you are caught at arm's length three times.

## Run it

```
node serve.ts   # then open http://localhost:8080
```

No libraries, no network requests, no external assets — all art is drawn
on canvas and all sound is synthesized with WebAudio. `node main.ts`
copies `game/` + `screenshots/` to `/output` and writes `dossier.json`
(make.fun bounty entry: "Make the best heist game").
