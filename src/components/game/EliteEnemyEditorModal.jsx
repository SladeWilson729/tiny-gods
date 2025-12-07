
import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UploadCloud, PlusCircle, Trash2, Crown, X } from 'lucide-react';

const AVAILABLE_AFFIXES = [
  { effect: 'swift', name: 'Swift', description: 'Attacks twice per turn' },
  { effect: 'legendary_swift', name: 'Legendary Swift', description: 'Attacks three times per turn' },
  { effect: 'enraged', name: 'Enraged', description: '+5 Attack damage' },
  { effect: 'legendary_enraged', name: 'Legendary Enraged', description: '+10 Attack damage' },
  { effect: 'fortified', name: 'Fortified', description: 'Gains 8 Shield per turn' },
  { effect: 'legendary_fortified', name: 'Titan\'s Shield', description: 'Gains 15 Shield per turn' },
  { effect: 'regenerating', name: 'Regenerating', description: 'Heals 5 HP per turn' },
  { effect: 'legendary_regenerating', name: 'Legendary Regenerating', description: 'Heals 10 HP per turn' },
  { effect: 'vampiric', name: 'Vampiric', description: 'Heals for 50% of damage dealt' },
  { effect: 'legendary_vampiric', name: 'Legendary Vampiric', description: 'Heals for 100% of damage dealt' },
  { effect: 'frost_aura', name: 'Frost Aura', description: 'Players can only play two cards per turn' },
  { effect: 'vengeful_strike', name: 'Vengeful Strike', description: 'Reflects 50% of damage received back to player' },
  { effect: 'venom_spiral', name: 'Venom Spiral', description: 'Applies Burn (5) and Poison (5) every 3 turns' },
  { effect: 'disorienting_aura', name: 'Disorienting Aura', description: 'Player attack cards have 30% chance to miss' }
];

export default function EliteEnemyEditorModal({ open, onClose, onUpdate }) {
  const [eliteEnemies, setEliteEnemies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  const fileInputRefs = useRef({});

  const loadEliteEnemies = async () => {
    setIsLoading(true);
    const allElites = await base44.entities.EliteEnemy.list('-created_date');
    setEliteEnemies(allElites);
    setIsLoading(false);
  };

  useEffect(() => {
    if (open) {
      loadEliteEnemies();
    }
  }, [open]);

  const handleFileChange = async (elite, event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingId(elite.id);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.EliteEnemy.update(elite.id, { image: file_url });
      await loadEliteEnemies();
    } catch (error) {
      console.error("Failed to upload file:", error);
    } finally {
      setUploadingId(null);
    }
  };
  
  const handleAddNew = async () => {
    await base44.entities.EliteEnemy.create({
      name: "New Elite Enemy",
      description: "A powerful elite enemy",
      maxHealth: 50,
      attack: 10,
      image: "",
      affixes: []
    });
    await loadEliteEnemies();
  };

  const handleUpdate = async (id, field, value) => {
    const numericFields = ['maxHealth', 'attack'];
    const finalValue = numericFields.includes(field) ? Number(value) : value;
    await base44.entities.EliteEnemy.update(id, { [field]: finalValue });
    setEliteEnemies(prev => prev.map(e => e.id === id ? {...e, [field]: finalValue} : e));
  };
  
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this elite enemy?')) return;
    await base44.entities.EliteEnemy.delete(id);
    await loadEliteEnemies();
  };

  const handleAddAffix = (elite, affixEffect) => {
    const affixData = AVAILABLE_AFFIXES.find(a => a.effect === affixEffect);
    if (!affixData) return;

    const newAffix = {
      name: affixData.name,
      effect: affixData.effect,
      description: affixData.description
    };

    const updatedAffixes = [...(elite.affixes || []), newAffix];
    handleUpdate(elite.id, 'affixes', updatedAffixes);
  };

  const handleRemoveAffix = (elite, affixIndex) => {
    const updatedAffixes = (elite.affixes || []).filter((_, i) => i !== affixIndex);
    handleUpdate(elite.id, 'affixes', updatedAffixes);
  };

  const triggerFileInput = (eliteId) => {
    fileInputRefs.current[eliteId]?.click();
  };

  const isVideo = (url) => {
    if (!url) return false;
    return url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm') || url.toLowerCase().endsWith('.mov');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] bg-gradient-to-br from-orange-950 via-red-950 to-black border-orange-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-3xl flex items-center gap-2">
            <Crown className="w-8 h-8 text-orange-400" />
            Elite Enemy Editor
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Create and customize elite enemies with powerful affixes. Upload images or videos (MP4).
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-end mb-4">
          <Button onClick={handleAddNew} className="bg-orange-600 hover:bg-orange-700">
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Elite Enemy
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-6 pb-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : eliteEnemies.length === 0 ? (
              <Card className="bg-black/30 border-orange-800 p-8 text-center">
                <p className="text-gray-400">No elite enemies created yet. Click "Add New Elite Enemy" to get started.</p>
              </Card>
            ) : (
              eliteEnemies.map(elite => (
                <Card key={elite.id} className="bg-black/30 border-orange-800 p-6">
                  <div className="flex gap-6">
                    <div className="w-48 flex-shrink-0">
                      <div className="relative">
                        {isVideo(elite.image) ? (
                          <video 
                            src={elite.image} 
                            className="w-full h-48 object-cover rounded-lg mb-2 border-2 border-orange-500"
                            autoPlay
                            loop
                            muted
                            playsInline
                          />
                        ) : (
                          <img 
                            src={elite.image || 'https://via.placeholder.com/300x300.png/ff8800/ffffff?text=Elite'} 
                            alt={elite.name} 
                            className="w-full h-48 object-cover rounded-lg mb-2 border-2 border-orange-500"
                          />
                        )}
                        <div className="absolute top-2 right-2 bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded">
                          ELITE
                        </div>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*,video/mp4,video/webm,video/quicktime" 
                        className="hidden" 
                        ref={el => (fileInputRefs.current[elite.id] = el)} 
                        onChange={(e) => handleFileChange(elite, e)} 
                      />
                      <Button 
                        onClick={() => triggerFileInput(elite.id)} 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-white border-orange-500 hover:bg-orange-500/20" 
                        disabled={uploadingId === elite.id}
                      >
                        {uploadingId === elite.id ? (
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
                          <label className="text-xs text-orange-300 font-semibold mb-1 block">Elite Name</label>
                          <Input 
                            value={elite.name} 
                            onChange={e => handleUpdate(elite.id, 'name', e.target.value)} 
                            className="bg-transparent border-orange-700 text-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-orange-300 font-semibold mb-1 block">Max Health</label>
                            <Input 
                              type="number" 
                              value={elite.maxHealth} 
                              onChange={e => handleUpdate(elite.id, 'maxHealth', e.target.value)} 
                              className="bg-transparent border-orange-700 text-white"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-orange-300 font-semibold mb-1 block">Attack</label>
                            <Input 
                              type="number" 
                              value={elite.attack} 
                              onChange={e => handleUpdate(elite.id, 'attack', e.target.value)} 
                              className="bg-transparent border-orange-700 text-white"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-orange-300 font-semibold mb-1 block">Description</label>
                        <Textarea 
                          value={elite.description} 
                          onChange={e => handleUpdate(elite.id, 'description', e.target.value)} 
                          className="bg-transparent border-orange-700 text-white"
                          rows={2}
                        />
                      </div>

                      <div className="border-t border-orange-800 pt-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-lg font-bold text-orange-300">Affixes</h4>
                          <Select onValueChange={(value) => handleAddAffix(elite, value)}>
                            <SelectTrigger className="w-48 bg-black/40 border-orange-500 text-white">
                              <SelectValue placeholder="Add Affix" />
                            </SelectTrigger>
                            <SelectContent className="bg-black border-orange-700">
                              {AVAILABLE_AFFIXES.map(affix => (
                                <SelectItem key={affix.effect} value={affix.effect} className="text-white">
                                  {affix.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {(!elite.affixes || elite.affixes.length === 0) ? (
                          <p className="text-gray-400 text-sm">No affixes yet. Add one to make this elite more challenging!</p>
                        ) : (
                          <div className="space-y-2">
                            {elite.affixes.map((affix, index) => (
                              <Card key={index} className="bg-black/40 border-orange-900 p-3">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-bold text-orange-300">🔥 {affix.name}</span>
                                    </div>
                                    <p className="text-xs text-orange-200">{affix.description}</p>
                                  </div>
                                  <Button 
                                    onClick={() => handleRemoveAffix(elite, index)} 
                                    size="icon" 
                                    variant="ghost"
                                    className="flex-shrink-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end">
                        <Button 
                          onClick={() => handleDelete(elite.id)} 
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Elite
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
