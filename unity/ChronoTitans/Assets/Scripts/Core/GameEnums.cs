namespace ChronoTitans.Core
{
    public enum GameScene
    {
        Home,
        GodSelection,
        RunProgression,
        Combat,
        Victory,
        Defeat,
        PantheonHall,
        HallOfEchoes,
        Achievements,
        Quests,
        Leaderboard,
        Profile,
        Store,
        RewardsShop,
        AudioUpload,
        BugReports,
        AdminPanel
    }

    public enum RunStatus
    {
        InProgress,
        Victory,
        Defeat,
        Abandoned
    }

    public enum CardType
    {
        Attack,
        Skill,
        Power,
        Ultimate
    }

    public enum TargetType
    {
        Self,
        Enemy,
        AllEnemies,
        RandomEnemy
    }
}
