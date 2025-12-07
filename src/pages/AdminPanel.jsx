
import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2, Search, Edit, Save, X, Crown, Skull, Plus, Trash2, Award,
  Settings,
  ShieldPlus, Sparkles, UploadCloud, ShoppingCart, Target, BookOpen // Added BookOpen
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EnemyEncounterEditor from '../components/game/EnemyEncounterEditor';

// Fix import paths - they are in components/game, not components/admin
import GodEditorModal from '../components/game/GodEditorModal';
import EnemyEditorModal from '../components/game/EnemyEditorModal';
import EliteEnemyEditorModal from '../components/game/EliteEnemyEditorModal';
import BossEditorModal from '../components/game/BossEditorModal';
import TitleRewardEditorModal from '../components/admin/TitleRewardEditorModal'; // NEW IMPORT


export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isResettingLeaderboard, setIsResettingLeaderboard] = useState(false);
  // Removed: const [isUpdatingGodAbilities, setIsUpdatingGodAbilities] = useState(false);

  const [achievements, setAchievements] = useState([]);
  const [editingAchievement, setEditingAchievement] = useState(null);
  const [isLoadingAchievements, setIsLoadingAchievements] = useState(false);

  // Add state for cosmetics
  const [cosmetics, setCosmetics] = useState([]);
  const [editingCosmetic, setEditingCosmetic] = useState(null);
  const [isLoadingCosmetics, setIsLoadingCosmetics] = useState(false);
  const [uploadingCosmeticImage, setUploadingCosmeticImage] = useState(null); // Tracks which field is uploading
  const cosmeticFileInputRefs = useRef({}); // Ref for hidden file inputs


  // Add state for editor modals
  const [isGodEditorOpen, setIsGodEditorOpen] = useState(false);
  const [isEnemyEditorOpen, setIsEnemyEditorOpen] = useState(false);
  const [isEliteEnemyEditorOpen, setIsEliteEnemyEditorOpen] = useState(false);
  const [isBossEditorOpen, setIsBossEditorOpen] = useState(false);
  const [allGods, setAllGods] = useState([]); // State to hold gods for GodEditorModal
  const [isTitleEditorOpen, setIsTitleEditorOpen] = useState(false); // NEW STATE

  // Add state for store packages
  const [storePackages, setStorePackages] = useState([]);
  const [editingPackage, setEditingPackage] = useState(null);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);

  // Add state for quests
  const [quests, setQuests] = useState([]);
  const [editingQuest, setEditingQuest] = useState(null);
  const [isLoadingQuests, setIsLoadingQuests] = useState(false);

  const [pantheonLore, setPantheonLore] = useState([]);
  const [editingLore, setEditingLore] = useState(null);
  const [isLoadingLore, setIsLoadingLore] = useState(false);
  const [uploadingLoreImage, setUploadingLoreImage] = useState(false);
  const loreImageInputRef = useRef(null);

  useEffect(() => {
    checkAdminAndLoadUsers();
    loadAchievements(); // Load achievements on mount
    loadGods(); // Load gods on mount for the editor
    loadCosmetics(); // Load cosmetics
    loadStorePackages(); // Load store packages
    loadQuests(); // Add this
    loadPantheonLore(); // Add this
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(user =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const checkAdminAndLoadUsers = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.role !== 'admin') {
        window.location.href = '/';
        return;
      }
      setIsAdmin(true);
      await loadUsers();
    } catch (error) {
      console.error("Failed to check admin status:", error);
      window.location.href = '/';
    }
  };

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await base44.functions.invoke('adminUsers', {
        method: 'list'
      });
      setUsers(response.data.users);
      setFilteredUsers(response.data.users);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAchievements = async () => {
    setIsLoadingAchievements(true);
    try {
      const achievementsList = await base44.entities.Achievement.list('-created_date');
      setAchievements(achievementsList);
    } catch (error) {
      console.error("Failed to load achievements:", error);
    } finally {
      setIsLoadingAchievements(false);
    }
  };

  const loadGods = async () => {
    try {
      // Assuming 'God' entity exists and has a list method
      const godsList = await base44.entities.God.list();
      setAllGods(godsList);
    } catch (error) {
      console.error("Failed to load gods:", error);
      // Handle error, e.e., set an error state or show a message
    }
  };

  const loadCosmetics = async () => {
    setIsLoadingCosmetics(true);
    try {
      const cosmeticsList = await base44.entities.CosmeticReward.list('-created_date');
      setCosmetics(cosmeticsList);
    } catch (error) {
      console.error("Failed to load cosmetics:", error);
    } finally {
      setIsLoadingCosmetics(false);
    }
  };

  const loadStorePackages = async () => {
    setIsLoadingPackages(true);
    try {
      const packagesList = await base44.entities.StorePackage.list('display_order');
      setStorePackages(packagesList);
    } catch (error) {
      console.error("Failed to load store packages:", error);
    } finally {
      setIsLoadingPackages(false);
    }
  };

  const loadQuests = async () => {
    setIsLoadingQuests(true);
    try {
      const questsList = await base44.entities.Quest.list('-created_date');
      setQuests(questsList);
    } catch (error) {
      console.error("Failed to load quests:", error);
    } finally {
      setIsLoadingQuests(false);
    }
  };

  const loadPantheonLore = async () => {
    setIsLoadingLore(true);
    try {
      const loreList = await base44.entities.PantheonLore.list('god_name');
      setPantheonLore(loreList);
    } catch (error) {
      console.error("Failed to load pantheon lore:", error);
    } finally {
      setIsLoadingLore(false);
    }
  };

  const handleCreateAchievement = async () => {
    const newAchievement = {
      title: "New Achievement",
      description: "Complete a specific task",
      icon_name: "Trophy",
      reward_type: "none",
      reward_value: "",
      criteria_type: "win_run",
      criteria_target_id: "",
      criteria_value: 1,
      is_secret: false,
      category: "General"
    };

    try {
      await base44.entities.Achievement.create(newAchievement);
      await loadAchievements();
    } catch (error) {
      console.error("Failed to create achievement:", error);
      alert("Failed to create achievement. Check console for details.");
    }
  };

  const handleEditAchievement = (achievement) => {
    setEditingAchievement({
      ...achievement,
      editData: {
        title: achievement.title,
        description: achievement.description,
        icon_name: achievement.icon_name,
        reward_type: achievement.reward_type || "none",
        reward_value: achievement.reward_value || "",
        criteria_type: achievement.criteria_type,
        criteria_target_id: achievement.criteria_target_id || "",
        criteria_value: achievement.criteria_value,
        is_secret: achievement.is_secret || false,
        category: achievement.category || "General"
      }
    });
  };

  const handleSaveAchievement = async () => {
    try {
      await base44.entities.Achievement.update(editingAchievement.id, editingAchievement.editData);
      await loadAchievements();
      setEditingAchievement(null);
    } catch (error) {
      console.error("Failed to update achievement:", error);
      alert("Failed to update achievement. Check console for details.");
    }
  };

  const handleDeleteAchievement = async (achievementId) => {
    if (!confirm('Are you sure you want to delete this achievement?')) return;

    try {
      await base44.entities.Achievement.delete(achievementId);
      await loadAchievements();
    } catch (error) {
      console.error("Failed to delete achievement:", error);
      alert("Failed to delete achievement. Check console for details.");
    }
  };

  const handleCreateCosmetic = async () => {
    const newCosmetic = {
      name: "New Cosmetic",
      description: "Description here",
      category: "god_art",
      rarity: "common",
      currency_type: "favor_tokens",
      cost: 100,
      preview_image: "",
      asset_url: "",
      target_id: "",
      target_name: "",
      is_animated: false,
      is_available: true,
      unlock_requirement: "",
      display_order: cosmetics.length
    };

    try {
      await base44.entities.CosmeticReward.create(newCosmetic);
      await loadCosmetics();
    } catch (error) {
      console.error("Failed to create cosmetic:", error);
      alert("Failed to create cosmetic. Check console for details.");
    }
  };

  const handleEditCosmetic = (cosmetic) => {
    setEditingCosmetic({
      ...cosmetic,
      editData: { ...cosmetic }
    });
  };

  const handleSaveCosmetic = async () => {
    try {
      const { id, created_date, updated_date, created_by, ...updateData } = editingCosmetic.editData;
      await base44.entities.CosmeticReward.update(editingCosmetic.id, updateData);
      await loadCosmetics();
      setEditingCosmetic(null);
    } catch (error) {
      console.error("Failed to update cosmetic:", error);
      alert("Failed to update cosmetic. Check console for details.");
    }
  };

  const handleDeleteCosmetic = async (cosmeticId) => {
    if (!confirm('Are you sure you want to delete this cosmetic?')) return;

    try {
      await base44.entities.CosmeticReward.delete(cosmeticId);
      await loadCosmetics();
    } catch (error) {
      console.error("Failed to delete cosmetic:", error);
      alert("Failed to delete cosmetic. Check console for details.");
    }
  };

  const handleCreatePackage = async () => {
    const newPackage = {
      package_id: "new_package",
      name: "New Package",
      price: "9.99",
      favor_tokens: 1000,
      essence_crystals: 500,
      bonus_cosmetics: [],
      is_available: true,
      is_popular: false,
      gradient: "from-purple-600 to-pink-600",
      display_order: storePackages.length
    };

    try {
      await base44.entities.StorePackage.create(newPackage);
      await loadStorePackages();
    } catch (error) {
      console.error("Failed to create package:", error);
      alert("Failed to create package. Check console for details.");
    }
  };

  const handleEditPackage = (pkg) => {
    setEditingPackage({
      ...pkg,
      editData: { ...pkg }
    });
  };

  const handleSavePackage = async () => {
    try {
      const { id, created_date, updated_date, created_by, ...updateData } = editingPackage.editData;
      await base44.entities.StorePackage.update(editingPackage.id, updateData);
      await loadStorePackages();
      setEditingPackage(null);
    } catch (error) {
      console.error("Failed to update package:", error);
      alert("Failed to update package. Check console for details.");
    }
  };

  const handleDeletePackage = async (packageId) => {
    if (!confirm('Are you sure you want to delete this store package?')) return;

    try {
      await base44.entities.StorePackage.delete(packageId);
      await loadStorePackages();
    } catch (error) {
      console.error("Failed to delete package:", error);
      alert("Failed to delete package. Check console for details.");
    }
  };

  const handleCreateQuest = async () => {
    const newQuest = {
      title: "New Quest",
      description: "Complete a specific task",
      quest_type: "daily",
      objective_type: "win_runs",
      objective_target: "",
      objective_value: 1,
      reward_type: "favor_tokens",
      reward_favor: 50,
      reward_essence: 0,
      is_active: true,
      icon_name: "Target",
      difficulty: "medium",
      display_order: quests.length
    };

    try {
      await base44.entities.Quest.create(newQuest);
      await loadQuests();
    } catch (error) {
      console.error("Failed to create quest:", error);
      alert("Failed to create quest. Check console for details.");
    }
  };

  const handleEditQuest = (quest) => {
    setEditingQuest({
      ...quest,
      editData: { ...quest }
    });
  };

  const handleSaveQuest = async () => {
    try {
      const { id, created_date, updated_date, created_by, ...updateData } = editingQuest.editData;
      await base44.entities.Quest.update(editingQuest.id, updateData);
      await loadQuests();
      setEditingQuest(null);
    } catch (error) {
      console.error("Failed to update quest:", error);
      alert("Failed to update quest. Check console for details.");
    }
  };

  const handleDeleteQuest = async (questId) => {
    if (!confirm('Are you sure you want to delete this quest?')) return;

    try {
      await base44.entities.Quest.delete(questId);
      await loadQuests();
    } catch (error) {
      console.error("Failed to delete quest:", error);
      alert("Failed to delete quest. Check console for details.");
    }
  };

  const handleCreateLore = async () => {
    const newLore = {
      god_name: "Thor",
      card_number: 1,
      title: "New Lore Card",
      content: "Write the lore content here...",
      image_url: "",
      unlock_requirement: 1
    };

    try {
      await base44.entities.PantheonLore.create(newLore);
      await loadPantheonLore();
    } catch (error) {
      console.error("Failed to create lore:", error);
      alert("Failed to create lore. Check console for details.");
    }
  };

  const handleEditLore = (lore) => {
    setEditingLore({
      ...lore,
      editData: { ...lore }
    });
  };

  const handleSaveLore = async () => {
    try {
      const { id, created_date, updated_date, created_by, ...updateData } = editingLore.editData;
      await base44.entities.PantheonLore.update(editingLore.id, updateData);
      await loadPantheonLore();
      setEditingLore(null);
    } catch (error) {
      console.error("Failed to update lore:", error);
      alert("Failed to update lore. Check console for details.");
    }
  };

  const handleDeleteLore = async (loreId) => {
    if (!confirm('Are you sure you want to delete this lore card?')) return;

    try {
      await base44.entities.PantheonLore.delete(loreId);
      await loadPantheonLore();
    } catch (error) {
      console.error("Failed to delete lore:", error);
      alert("Failed to delete lore. Check console for details.");
    }
  };

  const handleUploadCosmeticImage = async (cosmeticId, fieldName, event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingCosmeticImage(`${cosmeticId}-${fieldName}`);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      setEditingCosmetic(prev => {
        if (!prev) return null;
        return {
          ...prev,
          editData: {
            ...prev.editData,
            [fieldName]: file_url
          }
        };
      });

      console.log(`Successfully uploaded ${fieldName}:`, file_url);
    } catch (error) {
      console.error(`Failed to upload ${fieldName}:`, error);
      alert(`Failed to upload ${fieldName}. Please try again.`);
    } finally {
      setUploadingCosmeticImage(null);
      event.target.value = '';
    }
  };

  const triggerCosmeticFileInput = (refKey) => {
    cosmeticFileInputRefs.current[refKey]?.click();
  };

  const handleUploadLoreImage = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingLoreImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      setEditingLore(prev => ({
        ...prev,
        editData: {
          ...prev.editData,
          image_url: file_url
        }
      }));

      console.log('Successfully uploaded lore image:', file_url);
    } catch (error) {
      console.error('Failed to upload lore image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingLoreImage(false);
      event.target.value = '';
    }
  };

  const handleEditUser = (user) => {
    setEditingUser({
      ...user,
      editData: {
        full_name: user.full_name || '',
        role: user.role || 'user',
        total_victories: user.total_victories || 0,
        total_completed_runs: user.total_completed_runs || 0,
        has_won_run: user.has_won_run || false,
        has_won_hard_mode: user.has_won_hard_mode || false,
        has_won_heroic_mode: user.has_won_heroic_mode || false,
        god_runs_completed: user.god_runs_completed && typeof user.god_runs_completed === 'object' && !Array.isArray(user.god_runs_completed) ? user.god_runs_completed : {},
        god_talents_tier1: user.god_talents_tier1 || {},
        god_talents_tier2: user.god_talents_tier2 || {},
        god_talents_tier3: user.god_talents_tier3 || {}
      }
    });
  };

  const handleSaveUser = async () => {
    try {
      await base44.functions.invoke('adminUsers', {
        method: 'update',
        body: {
          userId: editingUser.id,
          updates: editingUser.editData
        }
      });
      await loadUsers();
      setEditingUser(null);
    } catch (error) {
      console.error("Failed to update user:", error);
      alert("Failed to update user. Check console for details.");
    }
  };

  const handleResetAllProgress = async () => {
    const confirmed = window.confirm(
      '⚠️ WARNING: This will reset ALL player progress, delete ALL game runs, and clear the leaderboard.\n\nThis action CANNOT be undone!\n\nAre you absolutely sure you want to proceed?'
    );

    if (!confirmed) return;

    const doubleConfirm = window.confirm(
      'FINAL CONFIRMATION: Type "RESET" in the next prompt to confirm.'
    );

    if (!doubleConfirm) return;

    const typedConfirmation = prompt('Type RESET to confirm:');
    if (typedConfirmation !== 'RESET') {
      alert('Reset cancelled - confirmation text did not match.');
      return;
    }

    setIsResetting(true);
    try {
      const response = await base44.functions.invoke('resetAllProgress');
      console.log('Reset result:', response.data);
      alert(
        `✅ Progress Reset Complete!\n\n` +
        `Users Reset: ${response.data.summary.users_reset}\n` +
        `Runs Deleted: ${response.data.summary.runs_deleted}\n` +
        `Leaderboard Cleared: ${response.data.summary.leaderboard_entries_deleted}`
      );
      await loadUsers();
    } catch (error) {
      console.error("Failed to reset progress:", error);
      alert("Failed to reset progress. Check console for details.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetLeaderboard = async () => {
    const confirmed = window.confirm(
      '⚠️ WARNING: This will delete ALL leaderboard entries.\n\nYou can resync the leaderboard afterward using the "Sync All Users" button on the Leaderboard page.\n\nContinue?'
    );

    if (!confirmed) return;

    setIsResettingLeaderboard(true);
    try {
      const response = await base44.functions.invoke('resetLeaderboard');
      console.log('Reset leaderboard result:', response.data);
      alert(
        `✅ Leaderboard Reset Complete!\n\n` +
        `Leaderboard Entries Deleted: ${response.data.summary.leaderboard_entries_deleted}\n\n` +
        `Go to the Leaderboard page and click "Sync All Users" to rebuild it.`
      );
    } catch (error) {
      console.error("Failed to reset leaderboard:", error);
      alert("Failed to reset leaderboard. Check console for details.");
    } finally {
      setIsResettingLeaderboard(false);
    }
  };

  // Removed handleUpdateGodAbilities function as per instructions

  const updateGodRuns = (godName, count) => {
    const newGodRuns = { ...editingUser.editData.god_runs_completed };
    if (count <= 0) {
      delete newGodRuns[godName];
    } else {
      newGodRuns[godName] = count;
    }
    setEditingUser({
      ...editingUser,
      editData: { ...editingUser.editData, god_runs_completed: newGodRuns }
    });
  };

  const availableGods = ['Thor', 'Zeus', 'Athena', 'Anubis', 'Hades', 'Shiva', 'Ra', 'Quetzalcoatl', 'Loki', 'Cthulhu', 'Baron Samedi', 'Odin'];


  if (!isAdmin) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Loader2 className="w-16 h-16 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-gray-400">Manage game content and settings</p>
        </motion.div>

        {/* Add editor modals */}
        <GodEditorModal
          open={isGodEditorOpen}
          onClose={() => setIsGodEditorOpen(false)}
          gods={allGods} // Pass the loaded gods
          onUpdate={loadGods} // Pass the function to reload gods after update
        />
        <EnemyEditorModal
          open={isEnemyEditorOpen}
          onClose={() => setIsEnemyEditorOpen(false)}
          onUpdate={() => { }} // Placeholder, implement actual update logic if needed
        />
        <EliteEnemyEditorModal
          open={isEliteEnemyEditorOpen}
          onClose={() => setIsEliteEnemyEditorOpen(false)}
          onUpdate={() => { }} // Placeholder
        />
        <BossEditorModal
          open={isBossEditorOpen}
          onClose={() => setIsBossEditorOpen(false)}
          onUpdate={() => { }} // Placeholder
        />
        <TitleRewardEditorModal // NEW MODAL
          open={isTitleEditorOpen}
          onClose={() => setIsTitleEditorOpen(false)}
        />

        <Tabs defaultValue="content" className="space-y-6"> {/* Changed default value to 'content' */}
          <TabsList className="bg-black/40 border border-purple-700">
            <TabsTrigger value="content" className="data-[state=active]:bg-purple-600">
              <Settings className="w-4 h-4 mr-2" />
              Content Editors
            </TabsTrigger>
            <TabsTrigger value="encounters" className="data-[state=active]:bg-purple-600">
              Enemy Encounters
            </TabsTrigger>
            <TabsTrigger value="achievements" className="data-[state=active]:bg-purple-600">
              <Award className="w-4 h-4 mr-2" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="cosmetics" className="data-[state=active]:bg-purple-600">
              <Sparkles className="w-4 h-4 mr-2" />
              Cosmetics Shop
            </TabsTrigger>
            <TabsTrigger value="store" className="data-[state=active]:bg-purple-600">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Cash Store
            </TabsTrigger>
            <TabsTrigger value="quests" className="data-[state=active]:bg-purple-600">
              <Target className="w-4 h-4 mr-2" />
              Quests
            </TabsTrigger>
            <TabsTrigger value="lore" className="data-[state=active]:bg-purple-600">
              <BookOpen className="w-4 h-4 mr-2" />
              Pantheon Lore
            </TabsTrigger>
            <TabsTrigger value="bugs" className="data-[state=active]:bg-purple-600">
              Bug Reports
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-purple-600">
              User Management
            </TabsTrigger>
            <TabsTrigger value="danger" className="data-[state=active]:bg-red-600">
              Danger Zone
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content">
            <Card className="bg-black/40 border-purple-800 p-6">
              <CardTitle className="text-2xl text-white mb-6">Game Content Editors</CardTitle>
              <div className="grid md:grid-cols-2 gap-4">
                <Button
                  onClick={() => setIsGodEditorOpen(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-8 text-lg"
                >
                  <Edit className="w-5 h-5 mr-2" />
                  Customize Pantheon
                </Button>
                <Button
                  onClick={() => setIsEnemyEditorOpen(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-8 text-lg"
                >
                  <ShieldPlus className="w-5 h-5 mr-2" />
                  Edit Bestiary
                </Button>
                <Button
                  onClick={() => setIsEliteEnemyEditorOpen(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-8 text-lg"
                >
                  <Crown className="w-5 h-5 mr-2" />
                  Edit Elite Enemies
                </Button>
                <Button // NEW BUTTON
                  onClick={() => setIsTitleEditorOpen(true)}
                  className="bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white font-bold py-8 text-lg"
                >
                  <Crown className="w-5 h-5 mr-2" />
                  Edit Title Rewards
                </Button>
                <Button
                  onClick={() => setIsBossEditorOpen(true)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-8 text-lg"
                >
                  <Skull className="w-5 h-5 mr-2" />
                  Edit Bosses
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="encounters">
            <EnemyEncounterEditor />
          </TabsContent>

          <TabsContent value="achievements">
            <Card className="bg-black/40 border-purple-800 mb-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl text-white flex items-center gap-2">
                    <Award className="w-6 h-6 text-yellow-400" />
                    Achievement Management
                  </CardTitle>
                  <Button
                    onClick={handleCreateAchievement}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Achievement
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {isLoadingAchievements ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              </div>
            ) : achievements.length === 0 ? (
              <Card className="bg-black/40 border-purple-800 p-8 text-center">
                <p className="text-gray-300 text-lg">No achievements created yet. Click "Create New Achievement" to get started.</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <Card className="bg-black/30 border-purple-800 hover:bg-purple-900/20 transition-all">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div className="flex-grow">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="bg-yellow-500/20 p-2 rounded">
                                <Award className="w-6 h-6 text-yellow-400" />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-white">{achievement.title}</h3>
                                <span className="text-xs text-purple-300 bg-purple-900/30 px-2 py-1 rounded">
                                  {achievement.category}
                                </span>
                              </div>
                              {achievement.is_secret && (
                                <span className="bg-indigo-600 text-white px-2 py-1 rounded text-xs font-bold">
                                  SECRET
                                </span>
                              )}
                            </div>
                            <p className="text-gray-300 mb-3">{achievement.description}</p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="bg-black/40 p-3 rounded">
                                <div className="text-xs text-gray-400">Criteria</div>
                                <div className="text-sm font-bold text-white">{achievement.criteria_type}</div>
                              </div>
                              <div className="bg-black/40 p-3 rounded">
                                <div className="text-xs text-gray-400">Target Value</div>
                                <div className="text-sm font-bold text-green-400">{achievement.criteria_value}</div>
                              </div>
                              <div className="bg-black/40 p-3 rounded">
                                <div className="text-xs text-gray-400">Reward Type</div>
                                <div className="text-sm font-bold text-white">{achievement.reward_type}</div>
                              </div>
                              {achievement.reward_value && (
                                <div className="bg-black/40 p-3 rounded">
                                  <div className="text-xs text-gray-400">Reward Value</div>
                                  <div className="text-sm font-bold text-yellow-400">{achievement.reward_value}</div>
                                </div>
                              )}
                            </div>

                            {achievement.criteria_target_id && (
                              <div className="mt-3 bg-purple-900/30 p-3 rounded border border-purple-700">
                                <div className="text-xs text-purple-300 font-bold mb-1">Target Specific:</div>
                                <div className="text-sm text-white">{achievement.criteria_target_id}</div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2">
                            <Button
                              onClick={() => handleEditAchievement(achievement)}
                              variant="outline"
                              className="border-purple-500 text-purple-300 hover:bg-purple-500/20"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleDeleteAchievement(achievement.id)}
                              variant="destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cosmetics">
            <Card className="bg-black/40 border-purple-800 mb-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl text-white flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                    Cosmetics Management
                  </CardTitle>
                  <Button
                    onClick={handleCreateCosmetic}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Cosmetic
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {isLoadingCosmetics ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              </div>
            ) : cosmetics.length === 0 ? (
              <Card className="bg-black/40 border-purple-800 p-8 text-center">
                <p className="text-gray-300 text-lg">No cosmetics created yet.</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {cosmetics.map((cosmetic, index) => (
                  <motion.div
                    key={cosmetic.id}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <Card className="bg-black/30 border-purple-800 hover:bg-purple-900/20 transition-all">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div className="flex gap-4 flex-grow">
                            {/* Preview */}
                            {cosmetic.preview_image && (
                              <div className="w-24 h-24 flex-shrink-0">
                                <img
                                  src={cosmetic.preview_image}
                                  alt={cosmetic.name}
                                  className="w-full h-full object-cover rounded border-2 border-purple-700"
                                />
                              </div>
                            )}

                            <div className="flex-grow">
                              <div className="flex items-center gap-3 mb-3">
                                <h3 className="text-xl font-bold text-white">{cosmetic.name}</h3>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  cosmetic.rarity === 'legendary' ? 'bg-yellow-600' :
                                    cosmetic.rarity === 'epic' ? 'bg-purple-600' :
                                      cosmetic.rarity === 'rare' ? 'bg-blue-600' : 'bg-gray-600'
                                  } text-white font-bold uppercase`}>
                                  {cosmetic.rarity}
                                </span>
                                {!cosmetic.is_available && (
                                  <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                                    DISABLED
                                  </span>
                                )}
                              </div>

                              <p className="text-gray-300 mb-3">{cosmetic.description}</p>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="bg-black/40 p-3 rounded">
                                  <div className="text-xs text-gray-400">Category</div>
                                  <div className="text-sm font-bold text-white">{cosmetic.category}</div>
                                </div>
                                <div className="bg-black/40 p-3 rounded">
                                  <div className="text-xs text-gray-400">Price</div>
                                  <div className="text-sm font-bold text-green-400">
                                    {cosmetic.cost} {cosmetic.currency_type === 'favor_tokens' ? '🪙' : '💎'}
                                  </div>
                                </div>
                                {cosmetic.target_name && (
                                  <div className="bg-black/40 p-3 rounded">
                                    <div className="text-xs text-gray-400">Target</div>
                                    <div className="text-sm font-bold text-white">{cosmetic.target_name}</div>
                                  </div>
                                )}
                                <div className="bg-black/40 p-3 rounded">
                                  <div className="text-xs text-gray-400">Type</div>
                                  <div className="text-sm font-bold text-purple-400">
                                    {cosmetic.is_animated ? 'Animated' : 'Static'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Button
                              onClick={() => handleEditCosmetic(cosmetic)}
                              variant="outline"
                              className="border-purple-500 text-purple-300 hover:bg-purple-500/20"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleDeleteCosmetic(cosmetic.id)}
                              variant="destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="store">
            <Card className="bg-black/40 border-purple-800 mb-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl text-white flex items-center gap-2">
                    <ShoppingCart className="w-6 h-6 text-purple-400" />
                    Cash Store Management
                  </CardTitle>
                  <Button
                    onClick={handleCreatePackage}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Package
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {isLoadingPackages ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              </div>
            ) : storePackages.length === 0 ? (
              <Card className="bg-black/40 border-purple-800 p-8 text-center">
                <p className="text-gray-300 text-lg">No store packages created yet.</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {storePackages.map((pkg, index) => (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <Card className="bg-black/30 border-purple-800 hover:bg-purple-900/20 transition-all">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div className="flex-grow">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
                              <span className="text-2xl font-bold text-green-400">${pkg.price}</span>
                              {pkg.is_popular && (
                                <span className="bg-yellow-600 text-white px-2 py-1 rounded text-xs font-bold">
                                  POPULAR
                                </span>
                              )}
                              {!pkg.is_available && (
                                <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                                  DISABLED
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="bg-black/40 p-3 rounded">
                                <div className="text-xs text-gray-400">Package ID</div>
                                <div className="text-sm font-bold text-white">{pkg.package_id}</div>
                              </div>
                              <div className="bg-black/40 p-3 rounded">
                                <div className="text-xs text-gray-400">Favor Tokens</div>
                                <div className="text-sm font-bold text-yellow-400">{pkg.favor_tokens.toLocaleString()}</div>
                              </div>
                              <div className="bg-black/40 p-3 rounded">
                                <div className="text-xs text-gray-400">Essence Crystals</div>
                                <div className="text-sm font-bold text-cyan-400">{pkg.essence_crystals.toLocaleString()}</div>
                              </div>
                              <div className="bg-black/40 p-3 rounded">
                                <div className="text-xs text-gray-400">Display Order</div>
                                <div className="text-sm font-bold text-white">{pkg.display_order}</div>
                              </div>
                            </div>
                            {pkg.bonus_cosmetics && pkg.bonus_cosmetics.length > 0 && (
                              <div className="mt-3 bg-purple-900/30 p-3 rounded border border-purple-700">
                                <div className="text-xs text-purple-300 font-bold mb-2">Bonus Cosmetics:</div>
                                <div className="flex flex-wrap gap-2">
                                  {pkg.bonus_cosmetics.map(cosmeticId => {
                                    const bonusCosmetic = cosmetics.find(c => c.id === cosmeticId);
                                    return bonusCosmetic ? (
                                      <span key={cosmeticId} className="bg-black/40 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                                        {bonusCosmetic.preview_image && (
                                          <img src={bonusCosmetic.preview_image} alt={bonusCosmetic.name} className="w-4 h-4 object-cover rounded-full" />
                                        )}
                                        {bonusCosmetic.name}
                                      </span>
                                    ) : null;
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2">
                            <Button
                              onClick={() => handleEditPackage(pkg)}
                              variant="outline"
                              className="border-purple-500 text-purple-300 hover:bg-purple-500/20"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleDeletePackage(pkg.id)}
                              variant="destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="quests">
            <Card className="bg-black/40 border-purple-800 mb-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl text-white flex items-center gap-2">
                    <Target className="w-6 h-6 text-purple-400" />
                    Quest Management
                  </CardTitle>
                  <Button
                    onClick={handleCreateQuest}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Quest
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {isLoadingQuests ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              </div>
            ) : quests.length === 0 ? (
              <Card className="bg-black/40 border-purple-800 p-8 text-center">
                <p className="text-gray-300 text-lg">No quests created yet.</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {quests.map((quest, index) => (
                  <motion.div
                    key={quest.id}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <Card className="bg-black/30 border-purple-800 hover:bg-purple-900/20 transition-all">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div className="flex-grow">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="bg-purple-500/20 p-2 rounded">
                                <Target className="w-6 h-6 text-purple-400" />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-white">{quest.title}</h3>
                                <div className="flex gap-2 mt-1">
                                  <span className="text-xs text-purple-300 bg-purple-900/30 px-2 py-1 rounded">
                                    {quest.quest_type}
                                  </span>
                                  <span className="text-xs text-yellow-300 bg-yellow-900/30 px-2 py-1 rounded">
                                    {quest.difficulty}
                                  </span>
                                  {!quest.is_active && (
                                    <span className="text-xs text-red-300 bg-red-900/30 px-2 py-1 rounded">
                                      INACTIVE
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <p className="text-gray-300 mb-3">{quest.description}</p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="bg-black/40 p-3 rounded">
                                <div className="text-xs text-gray-400">Objective</div>
                                <div className="text-sm font-bold text-white">{quest.objective_type}</div>
                              </div>
                              <div className="bg-black/40 p-3 rounded">
                                <div className="text-xs text-gray-400">Target</div>
                                <div className="text-sm font-bold text-green-400">{quest.objective_value}</div>
                              </div>
                              <div className="bg-black/40 p-3 rounded">
                                <div className="text-xs text-gray-400">Favor Reward</div>
                                <div className="text-sm font-bold text-yellow-400">{quest.reward_favor}</div>
                              </div>
                              <div className="bg-black/40 p-3 rounded">
                                <div className="text-xs text-gray-400">Essence Reward</div>
                                <div className="text-sm font-bold text-cyan-400">{quest.reward_essence}</div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Button
                              onClick={() => handleEditQuest(quest)}
                              variant="outline"
                              className="border-purple-500 text-purple-300 hover:bg-purple-500/20"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleDeleteQuest(quest.id)}
                              variant="destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="lore">
            <Card className="bg-black/40 border-purple-800 mb-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl text-white flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-amber-400" />
                    Pantheon Lore Management
                  </CardTitle>
                  <Button
                    onClick={handleCreateLore}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Lore Card
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {isLoadingLore ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              </div>
            ) : pantheonLore.length === 0 ? (
              <Card className="bg-black/40 border-purple-800 p-8 text-center">
                <p className="text-gray-300 text-lg">No lore cards created yet.</p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {Array.from(new Set(pantheonLore.map(l => l.god_name))).sort().map(godName => {
                  const godLore = pantheonLore.filter(l => l.god_name === godName).sort((a, b) => a.card_number - b.card_number);

                  return (
                    <Card key={godName} className="bg-black/30 border-2 border-purple-700 overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-amber-900/40 to-purple-900/40 border-b border-purple-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Crown className="w-6 h-6 text-amber-400" />
                            <div>
                              <h3 className="text-2xl font-bold text-amber-400">{godName}</h3>
                              <p className="text-sm text-purple-300">{godLore.length} of 10 Chapters</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-black/60 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-amber-500 to-yellow-500"
                                style={{ width: `${(godLore.length / 10) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-amber-400 font-bold">{Math.floor((godLore.length / 10) * 100)}%</span>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="p-4 space-y-2 max-h-96 overflow-y-auto">
                        {godLore.map((lore) => (
                          <Card key={lore.id} className="bg-black/40 border-purple-600/50 hover:bg-purple-900/30 transition-all">
                            <CardContent className="p-3">
                              <div className="flex items-center gap-3">
                                {lore.image_url && (
                                  <div className="w-16 h-16 flex-shrink-0">
                                    <img
                                      src={lore.image_url}
                                      alt={lore.title}
                                      className="w-full h-full object-cover rounded border border-purple-500/50"
                                    />
                                  </div>
                                )}

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="bg-purple-600 text-white px-2 py-0.5 rounded text-xs font-bold">
                                      Ch. {lore.card_number}
                                    </span>
                                    <h4 className="text-sm font-bold text-white truncate">{lore.title}</h4>
                                  </div>
                                  <p className="text-xs text-gray-400 line-clamp-2">{lore.content}</p>
                                </div>

                                <div className="flex gap-1 flex-shrink-0">
                                  <Button
                                    onClick={() => handleEditLore(lore)}
                                    variant="outline"
                                    size="sm"
                                    className="border-purple-500 text-purple-300 hover:bg-purple-500/20 h-8 w-8 p-0"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    onClick={() => handleDeleteLore(lore.id)}
                                    variant="destructive"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}

                        {godLore.length < 10 && (
                          <div className="text-center text-gray-500 text-xs py-2">
                            {10 - godLore.length} chapter{10 - godLore.length !== 1 ? 's' : ''} remaining
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bugs">
            <Card className="bg-black/40 border-purple-800 p-8 text-center min-h-[300px] flex items-center justify-center">
              <p className="text-gray-300 text-lg">Bug Reports functionality coming soon!</p>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="bg-black/40 border-purple-800 mb-6">
              <CardContent className="p-6">
                <div className="flex gap-4 items-center">
                  <Search className="w-5 h-5 text-purple-400" />
                  <Input
                    placeholder="Search by email or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-black/40 border-purple-700 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {filteredUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <Card className="bg-black/30 border-purple-800 hover:bg-purple-900/20 transition-all">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex-grow">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-bold text-white">{user.full_name || 'No Name'}</h3>
                            {user.role === 'admin' && (
                              <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                <Crown className="w-3 h-3" /> ADMIN
                              </span>
                            )}
                          </div>
                          <p className="text-gray-300 mb-3">{user.email}</p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-black/40 p-3 rounded">
                              <div className="text-xs text-gray-400">Total Runs</div>
                              <div className="text-lg font-bold text-white">{user.total_completed_runs || 0}</div>
                            </div>
                            <div className="bg-black/40 p-3 rounded">
                              <div className="text-xs text-gray-400">Victories</div>
                              <div className="text-lg font-bold text-green-400">{user.total_victories || 0}</div>
                            </div>
                            <div className="bg-black/40 p-3 rounded">
                              <div className="text-xs text-gray-400">First Win</div>
                              <div className="text-sm font-bold text-white">{user.has_won_run ? '✓' : '✗'}</div>
                            </div>
                            <div className="bg-black/40 p-3 rounded">
                              <div className="text-xs text-gray-400">Hard Mode</div>
                              <div className="text-sm font-bold text-red-400">{user.has_won_hard_mode ? '✓' : '✗'}</div>
                            </div>
                          </div>

                          {user.god_runs_completed && typeof user.god_runs_completed === 'object' && !Array.isArray(user.god_runs_completed) && Object.keys(user.god_runs_completed).length > 0 && (
                            <div className="mt-3 bg-purple-900/30 p-3 rounded border border-purple-700">
                              <div className="text-xs text-purple-300 font-bold mb-2">God Progress:</div>
                              <div className="flex flex-wrap gap-2">
                                {availableGods.map(god => user.god_runs_completed[god] > 0 && (
                                  <span key={god} className="bg-black/40 px-2 py-1 rounded text-xs text-white">
                                    {god}: {user.god_runs_completed[god]}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center">
                          <Button
                            onClick={() => handleEditUser(user)}
                            variant="outline"
                            className="border-purple-500 text-purple-300 hover:bg-purple-500/20"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {filteredUsers.length === 0 && (
              <Card className="bg-black/40 border-purple-800 p-8 text-center">
                <p className="text-gray-300 text-lg">No users found matching your search.</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="danger">
            <Card className="bg-black/40 border-red-800 p-6">
              <CardTitle className="text-red-400 text-xl mb-4">Danger Zone Actions</CardTitle>
              <div className="flex flex-col gap-4">
                {/* Removed Update God Abilities button */}
                <Button
                  onClick={handleResetLeaderboard}
                  disabled={isResettingLeaderboard}
                  variant="outline"
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-xl border-orange-800"
                >
                  {isResettingLeaderboard ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>🏆 Reset Leaderboard Only</>
                  )}
                </Button>
                <Button
                  onClick={handleResetAllProgress}
                  disabled={isResetting}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold shadow-xl"
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>⚠️ Reset All Player Progress</>
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-indigo-950 via-purple-950 to-black border-purple-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl">Edit User: {editingUser.email}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-semibold text-purple-300 mb-2 block">Full Name</label>
                <Input
                  value={editingUser.editData.full_name}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
                    editData: { ...editingUser.editData, full_name: e.target.value }
                  })}
                  className="bg-black/40 border-purple-700 text-white"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-purple-300 mb-2 block">Role</label>
                <Select
                  value={editingUser.editData.role}
                  onValueChange={(value) => setEditingUser({
                    ...editingUser,
                    editData: { ...editingUser.editData, role: value }
                  })}
                >
                  <SelectTrigger className="bg-black/40 border-purple-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-purple-700">
                    <SelectItem value="user" className="text-white">User</SelectItem>
                    <SelectItem value="admin" className="text-white">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">Total Victories</label>
                  <Input
                    type="number"
                    value={editingUser.editData.total_victories}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      editData: { ...editingUser.editData, total_victories: Number(e.target.value) }
                    })}
                    className="bg-black/40 border-purple-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">Total Runs</label>
                  <Input
                    type="number"
                    value={editingUser.editData.total_completed_runs}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      editData: { ...editingUser.editData, total_completed_runs: Number(e.target.value) }
                    })}
                    className="bg-black/40 border-purple-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingUser.editData.has_won_run}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      editData: { ...editingUser.editData, has_won_run: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                  <span className="text-white">Has Won a Run</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingUser.editData.has_won_hard_mode}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      editData: { ...editingUser.editData, has_won_hard_mode: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                  <span className="text-white">Has Won Hard Mode</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingUser.editData.has_won_heroic_mode}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      editData: { ...editingUser.editData, has_won_heroic_mode: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                  <span className="text-white">Has Won Heroic Mode</span>
                </label>
              </div>

              <div className="border-t border-purple-700 pt-4">
                <label className="text-sm font-semibold text-purple-300 mb-3 block">God Runs Completed (for Talent Tree Testing)</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto bg-black/20 p-3 rounded">
                  {availableGods.map(god => (
                    <div key={god} className="flex items-center gap-2">
                      <label className="text-sm text-white flex-1">{god}</label>
                      <Input
                        type="number"
                        min="0"
                        value={editingUser.editData.god_runs_completed[god] || 0}
                        onChange={(e) => updateGodRuns(god, Number(e.target.value))}
                        className="bg-black/40 border-purple-700 text-white w-20"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Tip: Set to 1 for Tier 1 talents, 3+ for Tier 2 talents
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSaveUser}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button
                  onClick={() => setEditingUser(null)}
                  variant="outline"
                  className="flex-1 border-purple-500 text-purple-300 hover:bg-purple-500/20"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {editingAchievement && (
        <Dialog open={!!editingAchievement} onOpenChange={() => setEditingAchievement(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-indigo-950 via-purple-950 to-black border-purple-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Award className="w-6 h-6 text-yellow-400" />
                Edit Achievement: {editingAchievement.editData.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-semibold text-purple-300 mb-2 block">Title</label>
                <Input
                  value={editingAchievement.editData.title}
                  onChange={(e) => setEditingAchievement({
                    ...editingAchievement,
                    editData: { ...editingAchievement.editData, title: e.target.value }
                  })}
                  className="bg-black/40 border-purple-700 text-white"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-purple-300 mb-2 block">Description</label>
                <Textarea
                  value={editingAchievement.editData.description}
                  onChange={(e) => setEditingAchievement({
                    ...editingAchievement,
                    editData: { ...editingAchievement.editData, description: e.target.value }
                  })}
                  className="bg-black/40 border-purple-700 text-white"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">Icon Name (Lucide)</label>
                  <Input
                    value={editingAchievement.editData.icon_name}
                    onChange={(e) => setEditingAchievement({
                      ...editingAchievement,
                      editData: { ...editingAchievement.editData, icon_name: e.target.value }
                    })}
                    className="bg-black/40 border-purple-700 text-white"
                    placeholder="e.g., Trophy, Swords, Shield"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">Category</label>
                  <Input
                    value={editingAchievement.editData.category}
                    onChange={(e) => setEditingAchievement({
                      ...editingAchievement,
                      editData: { ...editingAchievement.editData, category: e.target.value }
                    })}
                    className="bg-black/40 border-purple-700 text-white"
                    placeholder="e.g., Progression, God Specific"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-purple-300 mb-2 block">Criteria Type</label>
                <Select
                  value={editingAchievement.editData.criteria_type}
                  onValueChange={(value) => setEditingAchievement({
                    ...editingAchievement,
                    editData: { ...editingAchievement.editData, criteria_type: value }
                  })}
                >
                  <SelectTrigger className="bg-black/40 border-purple-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-purple-700 max-h-[300px]">
                    <SelectItem value="win_run" className="text-white">Win Any Run</SelectItem>
                    <SelectItem value="complete_runs" className="text-white">Win X Total Runs</SelectItem>
                    <SelectItem value="win_run_with_god" className="text-white">Win X Runs With Specific God</SelectItem>
                    <SelectItem value="win_hard_mode" className="text-white">Win Hard Mode</SelectItem>
                    <SelectItem value="win_heroic_mode" className="text-white">Win Heroic Mode</SelectItem>
                    <SelectItem value="win_mythic_mode" className="text-white">Win Mythic Mode</SelectItem>
                    <SelectItem value="defeat_enemies" className="text-white">Defeat X Enemies Total</SelectItem>
                    <SelectItem value="play_cards" className="text-white">Play X Cards Total</SelectItem>
                    <SelectItem value="deal_total_damage" className="text-white">Deal X Damage Total</SelectItem>
                    <SelectItem value="heal_total_hp" className="text-white">Heal X HP Total</SelectItem>
                    <SelectItem value="collect_relics_total" className="text-white">Collect X Relics Total</SelectItem>
                    <SelectItem value="max_victories_in_run" className="text-white">Win X Battles In Single Run</SelectItem>
                    <SelectItem value="reach_battle" className="text-white">Reach Battle X</SelectItem>
                    <SelectItem value="defeat_boss" className="text-white">Defeat Specific Boss</SelectItem>
                    <SelectItem value="defeat_elite_enemy" className="text-white">Defeat Elite Enemy</SelectItem>
                    <SelectItem value="survive_burn_damage" className="text-white">Survive X Burn Damage</SelectItem>
                    <SelectItem value="survive_poison_damage" className="text-white">Survive X Poison Damage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">Criteria Value</label>
                  <Input
                    type="number"
                    value={editingAchievement.editData.criteria_value}
                    onChange={(e) => setEditingAchievement({
                      ...editingAchievement,
                      editData: { ...editingAchievement.editData, criteria_value: Number(e.target.value) }
                    })}
                    className="bg-black/40 border-purple-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">Target ID (Optional)</label>
                  <Input
                    value={editingAchievement.editData.criteria_target_id}
                    onChange={(e) => setEditingAchievement({
                      ...editingAchievement,
                      editData: { ...editingAchievement.editData, criteria_target_id: e.target.value }
                    })}
                    className="bg-black/40 border-purple-700 text-white"
                    placeholder="e.g., Zeus, Kraken"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">Reward Type</label>
                  <Select
                    value={editingAchievement.editData.reward_type}
                    onValueChange={(value) => setEditingAchievement({
                      ...editingAchievement,
                      editData: { ...editingAchievement.editData, reward_type: value }
                    })}
                  >
                    <SelectTrigger className="bg-black/40 border-purple-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-purple-700">
                      <SelectItem value="none" className="text-white">None</SelectItem>
                      <SelectItem value="points" className="text-white">Achievement Points</SelectItem>
                      <SelectItem value="coins" className="text-white">Coins</SelectItem>
                      <SelectItem value="relic_unlock" className="text-white">Relic Unlock</SelectItem>
                      <SelectItem value="cosmetic_unlock" className="text-white">Cosmetic Unlock</SelectItem>
                      <SelectItem value="god_unlock" className="text-white">God Unlock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">Reward Value</label>
                  <Input
                    value={editingAchievement.editData.reward_value}
                    onChange={(e) => setEditingAchievement({
                      ...editingAchievement,
                      editData: { ...editingAchievement.editData, reward_value: e.target.value }
                    })}
                    className="bg-black/40 border-purple-700 text-white"
                    placeholder="e.g., 100 or 'Phoenix Feather'"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingAchievement.editData.is_secret}
                    onChange={(e) => setEditingAchievement({
                      ...editingAchievement,
                      editData: { ...editingAchievement.editData, is_secret: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                  <span className="text-white">Secret Achievement (Hidden until unlocked)</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSaveAchievement}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Achievement
                </Button>
                <Button
                  onClick={() => setEditingAchievement(null)}
                  variant="outline"
                  className="flex-1 border-purple-500 text-purple-300 hover:bg-purple-500/20"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Cosmetic Edit Modal */}
      {editingCosmetic && (
        <Dialog open={!!editingCosmetic} onOpenChange={() => setEditingCosmetic(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-indigo-950 via-purple-950 to-black border-purple-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-400" />
                Edit Cosmetic: {editingCosmetic.editData.name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Preview Image/Audio Section */}
              {editingCosmetic.editData.preview_image && (
                <div className="bg-black/40 p-4 rounded border border-purple-700">
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">Current Preview</label>
                  <img
                    src={editingCosmetic.editData.preview_image}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded mb-2"
                  />
                </div>
              )}

              {/* Asset Preview - Show audio player for voice effects */}
              {editingCosmetic.editData.asset_url && editingCosmetic.editData.category === 'voice_effect' && (
                <div className="bg-black/40 p-4 rounded border border-purple-700">
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">Current Audio Asset</label>
                  <audio controls className="w-full">
                    <source src={editingCosmetic.editData.asset_url} />
                    Your browser does not support audio playback.
                  </audio>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">Name</label>
                  <Input
                    value={editingCosmetic.editData.name}
                    onChange={(e) => setEditingCosmetic({
                      ...editingCosmetic,
                      editData: { ...editingCosmetic.editData, name: e.target.value }
                    })}
                    className="bg-black/40 border-purple-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">Category</label>
                  <Select
                    value={editingCosmetic.editData.category}
                    onValueChange={(value) => setEditingCosmetic({
                      ...editingCosmetic,
                      editData: { ...editingCosmetic.editData, category: value }
                    })}
                  >
                    <SelectTrigger className="bg-black/40 border-purple-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-purple-700">
                      <SelectItem value="god_art" className="text-white">God Art</SelectItem>
                      <SelectItem value="profile_picture" className="text-white">Profile Picture</SelectItem>
                      <SelectItem value="card_animation" className="text-white">Card Animation</SelectItem>
                      <SelectItem value="voice_effect" className="text-white">Voice Effect</SelectItem>
                      <SelectItem value="profile_frame" className="text-white">Profile Frame</SelectItem>
                      <SelectItem value="card_back" className="text-white">Card Back</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-purple-300 mb-2 block">Description</label>
                <Textarea
                  value={editingCosmetic.editData.description}
                  onChange={(e) => setEditingCosmetic({
                    ...editingCosmetic,
                    editData: { ...editingCosmetic.editData, description: e.target.value }
                  })}
                  className="bg-black/40 border-purple-700 text-white"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">Rarity</label>
                  <Select
                    value={editingCosmetic.editData.rarity}
                    onValueChange={(value) => setEditingCosmetic({
                      ...editingCosmetic,
                      editData: { ...editingCosmetic.editData, rarity: value }
                    })}
                  >
                    <SelectTrigger className="bg-black/40 border-purple-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-purple-700">
                      <SelectItem value="common" className="text-white">Common</SelectItem>
                      <SelectItem value="rare" className="text-white">Rare</SelectItem>
                      <SelectItem value="epic" className="text-white">Epic</SelectItem>
                      <SelectItem value="legendary" className="text-white">Legendary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">Currency</label>
                  <Select
                    value={editingCosmetic.editData.currency_type}
                    onValueChange={(value) => setEditingCosmetic({
                      ...editingCosmetic,
                      editData: { ...editingCosmetic.editData, currency_type: value }
                    })}
                  >
                    <SelectTrigger className="bg-black/40 border-purple-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-purple-700">
                      <SelectItem value="favor_tokens" className="text-white">Favor Tokens</SelectItem>
                      <SelectItem value="essence_crystals" className="text-white">Essence Crystals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">Cost</label>
                  <Input
                    type="number"
                    value={editingCosmetic.editData.cost}
                    onChange={(e) => setEditingCosmetic({
                      ...editingCosmetic,
                      editData: { ...editingCosmetic.editData, cost: Number(e.target.value) }
                    })}
                    className="bg-black/40 border-purple-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">Preview Image URL</label>
                  <div className="flex gap-2">
                    <Input
                      value={editingCosmetic.editData.preview_image}
                      onChange={(e) => setEditingCosmetic({
                        ...editingCosmetic,
                        editData: { ...editingCosmetic.editData, preview_image: e.target.value }
                      })}
                      className="bg-black/40 border-purple-700 text-white flex-1"
                      placeholder="https://..."
                    />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={el => cosmeticFileInputRefs.current[`${editingCosmetic.id}-preview`] = el}
                      onChange={(e) => handleUploadCosmeticImage(editingCosmetic.id, 'preview_image', e)}
                    />
                    <Button
                      type="button"
                      onClick={() => triggerCosmeticFileInput(`${editingCosmetic.id}-preview`)}
                      variant="outline"
                      className="border-purple-500 text-purple-300 hover:bg-purple-500/20"
                      disabled={uploadingCosmeticImage === `${editingCosmetic.id}-preview_image`}
                    >
                      {uploadingCosmeticImage === `${editingCosmetic.id}-preview_image` ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UploadCloud className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">
                    Asset URL {editingCosmetic.editData.category === 'voice_effect' && '(Audio File)'}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={editingCosmetic.editData.asset_url}
                      onChange={(e) => setEditingCosmetic({
                        ...editingCosmetic,
                        editData: { ...editingCosmetic.editData, asset_url: e.target.value }
                      })}
                      className="bg-black/40 border-purple-700 text-white flex-1"
                      placeholder="https://..."
                    />
                    <input
                      type="file"
                      accept={editingCosmetic.editData.category === 'voice_effect' ? 'audio/*' : 'image/*,audio/*,video/*'}
                      className="hidden"
                      ref={el => cosmeticFileInputRefs.current[`${editingCosmetic.id}-asset`] = el}
                      onChange={(e) => handleUploadCosmeticImage(editingCosmetic.id, 'asset_url', e)}
                    />
                    <Button
                      type="button"
                      onClick={() => triggerCosmeticFileInput(`${editingCosmetic.id}-asset`)}
                      variant="outline"
                      className="border-purple-500 text-purple-300 hover:bg-purple-500/20"
                      disabled={uploadingCosmeticImage === `${editingCosmetic.id}-asset_url`}
                    >
                      {uploadingCosmeticImage === `${editingCosmetic.id}-asset_url` ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UploadCloud className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {editingCosmetic.editData.category === 'voice_effect' && (
                    <p className="text-xs text-gray-400 mt-1">Upload MP3, WAV, or OGG audio files</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">Target ID (Optional)</label>
                  <Input
                    value={editingCosmetic.editData.target_id}
                    onChange={(e) => setEditingCosmetic({
                      ...editingCosmetic,
                      editData: { ...editingCosmetic.editData, target_id: e.target.value }
                    })}
                    className="bg-black/40 border-purple-700 text-white"
                    placeholder="God/Card ID"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">Target Name (Optional)</label>
                  <Input
                    value={editingCosmetic.editData.target_name}
                    onChange={(e) => setEditingCosmetic({
                      ...editingCosmetic,
                      editData: { ...editingCosmetic.editData, target_name: e.target.value }
                    })}
                    className="bg-black/40 border-purple-700 text-white"
                    placeholder="Zeus, Strike, etc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">Unlock Requirement (Optional)</label>
                  <Input
                    value={editingCosmetic.editData.unlock_requirement}
                    onChange={(e) => setEditingCosmetic({
                      ...editingCosmetic,
                      editData: { ...editingCosmetic.editData, unlock_requirement: e.target.value }
                    })}
                    className="bg-black/40 border-purple-700 text-white"
                    placeholder="e.g., Win 10 runs with Zeus"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">Display Order</label>
                  <Input
                    type="number"
                    value={editingCosmetic.editData.display_order}
                    onChange={(e) => setEditingCosmetic({
                      ...editingCosmetic,
                      editData: { ...editingCosmetic.editData, display_order: Number(e.target.value) }
                    })}
                    className="bg-black/40 border-purple-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingCosmetic.editData.is_animated}
                    onChange={(e) => setEditingCosmetic({
                      ...editingCosmetic,
                      editData: { ...editingCosmetic.editData, is_animated: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                  <span className="text-white">Is Animated</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingCosmetic.editData.is_available}
                    onChange={(e) => setEditingCosmetic({
                      ...editingCosmetic,
                      editData: { ...editingCosmetic.editData, is_available: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                  <span className="text-white">Available for Purchase</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSaveCosmetic}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Cosmetic
                </Button>
                <Button
                  onClick={() => setEditingCosmetic(null)}
                  variant="outline"
                  className="flex-1 border-purple-500 text-purple-300 hover:bg-purple-500/20"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Store Package Edit Modal */}
      {editingPackage && (
        <Dialog open={!!editingPackage} onOpenChange={() => setEditingPackage(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-indigo-950 via-purple-950 to-black border-purple-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-purple-400" />
                Edit Store Package: {editingPackage.editData.name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">Package ID</label>
                  <Input
                    value={editingPackage.editData.package_id}
                    onChange={(e) => setEditingPackage({
                      ...editingPackage,
                      editData: { ...editingPackage.editData, package_id: e.target.value }
                    })}
                    className="bg-black/40 border-purple-700 text-white"
                    placeholder="e.g., starter, hero"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">Package Name</label>
                  <Input
                    value={editingPackage.editData.name}
                    onChange={(e) => setEditingPackage({
                      ...editingPackage,
                      editData: { ...editingPackage.editData, name: e.target.value }
                    })}
                    className="bg-black/40 border-purple-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-purple-300 mb-2 block">Price (USD)</label>
                <Input
                  value={editingPackage.editData.price}
                  onChange={(e) => setEditingPackage({
                    ...editingPackage,
                    editData: { ...editingPackage.editData, price: e.target.value }
                  })}
                  className="bg-black/40 border-purple-700 text-white"
                  placeholder="9.99"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">Favor Tokens</label>
                  <Input
                    type="number"
                    value={editingPackage.editData.favor_tokens}
                    onChange={(e) => setEditingPackage({
                      ...editingPackage,
                      editData: { ...editingPackage.editData, favor_tokens: Number(e.target.value) }
                    })}
                    className="bg-black/40 border-purple-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">Essence Crystals</label>
                  <Input
                    type="number"
                    value={editingPackage.editData.essence_crystals}
                    onChange={(e) => setEditingPackage({
                      ...editingPackage,
                      editData: { ...editingPackage.editData, essence_crystals: Number(e.target.value) }
                    })}
                    className="bg-black/40 border-purple-700 text-white"
                  />
                </div>
              </div>

              {/* Bonus Cosmetics Selector */}
              <div>
                <label className="text-sm font-semibold text-purple-300 mb-2 block">Bonus Cosmetics (Optional)</label>
                <div className="bg-black/40 border border-purple-700 rounded-lg p-4 max-h-64 overflow-y-auto">
                  {cosmetics.length === 0 ? (
                    <p className="text-gray-400 text-sm">No cosmetics available</p>
                  ) : (
                    <div className="space-y-2">
                      {cosmetics.map(cosmetic => {
                        // Ensure bonus_cosmetics is an array, even if null/undefined initially
                        const isSelected = (editingPackage.editData.bonus_cosmetics || []).includes(cosmetic.id);
                        return (
                          <label key={cosmetic.id} className="flex items-center gap-3 cursor-pointer hover:bg-purple-900/20 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const currentCosmetics = editingPackage.editData.bonus_cosmetics || [];
                                const newCosmetics = e.target.checked
                                  ? [...currentCosmetics, cosmetic.id]
                                  : currentCosmetics.filter(id => id !== cosmetic.id);
                                setEditingPackage({
                                  ...editingPackage,
                                  editData: { ...editingPackage.editData, bonus_cosmetics: newCosmetics }
                                });
                              }}
                              className="w-4 h-4 accent-purple-500"
                            />
                            {cosmetic.preview_image && (
                              <img
                                src={cosmetic.preview_image}
                                alt={cosmetic.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <div className="text-sm text-white font-bold">{cosmetic.name}</div>
                              <div className="text-xs text-gray-400">{cosmetic.category} • {cosmetic.rarity}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-purple-300 mb-2 block">Gradient (Tailwind Classes)</label>
                <Input
                  value={editingPackage.editData.gradient}
                  onChange={(e) => setEditingPackage({
                    ...editingPackage,
                    editData: { ...editingPackage.editData, gradient: e.target.value }
                  })}
                  className="bg-black/40 border-purple-700 text-white"
                  placeholder="from-purple-600 to-pink-600"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-purple-300 mb-2 block">Display Order</label>
                <Input
                  type="number"
                  value={editingPackage.editData.display_order}
                  onChange={(e) => setEditingPackage({
                    ...editingPackage,
                    editData: { ...editingPackage.editData, display_order: Number(e.target.value) }
                  })}
                    className="bg-black/40 border-purple-700 text-white"
                  />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPackage.editData.is_available}
                    onChange={(e) => setEditingPackage({
                      ...editingPackage,
                      editData: { ...editingPackage.editData, is_available: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                  <span className="text-white">Available for Purchase</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPackage.editData.is_popular}
                    onChange={(e) => setEditingPackage({
                      ...editingPackage,
                      editData: { ...editingPackage.editData, is_popular: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                  <span className="text-white">Mark as Popular</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSavePackage}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Package
                </Button>
                <Button
                  onClick={() => setEditingPackage(null)}
                  variant="outline"
                  className="flex-1 border-purple-500 text-purple-300 hover:bg-purple-500/20"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Quest Edit Modal */}
      {editingQuest && (
        <Dialog open={!!editingQuest} onOpenChange={() => setEditingQuest(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-indigo-950 via-purple-950 to-black border-purple-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Target className="w-6 h-6 text-purple-400" />
                Edit Quest: {editingQuest.editData.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">Title</label>
                  <Input
                    value={editingQuest.editData.title}
                    onChange={(e) => setEditingQuest({
                      ...editingQuest,
                      editData: { ...editingQuest.editData, title: e.target.value }
                    })}
                    className="bg-black/40 border-purple-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">Quest Type</label>
                  <Select
                    value={editingQuest.editData.quest_type}
                    onValueChange={(value) => setEditingQuest({
                      ...editingQuest,
                      editData: { ...editingQuest.editData, quest_type: value }
                    })}
                  >
                    <SelectTrigger className="bg-black/40 border-purple-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-purple-700 max-h-64">
                      <SelectItem value="daily" className="text-white">Daily</SelectItem>
                      <SelectItem value="weekly" className="text-white">Weekly</SelectItem>
                      <SelectItem value="permanent" className="text-white">Permanent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-purple-300 mb-2 block">Description</label>
                <Textarea
                  value={editingQuest.editData.description}
                  onChange={(e) => setEditingQuest({
                    ...editingQuest,
                    editData: { ...editingQuest.editData, description: e.target.value }
                  })}
                  className="bg-black/40 border-purple-700 text-white"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">Objective Type</label>
                  <Select
                    value={editingQuest.editData.objective_type}
                    onValueChange={(value) => setEditingQuest({
                      ...editingQuest,
                      editData: { ...editingQuest.editData, objective_type: value }
                    })}
                  >
                    <SelectTrigger className="bg-black/40 border-purple-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-purple-700 max-h-64">
                      <SelectItem value="win_runs" className="text-white">Win Runs</SelectItem>
                      <SelectItem value="complete_runs" className="text-white">Complete Runs</SelectItem>
                      <SelectItem value="win_with_god" className="text-white">Win With God</SelectItem>
                      <SelectItem value="defeat_enemies" className="text-white">Defeat Enemies</SelectItem>
                      <SelectItem value="play_cards" className="text-white">Play Cards</SelectItem>
                      <SelectItem value="deal_damage" className="text-white">Deal Damage</SelectItem>
                      <SelectItem value="collect_relics" className="text-white">Collect Relics</SelectItem>
                      <SelectItem value="reach_battle" className="text-white">Reach Battle</SelectItem>
                      <SelectItem value="win_hard_mode" className="text-white">Win Hard Mode</SelectItem>
                      <SelectItem value="win_heroic_mode" className="text-white">Win Heroic Mode</SelectItem>
                      <SelectItem value="play_combo_cards" className="text-white">Play Combo Cards</SelectItem>
                      <SelectItem value="play_surge_cards" className="text-white">Play Surge Cards</SelectItem>
                      <SelectItem value="play_charge_cards" className="text-white">Play Charge Cards</SelectItem>
                      <SelectItem value="play_knowledge_cards" className="text-white">Play Knowledge Cards</SelectItem>
                      <SelectItem value="play_leech_cards" className="text-white">Play Leech Cards</SelectItem>
                      <SelectItem value="play_cards_with_burn" className="text-white">Play Burn Cards</SelectItem>
                      <SelectItem value="play_cards_with_poison" className="text-white">Play Poison Cards</SelectItem>
                      <SelectItem value="play_cards_with_vulnerable" className="text-white">Play Vulnerable Cards</SelectItem>
                      <SelectItem value="play_cards_with_stun" className="text-white">Play Stun Cards</SelectItem>
                      <SelectItem value="play_cards_with_confused" className="text-white">Play Confused Cards</SelectItem>
                      <SelectItem value="play_self_damage_cards" className="text-white">Play Self-Damage Cards</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">Target Value</label>
                  <Input
                    type="number"
                    value={editingQuest.editData.objective_value}
                    onChange={(e) => setEditingQuest({
                      ...editingQuest,
                      editData: { ...editingQuest.editData, objective_value: Number(e.target.value) }
                    })}
                    className="bg-black/40 border-purple-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">Difficulty</label>
                  <Select
                    value={editingQuest.editData.difficulty}
                    onValueChange={(value) => setEditingQuest({
                      ...editingQuest,
                      editData: { ...editingQuest.editData, difficulty: value }
                    })}
                  >
                    <SelectTrigger className="bg-black/40 border-purple-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-purple-700">
                      <SelectItem value="easy" className="text-white">Easy</SelectItem>
                      <SelectItem value="medium" className="text-white">Medium</SelectItem>
                      <SelectItem value="hard" className="text-white">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-purple-300 mb-2 block">Target (Optional - e.g., God Name)</label>
                <Input
                  value={editingQuest.editData.objective_target}
                  onChange={(e) => setEditingQuest({
                    ...editingQuest,
                    editData: { ...editingQuest.editData, objective_target: e.target.value }
                  })}
                  className="bg-black/40 border-purple-700 text-white"
                  placeholder="e.g., Zeus, Thor"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">Favor Reward</label>
                  <Input
                    type="number"
                    value={editingQuest.editData.reward_favor}
                    onChange={(e) => setEditingQuest({
                      ...editingQuest,
                      editData: { ...editingQuest.editData, reward_favor: Number(e.target.value) }
                    })}
                    className="bg-black/40 border-purple-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">Essence Reward</label>
                  <Input
                    type="number"
                    value={editingQuest.editData.reward_essence}
                    onChange={(e) => setEditingQuest({
                      ...editingQuest,
                      editData: { ...editingQuest.editData, reward_essence: Number(e.target.value) }
                    })}
                    className="bg-black/40 border-purple-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">Icon Name</label>
                  <Input
                    value={editingQuest.editData.icon_name}
                    onChange={(e) => setEditingQuest({
                      ...editingQuest,
                      editData: { ...editingQuest.editData, icon_name: e.target.value }
                    })}
                    className="bg-black/40 border-purple-700 text-white"
                    placeholder="Target, Trophy, etc."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingQuest.editData.is_active}
                    onChange={(e) => setEditingQuest({
                      ...editingQuest,
                      editData: { ...editingQuest.editData, is_active: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                  <span className="text-white">Quest Active (visible to players)</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSaveQuest}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Quest
                </Button>
                <Button
                  onClick={() => setEditingQuest(null)}
                  variant="outline"
                  className="flex-1 border-purple-500 text-purple-300 hover:bg-purple-500/20"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Lore Edit Modal */}
      {editingLore && (
        <Dialog open={!!editingLore} onOpenChange={() => setEditingLore(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-indigo-950 via-purple-950 to-black border-purple-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-amber-400" />
                Edit Lore: {editingLore.editData.god_name} - Chapter {editingLore.editData.card_number}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">God Name</label>
                  <Input
                    value={editingLore.editData.god_name}
                    onChange={(e) => setEditingLore({
                      ...editingLore,
                      editData: { ...editingLore.editData, god_name: e.target.value }
                    })}
                    className="bg-black/40 border-purple-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">Card Number (1-10)</label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={editingLore.editData.card_number}
                    onChange={(e) => setEditingLore({
                      ...editingLore,
                      editData: {
                        ...editingLore.editData,
                        card_number: Number(e.target.value),
                        unlock_requirement: Number(e.target.value)
                      }
                    })}
                    className="bg-black/40 border-purple-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-purple-300 mb-2 block">Title</label>
                <Input
                  value={editingLore.editData.title}
                  onChange={(e) => setEditingLore({
                    ...editingLore,
                    editData: { ...editingLore.editData, title: e.target.value }
                  })}
                  className="bg-black/40 border-purple-700 text-white"
                  placeholder="The Beginning of Thunder"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-purple-300 mb-2 block">Content</label>
                <Textarea
                  value={editingLore.editData.content}
                  onChange={(e) => setEditingLore({
                    ...editingLore,
                    editData: { ...editingLore.editData, content: e.target.value }
                  })}
                  className="bg-black/40 border-purple-700 text-white min-h-[200px]"
                  placeholder="Write the divine lore here..."
                />
              </div>

              {editingLore.editData.image_url && (
                <div className="bg-black/40 p-4 rounded border border-purple-700">
                  <label className="text-sm font-semibold text-purple-300 mb-2 block">Current Image</label>
                  <img
                    src={editingLore.editData.image_url}
                    alt="Lore"
                    className="w-full h-48 object-cover rounded mb-2"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-purple-300 mb-2 block">Image URL</label>
                <div className="flex gap-2">
                  <Input
                    value={editingLore.editData.image_url || ''}
                    onChange={(e) => setEditingLore({
                      ...editingLore,
                      editData: { ...editingLore.editData, image_url: e.target.value }
                    })}
                    className="bg-black/40 border-purple-700 text-white flex-1"
                    placeholder="https://..."
                  />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={loreImageInputRef}
                    onChange={handleUploadLoreImage}
                  />
                  <Button
                    type="button"
                    onClick={() => loreImageInputRef.current?.click()}
                    variant="outline"
                    className="border-purple-500 text-purple-300 hover:bg-purple-500/20"
                    disabled={uploadingLoreImage}
                  >
                    {uploadingLoreImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UploadCloud className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSaveLore}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Lore
                </Button>
                <Button
                  onClick={() => setEditingLore(null)}
                  variant="outline"
                  className="flex-1 border-purple-500 text-purple-300 hover:bg-purple-500/20"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
