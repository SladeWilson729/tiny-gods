using ChronoTitans.Core;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace ChronoTitans.Managers
{
    public class NavigationManager : MonoBehaviour
    {
        public void GoTo(GameScene scene)
        {
            SceneManager.LoadScene(scene.ToString());
        }
    }
}
