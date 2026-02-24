using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using ChronoTitans.Models;
using UnityEngine;
using UnityEngine.Networking;

namespace ChronoTitans.Services
{
    public class Base44ApiClient : IApiClient
    {
        private readonly string _baseUrl;
        private readonly string _authToken;

        public Base44ApiClient(string baseUrl, string authToken)
        {
            _baseUrl = baseUrl.TrimEnd('/');
            _authToken = authToken;
        }

        public Task<UserProfile> GetCurrentUserAsync() =>
            SendJsonAsync<UserProfile>(UnityWebRequest.kHttpVerbGET, "/auth/me", null);

        public Task<GameRun> CreateRunAsync(string godId, bool isWildMode, bool isCustomDeckMode)
        {
            var payload = JsonUtility.ToJson(new RunCreateRequest
            {
                god_id = godId,
                is_wild_mode = isWildMode,
                is_custom_deck_mode = isCustomDeckMode
            });
            return SendJsonAsync<GameRun>(UnityWebRequest.kHttpVerbPOST, "/entities/GameRun", payload);
        }

        public Task<GameRun> GetRunAsync(string runId) =>
            SendJsonAsync<GameRun>(UnityWebRequest.kHttpVerbGET, $"/entities/GameRun/{runId}", null);

        public Task<GameRun> UpdateRunAsync(GameRun run)
        {
            var payload = JsonUtility.ToJson(run);
            return SendJsonAsync<GameRun>(UnityWebRequest.kHttpVerbPUT, $"/entities/GameRun/{run.Id}", payload);
        }

        public Task<List<LeaderboardEntry>> GetLeaderboardAsync() =>
            SendJsonAsync<List<LeaderboardEntry>>(UnityWebRequest.kHttpVerbGET, "/entities/Leaderboard", null);

        public Task<List<Quest>> GetQuestsAsync() =>
            SendJsonAsync<List<Quest>>(UnityWebRequest.kHttpVerbGET, "/entities/Quest", null);

        public Task<List<Achievement>> GetAchievementsAsync() =>
            SendJsonAsync<List<Achievement>>(UnityWebRequest.kHttpVerbGET, "/entities/Achievement", null);

        public Task SubmitBugReportAsync(BugReport report)
        {
            var payload = JsonUtility.ToJson(report);
            return SendJsonAsync<object>(UnityWebRequest.kHttpVerbPOST, "/entities/BugReport", payload);
        }

        private async Task<T> SendJsonAsync<T>(string method, string endpoint, string payload)
        {
            using var req = new UnityWebRequest(_baseUrl + endpoint, method);
            req.downloadHandler = new DownloadHandlerBuffer();
            req.SetRequestHeader("Authorization", $"Bearer {_authToken}");
            req.SetRequestHeader("Content-Type", "application/json");

            if (!string.IsNullOrWhiteSpace(payload))
            {
                req.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(payload));
            }

            var operation = req.SendWebRequest();
            while (!operation.isDone)
            {
                await Task.Yield();
            }

            if (req.result != UnityWebRequest.Result.Success)
            {
                throw new Exception($"API failure ({req.responseCode}): {req.error}");
            }

            if (typeof(T) == typeof(object) || string.IsNullOrWhiteSpace(req.downloadHandler.text))
            {
                return default;
            }

            return JsonUtility.FromJson<T>(req.downloadHandler.text);
        }

        [Serializable]
        private class RunCreateRequest
        {
            public string god_id;
            public bool is_wild_mode;
            public bool is_custom_deck_mode;
        }
    }
}
