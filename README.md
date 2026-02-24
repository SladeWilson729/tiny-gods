# Chrono Titans (Unity Ingest Build)

This repository now includes a Unity-ingestible game package named **Chrono Titans** that preserves the same high-level feature set as the existing web game:

- Authentication + profile progression
- God/hero selection and run creation
- Run progression map and combat loop
- Victory/defeat flows
- Achievements, quests, leaderboard, and hall/lore progression
- Store, rewards shop, and cosmetic unlock handling
- Bug reports and admin tools support
- Audio upload integration points

## Unity package location

- `unity/ChronoTitans/`

## What is included

- Data models that mirror web entities (`User`, `GameRun`, gods, cards, relics, quests, etc.)
- Service layer contracts and a `Base44ApiClient` for backend parity
- Runtime managers for auth, navigation, run lifecycle, and combat actions
- Scene/page mapping document that tracks one-to-one functionality from the current game
- Starter balance/content JSON in `Assets/StreamingAssets/seed_content.json`

## Next step in Unity

1. Create/open a Unity project (2022.3+ LTS recommended).
2. Copy the contents of `unity/ChronoTitans/Assets/` into your Unity project's `Assets/` folder.
3. Create scenes matching the `GameScene` enum and wire scene controllers to the managers.
4. Assign API base URL and auth token flow in `Base44ApiClient`.
5. Iterate combat visuals and VFX while keeping the included game-state contracts.
