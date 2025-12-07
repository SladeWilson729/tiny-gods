import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2, Edit, Save, X, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';

const RARITY_COLORS = {
  common: { bg: 'bg-gray-600', text: 'text-gray-400', border: 'border-gray-500' },
  rare: { bg: 'bg-blue-600', text: 'text-blue-400', border: 'border-blue-500' },
  epic: { bg: 'bg-purple-600', text: 'text-purple-400', border: 'border-purple-500' },
  legendary: { bg: 'bg-yellow-600', text: 'text-yellow-400', border: 'border-yellow-500' }
};

export default function TitleRewardEditorModal({ open, onClose }) {
  const [titles, setTitles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTitle, setEditingTitle] = useState(null);

  useEffect(() => {
    if (open) {
      loadTitles();
    }
  }, [open]);

  const loadTitles = async () => {
    setIsLoading(true);
    try {
      const titlesList = await base44.entities.TitleReward.list('display_order');
      setTitles(titlesList);
    } catch (error) {
      console.error('Failed to load titles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTitle = async () => {
    const newTitle = {
      name: "New Title",
      description: "A prestigious title for achieving greatness",
      icon_name: "Crown",
      rarity: "common",
      unlock_criteria_type: "win_x_runs",
      unlock_criteria_value: 1,
      unlock_criteria_target_id: "",
      is_secret: false,
      color: "#a855f7",
      display_order: titles.length
    };

    try {
      await base44.entities.TitleReward.create(newTitle);
      await loadTitles();
    } catch (error) {
      console.error('Failed to create title:', error);
      alert('Failed to create title. Check console for details.');
    }
  };

  const handleUpdateTitle = async (titleId, updates) => {
    try {
      await base44.entities.TitleReward.update(titleId, updates);
      await loadTitles();
      setEditingTitle(null);
    } catch (error) {
      console.error('Failed to update title:', error);
      alert('Failed to update title. Check console for details.');
    }
  };

  const handleDeleteTitle = async (titleId) => {
    if (!confirm('Are you sure you want to delete this title?')) return;

    try {
      await base44.entities.TitleReward.delete(titleId);
      await loadTitles();
    } catch (error) {
      console.error('Failed to delete title:', error);
      alert('Failed to delete title. Check console for details.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] bg-gradient-to-br from-indigo-950 via-purple-950 to-black border-purple-700 text-white flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-3xl text-purple-300 flex items-center gap-3">
            <Crown className="w-8 h-8" />
            Title Rewards Editor
          </DialogTitle>
          <DialogDescription className="text-gray-300 text-lg">
            Create and manage player titles with unlock conditions
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end mb-4">
          <Button
            onClick={handleCreateTitle}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Title
          </Button>
        </div>

        <ScrollArea className="flex-1 pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-16 h-16 animate-spin text-purple-400" />
            </div>
          ) : titles.length === 0 ? (
            <Card className="bg-black/40 border-purple-800 p-12 text-center">
              <Crown className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <p className="text-gray-300 text-lg">No titles created yet. Click "Create New Title" to get started.</p>
            </Card>
          ) : (
            <div className="space-y-4 pb-6">
              {titles.map((title, index) => {
                const rarityStyle = RARITY_COLORS[title.rarity] || RARITY_COLORS.common;

                return (
                  <motion.div
                    key={title.id}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <Card className={`bg-black/30 border-2 ${rarityStyle.border} p-6`}>
                      {editingTitle === title.id ? (
                        <TitleEditor
                          title={title}
                          onSave={(updates) => handleUpdateTitle(title.id, updates)}
                          onCancel={() => setEditingTitle(null)}
                        />
                      ) : (
                        <>
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <div 
                                  className={`${rarityStyle.bg} p-2 rounded`}
                                >
                                  <Crown className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <h3 
                                    className="text-2xl font-bold"
                                    style={{ color: title.color }}
                                  >
                                    {title.name}
                                  </h3>
                                  <span className={`text-xs ${rarityStyle.text} uppercase font-bold`}>
                                    {title.rarity}
                                  </span>
                                  {title.is_secret && (
                                    <span className="ml-2 bg-indigo-600 text-white px-2 py-1 rounded text-xs font-bold">
                                      SECRET
                                    </span>
                                  )}
                                </div>
                              </div>

                              <p className="text-gray-300 mb-4">{title.description}</p>

                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                <div className="bg-black/40 p-3 rounded border border-purple-700/30">
                                  <div className="text-xs text-gray-400">Unlock Type</div>
                                  <div className="text-sm font-bold text-white">
                                    {title.unlock_criteria_type.replace(/_/g, ' ')}
                                  </div>
                                </div>
                                <div className="bg-black/40 p-3 rounded border border-purple-700/30">
                                  <div className="text-xs text-gray-400">Value Required</div>
                                  <div className="text-sm font-bold text-green-400">
                                    {title.unlock_criteria_value}
                                  </div>
                                </div>
                                {title.unlock_criteria_target_id && (
                                  <div className="bg-black/40 p-3 rounded border border-purple-700/30">
                                    <div className="text-xs text-gray-400">Specific Target</div>
                                    <div className="text-sm font-bold text-yellow-400">
                                      {title.unlock_criteria_target_id}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <Button
                                onClick={() => setEditingTitle(title.id)}
                                variant="outline"
                                size="sm"
                                className="border-purple-500 text-purple-300 hover:bg-purple-500/20"
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                onClick={() => handleDeleteTitle(title.id)}
                                variant="destructive"
                                size="sm"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function TitleEditor({ title, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: title.name,
    description: title.description,
    icon_name: title.icon_name || 'Crown',
    rarity: title.rarity,
    unlock_criteria_type: title.unlock_criteria_type,
    unlock_criteria_value: title.unlock_criteria_value,
    unlock_criteria_target_id: title.unlock_criteria_target_id || '',
    is_secret: title.is_secret || false,
    color: title.color || '#a855f7',
    display_order: title.display_order || 0
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold text-purple-300 mb-1 block">Title Name</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Slayer of Gods"
            className="bg-black/40 border-purple-700 text-white"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-purple-300 mb-1 block">Icon Name (Lucide)</label>
          <Input
            value={formData.icon_name}
            onChange={(e) => setFormData({ ...formData, icon_name: e.target.value })}
            placeholder="e.g., Crown, Sword, Trophy"
            className="bg-black/40 border-purple-700 text-white"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-purple-300 mb-1 block">Description</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Lore or explanation of the title"
          className="bg-black/40 border-purple-700 text-white"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-semibold text-purple-300 mb-1 block">Rarity</label>
          <Select value={formData.rarity} onValueChange={(value) => setFormData({ ...formData, rarity: value })}>
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
          <label className="text-sm font-semibold text-purple-300 mb-1 block">Color (Hex)</label>
          <Input
            type="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="bg-black/40 border-purple-700 h-10"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-purple-300 mb-1 block">Display Order</label>
          <Input
            type="number"
            value={formData.display_order}
            onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
            className="bg-black/40 border-purple-700 text-white"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-purple-300 mb-1 block">Unlock Criteria Type</label>
        <Select 
          value={formData.unlock_criteria_type} 
          onValueChange={(value) => setFormData({ ...formData, unlock_criteria_type: value })}
        >
          <SelectTrigger className="bg-black/40 border-purple-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-black border-purple-700 max-h-[300px]">
            <SelectItem value="always_unlocked" className="text-white">Always Unlocked</SelectItem>
            <SelectItem value="win_x_runs" className="text-white">Win X Total Runs</SelectItem>
            <SelectItem value="win_x_runs_with_god" className="text-white">Win X Runs With Specific God</SelectItem>
            <SelectItem value="defeat_x_bosses" className="text-white">Defeat X Bosses</SelectItem>
            <SelectItem value="defeat_specific_boss" className="text-white">Defeat Specific Boss</SelectItem>
            <SelectItem value="reach_x_divine_rank" className="text-white">Reach X Divine Rank</SelectItem>
            <SelectItem value="complete_x_achievements" className="text-white">Complete X Achievements</SelectItem>
            <SelectItem value="earn_x_achievement_points" className="text-white">Earn X Achievement Points</SelectItem>
            <SelectItem value="win_hard_mode" className="text-white">Win Hard Mode</SelectItem>
            <SelectItem value="win_heroic_mode" className="text-white">Win Heroic Mode</SelectItem>
            <SelectItem value="win_mythic_mode" className="text-white">Win Mythic Mode</SelectItem>
            <SelectItem value="win_wild_mode" className="text-white">Win Wild Mode</SelectItem>
            <SelectItem value="collect_x_relics" className="text-white">Collect X Relics (Total)</SelectItem>
            <SelectItem value="complete_all_gods" className="text-white">Complete Runs With All Gods</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold text-purple-300 mb-1 block">Criteria Value</label>
          <Input
            type="number"
            value={formData.unlock_criteria_value}
            onChange={(e) => setFormData({ ...formData, unlock_criteria_value: Number(e.target.value) })}
            className="bg-black/40 border-purple-700 text-white"
            placeholder="e.g., 10"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-purple-300 mb-1 block">Target ID (Optional)</label>
          <Input
            value={formData.unlock_criteria_target_id}
            onChange={(e) => setFormData({ ...formData, unlock_criteria_target_id: e.target.value })}
            className="bg-black/40 border-purple-700 text-white"
            placeholder="e.g., Zeus, Kraken"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is-secret"
          checked={formData.is_secret}
          onChange={(e) => setFormData({ ...formData, is_secret: e.target.checked })}
          className="w-4 h-4"
        />
        <label htmlFor="is-secret" className="text-white cursor-pointer">
          Secret Title (Hidden until unlocked)
        </label>
      </div>

      <div className="flex gap-2 pt-4">
        <Button
          onClick={() => onSave(formData)}
          className="flex-1 bg-purple-600 hover:bg-purple-700"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Title
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex-1 border-purple-500 text-purple-300 hover:bg-purple-500/20"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );
}