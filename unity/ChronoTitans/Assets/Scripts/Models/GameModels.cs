using System;
using System.Collections.Generic;
using ChronoTitans.Core;

namespace ChronoTitans.Models
{
    [Serializable]
    public class UserProfile
    {
        public string Id;
        public string Username;
        public int SoftCurrency;
        public int HardCurrency;
        public Dictionary<string, int> GodRunsCompleted = new();
        public List<string> OwnedCosmetics = new();
        public List<string> UnlockedAchievements = new();
    }

    [Serializable]
    public class GodDefinition
    {
        public string Id;
        public string Name;
        public int BaseHealth;
        public int BaseEnergy;
        public string PassiveDescription;
        public List<string> StarterCardIds = new();
    }

    [Serializable]
    public class CardDefinition
    {
        public string Id;
        public string Name;
        public CardType Type;
        public TargetType Target;
        public int EnergyCost;
        public int Value;
        public string EffectText;
    }

    [Serializable]
    public class RelicDefinition
    {
        public string Id;
        public string Name;
        public string Description;
    }

    [Serializable]
    public class GameRun
    {
        public string Id;
        public string UserId;
        public string GodId;
        public RunStatus Status;
        public int Victories;
        public bool IsWildMode;
        public bool IsCustomDeckMode;
        public int DivineRank;
        public List<string> ActiveModifiers = new();
        public List<string> DeckCardIds = new();
        public List<string> RelicIds = new();
    }

    [Serializable]
    public class Quest
    {
        public string Id;
        public string Title;
        public int Progress;
        public int Goal;
        public bool Claimed;
    }

    [Serializable]
    public class Achievement
    {
        public string Id;
        public string Title;
        public string Description;
        public bool Unlocked;
    }

    [Serializable]
    public class LeaderboardEntry
    {
        public int Rank;
        public string Username;
        public int Score;
    }

    [Serializable]
    public class BugReport
    {
        public string Category;
        public string Description;
        public DateTime CreatedAtUtc;
    }
}
