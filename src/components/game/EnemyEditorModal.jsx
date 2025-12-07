
import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, UploadCloud, PlusCircle, Trash2, Shield } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function EnemyEditorModal({ open, onClose, onUpdate }) {
  const [enemies, setEnemies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  const fileInputRefs = useRef({});

  const loadData = async () => {
    setIsLoading(true);
    const allEnemies = await base44.entities.Enemy.list('-created_date');
    setEnemies(allEnemies);
    setIsLoading(false);
  };

  React.useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const handleFileChange = async (enemy, event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingId(enemy.id);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Enemy.update(enemy.id, { image: file_url });
      await loadData();
    } catch (error) {
      console.error("Failed to upload image:", error);
    } finally {
      setUploadingId(null);
    }
  };
  
  const handleAddNew = async () => {
    await base44.entities.Enemy.create({
      name: "New Enemy",
      description: "A new threat emerges",
      maxHealth: 30,
      attack: 5,
      image: ""
    });
    await loadData();
  };

  const handleUpdate = async (id, field, value) => {
    const numericFields = ['maxHealth', 'attack'];
    const finalValue = numericFields.includes(field) ? Number(value) : value;
    await base44.entities.Enemy.update(id, { [field]: finalValue });
    setEnemies(prev => prev.map(e => e.id === id ? {...e, [field]: finalValue} : e));
  };
  
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this enemy?')) return;
    await base44.entities.Enemy.delete(id);
    await loadData();
  };

  const triggerFileInput = (enemyId) => {
    fileInputRefs.current[enemyId]?.click();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] bg-gradient-to-br from-indigo-950 via-purple-950 to-black border-purple-700 text-white flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-3xl flex items-center gap-2">
            <Shield className="w-8 h-8 text-purple-400" />
            Bestiary Editor
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Create and customize regular enemies for battles 1-9. Upload images to bring them to life.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-end mb-4">
          <Button onClick={handleAddNew} className="bg-purple-600 hover:bg-purple-700">
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Enemy
          </Button>
        </div>

        <ScrollArea className="flex-1 pr-4">
          <div className="grid md:grid-cols-2 gap-6 pb-6">
            {isLoading ? (
              <div className="col-span-2 flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : enemies.length === 0 ? (
              <Card className="col-span-2 bg-black/30 border-purple-800 p-8 text-center">
                <p className="text-gray-400">No enemies created yet. Click "Add New Enemy" to get started.</p>
              </Card>
            ) : (
              enemies.map(enemy => (
                <Card key={enemy.id} className="bg-black/30 border-purple-800 p-6 hover:border-purple-600 transition-colors">
                  <div className="space-y-4">
                    {/* Image Section */}
                    <div className="flex gap-4">
                      <div className="w-32 flex-shrink-0">
                        <img 
                          src={enemy.image || 'https://via.placeholder.com/150'} 
                          alt={enemy.name} 
                          className="w-full h-32 object-cover rounded-lg border-2 border-purple-500"
                        />
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          ref={el => (fileInputRefs.current[enemy.id] = el)} 
                          onChange={(e) => handleFileChange(enemy, e)} 
                        />
                        <Button 
                          onClick={() => triggerFileInput(enemy.id)} 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-2 text-white border-purple-500 hover:bg-purple-500/20" 
                          disabled={uploadingId === enemy.id}
                        >
                          {uploadingId === enemy.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <UploadCloud className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                      
                      {/* Name */}
                      <div className="flex-1 space-y-3">
                        <div>
                          <label className="text-xs font-bold text-purple-300 mb-1 block uppercase tracking-wide">
                            Enemy Name
                          </label>
                          <Input 
                            value={enemy.name} 
                            onChange={e => handleUpdate(enemy.id, 'name', e.target.value)} 
                            className="bg-black/40 border-purple-700 text-white font-semibold text-lg"
                            placeholder="Enemy Name"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="text-xs font-bold text-purple-300 mb-1 block uppercase tracking-wide">
                        Description
                      </label>
                      <Textarea 
                        value={enemy.description} 
                        onChange={e => handleUpdate(enemy.id, 'description', e.target.value)} 
                        className="bg-black/40 border-purple-700 text-white resize-none"
                        rows={2}
                        placeholder="Describe this enemy..."
                      />
                    </div>

                    {/* Stats Section */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-red-900/20 p-3 rounded-lg border border-red-700/50">
                        <label className="text-xs font-bold text-red-300 mb-1 block uppercase tracking-wide">
                          ❤️ Max Health
                        </label>
                        <Input 
                          type="number" 
                          value={enemy.maxHealth} 
                          onChange={e => handleUpdate(enemy.id, 'maxHealth', e.target.value)} 
                          className="bg-black/40 border-red-700 text-white font-bold text-lg text-center"
                        />
                      </div>
                      
                      <div className="bg-orange-900/20 p-3 rounded-lg border border-orange-700/50">
                        <label className="text-xs font-bold text-orange-300 mb-1 block uppercase tracking-wide">
                          ⚔️ Attack Damage
                        </label>
                        <Input 
                          type="number" 
                          value={enemy.attack} 
                          onChange={e => handleUpdate(enemy.id, 'attack', e.target.value)} 
                          className="bg-black/40 border-orange-700 text-white font-bold text-lg text-center"
                        />
                      </div>
                    </div>

                    {/* Delete Button */}
                    <div className="pt-2 border-t border-purple-800">
                      <Button 
                        onClick={() => handleDelete(enemy.id)} 
                        variant="destructive"
                        size="sm"
                        className="w-full"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Enemy
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
