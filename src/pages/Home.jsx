
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Swords, Trophy, Play, BookOpen, Target, Book } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import TutorialModal from '../components/game/TutorialModal';

export default function Home() {
  const navigate = useNavigate();
  const [activeRun, setActiveRun] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          setIsLoggedIn(true);
          
          const runs = await base44.entities.GameRun.filter({ status: 'in_progress', created_by: user.email }, '-created_date', 1);
          if (runs.length > 0) {
            setActiveRun(runs[0]);
          }

          const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
          if (!hasSeenTutorial) {
            setShowTutorial(true);
          }
        }
      } catch (error) {
        console.log("Not logged in", error);
        setIsLoggedIn(false);
        const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
        if (!hasSeenTutorial) {
          setShowTutorial(true);
        }
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async () => {
    try {
      await base44.auth.redirectToLogin(window.location.href);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const startNewRun = () => {
    if (!isLoggedIn) {
      handleLogin();
      return;
    }
    navigate(createPageUrl('GodSelection'));
  };

  const continueRun = () => {
    if (activeRun) {
      navigate(createPageUrl(`Combat?runId=${activeRun.id}`));
    }
  };

  const handleTutorialClose = () => {
    setShowTutorial(false);
    localStorage.setItem('hasSeenTutorial', 'true');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e04136fbb307df3e4a61ec/6f7e4ea76_u4997921937_cinematic_anime-style_illustration_of_Mount_Olymp_66c4e86b-019b-44aa-9262-935195bd17df_2.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#1a1410'
      }}>

      <TutorialModal
        open={showTutorial}
        onClose={handleTutorialClose}
      />

      <div className="absolute top-4 right-4 flex gap-2">
        <Button
          onClick={() => navigate(createPageUrl('PantheonHall'))}
          variant="outline"
          className="bg-black/80 backdrop-blur-sm border-amber-500 text-amber-300 hover:bg-amber-500/20 hover:text-white shadow-lg"
        >
          <Book className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Lore</span>
        </Button>
        <Button
          onClick={() => navigate(createPageUrl('Quests'))}
          variant="outline"
          className="bg-black/80 backdrop-blur-sm border-green-500 text-green-300 hover:bg-green-500/20 hover:text-white shadow-lg"
        >
          <Target className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Quests</span>
        </Button>
        <Button
          onClick={() => navigate(createPageUrl('Leaderboard'))}
          variant="outline"
          className="bg-black/80 backdrop-blur-sm border-amber-500 text-amber-300 hover:bg-amber-500/20 hover:text-white shadow-lg"
        >
          <Trophy className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Leaderboard</span>
          <span className="sm:hidden">Board</span>
        </Button>
      </div>

      <Button
        onClick={() => setShowTutorial(true)}
        variant="outline"
        className="fixed bottom-4 left-4 z-50 bg-black/80 backdrop-blur-sm border-green-500 text-green-300 hover:bg-green-500/20 hover:text-white shadow-lg"
      >
        <BookOpen className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">How to Play</span>
        <span className="sm:hidden">Tutorial</span>
      </Button>

      <div className="max-w-xl w-full flex flex-col items-center justify-center" style={{ minHeight: '70vh' }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/60 backdrop-blur-md rounded-2xl p-6 text-center mb-8 border-2 border-amber-900/50">
          <h1 className="text-5xl mb-4 text-white font-bold md:text-6xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
            Tiny Gods
          </h1>
          <p className="text-lg md:text-2xl text-amber-200 font-semibold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            A Mythological Rogue-Like Card Battle
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-md">

          {!isLoggedIn && !isLoading ? (
            <div className="text-center space-y-4">
              <p className="text-lg font-medium text-white bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-amber-900/50 drop-shadow-lg">
                Sign in to save your progress and unlock permanent upgrades
              </p>
            </div>
          ) : (
            <div className="text-center space-y-3 bg-black/60 backdrop-blur-md rounded-xl p-6 border-2 border-amber-900/50">
              <p className="text-lg font-semibold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Choose a deity...</p>
              <p className="font-semibold text-amber-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Battle fearsome foes...</p>
              <p className="font-semibold text-amber-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Forge your adventure...</p>
            </div>
          )}

            <div className="space-y-4 pt-4">
              {activeRun && !isLoading && isLoggedIn &&
              <Button
                onClick={continueRun}
                size="lg"
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold text-xl py-8 shadow-2xl border-2 border-green-800">
                  <Play className="w-6 h-6 mr-2" />
                  Continue Run (Battle {activeRun.victories + 1})
                </Button>
              }

              <Button
                onClick={startNewRun}
                size="lg"
                variant={activeRun ? "secondary" : "default"}
                className={`w-full font-bold text-xl py-8 shadow-2xl ${!activeRun ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 hover:from-amber-700 hover:via-orange-700 hover:to-red-700 text-white border-2 border-amber-800' : 'bg-gray-700 hover:bg-gray-600 text-white border-2 border-gray-800'}`}>
                <Swords className="w-6 h-6 mr-2" />
                {isLoggedIn ? 'Begin New Run' : 'Sign In to Play'}
              </Button>
            </div>

            <div className="bg-black/60 backdrop-blur-md rounded-xl p-6 pt-6 grid grid-cols-3 gap-4 border-2 border-amber-900/50">
              <div className="text-center">
                <div className="w-12 h-12 bg-amber-600/30 rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-amber-600/60 backdrop-blur-sm">
                  <Swords className="w-6 h-6 text-amber-200" />
                </div>
                <div className="text-sm font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">12 Gods</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-amber-600/30 rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-amber-600/60 backdrop-blur-sm">
                  <Trophy className="w-6 h-6 text-amber-200" />
                </div>
                <div className="text-sm font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">Unique Cards</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-amber-600/30 rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-amber-600/60 backdrop-blur-sm">
                  <Trophy className="w-6 h-6 text-amber-200" />
                </div>
                <div className="text-sm font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">Epic Battles</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
  );
}
