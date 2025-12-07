
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Swords, Home as HomeIcon, Map, Trophy, Bug, Settings as SettingsIcon, ShoppingCart, Sparkles, User as UserIcon, Target, Menu, Crown, Gift, Heart, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import BugSubmissionModal from './components/game/BugSubmissionModal';
import OptionsModal from './components/game/OptionsModal';
import { base44 } from '@/api/base44Client';
import { useAudio, useAudioManager } from '@/components/hooks/useAudio';

const AUDIO_TRACKS = {
  Home: 'https://base44.app/api/apps/68e04136fbb307df3e4a61ec/files/public/68e04136fbb307df3e4a61ec/68b266aeb_TinyGodsMenu.wav',
  Combat: 'https://base44.app/api/apps/68e04136fbb307df3e4a61ec/files/public/68e04136fbb307df3e4a61ec/2a8839f17_TinyGodsCombat.wav',
  RunProgression: 'https://base44.app/api/apps/68e04136fbb307df3e4a61ec/files/public/68e04136fbb307df3e4a61ec/2089b71f7_TinyGodsProgression.mp3',
  GodSelection: 'https://base44.app/api/apps/68e04136fbb307df3e4a61ec/files/public/68e04136fbb307df3e4a61ec/920a4b418_TinyGodsGodSelection.mp3',
};

export default function Layout({ children, currentPageName }) {
  const [showBugModal, setShowBugModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [livesData, setLivesData] = useState(null);
  
  const { musicVolume, sfxVolume, setMusicVolume, setSfxVolume } = useAudioManager();
  
  const noNavPages = ['Home', 'Defeat', 'RunProgression'];
  const showNav = !noNavPages.includes(currentPageName);
  
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const runId = urlParams.get('runId');

  const currentTrack = AUDIO_TRACKS[currentPageName];
  const audio = useAudio(currentTrack, { loop: true, volume: musicVolume });

  useEffect(() => {
    if (currentTrack) {
      audio.play();
    } else {
      audio.stop();
    }
  }, [currentPageName, currentTrack]);

  useEffect(() => {
    audio.setVolume(musicVolume);
  }, [musicVolume]);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const user = await base44.auth.me();
        if (user && user.role === 'admin') {
          setIsAdmin(true);
        }
        
        // Check lives
        if (user) {
          const response = await base44.functions.invoke('checkLivesRecovery', {});
          setLivesData(response.data);
        }
      } catch (e) {
        // Not logged in
      }
    };
    checkAdmin();

    // Update lives every minute
    const interval = setInterval(async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          const response = await base44.functions.invoke('checkLivesRecovery', {});
          setLivesData(response.data);
        }
      } catch (e) {
        // Ignore errors
      }
    }, 60000); // Every 60 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white selection:bg-amber-500/50">
      <BugSubmissionModal open={showBugModal} onClose={() => setShowBugModal(false)} />
      <OptionsModal 
        open={showOptionsModal} 
        onClose={() => setShowOptionsModal(false)}
        musicVolume={musicVolume}
        sfxVolume={sfxVolume}
        onMusicVolumeChange={setMusicVolume}
        onSfxVolumeChange={setSfxVolume}
      />
      
      {showNav && (
        <header className="bg-black/50 backdrop-blur-sm border-b border-amber-600/40 p-4 sticky top-0 z-50">
          <nav className="max-w-7xl mx-auto flex justify-between items-center">
            <Link to={createPageUrl('Home')} className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 hover:opacity-80 transition-opacity">
              Tiny Gods
            </Link>
            
            <div className="flex items-center gap-3">
              {/* Lives Display */}
              {livesData && (
                <div className="flex items-center gap-2 bg-black/60 px-4 py-2 rounded-lg border border-red-500/50">
                  <div className="flex items-center gap-1">
                    {[...Array(livesData.maxLives)].map((_, i) => (
                      <Heart
                        key={i}
                        className={`w-4 h-4 ${i < livesData.lives ? 'text-red-500 fill-red-500' : 'text-gray-600'}`}
                      />
                    ))}
                  </div>
                  <span className="text-white font-bold text-sm">
                    {livesData.lives}/{livesData.maxLives}
                  </span>
                  {livesData.lives < livesData.maxLives && livesData.nextRecoveryIn && (
                    <span className="text-xs text-gray-400 hidden lg:inline">
                      +1 in {livesData.nextRecoveryIn}m
                    </span>
                  )}
                </div>
              )}

              {/* Main Actions - Always Visible */}
              <Link 
                to={createPageUrl('Home')} 
                className="hidden sm:flex items-center gap-2 text-amber-300 hover:text-white transition-colors font-semibold"
              >
                <HomeIcon className="w-5 h-5" />
                <span>Menu</span>
              </Link>

              {runId && currentPageName === 'Combat' && (
                <Link 
                  to={createPageUrl(`RunProgression?runId=${runId}`)} 
                  className="flex items-center gap-2 text-cyan-300 hover:text-white transition-colors font-semibold"
                >
                  <Map className="w-5 h-5" />
                  <span className="hidden sm:inline">Map</span>
                </Link>
              )}

              <Link 
                to={createPageUrl('GodSelection')} 
                className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 px-4 py-2 rounded-lg transition-all font-semibold shadow-lg"
              >
                <Swords className="w-5 h-5" />
                <span className="hidden sm:inline">New Run</span>
              </Link>

              {/* Dropdown Menu for Other Pages */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="border-purple-500 text-purple-300 hover:bg-purple-500/20 hover:text-white"
                  >
                    <Menu className="w-5 h-5 sm:mr-2" />
                    <span className="hidden sm:inline">More</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-black/95 border-purple-500 w-56">
                  <DropdownMenuLabel className="text-purple-300">Player Menu</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-purple-500/30" />
                  
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Profile')} className="flex items-center gap-2 cursor-pointer text-white hover:bg-purple-500/20">
                      <UserIcon className="w-4 h-4 text-purple-400" />
                      Profile
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('PantheonHall')} className="flex items-center gap-2 cursor-pointer text-white hover:bg-purple-500/20">
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      Pantheon Lore
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Quests')} className="flex items-center gap-2 cursor-pointer text-white hover:bg-purple-500/20">
                      <Target className="w-4 h-4 text-green-400" />
                      Quests
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Achievements')} className="flex items-center gap-2 cursor-pointer text-white hover:bg-purple-500/20">
                      <Trophy className="w-4 h-4 text-yellow-400" />
                      Achievements
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Leaderboard')} className="flex items-center gap-2 cursor-pointer text-white hover:bg-purple-500/20">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      Leaderboard
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-purple-500/30" />
                  <DropdownMenuLabel className="text-purple-300">Shops & Rewards</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-purple-500/30" />

                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('HallOfEchoes')} className="flex items-center gap-2 cursor-pointer text-white hover:bg-purple-500/20">
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                      Hall of Echoes
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('RewardsShop')} className="flex items-center gap-2 cursor-pointer text-white hover:bg-purple-500/20">
                      <Gift className="w-4 h-4 text-pink-400" />
                      Rewards Shop
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Store')} className="flex items-center gap-2 cursor-pointer text-white hover:bg-purple-500/20">
                      <ShoppingCart className="w-4 h-4 text-purple-400" />
                      Cash Store
                    </Link>
                  </DropdownMenuItem>

                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator className="bg-purple-500/30" />
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl('AdminPanel')} className="flex items-center gap-2 cursor-pointer text-white hover:bg-cyan-500/20">
                          <Crown className="w-4 h-4 text-cyan-400" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </nav>
        </header>
      )}
      
      <Button
        onClick={() => setShowOptionsModal(true)}
        className="fixed top-4 left-4 z-50 bg-black/80 hover:bg-black/90 text-white shadow-xl border border-amber-500/50"
        size="icon"
      >
        <SettingsIcon className="w-5 h-5" />
      </Button>
      
      <Button
        onClick={() => setShowBugModal(true)}
        className="fixed bottom-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white shadow-xl"
        size="icon"
      >
        <Bug className="w-5 h-5" />
      </Button>
      
      <main className={showNav ? '' : 'h-full'}>
        {children}
      </main>
    </div>
  );
}
