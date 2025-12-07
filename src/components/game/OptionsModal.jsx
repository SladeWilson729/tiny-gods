import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Volume2, Music, User, Check, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';

export default function OptionsModal({ open, onClose, musicVolume, sfxVolume, onMusicVolumeChange, onSfxVolumeChange }) {
  const [gods, setGods] = useState([]);
  const [isLoadingGods, setIsLoadingGods] = useState(false);
  const [currentProfilePicture, setCurrentProfilePicture] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadGods();
      loadCurrentUser();
    }
  }, [open]);

  const loadGods = async () => {
    setIsLoadingGods(true);
    try {
      const allGods = await base44.entities.God.list();
      setGods(allGods);
    } catch (error) {
      console.error("Failed to load gods:", error);
    } finally {
      setIsLoadingGods(false);
    }
  };

  const loadCurrentUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentProfilePicture(user.profile_picture || null);
    } catch (error) {
      console.error("Failed to load user:", error);
    }
  };

  const handleSelectProfilePicture = async (imageUrl) => {
    setIsSaving(true);
    try {
      await base44.auth.updateMe({ profile_picture: imageUrl });
      setCurrentProfilePicture(imageUrl);
    } catch (error) {
      console.error("Failed to save profile picture:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-800 to-black border-amber-600 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">
            Options
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="audio" className="w-full">
          <TabsList className="w-full bg-black/40 mb-4">
            <TabsTrigger value="audio" className="flex-1 data-[state=active]:bg-amber-600">
              <Volume2 className="w-4 h-4 mr-2" />
              Audio
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex-1 data-[state=active]:bg-amber-600">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="audio" className="space-y-6">
            {/* Music Volume */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-amber-400" />
                <Label className="text-lg text-white">Music Volume</Label>
              </div>
              <Slider
                value={[musicVolume * 100]}
                onValueChange={(value) => onMusicVolumeChange(value[0] / 100)}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="text-right text-sm text-gray-400">{Math.round(musicVolume * 100)}%</div>
            </div>

            {/* SFX Volume */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-amber-400" />
                <Label className="text-lg text-white">Sound Effects Volume</Label>
              </div>
              <Slider
                value={[sfxVolume * 100]}
                onValueChange={(value) => onSfxVolumeChange(value[0] / 100)}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="text-right text-sm text-gray-400">{Math.round(sfxVolume * 100)}%</div>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <div>
              <Label className="text-lg text-white mb-3 block">Select Profile Picture</Label>
              <p className="text-sm text-gray-400 mb-4">Choose any god's image as your profile picture</p>
              
              {isLoadingGods ? (
                <div className="flex justify-center items-center h-48">
                  <Loader2 className="w-12 h-12 animate-spin text-amber-400" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto p-2">
                  {gods.map((god, index) => (
                    <motion.div
                      key={god.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative"
                    >
                      <button
                        onClick={() => handleSelectProfilePicture(god.image)}
                        disabled={isSaving}
                        className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          currentProfilePicture === god.image
                            ? 'border-green-500 ring-4 ring-green-500/50'
                            : 'border-amber-600 hover:border-amber-400'
                        } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                      >
                        <img 
                          src={god.image} 
                          alt={god.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-center pb-2">
                          <span className="text-white text-xs font-bold">{god.name}</span>
                        </div>
                        {currentProfilePicture === god.image && (
                          <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}