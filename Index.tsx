import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Wallet, 
  Users, 
  Home, 
  FileText, 
  User,
  Zap,
  Copy,
  Play
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useReferral } from '@/hooks/useReferral';
import { getTelegramData, initTelegramWebApp, generateReferralLink } from '@/utils/telegramUtils';
import MiningEarnings from '@/components/MiningEarnings';
import MinerCharacter from '@/components/MinerCharacter';
import RewardTimer from '@/components/RewardTimer';
import MiningControls from '@/components/MiningControls';
import MiningStats from '@/components/MiningStats';
import AreaSelector from '@/components/AreaSelector';
import BackgroundWithClickAreas from '@/components/BackgroundWithClickAreas';

// Declare global functions for ad providers
declare global {
  interface Window {
    Adsgram?: {
      init: (config: {
        blockId: string;
        debug?: boolean;
        debugBannerType?: string;
      }) => {
        show: () => Promise<{
          done: boolean;
          description: string;
          state: 'load' | 'render' | 'playing' | 'destroy';
          error?: boolean;
        }>;
      };
    };
    AdexiumWidget?: any;
    initCdTma?: (config: { id: number }) => Promise<() => Promise<void>>;
    show?: () => Promise<void>;
  }
}

const Index = () => {
  // Initialize Telegram Web App
  useEffect(() => {
    initTelegramWebApp();
  }, []);

  const { referralData, addReferralReward } = useReferral();
  const telegramData = getTelegramData();

  // Use Telegram ID as primary identifier, fallback to random ID
  const getUserId = () => {
    return telegramData?.userId || Math.floor(Math.random() * 900000000) + 100000000;
  };

  // Helper function to load user data from localStorage using Telegram ID
  const loadUserData = () => {
    const userId = getUserId();
    const savedData = localStorage.getItem(`miningAppUserData_${userId}`);
    console.log('Loading user data for userId:', userId, 'Data:', savedData);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      console.log('Parsed data:', parsed);
      return parsed;
    }
    return {
      userId,
      trxEarnings: 0.0000,
      leicoinEarnings: 0.0000,
      walletTrx: 0.0000,
      walletLeicoin: 0.0000,
      hashRate: 100.00,
      totalAdBoosts: 0,
      clickEarnings: 0.0000,
      totalLeicoinRewards: 0,
      adBoostTimeLeft: 0,
      transactionHistory: [],
      lastActiveTime: Date.now(),
      nextRewardTime: 300,
      clickAreas: [],
      trxPosition: { x: 20, y: 20 },
      leicoinPosition: { x: 20, y: 50 }
    };
  };

  // Calculate offline rewards
  const calculateOfflineRewards = (userData: any) => {
    const now = Date.now();
    const lastActive = userData.lastActiveTime || now;
    const offlineMinutes = (now - lastActive) / (1000 * 60);
    
    if (offlineMinutes > 0.1) { // Calculate if offline for more than 6 seconds
      let newTrxEarnings = userData.trxEarnings;
      let newLeicoinEarnings = userData.leicoinEarnings;
      let newAdBoostTime = userData.adBoostTimeLeft;
      let newHashRate = userData.hashRate;
      let newNextRewardTime = userData.nextRewardTime;
      
      // Handle ad boost timer decrease during offline time
      if (userData.adBoostTimeLeft > 0) {
        newAdBoostTime = Math.max(0, userData.adBoostTimeLeft - offlineMinutes);
        
        // Calculate TRX rewards from ad boost decrease (every 10 minutes of boost gives 0.00001 TRX)
        const adBoostDecrease = userData.adBoostTimeLeft - newAdBoostTime;
        const adBoostRewards = Math.floor(adBoostDecrease / 10) * 0.00001;
        newTrxEarnings += adBoostRewards;
        
        // Update hash rate based on remaining ad boost time
        if (newAdBoostTime <= 0) {
          newHashRate = 100.00; // Reset to base rate
        }
      }
      
      // Handle next reward timer during offline time
      const offlineSeconds = offlineMinutes * 60;
      if (userData.nextRewardTime > 0) {
        newNextRewardTime = Math.max(0, userData.nextRewardTime - offlineSeconds);
        
        // Calculate how many reward cycles completed during offline time
        const totalOfflineSeconds = offlineSeconds + (300 - userData.nextRewardTime);
        const completedCycles = Math.floor(totalOfflineSeconds / 300);
        
        if (completedCycles > 0) {
          newTrxEarnings += completedCycles * 0.00001;
          newLeicoinEarnings += completedCycles * 20;
          
          // Set next reward time based on remaining time
          const remainingSeconds = totalOfflineSeconds % 300;
          newNextRewardTime = remainingSeconds === 0 ? 300 : 300 - remainingSeconds;
        }
      } else {
        // If timer was at 0, calculate full cycles
        const completedCycles = Math.floor(offlineSeconds / 300);
        if (completedCycles > 0) {
          newTrxEarnings += completedCycles * 0.00001;
          newLeicoinEarnings += completedCycles * 20;
        }
        
        const remainingSeconds = offlineSeconds % 300;
        newNextRewardTime = remainingSeconds === 0 ? 300 : 300 - remainingSeconds;
      }
      
      return {
        ...userData,
        trxEarnings: newTrxEarnings,
        leicoinEarnings: newLeicoinEarnings,
        adBoostTimeLeft: newAdBoostTime,
        hashRate: newHashRate,
        nextRewardTime: Math.floor(newNextRewardTime),
        lastActiveTime: now,
        offlineTime: offlineMinutes
      };
    }
    
    return { ...userData, lastActiveTime: now };
  };

  // Initialize state with saved data or defaults, including offline calculations
  const rawData = loadUserData();
  const initialData = calculateOfflineRewards(rawData);
  
  const [activeTab, setActiveTab] = useState('home');
  const [trxEarnings, setTrxEarnings] = useState(initialData.trxEarnings);
  const [leicoinEarnings, setLeicoinEarnings] = useState(initialData.leicoinEarnings);
  const [walletTrx, setWalletTrx] = useState(initialData.walletTrx);
  const [walletLeicoin, setWalletLeicoin] = useState(initialData.walletLeicoin);
  const [hashRate, setHashRate] = useState(initialData.hashRate);
  const [baseHashRate] = useState(100.00);
  const [nextRewardTime, setNextRewardTime] = useState(initialData.nextRewardTime || 300);
  const [isMining, setIsMining] = useState(true);
  const [totalAdBoosts, setTotalAdBoosts] = useState(initialData.totalAdBoosts);
  const [clickEarnings, setClickEarnings] = useState(initialData.clickEarnings);
  const [totalLeicoinRewards, setTotalLeicoinRewards] = useState(initialData.totalLeicoinRewards);
  const [adBoostTimeLeft, setAdBoostTimeLeft] = useState(initialData.adBoostTimeLeft);
  const [maxAdBoostTime] = useState(720); // 12 hours in minutes
  const [userId] = useState(getUserId());
  const [transactionHistory, setTransactionHistory] = useState(initialData.transactionHistory);
  const [adCooldownMH, setAdCooldownMH] = useState(0); // 30 second cooldown for MH ad
  const [adCooldownLeicoin, setAdCooldownLeicoin] = useState(0); // 30 second cooldown for LEICOIN ad
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [adController, setAdController] = useState<any>(null);
  const { toast } = useToast();

  // Updated positions for TRX and LEICOIN values
  const trxPosition = { x: 277.5, y: 42 };
  const leicoinPosition = { x: 75.5, y: 44 };

  // Function declarations - moved before their usage
  const handleClaim = () => {
    setWalletLeicoin(prev => prev + leicoinEarnings);
    
    if (trxEarnings >= 1.0) {
      setWalletTrx(prev => prev + trxEarnings);
      setTrxEarnings(0.0000);
    }
    
    setLeicoinEarnings(0.0000);
    setNextRewardTime(300);
    
    toast({
      title: "Rewards Claimed!",
      description: "Your mining rewards have been processed.",
    });
  };

  // Ad handling functions
  const handleMHAdClick = async () => {
    if (isAdPlaying || adCooldownMH > 0) {
      console.log('Ad already playing or in cooldown, ignoring click');
      return;
    }

    console.log('MH button clicked - triggering ad for +5 MH/s');
    setIsAdPlaying(true);

    // Check if we're in Telegram WebView
    const isInTelegramWebView = typeof window !== 'undefined' && 
                               window.Telegram?.WebApp && 
                               window.parent !== window;

    if (typeof window !== 'undefined' && window.Adsgram) {
      try {
        console.log('Initializing Adsgram with blockId: 12223');
        
        // Wait a bit for Adsgram to fully initialize if in WebView
        if (isInTelegramWebView) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        let controller = adController;
        if (!controller) {
          controller = window.Adsgram.init({
            blockId: "12223",
            debug: false,
          });
          setAdController(controller);
        }

        console.log('AdController initialized, showing ad...');
        const result = await controller.show();
        console.log('Ad show result:', result);
        
        if (result && result.done === true && result.state === 'destroy' && !result.error) {
          console.log('Ad completed successfully, triggering MH reward');
          
          const newBoostTime = Math.min(adBoostTimeLeft + 10, maxAdBoostTime);
          setAdBoostTimeLeft(newBoostTime);
          setHashRate(prev => prev + 5);
          setTotalAdBoosts(prev => prev + 1);
          setAdCooldownMH(30);
          
          toast({
            title: "Ad Boost Earned!",
            description: `+5 MH/s boost added for 10 minutes!`,
          });
        } else {
          console.log('Ad not completed properly');
          
          if (process.env.NODE_ENV === 'development') {
            console.log('Development mode - giving fallback reward');
            const newBoostTime = Math.min(adBoostTimeLeft + 10, maxAdBoostTime);
            setAdBoostTimeLeft(newBoostTime);
            setHashRate(prev => prev + 5);
            setTotalAdBoosts(prev => prev + 1);
            setAdCooldownMH(30);
            
            toast({
              title: "Ad Boost Earned!",
              description: `+5 MH/s boost added for 10 minutes!`,
            });
          }
        }

      } catch (error) {
        console.error('Error with Adsgram:', error);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Development mode - giving fallback reward');
          const newBoostTime = Math.min(adBoostTimeLeft + 10, maxAdBoostTime);
          setAdBoostTimeLeft(newBoostTime);
          setHashRate(prev => prev + 5);
          setTotalAdBoosts(prev => prev + 1);
          setAdCooldownMH(30);
          
          toast({
            title: "Ad Boost Earned!",
            description: `+5 MH/s boost added for 10 minutes!`,
          });
        }
      } finally {
        setIsAdPlaying(false);
      }
    } else {
      console.log('Adsgram not available');
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode - giving fallback reward');
        const newBoostTime = Math.min(adBoostTimeLeft + 10, maxAdBoostTime);
        setAdBoostTimeLeft(newBoostTime);
        setHashRate(prev => prev + 5);
        setTotalAdBoosts(prev => prev + 1);
        setAdCooldownMH(30);
        
        toast({
          title: "Ad Boost Earned!",
          description: `+5 MH/s boost added for 10 minutes!`,
        });
      }
      setIsAdPlaying(false);
    }
  };

  const handleLeicoinAdClick = async () => {
    if (isAdPlaying || adCooldownLeicoin > 0) {
      console.log('Ad already playing or in cooldown, ignoring click');
      return;
    }

    console.log('LEICOIN button clicked - triggering ad for +20 LEICOIN');
    setIsAdPlaying(true);

    // Try different ad providers for LEICOIN
    try {
      // Try Onclicka first
      if (window.initCdTma) {
        console.log('Initializing Onclicka for LEICOIN ad');
        const show = await window.initCdTma({ id: 344883 });
        await show();
        
        console.log('Onclicka ad completed successfully');
        setLeicoinEarnings(prev => prev + 20);
        setTotalLeicoinRewards(prev => prev + 20);
        setAdCooldownLeicoin(30);
        
        toast({
          title: "LEICOIN Reward!",
          description: `You've earned +20 LEICOIN!`,
        });
      } else {
        throw new Error('Onclicka not available');
      }
    } catch (error) {
      console.error('Error with ad providers:', error);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode - giving fallback reward');
        setLeicoinEarnings(prev => prev + 20);
        setTotalLeicoinRewards(prev => prev + 20);
        setAdCooldownLeicoin(30);
        
        toast({
          title: "LEICOIN Reward!",
          description: `You've earned +20 LEICOIN!`,
        });
      }
    } finally {
      setIsAdPlaying(false);
    }
  };

  // Predefined click areas with percentage positioning for consistent placement across devices
  const predefinedClickAreas = [
    {
      id: 'mh-button',
      x: '12.5%', // 50px na ekranie 400px = 12.5%
      y: '71.6%', // 573px na ekranie 800px = 71.6%
      width: '38.75%', // 155px na ekranie 400px = 38.75%
      height: '11.4%', // 91px na ekranie 800px = 11.4%
      label: 'MH Button',
      onClick: handleMHAdClick
    },
    {
      id: 'leicoin-button',
      x: '63.5%', // 254px na ekranie 400px = 63.5%
      y: '71.9%', // 575px na ekranie 800px = 71.9%
      width: '36.75%', // 147px na ekranie 400px = 36.75%
      height: '11.5%', // 92px na ekranie 800px = 11.5%
      label: 'LEICOIN Button',
      onClick: handleLeicoinAdClick
    },
    {
      id: 'claim-button',
      x: '27.5%', // 110px na ekranie 400px = 27.5%
      y: '20.1%', // 161px na ekranie 800px = 20.1%
      width: '58.25%', // 233px na ekranie 400px = 58.25%
      height: '11.6%', // 93px na ekranie 800px = 11.6%
      label: 'Claim Button',
      onClick: handleClaim
    },
    {
      id: 'wallet-button',
      x: '9%', // 36px na ekranie 400px = 9%
      y: '94.25%', // 754px na ekranie 800px = 94.25%
      width: '13.5%', // 54px na ekranie 400px = 13.5%
      height: '7.25%', // 58px na ekranie 800px = 7.25%
      label: 'Wallet',
      onClick: () => setActiveTab('wallet')
    },
    {
      id: 'friends-button',
      x: '27.75%', // 111px na ekranie 400px = 27.75%
      y: '93.9%', // 751px na ekranie 800px = 93.9%
      width: '14.5%', // 58px na ekranie 400px = 14.5%
      height: '7.4%', // 59px na ekranie 800px = 7.4%
      label: 'Friends',
      onClick: () => setActiveTab('friends')
    },
    {
      id: 'home-button',
      x: '48%', // 192px na ekranie 400px = 48%
      y: '94.1%', // 753px na ekranie 800px = 94.1%
      width: '16.5%', // 66px na ekranie 400px = 16.5%
      height: '7.6%', // 61px na ekranie 800px = 7.6%
      label: 'Home',
      onClick: () => setActiveTab('home')
    },
    {
      id: 'missions-button',
      x: '70.5%', // 282px na ekranie 400px = 70.5%
      y: '94.5%', // 756px na ekranie 800px = 94.5%
      width: '14%', // 56px na ekranie 400px = 14%
      height: '7.1%', // 57px na ekranie 800px = 7.1%
      label: 'Missions',
      onClick: () => setActiveTab('missions')
    },
    {
      id: 'profile-button',
      x: '90.5%', // 362px na ekranie 400px = 90.5%
      y: '94.4%', // 755px na ekranie 800px = 94.4%
      width: '13.5%', // 54px na ekranie 400px = 13.5%
      height: '7.4%', // 59px na ekranie 800px = 7.4%
      label: 'Profile',
      onClick: () => setActiveTab('profile')
    }
  ];

  const backgroundImageUrl = 'https://files.catbox.moe/tivvp2.gif';

  // Generate referral link for current user
  const userReferralLink = generateReferralLink(userId);

  // Save user data to localStorage whenever state changes
  const saveUserData = useCallback(() => {
    const userData = {
      userId,
      trxEarnings,
      leicoinEarnings,
      walletTrx,
      walletLeicoin,
      hashRate,
      totalAdBoosts,
      clickEarnings,
      totalLeicoinRewards,
      adBoostTimeLeft,
      transactionHistory,
      lastActiveTime: Date.now(),
      nextRewardTime,
      referralCount: referralData.referralCount,
      totalReferralRewards: referralData.totalReferralRewards,
      referredUsers: referralData.referredUsers
    };
    console.log('Saving user data to localStorage:', userData);
    localStorage.setItem(`miningAppUserData_${userId}`, JSON.stringify(userData));
  }, [userId, trxEarnings, leicoinEarnings, walletTrx, walletLeicoin, hashRate, totalAdBoosts, clickEarnings, totalLeicoinRewards, adBoostTimeLeft, transactionHistory, nextRewardTime, referralData]);

  // Save data whenever relevant state changes
  useEffect(() => {
    console.log('State changed, saving user data...');
    saveUserData();
  }, [saveUserData]);

  // Update lastActiveTime every 30 seconds while user is active
  useEffect(() => {
    const updateActiveTime = setInterval(() => {
      const userData = JSON.parse(localStorage.getItem(`miningAppUserData_${userId}`) || '{}');
      userData.lastActiveTime = Date.now();
      localStorage.setItem(`miningAppUserData_${userId}`, JSON.stringify(userData));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(updateActiveTime);
  }, [userId]);

  // Show offline rewards toast on initial load
  useEffect(() => {
    if (initialData.offlineTime && initialData.offlineTime > 5) {
      const offlineHours = Math.floor(initialData.offlineTime / 60);
      const offlineMins = Math.floor(initialData.offlineTime % 60);
      
      toast({
        title: "Welcome Back!",
        description: `You were offline for ${offlineHours}h ${offlineMins}m. Offline rewards have been added!`,
      });
    }
  }, []);

  // Main reward timer
  useEffect(() => {
    if (isMining && nextRewardTime > 0) {
      const timer = setInterval(() => {
        setNextRewardTime(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isMining, nextRewardTime]);

  // Ad boost timer with second precision
  useEffect(() => {
    if (adBoostTimeLeft > 0) {
      const timer = setInterval(() => {
        setAdBoostTimeLeft(prev => {
          const newTime = prev - (1/60); // Decrease by 1 second (1/60 minute)
          if (newTime <= 0) {
            setHashRate(baseHashRate);
            return 0;
          }
          
          // Give 0.00001 TRX every 10 minutes decrease
          const currentMinutes = Math.floor(prev);
          const newMinutes = Math.floor(newTime);
          if (currentMinutes > newMinutes && newMinutes % 10 === 0) {
            setTrxEarnings(current => current + 0.00001);
          }
          
          return newTime;
        });
      }, 1000); // Update every second
      return () => clearInterval(timer);
    }
  }, [adBoostTimeLeft, baseHashRate]);

  // Ad cooldown timers
  useEffect(() => {
    if (adCooldownMH > 0) {
      const timer = setInterval(() => {
        setAdCooldownMH(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [adCooldownMH]);

  useEffect(() => {
    if (adCooldownLeicoin > 0) {
      const timer = setInterval(() => {
        setAdCooldownLeicoin(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [adCooldownLeicoin]);

  // Add reward when timer reaches 0
  useEffect(() => {
    if (nextRewardTime === 0 && isMining) {
      setTrxEarnings(prev => prev + 0.00001);
      setLeicoinEarnings(prev => prev + 20);
      setNextRewardTime(300);
      
      toast({
        title: "Mining Reward!",
        description: "You earned +0.00001 TRX and +20 LEICOIN",
      });
    }
  }, [nextRewardTime, isMining]);

  const handleRomanClick = () => {
    const clickReward = 0.00001;
    setClickEarnings(prev => prev + clickReward);
    setTrxEarnings(prev => prev + clickReward);
  };

  const handleStopMining = () => {
    setIsMining(false);
    toast({
      title: "Mining Stopped",
      description: "Your mining session has been paused.",
    });
  };

  const handleStartMining = () => {
    setIsMining(true);
    setNextRewardTime(300);
    toast({
      title: "Mining Started",
      description: "Your mining session has resumed!",
    });
  };

  const handleConvert = () => {
    if (walletLeicoin >= 5000) {
      const trxToAdd = Math.floor(walletLeicoin / 5000);
      const leicoinUsed = trxToAdd * 5000;
      
      setWalletLeicoin(prev => prev - leicoinUsed);
      setWalletTrx(prev => prev + trxToAdd);
      
      const newTransaction = {
        amount: `${leicoinUsed} LEICOIN → ${trxToAdd} TRX`,
        date: new Date().toLocaleString('en-GB', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        gain: `+${trxToAdd} TRX`
      };
      
      setTransactionHistory(prev => [newTransaction, ...prev]);
      
      toast({
        title: "Conversion Successful!",
        description: `Converted ${leicoinUsed} LEICOIN to ${trxToAdd} TRX`,
      });
    } else {
      toast({
        title: "Insufficient LEICOIN",
        description: "You need at least 5000 LEICOIN to convert to 1 TRX",
        variant: "destructive"
      });
    }
  };

  const handleWithdraw = () => {
    if (walletTrx >= 50) {
      toast({
        title: "Withdrawal Initiated",
        description: "Your withdrawal request has been processed.",
      });
    } else {
      toast({
        title: "Minimum Withdrawal Not Met",
        description: "You need at least 50 TRX to withdraw to external wallet",
        variant: "destructive"
      });
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(userReferralLink);
    toast({
      title: "Link Copied!",
      description: "Invite link has been copied to clipboard.",
    });
  };

  const renderHomeTab = () => {
    return (
      <div className="relative h-screen overflow-hidden">
        <BackgroundWithClickAreas
          backgroundImage={backgroundImageUrl}
          clickAreas={predefinedClickAreas}
          trxPosition={trxPosition}
          leicoinPosition={leicoinPosition}
          trxValue={trxEarnings}
          leicoinValue={leicoinEarnings}
        >
          {/* Ukryte okno z informacjami debugowania - zakomentowane */}
          {/* 
          <div className="fixed top-4 left-4 bg-black bg-opacity-70 text-white p-2 rounded text-sm z-20">
            <div>Next reward: {nextRewardTime}s</div>
            <div>Hash rate: {hashRate.toFixed(2)} MH/s</div>
            <div className="text-green-500 text-xs mt-1">
              Click areas loaded: {predefinedClickAreas.length}
            </div>
            <div className="text-blue-500 text-xs">
              MH cooldown: {adCooldownMH}s | LEICOIN cooldown: {adCooldownLeicoin}s
            </div>
            {isAdPlaying && (
              <div className="text-yellow-500 text-xs">
                Ad playing...
              </div>
            )}
          </div>
          */}
        </BackgroundWithClickAreas>
      </div>
    );
  };

  const renderWalletTab = () => (
    <div className="space-y-4">
      <Card className="bg-gray-800 border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-white font-semibold">TRX Balance</span>
          <Button 
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
            onClick={handleWithdraw}
          >
            Withdraw
          </Button>
        </div>
        <div className="text-red-500 text-lg font-semibold">{walletTrx.toFixed(4)} TRX</div>
      </Card>

      <Card className="bg-gray-800 border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-white font-semibold">LEICOIN Balance</span>
          <Button 
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
            onClick={handleConvert}
          >
            Convert
          </Button>
        </div>
        <div className="text-white text-lg">{walletLeicoin.toFixed(0)} LEICOIN</div>
      </Card>

      <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 flex items-center justify-center gap-2">
        <Zap className="w-4 h-4" />
        Boost Power
      </Button>

      {transactionHistory.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-white font-semibold">Transaction History</h3>
          
          {transactionHistory.map((transaction, index) => (
            <Card key={index} className="bg-gray-800 border-gray-700 p-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">T</span>
                </div>
                <div className="flex-1">
                  <div className="text-white text-sm">{transaction.amount}</div>
                  <div className="text-gray-400 text-xs">{transaction.date}</div>
                </div>
                <div className="text-green-500 text-sm font-semibold">{transaction.gain}</div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderFriendsTab = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-white text-xl font-bold mb-2">Invite Friends</h2>
        <p className="text-gray-400 text-sm mb-6">Earn LEICOIN tokens for each friend you invite!</p>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-yellow-500 text-2xl font-bold">{referralData.referralCount}</div>
            <div className="text-gray-400 text-sm">Active Referrals</div>
          </div>
          <div className="text-center">
            <div className="text-yellow-500 text-2xl font-bold">0</div>
            <div className="text-gray-400 text-sm">Pending Referrals</div>
          </div>
          <div className="text-center">
            <div className="text-yellow-500 text-2xl font-bold">{referralData.totalReferralRewards}</div>
            <div className="text-gray-400 text-sm">Total LEICOIN Earned</div>
          </div>
        </div>

        {telegramData && (
          <div className="mb-4 p-3 bg-gray-800 rounded-lg">
            <div className="text-green-500 text-sm">✓ Connected to Telegram</div>
            <div className="text-gray-400 text-xs">
              {telegramData.firstName} {telegramData.lastName}
              {telegramData.username && ` (@${telegramData.username})`}
            </div>
          </div>
        )}

        {referralData.referredBy && (
          <div className="mb-4 p-3 bg-blue-900/30 rounded-lg border border-blue-500/30">
            <div className="text-blue-400 text-sm">🎉 You were referred by user #{referralData.referredBy}</div>
            <div className="text-gray-400 text-xs">Enjoy your bonus rewards!</div>
          </div>
        )}
      </div>

      <Card className="bg-gray-800 border-gray-700 p-4">
        <div className="mb-4">
          <span className="text-gray-400 text-sm">Your Invite Link</span>
          <div className="bg-gray-700 p-2 rounded mt-2 text-white text-sm break-all">
            {userReferralLink}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
            onClick={copyInviteLink}
          >
            Invite Friends
          </Button>
          <Button 
            className="bg-yellow-500 hover:bg-yellow-600 text-black p-2"
            onClick={copyInviteLink}
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      <Card className="bg-gray-800 border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-blue-500 rounded"></div>
          <span className="text-white font-semibold">Referral Rewards</span>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">For Each Referral</span>
            <div className="flex items-center gap-1">
              <span className="text-yellow-500 font-semibold">250</span>
              <img 
                src="/lovable-uploads/536c2ca9-5599-4af9-9a71-1eff6459c83c.png" 
                alt="LEICOIN" 
                className="w-4 h-4"
              />
              <span className="text-white">LEICOIN</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Hash Rate Bonus</span>
            <div className="flex items-center gap-1">
              <span className="text-yellow-500 font-semibold">2 MH/s</span>
              <Zap className="w-4 h-4 text-orange-500" />
            </div>
          </div>
        </div>
      </Card>

      {referralData.referredUsers && referralData.referredUsers.length > 0 && (
        <Card className="bg-gray-800 border-gray-700 p-4">
          <h3 className="text-white font-semibold mb-3">Your Referrals</h3>
          <div className="space-y-2">
            {referralData.referredUsers.map((user, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                <div>
                  <div className="text-white text-sm font-medium">{user.name}</div>
                  <div className="text-gray-400 text-xs">Joined: {user.joinedAt}</div>
                </div>
                <div className="text-green-500 text-sm">+250 LEICOIN</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );

  const renderMissionsTab = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-white text-xl font-bold mb-2">Missions</h2>
        <p className="text-gray-400 text-sm">Complete missions and earn more</p>
      </div>

      <div className="flex gap-2 mb-4">
        <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold flex-1">
          Money Wall
        </Button>
        <Button variant="ghost" className="text-gray-400 flex-1">Tasks</Button>
        <Button variant="ghost" className="text-gray-400 flex-1">Referral</Button>
        <Button variant="ghost" className="text-gray-400 flex-1">Special</Button>
      </div>

      <div className="space-y-3">
        <Card className="bg-gray-800 border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded-full"></div>
              </div>
              <div>
                <div className="text-white font-semibold">CryptoAnalysis AI - Visit</div>
                <div className="text-yellow-500 text-sm">Earn 1000 🪙</div>
              </div>
            </div>
            <Button className="bg-gray-600 text-white text-xs px-3 py-1">
              Completed
            </Button>
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded-full"></div>
              </div>
              <div>
                <div className="text-white font-semibold">Register at Sportbets!</div>
                <div className="text-yellow-500 text-sm">Earn 1250 🪙</div>
              </div>
            </div>
            <Button className="bg-gray-600 text-white text-xs px-3 py-1">
              Completed
            </Button>
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center text-white font-bold">
                T
              </div>
              <div>
                <div className="text-white font-semibold">RT & Comment!</div>
                <div className="text-yellow-500 text-sm">Earn 1250 🪙</div>
              </div>
            </div>
            <Button className="bg-green-500 hover:bg-green-600 text-white text-xs px-4 py-1">
              GO
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderProfileTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <span className="text-white text-xl">
          Hello {telegramData?.firstName || 'User'}
        </span>
        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-white" />
        </div>
      </div>

      <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 flex items-center justify-center gap-2">
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </Button>

      <Card className="bg-gray-800 border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-purple-400" />
          <span className="text-white">Invite Friends</span>
        </div>
      </Card>

      <Card className="bg-gray-800 border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-gray-400 rounded-full"></div>
          <span className="text-white">Support Contact</span>
        </div>
      </Card>

      <Card className="bg-gray-800 border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-blue-400" />
          <span className="text-white">Legal Information</span>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white max-w-md mx-auto">
      <div className="pb-4">
        {activeTab === 'wallet' && renderWalletTab()}
        {activeTab === 'friends' && renderFriendsTab()}
        {activeTab === 'home' && renderHomeTab()}
        {activeTab === 'missions' && renderMissionsTab()}
        {activeTab === 'profile' && renderProfileTab()}
      </div>

      {/* Bottom Navigation - hidden on Home tab */}
      {activeTab !== 'home' && (
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-gray-900 border-t border-gray-700">
          <div className="flex items-center justify-around py-2">
            {[
              { id: 'wallet', icon: Wallet, label: 'Wallet' },
              { id: 'friends', icon: Users, label: 'Friends' },
              { id: 'home', icon: Home, label: 'Home' },
              { id: 'missions', icon: FileText, label: 'Missions' },
              { id: 'profile', icon: User, label: 'Profile' }
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex flex-col items-center gap-1 py-2 px-3 ${
                  activeTab === id ? 'text-yellow-500' : 'text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
