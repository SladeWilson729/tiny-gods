
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function RunProgression() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const runId = urlParams.get('runId');

  const [run, setRun] = useState(null);
  const [god, setGod] = useState(null);
  const [equippedGodArt, setEquippedGodArt] = useState(null); // Added state for equipped god art
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nodePositions, setNodePositions] = useState([]);
  const [totalBattles, setTotalBattles] = useState(10); // Default to 10, will be updated based on run data

  // The initial useEffect for nodePositions is removed, as positions are now generated dynamically
  // within the data loading useEffect based on `totalBattles`.

  useEffect(() => {
    if (!runId) {
      console.log("[RunProgression] No runId provided, redirecting to Home");
      navigate(createPageUrl('Home'));
      return;
    }

    const loadData = async () => {
      try {
        console.log("=== RUN PROGRESSION LOADING ===");
        console.log("[RunProgression] Loading run data for runId:", runId);
        const runData = await base44.entities.GameRun.get(runId);
        
        if (!runData) {
          console.error("[RunProgression] Run not found");
          setError("Run not found");
          setIsLoading(false);
          return;
        }
        
        console.log("[RunProgression] Run data loaded:", {
          id: runData.id,
          status: runData.status,
          victories: runData.victories,
          god_id: runData.god_id,
          is_custom_deck_mode: runData.is_custom_deck_mode // Added custom deck mode
        });

        // Set total battles based on custom deck mode
        const battles = runData.is_custom_deck_mode ? 20 : 10;
        setTotalBattles(battles);
        
        // Regenerate node positions for the correct number of battles
        // Spread nodes across 90% width, starting at 5% from left.
        const positions = Array.from({ length: battles }).map((_, i) => ({
          left: `${5 + i * (90 / battles)}%`,
          top: `${40 + (i % 2 === 0 ? -15 : 15) * Math.sin(i * Math.PI / 3)}%`,
        }));
        setNodePositions(positions);

        // Check status BEFORE setting run
        if (runData.status !== 'in_progress') {
          console.error("[RunProgression] Run status is not 'in_progress':", runData.status);
          console.error("[RunProgression] This should not happen! Redirecting to Home");
          navigate(createPageUrl('Home'));
          return;
        }
        
        if (!runData.god_id) {
          console.error("[RunProgression] Run has no god_id");
          setError("Invalid run data");
          setIsLoading(false);
          return;
        }
        
        console.log("[RunProgression] Loading god data for god_id:", runData.god_id);
        const godData = await base44.entities.God.get(runData.god_id);
        
        if (!godData) {
          console.error("[RunProgression] God not found");
          setError("God not found");
          setIsLoading(false);
          return;
        }
        
        console.log("[RunProgression] ✓ God data loaded:", godData.name);
        
        setRun(runData);
        setGod(godData);
        setError(null);

        // Load equipped god art
        const user = await base44.auth.me();
        if (user?.equipped_cosmetics?.god_art) {
          const godArts = user.equipped_cosmetics.god_art;
          
          // Check if it's the new object format or old string format
          if (typeof godArts === 'object' && !Array.isArray(godArts)) {
            // New format: { "Zeus": "art_id", "Thor": "art_id" }
            const artIdForThisGod = godArts[godData.name] || godArts[godData.id];
            if (artIdForThisGod) {
              const godArtCosmetic = await base44.entities.CosmeticReward.get(artIdForThisGod);
              if (godArtCosmetic) {
                setEquippedGodArt(godArtCosmetic.asset_url);
              }
            }
          } else if (typeof godArts === 'string') {
            // Old format: single ID - still support it
            const godArtCosmetic = await base44.entities.CosmeticReward.get(godArts);
            if (godArtCosmetic && (godArtCosmetic.target_id === godData.id || godArtCosmetic.target_name === godData.name)) {
              setEquippedGodArt(godArtCosmetic.asset_url);
            }
          }
        }

      } catch (error) {
        console.error("[RunProgression] Failed to load progression data", error);
        setError(error.message || "Failed to load progression data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [runId, navigate]);
  
  const handleContinue = () => {
    console.log("[RunProgression] Continuing to next battle, runId:", runId);
    navigate(createPageUrl(`Combat?runId=${runId}`));
  };
  
  const handleReturnHome = () => {
    navigate(createPageUrl('Home'));
  };

  if (isLoading || nodePositions.length === 0) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-black">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-white text-lg">Loading progression...</p>
        </div>
      </div>
    );
  }

  if (error || !run || !god) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black p-6 flex items-center justify-center">
        <Card className="bg-black/60 border-red-700 p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Error Loading Run</h2>
          <p className="text-gray-300 mb-6">{error || "Failed to load run data"}</p>
          <Button 
            onClick={handleReturnHome}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            Return to Main Menu
          </Button>
        </Card>
      </div>
    );
  }

  const victories = run.victories || 0;
  // godPosition now directly returns { left, top }
  const godPosition = victories > 0 ? nodePositions[victories - 1] : { top: '40%', left: '-5%' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-6 flex flex-col items-center justify-center">
      <div className="max-w-6xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 mb-2 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
            Battle {victories} Complete!
          </h1>
          <p className="text-xl text-purple-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            {totalBattles - victories} battles remaining
          </p>
          {run?.is_custom_deck_mode && (
            <p className="text-sm text-cyan-400 mt-2">⚔️ Custom Deck Mode - {totalBattles} Battle Challenge</p>
          )}
          {victories > 0 && victories % 3 === 0 && (
            <p className="text-sm text-yellow-300 mt-2">✨ Relic awarded! Check your collection.</p>
          )}
        </motion.div>

        <div className="w-full max-w-5xl h-48 sm:h-64 relative mb-8 mx-auto">
          {/* Dotted lines connecting nodes */}
          {nodePositions.slice(0, -1).map((pos, i) => {
            const nextPos = nodePositions[i + 1];
            const posLeft = parseFloat(pos.left);
            const posTop = parseFloat(pos.top);
            const nextPosLeft = parseFloat(nextPos.left);
            const nextPosTop = parseFloat(nextPos.top);

            const angleRad = Math.atan2(
              (nextPosTop - posTop),
              (nextPosLeft - posLeft)
            );
            const angle = angleRad * 180 / Math.PI;

            const distance = Math.sqrt(
              Math.pow((nextPosLeft - posLeft), 2) +
              Math.pow((nextPosTop - posTop), 2)
            );
            
            return (
              <div
                key={`line-${i}`}
                className="absolute bg-repeat-x bg-center h-px origin-left"
                style={{
                  top: `calc(${pos.top} + 1.5rem)`, 
                  left: `calc(${pos.left} + 1.5rem)`,
                  width: `${distance}%`, 
                  transform: `rotate(${angle}deg)`,
                  backgroundImage: `radial-gradient(circle at center, ${i < victories ? 'rgba(234, 179, 8, 0.7)' : 'rgba(129, 140, 248, 0.4)'} 2px, transparent 2px)`,
                  backgroundSize: '10px 10px',
                }}
              />
            );
          })}

          {/* Nodes */}
          {nodePositions.map((pos, i) => {
            const isCompleted = i < victories;
            return (
              <motion.div
                key={`node-${i}`}
                className="absolute w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold text-2xl transition-all duration-500 text-white"
                style={{ ...pos }}
                initial={{ scale: 0 }}
                animate={{
                  scale: 1,
                  borderColor: isCompleted ? '#FBBF24' : '#6366F1',
                  backgroundColor: isCompleted ? 'rgba(251, 191, 36, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                {isCompleted ? <CheckCircle className="text-yellow-400"/> : i + 1}
              </motion.div>
            );
          })}
          
          {/* God Avatar Moving Along Path (Combined existing movement with new styling and pulse) */}
          <AnimatePresence>
            <motion.div
              className="absolute w-20 h-20 rounded-full border-4 border-amber-500 overflow-hidden shadow-2xl z-10"
              initial={{ top: victories > 1 ? nodePositions[victories - 2].top : '40%', left: victories > 1 ? nodePositions[victories - 2].left : '-5%' }}
              animate={{
                top: godPosition.top,
                left: godPosition.left,
                scale: [1, 1.05, 1], // Pulse animation
              }}
              transition={{
                top: { type: 'spring', stiffness: 100, damping: 20, delay: 0.5 }, // Movement transition for top
                left: { type: 'spring', stiffness: 100, damping: 20, delay: 0.5 }, // Movement transition for left
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" } // Pulse transition for scale
              }}
              style={{
                transform: 'translate(4px, 4px)', // Retain existing slight offset for alignment
                boxShadow: '0 0 40px rgba(251, 191, 36, 0.8), 0 0 80px rgba(251, 191, 36, 0.4)' // New shadow
              }}
            >
              <img 
                src={equippedGodArt || god.image} // Use equippedGodArt state
                alt={god.name} 
                className="w-full h-full object-cover"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 1.5 } }} className="text-center">
          <Button
            onClick={handleContinue}
            size="lg"
            className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold text-xl px-12 py-6"
          >
            Claim Rewards & Continue
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
