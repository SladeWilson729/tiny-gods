
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2, Crown, Skull, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EnemyEncounterEditor() {
  const [encounters, setEncounters] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [eliteEnemies, setEliteEnemies] = useState([]);
  const [bosses, setBosses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [encountersData, enemiesData, elitesData, bossesData] = await Promise.all([
        base44.entities.EnemyEncounter.list('-battle_number'),
        base44.entities.Enemy.list(),
        base44.entities.EliteEnemy.list(),
        base44.entities.Boss.list(),
      ]);
      
      setEncounters(encountersData);
      setEnemies(enemiesData);
      setEliteEnemies(elitesData);
      setBosses(bossesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEncounter = async (battleNumber) => {
    try {
      // Default to 'random' if no specific enemy exists, otherwise first enemy of regular type
      const initialEnemyId = enemies[0]?.id || 'random';
      const initialEnemyName = enemies[0]?.name || 'Random';

      await base44.entities.EnemyEncounter.create({
        battle_number: battleNumber,
        enemy_type: 'regular',
        enemy_id: initialEnemyId,
        enemy_name: initialEnemyName,
        is_active: true,
      });
      await loadAllData();
      
      // Clear the enemy cache so combat picks up the changes
      const { clearEnemyCache } = await import('./combatHelpers');
      clearEnemyCache();
    } catch (error) {
      console.error('Failed to add encounter:', error);
    }
  };

  const handleUpdateEncounter = async (encounterId, updates) => {
    try {
      await base44.entities.EnemyEncounter.update(encounterId, updates);
      await loadAllData();
      
      // Clear the enemy cache so combat picks up the changes
      const { clearEnemyCache } = await import('./combatHelpers');
      clearEnemyCache();
    } catch (error) {
      console.error('Failed to update encounter:', error);
    }
  };

  const handleDeleteEncounter = async (encounterId) => {
    if (!confirm('Are you sure you want to delete this encounter?')) return;
    
    try {
      await base44.entities.EnemyEncounter.delete(encounterId);
      await loadAllData();
      
      // Clear the enemy cache so combat picks up the changes
      const { clearEnemyCache } = await import('./combatHelpers');
      clearEnemyCache();
    } catch (error) {
      console.error('Failed to delete encounter:', error);
    }
  };

  const getEncounterForBattle = (battleNumber) => {
    return encounters.find(e => e.battle_number === battleNumber && e.is_active);
  };

  const getEnemyList = (type) => {
    if (type === 'regular') return enemies;
    if (type === 'elite') return eliteEnemies;
    if (type === 'boss') return bosses;
    return [];
  };

  const getEnemyName = (enemyId, type) => {
    if (enemyId === 'random') return 'Random';
    const list = getEnemyList(type);
    const enemy = list.find(e => e.id === enemyId);
    return enemy?.name || 'Unknown';
  };

  const getBattleIcon = (battleNumber) => {
    if (battleNumber === 5 || battleNumber === 10) {
      return <Skull className="w-5 h-5 text-red-500" />;
    } else if (battleNumber >= 6 && battleNumber <= 9) {
      return <Crown className="w-5 h-5 text-orange-500" />;
    }
    return <Shield className="w-5 h-5 text-blue-500" />;
  };

  const getRecommendedType = (battleNumber) => {
    if (battleNumber === 5 || battleNumber === 10) return 'boss';
    if (battleNumber >= 6 && battleNumber <= 9) return 'elite';
    return 'regular';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Enemy Encounter Configuration</h2>
        <p className="text-gray-400 text-sm">Configure which enemies appear at specific battle levels</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((battleNumber) => {
          const encounter = getEncounterForBattle(battleNumber);
          const recommendedType = getRecommendedType(battleNumber);
          
          return (
            <motion.div
              key={battleNumber}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: battleNumber * 0.05 }}
            >
              <Card className="bg-black/40 border-purple-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getBattleIcon(battleNumber)}
                    <span className="text-white font-bold">Battle {battleNumber}</span>
                  </div>
                  {encounter && (
                    <Button
                      onClick={() => handleDeleteEncounter(encounter.id)}
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {encounter ? (
                  <div className="space-y-2">
                    <Select
                      value={encounter.enemy_type}
                      onValueChange={(value) => {
                        const newList = getEnemyList(value);
                        handleUpdateEncounter(encounter.id, {
                          enemy_type: value,
                          enemy_id: newList.length > 0 ? newList[0]?.id : 'random',
                          enemy_name: newList.length > 0 ? newList[0]?.name : 'Random',
                        });
                      }}
                    >
                      <SelectTrigger className="bg-black/40 border-purple-700 text-white text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-purple-700">
                        <SelectItem value="regular" className="text-white text-xs">Regular</SelectItem>
                        <SelectItem value="elite" className="text-white text-xs">Elite</SelectItem>
                        <SelectItem value="boss" className="text-white text-xs">Boss</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={encounter.enemy_id}
                      onValueChange={(value) => {
                        if (value === 'random') {
                          handleUpdateEncounter(encounter.id, {
                            enemy_id: 'random',
                            enemy_name: 'Random',
                          });
                        } else {
                          const selectedEnemy = getEnemyList(encounter.enemy_type).find(e => e.id === value);
                          handleUpdateEncounter(encounter.id, {
                            enemy_id: value,
                            enemy_name: selectedEnemy?.name || '',
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="bg-black/40 border-purple-700 text-white text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-purple-700">
                        <SelectItem value="random" className="text-amber-300 text-xs font-bold">
                          🎲 Random
                        </SelectItem>
                        {getEnemyList(encounter.enemy_type).map(enemy => (
                          <SelectItem key={enemy.id} value={enemy.id} className="text-white text-xs">
                            {enemy.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="text-xs text-gray-400 mt-2">
                      {getEnemyName(encounter.enemy_id, encounter.enemy_type)}
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleAddEncounter(battleNumber)}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs border-purple-500 text-purple-300 hover:bg-purple-500/20"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Set Enemy
                  </Button>
                )}

                {recommendedType !== 'regular' && (
                  <div className="text-xs text-amber-400 mt-2">
                    Recommended: {recommendedType}
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card className="bg-black/40 border-purple-800 p-4">
        <h3 className="text-lg font-bold text-white mb-2">Legend</h3>
        <div className="space-y-2 text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" />
            <span>Battles 1-4: Regular enemies (easier)</span>
          </div>
          <div className="flex items-center gap-2">
            <Skull className="w-4 h-4 text-red-500" />
            <span>Battles 5 & 10: Boss fights</span>
          </div>
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-orange-500" />
            <span>Battles 6-9: Elite enemies (harder)</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          * If no enemy is set for a battle, a random enemy of the recommended type will be selected
        </p>
      </Card>
    </div>
  );
}
