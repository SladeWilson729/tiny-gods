using System.Collections.Generic;
using System.Threading.Tasks;
using ChronoTitans.Models;

namespace ChronoTitans.Services
{
    public interface IApiClient
    {
        Task<UserProfile> GetCurrentUserAsync();
        Task<GameRun> CreateRunAsync(string godId, bool isWildMode, bool isCustomDeckMode);
        Task<GameRun> GetRunAsync(string runId);
        Task<GameRun> UpdateRunAsync(GameRun run);
        Task<List<LeaderboardEntry>> GetLeaderboardAsync();
        Task<List<Quest>> GetQuestsAsync();
        Task<List<Achievement>> GetAchievementsAsync();
        Task SubmitBugReportAsync(BugReport report);
    }
}
