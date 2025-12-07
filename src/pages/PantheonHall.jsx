import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, BookOpen, Lock, Crown, Sparkles } from 'lucide-react';
import LoreMenu from '../components/game/LoreMenu';

export default function PantheonHall() {
  const [gods, setGods] = useState([]);
  const [user, setUser] = useState(null);
  const [selectedGod, setSelectedGod] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const godsList = await base44.entities.God.list();
      const availableGods = godsList.filter(god =>
        god.name !== 'Zeus' &&
        god.name !== 'Odin' &&
        god.name !== 'Cthulhu' &&
        god.name !== 'Hades'
      );
      setGods(availableGods);
    } catch (error) {
      console.error('Failed to load Pantheon Hall:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getGodProgress = (godName) => {
    const runsCompleted = user?.god_runs_completed?.[godName] || 0;
    const maxLore = 10;
    const percentage = Math.min((runsCompleted / maxLore) * 100, 100);
    return { runsCompleted, percentage };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-black p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-white text-xl">Loading Pantheon Hall...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-black p-6 relative overflow-hidden">
      {/* Mystical Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="bg-black/70 backdrop-blur-md rounded-2xl p-8 border-2 border-amber-500/50 shadow-2xl">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Crown className="w-12 h-12 text-amber-400" />
              <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600">
                Pantheon Hall
              </h1>
              <Crown className="w-12 h-12 text-amber-400" />
            </div>
            <p className="text-xl text-purple-200">
              Discover the divine legends of each deity
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Complete runs to unlock sacred knowledge
            </p>
          </div>
        </motion.div>

        {/* God Statues Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {gods.map((god, index) => {
            const { runsCompleted, percentage } = getGodProgress(god.name);
            const isComplete = percentage === 100;

            return (
              <motion.div
                key={god.id}
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -10 }}
                onClick={() => setSelectedGod(god)}
                className="cursor-pointer"
              >
                <Card 
                  className="relative overflow-hidden bg-gradient-to-br from-black/60 to-purple-900/30 border-2 transition-all duration-500 hover:shadow-2xl"
                  style={{
                    borderColor: percentage > 0 ? '#8b5cf6' : '#4b5563',
                    boxShadow: percentage > 0 ? '0 0 30px rgba(139, 92, 246, 0.5)' : 'none'
                  }}
                >
                  {/* Progress Glow Effect */}
                  {percentage > 0 && (
                    <div 
                      className="absolute inset-0 opacity-30 pointer-events-none"
                      style={{
                        background: `linear-gradient(180deg, transparent ${100 - percentage}%, rgba(139, 92, 246, 0.3) 100%)`
                      }}
                    />
                  )}

                  {/* God Image/Statue */}
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={god.image}
                      alt={god.name}
                      className="w-full h-full object-cover transition-all duration-700"
                      style={{
                        filter: percentage === 0 ? 'grayscale(100%) brightness(0.5)' : 
                               percentage < 100 ? `grayscale(${100 - percentage}%) brightness(${0.5 + percentage / 200})` :
                               'grayscale(0%) brightness(1.1)',
                        transform: `scale(${1 + percentage / 500})`
                      }}
                    />
                    
                    {/* Unlock Overlay */}
                    {percentage === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <Lock className="w-16 h-16 text-gray-500" />
                      </div>
                    )}

                    {/* Completion Overlay */}
                    {isComplete && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-amber-500/30 to-transparent"
                      >
                        <Sparkles className="w-16 h-16 text-amber-400 animate-pulse" />
                      </motion.div>
                    )}
                  </div>

                  {/* God Info */}
                  <div className="p-4 bg-black/80 backdrop-blur-sm">
                    <h3 className="text-2xl font-bold text-center mb-2" style={{
                      color: percentage > 0 ? '#fbbf24' : '#9ca3af'
                    }}>
                      {god.name}
                    </h3>
                    
                    {/* Progress Bar */}
                    <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden mb-2">
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-600 to-amber-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                      />
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-purple-300">
                        <BookOpen className="w-4 h-4" />
                        <span>{runsCompleted}/10</span>
                      </div>
                      <div className="text-gray-400">
                        {isComplete ? (
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <Sparkles className="w-4 h-4" />
                            Complete
                          </span>
                        ) : runsCompleted === 0 ? (
                          <span className="text-gray-500">Locked</span>
                        ) : (
                          <span className="text-purple-400">{Math.floor(percentage)}%</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Overall Progress Summary */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <Card className="bg-black/60 backdrop-blur-md border-2 border-purple-500/50 p-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center justify-center gap-2">
                <Crown className="w-6 h-6 text-amber-400" />
                Your Divine Knowledge
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-black/40 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-purple-400">
                    {gods.filter(g => getGodProgress(g.name).runsCompleted > 0).length}
                  </div>
                  <div className="text-sm text-gray-400">Gods Discovered</div>
                </div>
                <div className="bg-black/40 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-amber-400">
                    {gods.reduce((sum, g) => sum + getGodProgress(g.name).runsCompleted, 0)}
                  </div>
                  <div className="text-sm text-gray-400">Total Lore Unlocked</div>
                </div>
                <div className="bg-black/40 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-400">
                    {gods.filter(g => getGodProgress(g.name).percentage === 100).length}
                  </div>
                  <div className="text-sm text-gray-400">Complete Pantheons</div>
                </div>
                <div className="bg-black/40 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-cyan-400">
                    {Math.floor(gods.reduce((sum, g) => sum + getGodProgress(g.name).percentage, 0) / gods.length)}%
                  </div>
                  <div className="text-sm text-gray-400">Overall Progress</div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Lore Menu Modal */}
      <AnimatePresence>
        {selectedGod && (
          <LoreMenu
            god={selectedGod}
            runsCompleted={getGodProgress(selectedGod.name).runsCompleted}
            onClose={() => setSelectedGod(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}