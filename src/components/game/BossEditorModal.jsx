
import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UploadCloud, PlusCircle, Trash2, Skull, Plus } from 'lucide-react';

export default function BossEditorModal({ open, onClose, onUpdate }) {
  const [bosses, setBosses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  const [editingAbilities, setEditingAbilities] = useState(null);
  const fileInputRefs = useRef({});

  const loadBosses = async () => {
    setIsLoading(true);
    const allBosses = await base44.entities.Boss.list('-created_date');
    setBosses(allBosses);
    setIsLoading(false);
  };

  useEffect(() => {
    if (open) {
      loadBosses();
    }
  }, [open]);

  const handleFileChange = async (boss, event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingId(boss.id);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Boss.update(boss.id, { image: file_url });
      await loadBosses();
    } catch (error) {
      console.error("Failed to upload image/video:", error);
    } finally {
      setUploadingId(null);
    }
  };
  
  const handleAddNew = async () => {
    await base44.entities.Boss.create({
      name: "New Boss",
      description: "A fearsome boss enemy",
      maxHealth: 100,
      attack: 15,
      image: "",
      special_abilities: [],
      phases: 1,
      difficulty_tier: "elite"
    });
    await loadBosses();
  };

  const handleUpdate = async (id, field, value) => {
    const numericFields = ['maxHealth', 'attack', 'phases'];
    const finalValue = numericFields.includes(field) ? Number(value) : value;
    await base44.entities.Boss.update(id, { [field]: finalValue });
    setBosses(prev => prev.map(b => b.id === id ? {...b, [field]: finalValue} : b));
  };
  
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this boss?')) return;
    await base44.entities.Boss.delete(id);
    await loadBosses();
  };

  const handleAddAbility = (boss) => {
    const newAbility = {
      name: "New Ability",
      description: "Ability description",
      trigger: "on_turn_start"
    };
    const updatedAbilities = [...(boss.special_abilities || []), newAbility];
    handleUpdate(boss.id, 'special_abilities', updatedAbilities);
  };

  const handleUpdateAbility = (boss, abilityIndex, field, value) => {
    const updatedAbilities = [...(boss.special_abilities || [])];
    updatedAbilities[abilityIndex] = {
      ...updatedAbilities[abilityIndex],
      [field]: value
    };
    handleUpdate(boss.id, 'special_abilities', updatedAbilities);
  };

  const handleDeleteAbility = (boss, abilityIndex) => {
    const updatedAbilities = (boss.special_abilities || []).filter((_, i) => i !== abilityIndex);
    handleUpdate(boss.id, 'special_abilities', updatedAbilities);
  };

  const triggerFileInput = (bossId) => {
    fileInputRefs.current[bossId]?.click();
  };

  const isVideo = (url) => {
    if (!url) return false;
    const lowerCaseUrl = url.toLowerCase();
    return lowerCaseUrl.endsWith('.mp4') || lowerCaseUrl.endsWith('.webm') || lowerCaseUrl.endsWith('.mov');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] bg-gradient-to-br from-red-950 via-purple-950 to-black border-red-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-3xl flex items-center gap-2">
            <Skull className="w-8 h-8 text-red-400" />
            Boss Enemy Editor
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Create and customize powerful boss enemies with unique abilities. Upload images or videos (MP4).
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-end mb-4">
          <Button onClick={handleAddNew} className="bg-red-600 hover:bg-red-700">
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Boss
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-6 pb-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : bosses.length === 0 ? (
              <Card className="bg-black/30 border-red-800 p-8 text-center">
                <p className="text-gray-400">No bosses created yet. Click "Add New Boss" to get started.</p>
              </Card>
            ) : (
              bosses.map(boss => (
                <Card key={boss.id} className="bg-black/30 border-red-800 p-6">
                  <div className="flex gap-6">
                    <div className="w-48 flex-shrink-0">
                      <div className="relative">
                        {isVideo(boss.image) ? (
                          <video 
                            src={boss.image} 
                            className="w-full h-48 object-cover rounded-lg mb-2 border-2 border-red-500"
                            autoPlay
                            loop
                            muted
                            playsInline
                          />
                        ) : (
                          <img 
                            src={boss.image || 'https://via.placeholder.com/300x300.png/8b0000/ffffff?text=Boss'} 
                            alt={boss.name} 
                            className="w-full h-48 object-cover rounded-lg mb-2 border-2 border-red-500"
                          />
                        )}
                        <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                          BOSS
                        </div>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*,video/mp4,video/webm,video/quicktime" 
                        className="hidden" 
                        ref={el => (fileInputRefs.current[boss.id] = el)} 
                        onChange={(e) => handleFileChange(boss, e)} 
                      />
                      <Button 
                        onClick={() => triggerFileInput(boss.id)} 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-white border-red-500 hover:bg-red-500/20" 
                        disabled={uploadingId === boss.id}
                      >
                        {uploadingId === boss.id ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <UploadCloud className="w-4 h-4 mr-2" />
                        )}
                        Upload Image/Video
                      </Button>
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-red-300 font-semibold mb-1 block">Boss Name</label>
                          <Input 
                            value={boss.name} 
                            onChange={e => handleUpdate(boss.id, 'name', e.target.value)} 
                            className="bg-transparent border-red-700 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-red-300 font-semibold mb-1 block">Difficulty Tier</label>
                          <Select 
                            value={boss.difficulty_tier || 'elite'} 
                            onValueChange={(value) => handleUpdate(boss.id, 'difficulty_tier', value)}
                          >
                            <SelectTrigger className="bg-transparent border-red-700 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-black border-red-700">
                              <SelectItem value="normal" className="text-white">Normal</SelectItem>
                              <SelectItem value="elite" className="text-white">Elite</SelectItem>
                              <SelectItem value="legendary" className="text-white">Legendary</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-red-300 font-semibold mb-1 block">Description</label>
                        <Textarea 
                          value={boss.description} 
                          onChange={e => handleUpdate(boss.id, 'description', e.target.value)} 
                          className="bg-transparent border-red-700 text-white"
                          rows={2}
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs text-red-300 font-semibold mb-1 block">Max Health</label>
                          <Input 
                            type="number" 
                            value={boss.maxHealth} 
                            onChange={e => handleUpdate(boss.id, 'maxHealth', e.target.value)} 
                            className="bg-transparent border-red-700 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-red-300 font-semibold mb-1 block">Attack</label>
                          <Input 
                            type="number" 
                            value={boss.attack} 
                            onChange={e => handleUpdate(boss.id, 'attack', e.target.value)} 
                            className="bg-transparent border-red-700 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-red-300 font-semibold mb-1 block">Phases</label>
                          <Input 
                            type="number" 
                            value={boss.phases || 1} 
                            onChange={e => handleUpdate(boss.id, 'phases', e.target.value)} 
                            className="bg-transparent border-red-700 text-white"
                            min="1"
                            max="3"
                          />
                        </div>
                      </div>

                      <div className="border-t border-red-800 pt-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-lg font-bold text-red-300">Special Abilities</h4>
                          <Button 
                            onClick={() => handleAddAbility(boss)} 
                            size="sm" 
                            variant="outline"
                            className="border-red-500 text-red-300 hover:bg-red-500/20"
                          >
                            <Plus className="w-4 h-4 mr-1" /> Add Ability
                          </Button>
                        </div>

                        {(!boss.special_abilities || boss.special_abilities.length === 0) ? (
                          <p className="text-gray-400 text-sm">No abilities yet. Add one to make this boss unique!</p>
                        ) : (
                          <div className="space-y-3">
                            {boss.special_abilities.map((ability, index) => (
                              <Card key={index} className="bg-black/40 border-red-900 p-3">
                                <div className="space-y-2">
                                  <div className="flex gap-2">
                                    <Input 
                                      value={ability.name} 
                                      onChange={e => handleUpdateAbility(boss, index, 'name', e.target.value)}
                                      placeholder="Ability Name"
                                      className="bg-transparent border-red-700 text-white text-sm flex-1"
                                    />
                                    <Select 
                                      value={ability.trigger} 
                                      onValueChange={(value) => handleUpdateAbility(boss, index, 'trigger', value)}
                                    >
                                      <SelectTrigger className="bg-transparent border-red-700 text-white text-sm w-40">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="bg-black border-red-700">
                                        <SelectItem value="on_turn_start" className="text-white">Turn Start</SelectItem>
                                        <SelectItem value="on_turn_end" className="text-white">Turn End</SelectItem>
                                        <SelectItem value="on_damage_taken" className="text-white">On Damaged</SelectItem>
                                        <SelectItem value="on_low_health" className="text-white">Low Health</SelectItem>
                                        <SelectItem value="passive" className="text-white">Passive</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Button 
                                      onClick={() => handleDeleteAbility(boss, index)} 
                                      size="icon" 
                                      variant="destructive"
                                      className="flex-shrink-0"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <Textarea 
                                    value={ability.description} 
                                    onChange={e => handleUpdateAbility(boss, index, 'description', e.target.value)}
                                    placeholder="Ability description"
                                    className="bg-transparent border-red-700 text-white text-xs"
                                    rows={2}
                                  />
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end">
                        <Button 
                          onClick={() => handleDelete(boss.id)} 
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Boss
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
