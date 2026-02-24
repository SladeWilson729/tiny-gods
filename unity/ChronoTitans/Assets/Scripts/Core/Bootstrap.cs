using ChronoTitans.Managers;
using ChronoTitans.Services;
using UnityEngine;

namespace ChronoTitans.Core
{
    public class Bootstrap : MonoBehaviour
    {
        [SerializeField] private string apiBaseUrl = "https://your-base44-host";
        [SerializeField] private string authToken = "replace-at-runtime";
        [SerializeField] private AuthManager authManager;
        [SerializeField] private RunManager runManager;

        private async void Start()
        {
            var api = new Base44ApiClient(apiBaseUrl, authToken);
            authManager.Configure(api);
            runManager.Configure(api);

            var ok = await authManager.BootstrapAsync();
            Debug.Log(ok ? "Chrono Titans bootstrap complete." : "Chrono Titans bootstrap failed.");
        }
    }
}
