import Achievements from './pages/Achievements';
import AdminPanel from './pages/AdminPanel';
import AudioUpload from './pages/AudioUpload';
import BugReports from './pages/BugReports';
import Combat from './pages/Combat';
import Defeat from './pages/Defeat';
import GodSelection from './pages/GodSelection';
import HallOfEchoes from './pages/HallOfEchoes';
import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import PantheonHall from './pages/PantheonHall';
import Profile from './pages/Profile';
import Quests from './pages/Quests';
import RewardsShop from './pages/RewardsShop';
import RunProgression from './pages/RunProgression';
import Store from './pages/Store';
import Victory from './pages/Victory';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Achievements": Achievements,
    "AdminPanel": AdminPanel,
    "AudioUpload": AudioUpload,
    "BugReports": BugReports,
    "Combat": Combat,
    "Defeat": Defeat,
    "GodSelection": GodSelection,
    "HallOfEchoes": HallOfEchoes,
    "Home": Home,
    "Leaderboard": Leaderboard,
    "PantheonHall": PantheonHall,
    "Profile": Profile,
    "Quests": Quests,
    "RewardsShop": RewardsShop,
    "RunProgression": RunProgression,
    "Store": Store,
    "Victory": Victory,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};