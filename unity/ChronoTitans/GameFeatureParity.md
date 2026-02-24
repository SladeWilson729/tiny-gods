# Feature Parity Map: Web Game -> Chrono Titans (Unity)

| Current Page/Function | Unity Scene (`GameScene`) | Unity Owner | Notes |
|---|---|---|---|
| Home | Home | `NavigationManager` + `RunManager` | Start/resume run, quick links |
| GodSelection | GodSelection | `RunManager` | Select god + mode and create run |
| RunProgression | RunProgression | `RunManager` | Map nodes and battle entry |
| Combat | Combat | `CombatManager` | Turn loop, hand/deck/discard, statuses |
| Victory | Victory | `RunManager` | Rewards + post-battle progression |
| Defeat | Defeat | `RunManager` | Run fail and retry routing |
| PantheonHall | PantheonHall | `ProgressionManager` (future) | Lore by completed runs |
| HallOfEchoes | HallOfEchoes | `ProgressionManager` (future) | Legacy records/stat-history presentation |
| Achievements | Achievements | `ProgressionManager` (future) | Unlock checks + claims |
| Quests | Quests | `ProgressionManager` (future) | Daily/weekly progression |
| Leaderboard | Leaderboard | `SocialManager` (future) | Ranked entries |
| Profile | Profile | `AuthManager` | User data + cosmetics |
| Store | Store | `CommerceManager` (future) | Real-money package purchase entry |
| RewardsShop | RewardsShop | `CommerceManager` (future) | Soft-currency unlocks |
| AudioUpload | AudioUpload | `AudioManager` (future) | File upload endpoint |
| BugReports | BugReports | `SupportManager` (future) | Bug submission flow |
| AdminPanel | AdminPanel | `AdminManager` (future) | Restricted moderation/ops tools |

## Preserved Functional Contracts

- **Auth contract**: load current user, login/logout redirects, public setting preflight.
- **Run contract**: create run, update run status, track victories, mode flags, rank/modifiers.
- **Combat contract**: deterministic state transitions with card/relic/status effects and turn-end triggers.
- **Economy contract**: hard/soft currencies, cosmetics ownership, reward claims, purchase callbacks.
- **Meta contract**: achievements, quests, hall progression, leaderboards, and bug reports.

## New Theme

The game is re-themed as **Chrono Titans** (time-warrior mythology) while preserving the same system mechanics and backend responsibilities.
