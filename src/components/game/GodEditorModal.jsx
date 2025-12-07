
import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, UploadCloud, Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function GodEditorModal({ open, onClose, gods, onUpdate }) {
  const [uploadingId, setUploadingId] = useState(null);
  const [gameSettings, setGameSettings] = useState(null);
  const [selectedGod, setSelectedGod] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [editingGodInfo, setEditingGodInfo] = useState(false);
  const fileInputRefs = useRef({});

  useEffect(() => {
    if (open) {
      const loadGameSettings = async () => {
        try {
          const settings = await base44.entities.GameSettings.list();
          if (settings.length > 0) {
            setGameSettings(settings[0]);
          } else {
            const newSettings = await base44.entities.GameSettings.create({
              strike_card_image: null,
              defend_card_image: null,
              heal_card_image: null // Initialize heal_card_image
            });
            setGameSettings(newSettings);
          }
        } catch (e) {
          console.error("Failed to load game settings:", e);
          setGameSettings({});
        }
      };
      loadGameSettings();
    }
  }, [open]);

  const handleGodImageChange = async (god, event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingId(`god-${god.id}`);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.God.update(god.id, { image: file_url });
      onUpdate();
    } catch (error) {
      console.error("Failed to upload god image:", error);
    } finally {
      setUploadingId(null);
    }
  };
  
  const handleCardImageChange = async (god, cardIndex, event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingId(`card-${god.id}-${cardIndex}`);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const newCards = [...god.cards];
      newCards[cardIndex] = { ...newCards[cardIndex], image: file_url };
      await base44.entities.God.update(god.id, { cards: newCards });
      onUpdate();
    } catch (error) {
      console.error("Failed to upload card image:", error);
    } finally {
      setUploadingId(null);
    }
  };

  const handleCommonCardImageChange = async (cardType, event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingId(`common-${cardType}`);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const fieldName = `${cardType}_card_image`;
      await base44.entities.GameSettings.update(gameSettings.id, { [fieldName]: file_url });
      setGameSettings(prev => ({ ...prev, [fieldName]: file_url }));
    } catch (error) {
      console.error(`Failed to upload ${cardType} image:`, error);
    } finally {
      setUploadingId(null);
    }
  };

  const handleUpdateGodInfo = async (godId, updates) => {
    try {
      await base44.entities.God.update(godId, updates);
      onUpdate();
      setEditingGodInfo(false);
    } catch (error) {
      console.error("Failed to update god info:", error);
    }
  };

  const handleAddCard = async (god) => {
    const newCard = {
      name: "New Card",
      type: "damage",
      value: 5,
      cost: 1,
      description: "A new card effect",
      gradient: "bg-gradient-to-br from-purple-500 to-indigo-500",
      image: "",
      healValue: 0,
      shieldValue: 0,
      energyReturn: 0,
      drawCards: 0,
      discardCards: 0,
      selfDamage: 0,
      nextAttackBonus: 0,
      nextAttackBonusPercent: 0,
      nextCardDiscount: 0,
      applyBurn: 0,
      applyPoison: 0,
      applyVulnerable: false,
      damageReflection: 0,
      applyStun: false,
      applyConfused: 0,
      comboType: '',
      comboBonus: 0,
      chargeValue: 0,
      applyLeech: false,
      hasSurge: false,
      debuffAmplify: '', 
      knowledgeType: '', // Added new field
      knowledgeValue: 0, // Added new field
    };
    
    const newCards = [...god.cards];
    newCards.push(newCard);
    await base44.entities.God.update(god.id, { cards: newCards });
    onUpdate();
  };

  const handleUpdateCard = async (god, cardIndex, updates) => {
    const newCards = [...god.cards];
    newCards[cardIndex] = { ...newCards[cardIndex], ...updates };
    await base44.entities.God.update(god.id, { cards: newCards });
    onUpdate();
    setEditingCard(null);
  };

  const handleDeleteCard = async (god, cardIndex) => {
    if (!confirm('Are you sure you want to delete this card?')) return;
    
    const newCards = god.cards.filter((_, i) => i !== cardIndex);
    await base44.entities.God.update(god.id, { cards: newCards });
    onUpdate();
  };

  const triggerFileInput = (id) => {
    fileInputRefs.current[id]?.click();
  };

  const isVideo = (url) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return lowerUrl.endsWith('.mp4') || lowerUrl.endsWith('.webm') || lowerUrl.endsWith('.mov');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] bg-gradient-to-br from-indigo-950 via-purple-950 to-black border-purple-700 text-white flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white">God & Card Editor</DialogTitle>
          <DialogDescription className="text-gray-300">
            Customize gods, their abilities, and card decks. Upload images or videos (MP4, WebM, MOV).
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="gods" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="bg-black/40">
            <TabsTrigger value="gods" className="text-white">Gods & Stats</TabsTrigger>
            <TabsTrigger value="cards" className="text-white">Card Decks</TabsTrigger>
            <TabsTrigger value="common" className="text-white">Common Cards</TabsTrigger>
          </TabsList>

          <TabsContent value="gods" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6 pb-6">
                {gods.map(god => (
                  <Card key={god.id} className="bg-black/30 border-purple-800 p-6">
                    <div className="flex gap-6">
                      <div className="w-48 flex-shrink-0">
                        {isVideo(god.image) ? (
                          <video 
                            src={god.image} 
                            className="w-full h-48 object-cover rounded-lg mb-2"
                            autoPlay
                            loop
                            muted
                            playsInline
                          />
                        ) : (
                          <img src={god.image} alt={god.name} className="w-full h-48 object-cover rounded-lg mb-2" />
                        )}
                        <input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" className="hidden" ref={el => (fileInputRefs.current[`god-${god.id}`] = el)} onChange={(e) => handleGodImageChange(god, e)} />
                        <Button onClick={() => triggerFileInput(`god-${god.id}`)} variant="outline" size="sm" className="w-full text-white border-purple-500 hover:bg-purple-500/20" disabled={uploadingId === `god-${god.id}`}>
                          {uploadingId === `god-${god.id}` ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                          Change Image/Video
                        </Button>
                      </div>
                      
                      <div className="flex-1 space-y-4">
                        {editingGodInfo === god.id ? (
                          <GodInfoEditor 
                            god={god} 
                            onSave={(updates) => handleUpdateGodInfo(god.id, updates)}
                            onCancel={() => setEditingGodInfo(false)}
                          />
                        ) : (
                          <>
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-2xl font-bold text-purple-300">{god.name}</h3>
                                <p className="text-gray-300 mt-1">{god.description}</p>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => setEditingGodInfo(god.id)} className="text-white hover:bg-purple-500/20">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-black/40 p-3 rounded">
                                <div className="text-xs text-gray-400">Base Health</div>
                                <div className="text-xl font-bold text-white">{god.baseHealth}</div>
                              </div>
                              <div className="bg-black/40 p-3 rounded">
                                <div className="text-xs text-gray-400">Base Energy</div>
                                <div className="text-xl font-bold text-white">{god.baseEnergy || 3}</div>
                              </div>
                            </div>
                            
                            <div className="bg-black/40 p-3 rounded">
                                <div className="text-xs text-gray-400">Playstyle</div>
                                <div className="text-sm text-white">{god.playstyle}</div>
                            </div>

                            <div className="bg-purple-900/30 p-4 rounded border border-purple-700">
                              <div className="text-xs text-purple-300 font-bold mb-1">⚡ Static Ability</div>
                              <div className="text-sm text-white">{god.static_ability || "No ability defined"}</div>
                            </div>

                            <div className="bg-purple-900/30 p-4 rounded border border-purple-700">
                              <div className="text-xs text-purple-300 font-bold mb-1">Starting Deck</div>
                              <div className="text-sm text-white">
                                Strikes: {god.startingDeck?.strikes || 5},
                                Defends: {god.startingDeck?.defends || 3},
                                Heals: {god.startingDeck?.heals || 2}
                                (Total: {(god.startingDeck?.strikes || 5) + (god.startingDeck?.defends || 3) + (god.startingDeck?.heals || 2)} cards)
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="cards" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-8 pb-6">
                {gods.map(god => (
                  <Card key={god.id} className="bg-black/30 border-purple-800 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-purple-300">{god.name}'s Deck</h3>
                      <Button onClick={() => handleAddCard(god)} size="sm" className="text-white bg-purple-600 hover:bg-purple-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Card
                      </Button>
                    </div>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {god.cards.map((card, index) => (
                        <Card key={index} className="bg-black/40 border-purple-900 p-4">
                          {editingCard === `${god.id}-${index}` ? (
                            <CardEditor
                              card={card}
                              onSave={(updates) => handleUpdateCard(god, index, updates)}
                              onCancel={() => setEditingCard(null)}
                            />
                          ) : (
                            <>
                              <div className="flex gap-3 mb-3">
                                <div className="w-16 h-20 rounded bg-gray-700 overflow-hidden flex-shrink-0">
                                  {card.image && (
                                    isVideo(card.image) ? (
                                      <video 
                                        src={card.image} 
                                        className="w-full h-full object-cover"
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                      />
                                    ) : (
                                      <img src={card.image} alt={card.name} className="w-full h-full object-cover"/>
                                    )
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-white truncate">{card.name}</h4>
                                  <div className="text-xs text-gray-400 space-y-1">
                                    <div>Type: {card.type}</div>
                                    <div>Value: {card.value} | Cost: {card.cost}</div>
                                    {card.healValue > 0 && <div className="text-green-400">Heal: {card.healValue}</div>}
                                    {card.shieldValue > 0 && <div className="text-blue-400">Shield: {card.shieldValue}</div>}
                                    {typeof card.energyReturn === 'number' && card.energyReturn !== 0 && <div className="text-yellow-400">Energy Return: {card.energyReturn > 0 ? '+' : ''}{card.energyReturn}</div>}
                                    {typeof card.drawCards === 'number' && card.drawCards > 0 && <div className="text-blue-400">Draw: {card.drawCards} card{card.drawCards !== 1 ? 's' : ''}</div>}
                                    {typeof card.discardCards === 'number' && card.discardCards > 0 && <div className="text-red-400">Discard: {card.discardCards} card{card.discardCards !== 1 ? 's' : ''}</div>}
                                    {typeof card.selfDamage === 'number' && card.selfDamage > 0 && <div className="text-red-400">Self Damage: {card.selfDamage}</div>}
                                    {typeof card.nextAttackBonus === 'number' && card.nextAttackBonus > 0 && <div className="text-orange-400">Next Attack +{card.nextAttackBonus}</div>}
                                    {typeof card.nextAttackBonusPercent === 'number' && card.nextAttackBonusPercent > 0 && <div className="text-orange-400">Next Attack +{card.nextAttackBonusPercent}%</div>}
                                    {typeof card.nextCardDiscount === 'number' && card.nextCardDiscount > 0 && <div className="text-cyan-400">Next Card -{card.nextCardDiscount} Cost</div>}
                                    {typeof card.applyBurn === 'number' && card.applyBurn > 0 && <div className="text-orange-600">Burn: {card.applyBurn} dmg/turn</div>}
                                    {typeof card.applyPoison === 'number' && card.applyPoison > 0 && <div className="text-green-600">Poison: {card.applyPoison} stack{card.applyPoison !== 1 ? 's' : ''} (2 dmg/stack/turn)</div>}
                                    {card.applyVulnerable && <div className="text-pink-400">Vulnerable (+50% dmg)</div>}
                                    {typeof card.damageReflection === 'number' && card.damageReflection > 0 && <div className="text-indigo-400">Reflect: {card.damageReflection}%</div>}
                                    {card.applyStun && <div className="text-yellow-500">Stun (lose 50% dmg)</div>}
                                    {typeof card.applyConfused === 'number' && card.applyConfused > 0 && <div className="text-purple-400">Confused: {card.applyConfused} turn{card.applyConfused !== 1 ? 's' : ''}</div>}
                                    {card.comboType && card.comboBonus > 0 && (
                                      <div className="text-lime-400">Combo: +{card.comboBonus} {card.comboType}</div>
                                    )}
                                    {typeof card.chargeValue === 'number' && card.chargeValue > 0 && (
                                      <div className="text-yellow-300">⚡ Charge: +{card.chargeValue} (per turn in hand)</div>
                                    )}
                                    {card.applyLeech && <div className="text-red-300">🩸 Leech (100% healing from damage)</div>}
                                    {card.hasSurge && <div className="text-cyan-300">🌊 Surge (x2 when last card)</div>}
                                    {card.debuffAmplify && <div className="text-purple-300">⬆️ Debuff Amplify: {card.debuffAmplify}</div>}
                                    {card.knowledgeType && card.knowledgeValue > 0 && (
                                      <div className="text-cyan-300">📚 Knowledge: +{card.knowledgeValue} {card.knowledgeType} per card in hand</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <p className="text-xs text-gray-300 mb-3 line-clamp-2">{card.description}</p>
                              
                              <div className="flex gap-2">
                                <input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" className="hidden" ref={el => (fileInputRefs.current[`card-${god.id}-${index}`] = el)} onChange={(e) => handleCardImageChange(god, index, e)} />
                                <Button onClick={() => triggerFileInput(`card-${god.id}-${index}`)} size="sm" variant="outline" className="flex-1 text-white border-purple-500 hover:bg-purple-500/20" disabled={uploadingId === `card-${god.id}-${index}`}>
                                  {uploadingId === `card-${god.id}-${index}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <UploadCloud className="w-3 h-3" />}
                                </Button>
                                <Button onClick={() => setEditingCard(`${god.id}-${index}`)} size="sm" variant="outline" className="text-white border-purple-500 hover:bg-purple-500/20">
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button onClick={() => handleDeleteCard(god, index)} size="sm" variant="destructive">
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </>
                          )}
                        </Card>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="common" className="flex-1">
            {gameSettings && (
              <div className="space-y-6">
                <h4 className="text-xl font-bold text-purple-300">Common Cards (Global)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-black/30 border-purple-800 p-6">
                    {isVideo(gameSettings.strike_card_image) ? (
                      <video 
                        src={gameSettings.strike_card_image} 
                        className="w-full h-48 object-cover rounded mb-4"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    ) : (
                      <img src={gameSettings.strike_card_image || 'https://via.placeholder.com/300x400.png/1a1b2c/808080?text=Strike'} alt="Strike Card" className="w-full h-48 object-cover rounded mb-4" />
                    )}
                    <h4 className="font-bold text-lg mb-2 text-white">Strike</h4>
                    <p className="text-xs text-gray-400 mb-4">Default attack card for all gods</p>
                    <input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" className="hidden" ref={el => (fileInputRefs.current['common-strike'] = el)} onChange={(e) => handleCommonCardImageChange('strike', e)} />
                    <Button onClick={() => triggerFileInput('common-strike')} variant="outline" size="sm" className="w-full text-white border-purple-500 hover:bg-purple-500/20" disabled={uploadingId === 'common-strike'}>
                      {uploadingId === 'common-strike' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                      Change Image/Video
                    </Button>
                  </Card>
                  
                  <Card className="bg-black/30 border-purple-800 p-6">
                    {isVideo(gameSettings.defend_card_image) ? (
                      <video 
                        src={gameSettings.defend_card_image} 
                        className="w-full h-48 object-cover rounded mb-4"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    ) : (
                      <img src={gameSettings.defend_card_image || 'https://via.placeholder.com/300x400.png/1a1b2c/808080?text=Defend'} alt="Defend Card" className="w-full h-48 object-cover rounded mb-4" />
                    )}
                    <h4 className="font-bold text-lg mb-2 text-white">Defend</h4>
                    <p className="text-xs text-gray-400 mb-4">Default defense card for all gods</p>
                    <input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" className="hidden" ref={el => (fileInputRefs.current['common-defend'] = el)} onChange={(e) => handleCommonCardImageChange('defend', e)} />
                    <Button onClick={() => triggerFileInput('common-defend')} variant="outline" size="sm" className="w-full text-white border-purple-500 hover:bg-purple-500/20" disabled={uploadingId === 'common-defend'}>
                      {uploadingId === 'common-defend' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                      Change Image/Video
                    </Button>
                  </Card>

                  <Card className="bg-black/30 border-purple-800 p-6">
                    {isVideo(gameSettings.heal_card_image) ? (
                      <video 
                        src={gameSettings.heal_card_image} 
                        className="w-full h-48 object-cover rounded mb-4"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    ) : (
                      <img src={gameSettings.heal_card_image || 'https://via.placeholder.com/300x400.png/1a1b2c/808080?text=Heal'} alt="Heal Card" className="w-full h-48 object-cover rounded mb-4" />
                    )}
                    <h4 className="font-bold text-lg mb-2 text-white">Heal</h4>
                    <p className="text-xs text-gray-400 mb-4">Default healing card for all gods</p>
                    <input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" className="hidden" ref={el => (fileInputRefs.current['common-heal'] = el)} onChange={(e) => handleCommonCardImageChange('heal', e)} />
                    <Button onClick={() => triggerFileInput('common-heal')} variant="outline" size="sm" className="w-full text-white border-purple-500 hover:bg-purple-500/20" disabled={uploadingId === 'common-heal'}>
                      {uploadingId === 'common-heal' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                      Change Image/Video
                    </Button>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function GodInfoEditor({ god, onSave, onCancel }) {
  const [formData, setFormData] = React.useState({
    name: god.name,
    description: god.description,
    baseHealth: god.baseHealth,
    baseEnergy: god.baseEnergy || 3,
    playstyle: god.playstyle,
    static_ability: god.static_ability || "",
    startingDeck: god.startingDeck || { strikes: 5, defends: 3, heals: 2 }
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-semibold text-purple-300 mb-1 block">God Name</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="God Name"
          className="bg-black/40 border-purple-700 text-white placeholder:text-gray-400"
        />
      </div>
      
      <div>
        <label className="text-sm font-semibold text-purple-300 mb-1 block">Description</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Description"
          className="bg-black/40 border-purple-700 text-white placeholder:text-gray-400"
          rows={2}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold text-purple-300 mb-1 block">Base Health</label>
          <Input
            type="number"
            value={formData.baseHealth}
            onChange={(e) => setFormData({ ...formData, baseHealth: Number(e.target.value) })}
            placeholder="Base Health"
            className="bg-black/40 border-purple-700 text-white placeholder:text-gray-400"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-purple-300 mb-1 block">Base Energy</label>
          <Input
            type="number"
            value={formData.baseEnergy}
            onChange={(e) => setFormData({ ...formData, baseEnergy: Number(e.target.value) })}
            placeholder="Base Energy"
            className="bg-black/40 border-purple-700 text-white placeholder:text-gray-400"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-purple-300 mb-1 block">Playstyle</label>
        <Input
          value={formData.playstyle}
          onChange={(e) => setFormData({ ...formData, playstyle: e.target.value })}
          placeholder="Playstyle"
          className="bg-black/40 border-purple-700 text-white placeholder:text-gray-400"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-purple-300 mb-2 block">Starting Deck Composition</label>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">⚔️ Strikes</label>
            <Input
              type="number"
              min="0"
              value={formData.startingDeck.strikes}
              onChange={(e) => setFormData({ 
                ...formData, 
                startingDeck: { ...formData.startingDeck, strikes: Number(e.target.value) }
              })}
              className="bg-black/40 border-purple-700 text-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">🛡️ Defends</label>
            <Input
              type="number"
              min="0"
              value={formData.startingDeck.defends}
              onChange={(e) => setFormData({ 
                ...formData, 
                startingDeck: { ...formData.startingDeck, defends: Number(e.target.value) }
              })}
              className="bg-black/40 border-purple-700 text-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">💚 Heals</label>
            <Input
              type="number"
              min="0"
              value={formData.startingDeck.heals}
              onChange={(e) => setFormData({ 
                ...formData, 
                startingDeck: { ...formData.startingDeck, heals: Number(e.target.value) }
              })}
              className="bg-black/40 border-purple-700 text-white"
            />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Total cards: {formData.startingDeck.strikes + formData.startingDeck.defends + formData.startingDeck.heals}
        </p>
      </div>
      
      <div>
        <label className="text-sm font-semibold text-purple-300 mb-1 block">Static Ability Description</label>
        <Textarea
          value={formData.static_ability}
          onChange={(e) => setFormData({ ...formData, static_ability: e.target.value })}
          placeholder="Static Ability Description"
          className="bg-black/40 border-purple-700 text-white placeholder:text-gray-400"
          rows={3}
        />
      </div>
      
      <div className="flex gap-2">
        <Button onClick={() => onSave(formData)} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
        <Button onClick={onCancel} variant="outline" className="flex-1 text-white border-purple-500 hover:bg-purple-500/20">
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );
}

function CardEditor({ card, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: card.name,
    type: card.type,
    value: card.value,
    healValue: card.healValue || 0,
    shieldValue: card.shieldValue || 0,
    energyReturn: card.energyReturn || 0,
    drawCards: card.drawCards || 0,
    discardCards: card.discardCards || 0,
    selfDamage: card.selfDamage || 0,
    nextAttackBonus: card.nextAttackBonus || 0,
    nextAttackBonusPercent: card.nextAttackBonusPercent || 0,
    nextCardDiscount: card.nextCardDiscount || 0,
    applyBurn: card.applyBurn || 0,
    applyPoison: card.applyPoison || 0,
    applyVulnerable: card.applyVulnerable || false,
    damageReflection: card.damageReflection || 0,
    applyStun: card.applyStun || false,
    applyConfused: card.applyConfused || 0,
    comboType: card.comboType || '',
    comboBonus: card.comboBonus || 0,
    chargeValue: card.chargeValue || 0,
    applyLeech: card.applyLeech || false,
    hasSurge: card.hasSurge || false,
    debuffAmplify: card.debuffAmplify || '', 
    knowledgeType: card.knowledgeType || '', // Added new field
    knowledgeValue: card.knowledgeValue || 0, // Added new field
    cost: card.cost,
    description: card.description,
    gradient: card.gradient || "bg-gradient-to-br from-purple-500 to-indigo-500"
  });

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-semibold text-purple-300 mb-1 block">Card Name</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Card Name"
          className="bg-black/40 border-purple-700 text-sm text-white placeholder:text-gray-400"
        />
      </div>
      
      <div>
        <label className="text-xs font-semibold text-purple-300 mb-1 block">Card Type</label>
        <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
          <SelectTrigger className="bg-black/40 border-purple-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-black border-purple-700">
            <SelectItem value="damage" className="text-white">Damage</SelectItem>
            <SelectItem value="heal" className="text-white">Heal</SelectItem>
            <SelectItem value="shield" className="text-white">Shield</SelectItem>
            <SelectItem value="draw" className="text-white">Draw Cards</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-semibold text-purple-300 mb-1 block">Primary Value</label>
          <Input
            type="number"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
            placeholder="Value"
            className="bg-black/40 border-purple-700 text-sm text-white placeholder:text-gray-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-purple-300 mb-1 block">Energy Cost</label>
          <Input
            type="number"
            value={formData.cost}
            onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
            placeholder="Cost"
            className="bg-black/40 border-purple-700 text-sm text-white placeholder:text-gray-400"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs font-semibold text-green-300 mb-1 block">Bonus Heal</label>
          <Input
            type="number"
            value={formData.healValue}
            onChange={(e) => setFormData({ ...formData, healValue: Number(e.target.value) })}
            placeholder="0"
            className="bg-black/40 border-purple-700 text-sm text-white placeholder:text-gray-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-blue-300 mb-1 block">Bonus Shield</label>
          <Input 
            type="number"
            value={formData.shieldValue}
            onChange={(e) => setFormData({ ...formData, shieldValue: Number(e.target.value) })}
            placeholder="0"
            className="bg-black/40 border-purple-700 text-sm text-white placeholder:text-gray-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-yellow-300 mb-1 block">Energy Return</label>
          <Input
            type="number"
            value={formData.energyReturn}
            onChange={(e) => setFormData({ ...formData, energyReturn: Number(e.target.value) })}
            placeholder="0"
            className="bg-black/40 border-purple-700 text-sm text-white placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs font-semibold text-blue-300 mb-1 block">Draw Cards</label>
          <Input
            type="number"
            value={formData.drawCards}
            onChange={(e) => setFormData({ ...formData, drawCards: Number(e.target.value) })}
            placeholder="0"
            className="bg-black/40 border-purple-700 text-sm text-white placeholder:text-gray-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-300 mb-1 block">Discard Cards</label>
          <Input
            type="number"
            value={formData.discardCards}
            onChange={(e) => setFormData({ ...formData, discardCards: Number(e.target.value) })}
            placeholder="0"
            className="bg-black/40 border-purple-700 text-sm text-white placeholder:text-gray-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-red-300 mb-1 block">Self Damage</label>
          <Input
            type="number"
            value={formData.selfDamage}
            onChange={(e) => setFormData({ ...formData, selfDamage: Number(e.target.value) })}
            placeholder="0"
            className="bg-black/40 border-purple-700 text-sm text-white placeholder:text-gray-400"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-semibold text-orange-300 mb-1 block">Next Attack +DMG (Flat)</label>
          <Input
            type="number"
            value={formData.nextAttackBonus}
            onChange={(e) => setFormData({ ...formData, nextAttackBonus: Number(e.target.value) })}
            placeholder="0"
            className="bg-black/40 border-purple-700 text-sm text-white placeholder:text-gray-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-orange-300 mb-1 block">Next Attack +DMG (%)</label>
          <Input
            type="number"
            min="0"
            max="500"
            value={formData.nextAttackBonusPercent}
            onChange={(e) => setFormData({ ...formData, nextAttackBonusPercent: Number(e.target.value) })}
            className="bg-black/40 border-purple-700 text-sm text-white placeholder:text-gray-400"
            placeholder="e.g., 50 for +50% damage"
          />
          <p className="text-xs text-gray-500 mt-1">Next attack deals X% more damage (e.g., 50 = +50%, 100 = double)</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-semibold text-cyan-300 mb-1 block">Next Card -Cost</label>
          <Input
            type="number"
            value={formData.nextCardDiscount}
            onChange={(e) => setFormData({ ...formData, nextCardDiscount: Number(e.target.value) })}
            placeholder="0"
            className="bg-black/40 border-purple-700 text-sm text-white placeholder:text-gray-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-orange-600 mb-1 block">Burn (dmg/turn)</label>
          <Input
            type="number"
            value={formData.applyBurn}
            onChange={(e) => setFormData({ ...formData, applyBurn: Number(e.target.value) })}
            placeholder="0"
            className="bg-black/40 border-purple-700 text-sm text-white placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-semibold text-green-600 mb-1 block">Poison (stacks)</label>
          <Input
            type="number"
            value={formData.applyPoison}
            onChange={(e) => setFormData({ ...formData, applyPoison: Number(e.target.value) })}
            placeholder="0"
            className="bg-black/40 border-purple-700 text-sm text-white placeholder:text-gray-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-pink-400 mb-1 block">Apply Vulnerable</label>
          <Select 
            value={formData.applyVulnerable ? "true" : "false"} 
            onValueChange={(value) => setFormData({ ...formData, applyVulnerable: value === "true" })}
          >
            <SelectTrigger className="bg-black/40 border-purple-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-black border-purple-700">
              <SelectItem value="false" className="text-white">No</SelectItem>
              <SelectItem value="true" className="text-white">Yes (+50% dmg)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-semibold text-indigo-400 mb-1 block">Damage Reflection (%)</label>
          <Input
            type="number"
            value={formData.damageReflection}
            onChange={(e) => setFormData({ ...formData, damageReflection: Number(e.target.value) })}
            placeholder="0"
            className="bg-black/40 border-purple-700 text-sm text-white placeholder:text-gray-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-yellow-600 mb-1 block">Apply Stun</label>
          <Select 
            value={formData.applyStun ? "true" : "false"} 
            onValueChange={(value) => setFormData({ ...formData, applyStun: value === "true" })}
          >
            <SelectTrigger className="bg-black/40 border-purple-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-black border-purple-700">
              <SelectItem value="false" className="text-white">No</SelectItem>
              <SelectItem value="true" className="text-white">Yes (-50% dmg)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-semibold text-purple-400 mb-1 block">Apply Confused (stacks)</label>
          <Input
            type="number"
            value={formData.applyConfused}
            onChange={(e) => setFormData({ ...formData, applyConfused: Number(e.target.value) })}
            placeholder="0"
            className="bg-black/40 border-purple-700 text-sm text-white placeholder:text-gray-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-purple-300 mb-1 block">Combo Type</label>
          <Select value={formData.comboType} onValueChange={(value) => setFormData({ ...formData, comboType: value })}>
            <SelectTrigger className="bg-black/40 border-purple-700 text-white">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent className="bg-black border-purple-700">
              <SelectItem value={null} className="text-white">None</SelectItem>
              <SelectItem value="damage" className="text-white">Damage</SelectItem>
              <SelectItem value="shield" className="text-white">Shield</SelectItem>
              <SelectItem value="heal" className="text-white">Heal</SelectItem>
              <SelectItem value="draw" className="text-white">Draw</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-semibold text-purple-300 mb-1 block">Combo Bonus</label>
          <Input
            type="number"
            value={formData.comboBonus}
            onChange={(e) => setFormData({ ...formData, comboBonus: Number(e.target.value) })}
            placeholder="0"
            disabled={!formData.comboType}
            className="bg-black/40 border-purple-700 text-sm text-white placeholder:text-gray-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-yellow-300 mb-1 block">⚡ Charge Value (Per Turn in Hand)</label>
          <Input
            type="number"
            value={formData.chargeValue}
            onChange={(e) => setFormData({ ...formData, chargeValue: Number(e.target.value) })}
            placeholder="0"
            className="bg-black/40 border-purple-700 text-sm text-white placeholder:text-gray-400"
          />
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-1">
        Gains +X to primary effect for each turn this card stays in hand (e.g., 2 = +2 per turn)
      </p>

      <div>
        <label className="text-xs font-semibold text-red-300 mb-1 block">Apply Leech</label>
        <Select 
          value={formData.applyLeech ? "true" : "false"} 
          onValueChange={(value) => setFormData({ ...formData, applyLeech: value === "true" })}
        >
          <SelectTrigger className="bg-black/40 border-purple-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-black border-purple-700">
            <SelectItem value="false" className="text-white">No</SelectItem>
            <SelectItem value="true" className="text-white">Yes (100% healing)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-400 mt-1">
          All damage dealt this turn heals the player for 100% of damage dealt
        </p>
      </div>

      <div>
        <label className="text-xs font-semibold text-cyan-300 mb-1 block">Surge Effect</label>
        <Select 
          value={formData.hasSurge ? "true" : "false"} 
          onValueChange={(value) => setFormData({ ...formData, hasSurge: value === "true" })}
        >
          <SelectTrigger className="bg-black/40 border-purple-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-black border-purple-700">
            <SelectItem value="false" className="text-white">No</SelectItem>
            <SelectItem value="true" className="text-white">Yes (x2 when last card)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-400 mt-1">
          If this is the last card played in a turn, its primary effects are doubled
        </p>
      </div>

      <div>
        <label className="text-xs font-semibold text-purple-300 mb-1 block">Debuff Amplification</label>
        <Select 
          value={formData.debuffAmplify || ''} 
          onValueChange={(value) => setFormData({ ...formData, debuffAmplify: value })}
        >
          <SelectTrigger className="bg-black/40 border-purple-700 text-white">
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent className="bg-black border-purple-700">
            <SelectItem value={null} className="text-white">None</SelectItem>
            <SelectItem value="stun" className="text-white">Stun (+50% if Stunned)</SelectItem>
            <SelectItem value="confused" className="text-white">Confused (+50% if Confused)</SelectItem>
            <SelectItem value="burn" className="text-white">Burn (+50% if Burning)</SelectItem>
            <SelectItem value="poison" className="text-white">Poison (+50% if Poisoned)</SelectItem>
            <SelectItem value="vulnerable" className="text-white">Vulnerable (+50% if Vulnerable)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-400 mt-1">
          Card effects increased by 50% if enemy has this debuff active
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-semibold text-cyan-300 mb-1 block">📚 Knowledge Type</label>
          <Select 
            value={formData.knowledgeType || ''} 
            onValueChange={(value) => setFormData({ ...formData, knowledgeType: value })}
          >
            <SelectTrigger className="bg-black/40 border-purple-700 text-white">
              <SelectValue placeholder="None" />
            </SelectTrigger>
          <SelectContent className="bg-black border-purple-700">
              <SelectItem value={null} className="text-white">None</SelectItem>
              <SelectItem value="damage" className="text-white">Damage per Card</SelectItem>
              <SelectItem value="heal" className="text-white">Heal per Card</SelectItem>
              <SelectItem value="shield" className="text-white">Shield per Card</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-semibold text-cyan-300 mb-1 block">📚 Knowledge Value</label>
          <Input
            type="number"
            value={formData.knowledgeValue}
            onChange={(e) => setFormData({ ...formData, knowledgeValue: Number(e.target.value) })}
            placeholder="0"
            disabled={!formData.knowledgeType}
            className="bg-black/40 border-purple-700 text-sm text-white placeholder:text-gray-400"
          />
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-1">
        Knowledge: Grants +X {formData.knowledgeType || 'effect'} per card in your hand when played (e.g., 2 = +2 per card)
      </p>
      
      <div>
        <label className="text-xs font-semibold text-purple-300 mb-1 block">Card Description</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Description"
          className="bg-black/40 border-purple-700 text-sm text-white placeholder:text-gray-400"
          rows={2}
        />
      </div>
      
      <div className="flex gap-2">
        <Button onClick={() => onSave(formData)} size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
          <Save className="w-3 h-3 mr-1" />
          Save
        </Button>
        <Button onClick={onCancel} size="sm" variant="outline" className="flex-1 text-white border-purple-500 hover:bg-purple-500/20">
          <X className="w-3 h-3 mr-1" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
