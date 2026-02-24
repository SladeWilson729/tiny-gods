using System.Threading.Tasks;
using ChronoTitans.Models;
using ChronoTitans.Services;
using UnityEngine;

namespace ChronoTitans.Managers
{
    public class AuthManager : MonoBehaviour
    {
        public UserProfile CurrentUser { get; private set; }
        public bool IsAuthenticated => CurrentUser != null;

        private IApiClient _apiClient;

        public void Configure(IApiClient apiClient)
        {
            _apiClient = apiClient;
        }

        public async Task<bool> BootstrapAsync()
        {
            if (_apiClient == null)
            {
                Debug.LogError("AuthManager requires Configure(apiClient) before bootstrap.");
                return false;
            }

            CurrentUser = await _apiClient.GetCurrentUserAsync();
            return CurrentUser != null;
        }
    }
}
