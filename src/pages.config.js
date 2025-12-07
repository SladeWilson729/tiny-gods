import Home from './pages/Home';
import GodSelection from './pages/GodSelection';
import Combat from './pages/Combat';
import Defeat from './pages/Defeat';
import RunProgression from './pages/RunProgression';
import Leaderboard from './pages/Leaderboard';
import BugReports from './pages/BugReports';
import AdminPanel from './pages/AdminPanel';
import AudioUpload from './pages/AudioUpload';
import Victory from './pages/Victory';
import Store from './pages/Store';
import Achievements from './pages/Achievements';
import HallOfEchoes from './pages/HallOfEchoes';
import RewardsShop from './pages/RewardsShop';
import Profile from './pages/Profile';
import Quests from './pages/Quests';
import PantheonHall from './pages/PantheonHall';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "GodSelection": GodSelection,
    "Combat": Combat,
    "Defeat": Defeat,
    "RunProgression": RunProgression,
    "Leaderboard": Leaderboard,
    "BugReports": BugReports,
    "AdminPanel": AdminPanel,
    "AudioUpload": AudioUpload,
    "Victory": Victory,
    "Store": Store,
    "Achievements": Achievements,
    "HallOfEchoes": HallOfEchoes,
    "RewardsShop": RewardsShop,
    "Profile": Profile,
    "Quests": Quests,
    "PantheonHall": PantheonHall,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};