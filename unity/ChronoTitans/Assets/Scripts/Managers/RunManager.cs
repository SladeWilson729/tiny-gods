using System.Threading.Tasks;
using ChronoTitans.Core;
using ChronoTitans.Models;
using ChronoTitans.Services;
using UnityEngine;

namespace ChronoTitans.Managers
{
    public class RunManager : MonoBehaviour
    {
        public GameRun ActiveRun { get; private set; }
        private IApiClient _apiClient;

        public void Configure(IApiClient apiClient)
        {
            _apiClient = apiClient;
        }

        public async Task<GameRun> StartRunAsync(string godId, bool isWildMode, bool isCustomDeckMode)
        {
            ActiveRun = await _apiClient.CreateRunAsync(godId, isWildMode, isCustomDeckMode);
            return ActiveRun;
        }

        public async Task<GameRun> LoadRunAsync(string runId)
        {
            ActiveRun = await _apiClient.GetRunAsync(runId);
            return ActiveRun;
        }

        public async Task CompleteBattleAsync(bool wonBattle)
        {
            if (ActiveRun == null) return;

            if (wonBattle)
            {
                ActiveRun.Victories += 1;
                ActiveRun.Status = ActiveRun.Victories >= (ActiveRun.IsCustomDeckMode ? 20 : 10)
                    ? RunStatus.Victory
                    : RunStatus.InProgress;
            }
            else
            {
                ActiveRun.Status = RunStatus.Defeat;
            }

            ActiveRun = await _apiClient.UpdateRunAsync(ActiveRun);
        }
    }
}
