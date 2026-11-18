# Diomedes

A daily kettlebell app. **Move in silence.**

Diomedes carried the Greek army while Achilles sulked, wounded two gods, and sailed home without drama. Almost nobody remembers him. This app is for training the same way: consistent, disciplined, without an audience.

## What it does

- **Today:** a weekly rotation (Upper / Lower / Full / Mobility / Rest) picks the day's session. **Flex** switches today to a different focus without changing the rotation.
- **Generated sessions:** warm-up → EMOM strength → interval conditioning → AMRAP finisher → cool-down, sized to 20, 30 or 45 minutes. The same day always gives the same workout; **Reshuffle** gives a new one.
- **Session player:** countdown ring, movement video, next-up line, and 3-2-1 beeps, phase gong and haptics. A "switch sides" cue sounds halfway through single-arm intervals. The screen stays awake, and the timer stays correct if you lock the phone.
- **Catalog:** 39 kettlebell movements with cues, common mistakes, tags and a video slot for each.
- **Log:** a private streak (scheduled rest days don't break it), a month calendar, session history, and the last and best bell for each movement.
- **Settings:** rotation editor, session length, movement level cap, your bells (kg/lb), sound and haptics, a daily reminder showing the creed, and JSON export/import.
- **No account, no cloud, no feed.** Everything stays on the device.

## Run it

```bash
npm install
npm start          # scan the QR code with Expo Go on your phone
npm run web        # or run it in a browser
```

Checks:

```bash
npm test           # engine unit tests (rotation, generator, timer, streak)
npm run typecheck
npm run lint
```

## Adding movement videos

Every exercise shows a "Film coming" placeholder until it has a video.

1. Export the clip as `assets/videos/<exercise-id>.mp4`. The ids are in `src/data/exercises.ts`, e.g. `two-hand-swing`, `turkish-get-up`. Short, square-ish or 16:10 loops of 3–8 seconds with no audio work best.
2. Register it in `src/data/videos.ts`:

   ```ts
   'two-hand-swing': require('@/assets/videos/two-hand-swing.mp4'),
   ```

   For hosted files, use a URL instead: `'snatch': 'https://…/snatch.mp4'`.

The catalog header counts how many movements are filmed.

## Where things live

| Path | What |
| --- | --- |
| `src/app/` | Screens (Expo Router). `(tabs)/` holds Today, Catalog, Log and Settings; `session.tsx` is the player; `complete.tsx` is logging |
| `src/data/exercises.ts` | Exercise catalog — edit cues and add movements here |
| `src/data/creeds.ts` | Daily creed lines |
| `src/engine/` | Pure logic: rotation, workout generator, timer state machine, streak |
| `src/store/` | Persisted on-device state (zustand + AsyncStorage) |
| `src/theme.ts` | Palette (navy / steel blue / parchment) and fonts (Cinzel + Inter) |

## Shipping to the stores

Reminders and audio work in Expo Go. For TestFlight or Play Store builds, use EAS:

```bash
npx eas-cli@latest build --platform ios
```

Change `ios.bundleIdentifier` / `android.package` in `app.json` (currently `com.diomedes.app`) to an id you own first.
