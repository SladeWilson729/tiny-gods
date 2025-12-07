
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, Gem, ShoppingCart, Sparkles, CheckCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Store() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchasingPackage, setPurchasingPackage] = useState(null);
  const [cosmetics, setCosmetics] = useState([]);

  useEffect(() => {
    loadData();
    checkPaymentStatus();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const packagesList = await base44.entities.StorePackage.filter(
        { is_available: true },
        'display_order'
      );
      setPackages(packagesList);
      
      // Load all cosmetics to display in packages
      const cosmeticsList = await base44.entities.CosmeticReward.list();
      setCosmetics(cosmeticsList);
    } catch (error) {
      console.error('Failed to load store:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    const urlParams = new URLSearchParams(location.search);
    const paymentStatus = urlParams.get('payment');
    const token = urlParams.get('token');

    if (paymentStatus === 'success' && token) {
      setIsPurchasing(true);
      try {
        const response = await base44.functions.invoke('capturePayPalOrder', {
          orderId: token
        });

        if (response.data.success) {
          alert(`✅ Payment successful!\n\n+${response.data.granted.favor} Favor Tokens\n+${response.data.granted.essence} Essence Crystals`);
          await loadData();
        }
      } catch (error) {
        console.error('Payment capture failed:', error);
        alert('❌ Payment verification failed. Please contact support if you were charged.');
      } finally {
        setIsPurchasing(false);
        navigate(createPageUrl('Store'), { replace: true });
      }
    } else if (paymentStatus === 'cancelled') {
      alert('Payment was cancelled.');
      navigate(createPageUrl('Store'), { replace: true });
    }
  };

  const handlePurchase = async (pkg) => {
    if (isPurchasing) return;

    setPurchasingPackage(pkg.package_id);
    setIsPurchasing(true);

    try {
      const response = await base44.functions.invoke('createPayPalOrder', {
        packageId: pkg.package_id
      });

      if (response.data.approveUrl) {
        window.location.href = response.data.approveUrl;
      } else {
        throw new Error('No approval URL returned');
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Failed to initiate payment. Please try again.');
      setIsPurchasing(false);
      setPurchasingPackage(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-6 flex items-center justify-center">
        <Loader2 className="w-16 h-16 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="bg-black/70 backdrop-blur-md rounded-2xl p-8 border-2 border-purple-500/50 shadow-2xl">
            <div className="flex items-center justify-center gap-4 mb-4">
              <ShoppingCart className="w-12 h-12 text-purple-400" />
              <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Divine Store
              </h1>
            </div>
            <p className="text-xl text-purple-200 mb-4">
              Purchase premium currency to unlock exclusive rewards
            </p>

            {/* Current Balance */}
            <div className="flex items-center justify-center gap-6">
              <div className="flex items-center gap-2 bg-black/60 px-6 py-3 rounded-full border border-yellow-600">
                <Coins className="w-6 h-6 text-yellow-400" />
                <span className="text-2xl font-bold text-yellow-400">
                  {user?.favor_tokens || 0}
                </span>
                <span className="text-sm text-gray-300">Favor Tokens</span>
              </div>
              <div className="flex items-center gap-2 bg-black/60 px-6 py-3 rounded-full border border-cyan-600">
                <Gem className="w-6 h-6 text-cyan-400" />
                <span className="text-2xl font-bold text-cyan-400">
                  {user?.essence_crystals || 0}
                </span>
                <span className="text-sm text-gray-300">Essence Crystals</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Payment Processing Overlay */}
        {isPurchasing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="bg-gradient-to-br from-purple-900 to-black p-8 rounded-2xl border-2 border-purple-500 text-center">
              <Loader2 className="w-16 h-16 animate-spin text-purple-400 mx-auto mb-4" />
              <p className="text-white text-xl">Processing Payment...</p>
              <p className="text-gray-400 mt-2">Please wait while we redirect you to PayPal</p>
            </div>
          </motion.div>
        )}

        {/* Package Cards */}
        {packages.length === 0 ? (
          <Card className="bg-black/40 border-purple-800 p-12 text-center">
            <ShoppingCart className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">No Packages Available</h3>
            <p className="text-gray-400">Check back later for new offers!</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg, index) => {
              const bonusCosmetics = pkg.bonus_cosmetics 
                ? cosmetics.filter(c => pkg.bonus_cosmetics.includes(c.id))
                : [];

              return (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`bg-black/40 border-2 ${pkg.is_popular ? 'border-yellow-500 ring-4 ring-yellow-500/30' : 'border-purple-800'} hover:scale-105 transition-all relative overflow-hidden`}>
                    {pkg.is_popular && (
                      <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-500 to-amber-500 text-black px-4 py-1 text-xs font-bold">
                        MOST POPULAR
                      </div>
                    )}
                    
                    <CardHeader>
                      <CardTitle className={`text-2xl font-bold bg-gradient-to-r ${pkg.gradient} bg-clip-text text-transparent`}>
                        {pkg.name}
                      </CardTitle>
                      <div className="text-4xl font-bold text-white mt-2">
                        ${pkg.price}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Contents */}
                      <div className="bg-black/40 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Coins className="w-5 h-5 text-yellow-400" />
                            <span className="text-white">Favor Tokens</span>
                          </div>
                          <span className="text-yellow-400 font-bold text-xl">
                            {pkg.favor_tokens.toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Gem className="w-5 h-5 text-cyan-400" />
                            <span className="text-white">Essence Crystals</span>
                          </div>
                          <span className="text-cyan-400 font-bold text-xl">
                            {pkg.essence_crystals.toLocaleString()}
                          </span>
                        </div>
                        
                        {bonusCosmetics.length > 0 && (
                          <>
                            <div className="border-t border-purple-700 pt-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4 text-pink-400" />
                                <span className="text-pink-300 font-bold text-sm">Bonus Cosmetics:</span>
                              </div>
                              <div className="space-y-2">
                                {bonusCosmetics.map(cosmetic => (
                                  <div key={cosmetic.id} className="flex items-center gap-2 bg-purple-900/30 p-2 rounded">
                                    {cosmetic.preview_image && (
                                      <img 
                                        src={cosmetic.preview_image} 
                                        alt={cosmetic.name}
                                        className="w-8 h-8 object-cover rounded"
                                      />
                                    )}
                                    <div className="flex-1">
                                      <div className="text-xs text-white font-bold">{cosmetic.name}</div>
                                      <div className="text-[10px] text-purple-300">{cosmetic.category}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Purchase Button */}
                      <Button
                        onClick={() => handlePurchase(pkg)}
                        disabled={isPurchasing}
                        className={`w-full bg-gradient-to-r ${pkg.gradient} hover:opacity-90 text-white font-bold py-6 text-lg`}
                      >
                        {purchasingPackage === pkg.package_id ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5 mr-2" />
                            Purchase Now
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Card className="bg-black/40 border-purple-800">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Secure Payment via PayPal
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-300">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-white">Instant Delivery</div>
                    <div>Currency is added to your account immediately after payment</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-white">Secure Checkout</div>
                    <div>All payments processed securely through PayPal</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-white">Support Available</div>
                    <div>Contact us if you experience any payment issues</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
