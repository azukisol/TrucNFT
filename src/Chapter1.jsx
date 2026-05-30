import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Repeat, 
  MessageSquare, 
  Wallet, 
  CheckCircle, 
  Play, 
  Volume2, 
  VolumeX, 
  ArrowLeft, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Sparkles,
  Award,
  Share2,
  Terminal,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AcademySoundtrack } from './academy_soundtrack';
import { supabase } from './supabaseClient';
import { useWallet } from './WalletContext';

// --- Visual Novel Character Avatars & Dialogue Definitions ---
const dialogueSessions = {
  briefing: [
    { text: "Welcome back, Recruit! Your enlistment request in the Academy enrollment registry was successfully received.", image: "/assets/bear_thumbs_up.png", name: "INSTRUCTOR MR. BARRY", shake: false },
    { text: "You are now at the Chapter I Gate. To secure your limited admission slot, you must complete this Gate Trial.", image: "/assets/bear_sunglasses.png", name: "INSTRUCTOR MR. BARRY", shake: true },
    { text: "Once you secure your gate code, you will be prepared for the Deep Reef Trials, where your real training begins!", image: "/assets/bear_thinking.png", name: "INSTRUCTOR MR. BARRY", shake: false }
  ],
  step_1: [
    { text: "First, let's establish official communication with headquarters. Click follow on our official Twitter channel, Recruit!", image: "/assets/bear_wave.png", name: "INSTRUCTOR MR. BARRY", shake: false }
  ],
  step_2: [
    { text: "Excellent progress. Next, you must confirm the Academy announcement post. Retweet the announcement!", image: "/assets/bear_sunglasses.png", name: "INSTRUCTOR MR. BARRY", shake: false }
  ],
  step_3: [
    { text: "Social steps verified! Submit your Quote Tweet link below to register your unique admission code.", image: "/assets/bear_thinking.png", name: "INSTRUCTOR MR. BARRY", shake: false }
  ],
  step_4: [
    { text: "WARNING: Anti-bot gate check active. Prove you are a human recruit! Match the target security code.", image: "/assets/shark_smirk.png", name: "SHARK OFFICER", shake: true }
  ],
  evm_entry: [
    { text: "Gate cleared! Enter your EVM credentials to confirm your academy admission code.", image: "/assets/bear_thinking.png", name: "INSTRUCTOR MR. BARRY", shake: false }
  ],
  raid_needed: [
    { text: "RECRUIT! The gate's clearance check requires a broadcast. Share the announcement post to bypass it!", image: "/assets/shark_smirk.png", name: "SHARK OFFICER", shake: true }
  ],
  gacha_ready: [
    { text: "Outstanding! The clearance check is complete. The Chapter I Gate is open for your admission draw.", image: "/assets/bear_thumbs_up.png", name: "INSTRUCTOR MR. BARRY", shake: false },
    { text: "Click JOIN ACADEMY and test your luck to claim your official admission code, Recruit!", image: "/assets/bear_peace.png", name: "INSTRUCTOR MR. BARRY", shake: true }
  ],
  ip_blocked: [
    { text: "ACCESS DENIED! The academy registry detected that you have already initiated an admission draw from this IP address.", image: "/assets/bear_scared.png", name: "INSTRUCTOR MR. BARRY", shake: true },
    { text: "To maintain Academy integrity, only one initiation draw per recruit is allowed. Stand by for future operations.", image: "/assets/shark_sunglasses.png", name: "SHARK OFFICER", shake: true }
  ],
  success_gtd: [
    { text: "GTD ACCESS GRANTED! Outstanding job, Recruit! You successfully bypassed the queue and secured your access code.", image: "/assets/bear_peace.png", name: "INSTRUCTOR MR. BARRY", shake: false },
    { text: "Keep this gate code safe. You will use it to unlock the Deep Reef Trials. Prepare for deployment!", image: "/assets/shark_thumbs_up.png", name: "SHARK OFFICER", shake: true }
  ],
  success_fcfs: [
    { text: "FCFS ACCESS GRANTED! Splendid job, Recruit! You successfully bypassed the queue and secured your access code.", image: "/assets/bear_thumbs_up.png", name: "INSTRUCTOR MR. BARRY", shake: false },
    { text: "Slots are limited! Submit your code and report to headquarters immediately. Preparing for deployment!", image: "/assets/shark_sunglasses.png", name: "SHARK OFFICER", shake: true }
  ],
  failure: [
    { text: "GATEWAY EXHAUSTED! The specific admission slot you sampled has already been claimed by another recruit.", image: "/assets/bear_scared.png", name: "INSTRUCTOR MR. BARRY", shake: true },
    { text: "Don't be discouraged, Recruit. Your queue spot from the enlistment deck is still fully active. You will gain access when the next phase launches!", image: "/assets/shark_sunglasses.png", name: "SHARK OFFICER", shake: true }
  ]
};

// --- Web Audio API Synth Generators ---
let audioCtx = null;
const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

const playTypeSound = (isMuted) => {
  if (isMuted || !audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600 + Math.random() * 300, audioCtx.currentTime); 
    gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.04);
  } catch (e) {}
};

const playClickSound = (isMuted) => {
  if (isMuted) return;
  initAudio();
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  } catch (e) {}
};

const playConfirmSound = (isMuted) => {
  if (isMuted) return;
  initAudio();
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, audioCtx.currentTime);
    osc.frequency.setValueAtTime(660, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch (e) {}
};

const playSuccessSound = (isMuted) => {
  if (isMuted) return;
  initAudio();
  try {
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc1.type = 'triangle';
    osc2.type = 'sine';
    
    const now = audioCtx.currentTime;
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.setValueAtTime(659.25, now + 0.1); // E5
    osc1.frequency.setValueAtTime(783.99, now + 0.2); // G5
    osc1.frequency.setValueAtTime(1046.50, now + 0.3); // C6
    
    osc2.frequency.setValueAtTime(261.63, now); // C4
    
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    
    osc1.start();
    osc2.start();
    osc1.stop(now + 0.7);
    osc2.stop(now + 0.7);
  } catch (e) {}
};

const playFailureSound = (isMuted) => {
  if (isMuted) return;
  initAudio();
  try {
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc1.type = 'sawtooth';
    osc2.type = 'square';
    
    const now = audioCtx.currentTime;
    osc1.frequency.setValueAtTime(120, now); 
    osc1.frequency.setValueAtTime(90, now + 0.15); 
    
    osc2.frequency.setValueAtTime(125, now);
    osc2.frequency.setValueAtTime(95, now + 0.15);
    
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    
    osc1.start();
    osc2.start();
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  } catch (e) {}
};

// --- Custom Typewriter Hook for Visual Novel Dialogue ---
function useTypewriter(text, speed = 25, isMutedRef) {
  const [displayedText, setDisplayedText] = useState('');
  const [isDone, setIsDone] = useState(false);
  const timerRef = useRef(null);
  const delayRef = useRef(null);

  useEffect(() => {
    setDisplayedText('');
    setIsDone(false);
    let i = 0;
    
    if (delayRef.current) clearTimeout(delayRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    delayRef.current = setTimeout(() => {
      if (isMutedRef && !isMutedRef.current && !audioCtx) {
        initAudio();
      }

      timerRef.current = setInterval(() => {
        if (i < text.length) {
          setDisplayedText(prev => {
            if (prev.length >= text.length) return prev;
            return prev + text.charAt(prev.length);
          });
          if (text.charAt(i) !== ' ') {
            playTypeSound(isMutedRef ? isMutedRef.current : false);
          }
          i++;
        } else {
          clearInterval(timerRef.current);
          setIsDone(true);
        }
      }, speed);
    }, 300);

    return () => {
      if (delayRef.current) clearTimeout(delayRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [text, speed]);

  const skip = () => {
    if (delayRef.current) clearTimeout(delayRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    setDisplayedText(text);
    setIsDone(true);
  };

  return { displayedText, isDone, skip };
}

const TwitterIcon = ({ size, color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none" style={{ display: 'inline-block' }}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 4.076H5.078z"/>
  </svg>
);

const Chapter1 = () => {
  const navigate = useNavigate();
  const { walletAddress, isConnected, isWhitelisted, isValidating, error: walletError, connectWallet, disconnectWallet } = useWallet();

  useEffect(() => {
    if (walletAddress) {
      setEvmAddress(walletAddress);
      checkWalletClaimStatus(walletAddress);
    }
  }, [walletAddress]);

  const checkWalletClaimStatus = async (address) => {
    if (!address) return;
    try {
      const { data, error } = await supabase
        .from('gacha_claims')
        .select('wallet_address, claimed_code, reward_type')
        .ilike('wallet_address', address);
      
      if (!error && data && data.length > 0) {
        const claim = data[0];
        const isWin = claim.claimed_code && claim.claimed_code !== 'NONE';
        const result = isWin ? 'success' : 'failure';

        // Cache in localStorage to ensure the terminal stays permanently locked
        localStorage.setItem('turc_chapter1_gacha_result', result);
        localStorage.setItem('turc_chapter1_evm_address', claim.wallet_address || '');
        if (isWin) {
          localStorage.setItem('turc_chapter1_claimed_code', claim.claimed_code);
          localStorage.setItem('turc_chapter1_reward_type', claim.reward_type);
        } else {
          localStorage.removeItem('turc_chapter1_claimed_code');
          localStorage.removeItem('turc_chapter1_reward_type');
        }

        // Apply state updates
        setGachaResult(result);
        setEvmAddress(claim.wallet_address || '');
        setVerificationCompleted(true);
        setHasRaided(true);
        if (isWin) {
          setClaimedCode(claim.claimed_code);
          setRewardType(claim.reward_type);
          setCurrentSessionState(claim.reward_type === 'gtd' ? 'success_gtd' : 'success_fcfs');
        } else {
          setRewardType(null);
          setClaimedCode('');
          setCurrentSessionState('failure');
        }
        setCurrentDialogueIndex(0);
      } else {
        // WALLET HAS NOT DRAWN / NOT IN DATABASE - RESET TO STEP 1 (INITIAL STATE)
        // Clear gacha local storage for this session
        localStorage.removeItem('turc_chapter1_gacha_result');
        localStorage.removeItem('turc_chapter1_evm_address');
        localStorage.removeItem('turc_chapter1_claimed_code');
        localStorage.removeItem('turc_chapter1_reward_type');
        localStorage.removeItem('turc_verification_completed');

        // Reset all React state variables to initial values
        setGachaResult(null);
        setClaimedCode('');
        setRewardType(null);
        setVerificationCompleted(false);
        setHasRaided(false);
        setCurrentStep(1);
        setStep1Clicked(false);
        setStep1Verified(false);
        setStep2Clicked(false);
        setStep2Verified(false);
        setStep3Verified(false);
        setCurrentSessionState('briefing');
        setCurrentDialogueIndex(0);
      }
    } catch (err) {
      console.error("Failed to check wallet claim status:", err);
    }
  };

  const [currentSessionState, setCurrentSessionState] = useState(() => {
    const savedResult = localStorage.getItem('turc_chapter1_gacha_result');
    if (savedResult) {
      if (savedResult === 'success') {
        const type = localStorage.getItem('turc_chapter1_reward_type');
        return type === 'gtd' ? 'success_gtd' : 'success_fcfs';
      } else {
        return 'failure';
      }
    }
    return 'briefing';
  });
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  
  const [evmAddress, setEvmAddress] = useState(() => {
    return localStorage.getItem('turc_chapter1_evm_address') || '';
  });
  const [hasRaided, setHasRaided] = useState(() => {
    return localStorage.getItem('turc_chapter1_gacha_result') ? true : false;
  });
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanMessage, setScanMessage] = useState('');

  // Video Ceremony overlay states
  const [showIntroVideo, setShowIntroVideo] = useState(() => {
    return !localStorage.getItem('turc_chapter1_gacha_result');
  });
  const [videoStarted, setVideoStarted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const videoRef = useRef(null);
  
  const [gachaResult, setGachaResult] = useState(() => {
    return localStorage.getItem('turc_chapter1_gacha_result') || null;
  });
  const [claimedCode, setClaimedCode] = useState(() => {
    return localStorage.getItem('turc_chapter1_claimed_code') || '';
  });
  const [rewardType, setRewardType] = useState(() => {
    return localStorage.getItem('turc_chapter1_reward_type') || null;
  });
  
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isFailureModalOpen, setIsFailureModalOpen] = useState(false);
  
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(isMuted);
  const bgmRef = useRef(null);
  
  const [gachaSlots, setGachaSlots] = useState([]);
  const [remainingSupply, setRemainingSupply] = useState(1100);
  const [remainingFcfs, setRemainingFcfs] = useState(1000);
  const [remainingGtd, setRemainingGtd] = useState(100);
  const [userIp, setUserIp] = useState(null);
  const [ipBlocked, setIpBlocked] = useState(false);

  // --- Step-by-step verification state variables ---
  const [verificationCompleted, setVerificationCompleted] = useState(() => {
    return localStorage.getItem('turc_chapter1_gacha_result') 
      ? true 
      : (localStorage.getItem('turc_verification_completed') === 'true');
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Clicked, setStep1Clicked] = useState(false);
  const [step1Verified, setStep1Verified] = useState(false);
  const [step2Clicked, setStep2Clicked] = useState(false);
  const [step2Verified, setStep2Verified] = useState(false);
  const [quoteTweetUrl, setQuoteTweetUrl] = useState('');
  const [step3Verified, setStep3Verified] = useState(false);
  const [verifyingStep, setVerifyingStep] = useState(null); // 1, 2, 3, or null
  const [verifyProgress, setVerifyProgress] = useState(0);

  // Captcha anti-bot states
  const [captchaTarget, setCaptchaTarget] = useState('');
  const [captchaOptions, setCaptchaOptions] = useState([]);
  const [captchaError, setCaptchaError] = useState(false);

  const generateCaptcha = () => {
    const codes = ['0x4E', '0x7F', '0xA2', '0xBC', '0xD5', '0xE9', '0x1F', '0x3B', '0x6A', '0x8D', '0xC1', '0xF4'];
    const shuffled = [...codes].sort(() => Math.random() - 0.5);
    const options = shuffled.slice(0, 6);
    const target = options[Math.floor(Math.random() * options.length)];
    setCaptchaTarget(target);
    setCaptchaOptions(options);
    setCaptchaError(false);
  };

  useEffect(() => {
    if (currentStep === 4 && !verificationCompleted && captchaOptions.length === 0) {
      generateCaptcha();
    }
  }, [currentStep, verificationCompleted, captchaOptions.length]);

  const isQuoteTweetUrlValid = (url) => {
    const pattern = /^https?:\/\/(www\.)?(twitter|x)\.com\/[a-zA-Z0-9_]+\/status\/[0-9]+/i;
    return pattern.test(url.trim());
  };

  const handleVerifyStep = (stepNum) => {
    playConfirmSound(isMuted);
    setVerifyingStep(stepNum);
    setVerifyProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setVerifyProgress(progress);
      playTypeSound(isMuted);
      if (progress >= 100) {
        clearInterval(interval);
        setVerifyingStep(null);
        if (stepNum === 1) {
          setStep1Verified(true);
          setCurrentStep(2);
          setCurrentSessionState('step_2');
          setCurrentDialogueIndex(0);
        } else if (stepNum === 2) {
          setStep2Verified(true);
          setCurrentStep(3);
          setCurrentSessionState('step_3');
          setCurrentDialogueIndex(0);
        } else if (stepNum === 3) {
          setStep3Verified(true);
          setCurrentStep(4);
          setCurrentSessionState('step_4');
          setCurrentDialogueIndex(0);
        }
      }
    }, 120);
  };

  const handleCaptchaClick = (code) => {
    if (code === captchaTarget) {
      playSuccessSound(isMuted);
      setVerificationCompleted(true);
      localStorage.setItem('turc_verification_completed', 'true');
      setCurrentSessionState('evm_entry');
      setCurrentDialogueIndex(0);
    } else {
      playFailureSound(isMuted);
      setCaptchaError(true);
      setTimeout(() => {
        generateCaptcha();
      }, 1000);
    }
  };
  
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [systemTime, setSystemTime] = useState(new Date().toLocaleTimeString());

  // --- Initializing local storage and live feeds ---
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSystemTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // IP detection removed as requested - using connect wallet

  // Initialize and load supply counts from Supabase
  useEffect(() => {
    const fetchSupply = async () => {
      try {
        const { data: claims, error } = await supabase
          .from('gacha_claims')
          .select('reward_type');

        if (!error && claims) {
          const fcfsClaimed = claims.filter(c => c.reward_type === 'fcfs').length;
          const gtdClaimed = claims.filter(c => c.reward_type === 'gtd').length;
          
          const fcfsRemaining = Math.max(0, 1000 - fcfsClaimed);
          const gtdRemaining = Math.max(0, 100 - gtdClaimed);
          
          setRemainingFcfs(fcfsRemaining);
          setRemainingGtd(gtdRemaining);
          setRemainingSupply(fcfsRemaining + gtdRemaining);
        } else {
          setRemainingFcfs(1000);
          setRemainingGtd(100);
          setRemainingSupply(1100);
        }
      } catch (err) {
        console.error("Failed to load supply from database:", err);
        setRemainingFcfs(1000);
        setRemainingGtd(100);
        setRemainingSupply(1100);
      }
    };

    fetchSupply();
  }, []);

  // Prepopulate live breach log feed
  useEffect(() => {
    const baseMockLogs = [
      { time: '17:01:22', text: 'CADET RECRUITMENT LOGGED BY 0x3F8B...C210', status: 'WARN', color: '#ffd500' },
      { time: '17:02:15', text: 'CADET 0x7E12...9F81 SECURED ADMISSION -> CODE ACAD-014', status: 'SUCCESS', color: '#00f0ff' },
      { time: '17:03:09', text: 'CADET 0x9A45...2B34 BLOCKED -> SLOTS EXHAUSTED', status: 'DENIED', color: '#ff007f' },
      { time: '17:03:54', text: 'CADET 0x5C90...7D11 SECURED ADMISSION -> CODE ACAD-056', status: 'SUCCESS', color: '#00f0ff' },
      { time: '17:04:12', text: 'CADET 0x1B88...8A4C BLOCKED -> SLOTS EXHAUSTED', status: 'DENIED', color: '#ff007f' },
    ];
    setTerminalLogs(baseMockLogs);

    // Loop to inject random activity updates
    const interval = setInterval(() => {
      const mockWallets = [
        '0x3F8B...C210', '0x7E12...9F81', '0x9A45...2B34', '0x5C90...7D11', '0x1B88...8A4C',
        '0x6D31...5E29', '0x4F02...3A12', '0x8B77...0C45', '0x2D9A...99FF', '0x0E55...11AA'
      ];
      const randomWallet = mockWallets[Math.floor(Math.random() * mockWallets.length)];
      const randomSuccess = Math.random() < 0.45;
      const nowTime = new Date().toLocaleTimeString();
      const randomCode = `ACAD-${String(Math.floor(Math.random() * 200) + 1).padStart(3, '0')}`;

      const newLog = randomSuccess 
        ? { time: nowTime, text: `CADET ${randomWallet} SECURED ADMISSION -> CODE ${randomCode}`, status: 'SUCCESS', color: '#00f0ff' }
        : { time: nowTime, text: `CADET ${randomWallet} BLOCKED -> SLOTS EXHAUSTED`, status: 'DENIED', color: '#ff007f' };

      setTerminalLogs(prev => [newLog, ...prev.slice(0, 7)]);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  // Audio configuration & lifecycle
  useEffect(() => {
    bgmRef.current = new AcademySoundtrack();
    return () => {
      if (bgmRef.current) bgmRef.current.stop();
    };
  }, []);

  useEffect(() => {
    if (bgmRef.current) {
      if (!isMuted && !showIntroVideo) {
        bgmRef.current.start();
      } else {
        bgmRef.current.stop();
      }
    }
  }, [isMuted, showIntroVideo]);

  useEffect(() => {
    const handleFirstInteraction = () => {
      initAudio();
      if (!isMutedRef.current && bgmRef.current && !showIntroVideo) {
        bgmRef.current.start();
      }
      window.removeEventListener('click', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    return () => window.removeEventListener('click', handleFirstInteraction);
  }, [showIntroVideo]);

  // Typewriter effect state hooks
  const currentSession = dialogueSessions[currentSessionState]?.[currentDialogueIndex];
  const { displayedText, isDone, skip } = useTypewriter(currentSession?.text || '', 25, isMutedRef);

  const handleDialogueClick = () => {
    if (!isDone) {
      skip();
    } else if (currentDialogueIndex < dialogueSessions[currentSessionState].length - 1) {
      playClickSound(isMuted);
      setCurrentDialogueIndex(c => c + 1);
    } else if (currentSessionState === 'briefing') {
      playClickSound(isMuted);
      if (verificationCompleted) {
        setCurrentSessionState('evm_entry');
      } else {
        setCurrentSessionState('step_1');
      }
      setCurrentDialogueIndex(0);
    }
  };

  const handleEvmInputFocus = () => {
    playTypeSound(isMuted);
  };

  const handleEvmSubmit = async (e) => {
    e.preventDefault();
    if (!/^0x[0-9a-fA-F]{40}$/.test(evmAddress.trim())) return;
    
    playConfirmSound(isMuted);

    // IP verification removed

    setCurrentSessionState('raid_needed');
    setCurrentDialogueIndex(0);
  };

  const handlePerformRaid = () => {
    playConfirmSound(isMuted);
    const targetTweet = 'https://x.com/TurcNFT/status/2057111706250387712?s=20';
    const text = encodeURIComponent(`Locked in and working through the Chapter I Gateway Trial. 
Aiming for that seat at the 

@TurcNFT Academy!

${targetTweet}`);
    const url = `https://twitter.com/intent/tweet?text=${text}`;
    
    window.open(url, '_blank');
    
    setHasRaided(true);
    setCurrentSessionState('gacha_ready');
    setCurrentDialogueIndex(0);
  };

  const handleGachaDraw = async () => {
    playConfirmSound(isMuted);

    // IP verification removed

    setIsScanning(true);
    setScanProgress(0);
    setScanMessage('PREPARING ENROLLMENT GATEWAY...');

    const scanningPhases = [
      { progress: 15, msg: 'VERIFYING RECRUIT CREDENTIALS...' },
      { progress: 38, msg: 'ANALYZING TRIAL SCORES...' },
      { progress: 55, msg: 'GENERATING ACADEMY CLEARANCE...' },
      { progress: 75, msg: 'ALLOCATING ADMISSION CODE...' },
      { progress: 92, msg: 'CONFIRMING ENLISTMENT SECTOR...' },
      { progress: 100, msg: 'Initiation complete!' }
    ];

    let phaseIndex = 0;
    const interval = setInterval(() => {
      if (phaseIndex < scanningPhases.length) {
        setScanProgress(scanningPhases[phaseIndex].progress);
        setScanMessage(scanningPhases[phaseIndex].msg);
        playTypeSound(isMuted);
        phaseIndex++;
      } else {
        clearInterval(interval);
        executeGachaLogic();
      }
    }, 450);
  };

  const executeGachaLogic = async () => {
    setIsScanning(false);
    
    // Fetch latest claim counts from Supabase to ensure accurate supply checks
    let latestFcfsClaimed = 0;
    let latestGtdClaimed = 0;
    try {
      const { data: claims, error } = await supabase
        .from('gacha_claims')
        .select('reward_type');
      if (!error && claims) {
        latestFcfsClaimed = claims.filter(c => c.reward_type === 'fcfs').length;
        latestGtdClaimed = claims.filter(c => c.reward_type === 'gtd').length;
      }
    } catch (err) {
      console.error("Error fetching latest supply for gacha roll:", err);
    }

    const fcfsRemaining = Math.max(0, 1000 - latestFcfsClaimed);
    const gtdRemaining = Math.max(0, 100 - latestGtdClaimed);

    // Roll to determine win type:
    // 1% Guaranteed (GTD)
    // 20% First Come First Serve (FCFS)
    // 79% Failure (Zonk)
    const roll = Math.random() * 100;
    let rolledReward = null;

    if (roll < 1) {
      if (gtdRemaining > 0) {
        rolledReward = 'gtd';
      } else if (fcfsRemaining > 0) {
        rolledReward = 'fcfs';
      }
    } else if (roll < 21) {
      if (fcfsRemaining > 0) {
        rolledReward = 'fcfs';
      } else if (gtdRemaining > 0) {
        rolledReward = 'gtd';
      }
    }

    const isSuccess = rolledReward !== null;

    if (isSuccess) {
      // Generate a unique code
      const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
      const newClaimCode = rolledReward === 'gtd' 
        ? `GTD-${String(latestGtdClaimed + 1).padStart(3, '0')}-${randomSuffix}`
        : `FCFS-${String(latestFcfsClaimed + 1).padStart(4, '0')}-${randomSuffix}`;

      // Record claim in Supabase
      if (evmAddress) {
        try {
          const { error } = await supabase
            .from('gacha_claims')
            .insert([
              {
                ip_address: `wallet-${evmAddress.toLowerCase()}`, // Use a unique placeholder to satisfy UNIQUE NOT NULL db constraint without forcing SQL table alteration
                wallet_address: evmAddress.toLowerCase(),
                claimed_code: newClaimCode,
                reward_type: rolledReward
              }
            ]);

          if (error) {
            console.error("Supabase insert claim error:", error);
            if (error.code !== 'PGRST205') {
              alert("Database sync failed. Please try again.");
              return;
            }
          }
        } catch (e) {
          console.error("Supabase claim connection failed:", e);
        }
      }

      // Update state
      const finalRemainingFcfs = rolledReward === 'fcfs' ? fcfsRemaining - 1 : fcfsRemaining;
      const finalRemainingGtd = rolledReward === 'gtd' ? gtdRemaining - 1 : gtdRemaining;
      setRemainingFcfs(finalRemainingFcfs);
      setRemainingGtd(finalRemainingGtd);
      setRemainingSupply(finalRemainingFcfs + finalRemainingGtd);
      setClaimedCode(newClaimCode);
      
      setRewardType(rolledReward);
      setGachaResult('success');
      localStorage.setItem('turc_chapter1_gacha_result', 'success');
      localStorage.setItem('turc_chapter1_claimed_code', newClaimCode);
      localStorage.setItem('turc_chapter1_reward_type', rolledReward);
      localStorage.setItem('turc_chapter1_evm_address', evmAddress);
      
      const nowTime = new Date().toLocaleTimeString();
      const newRealLog = { 
        time: nowTime, 
        text: `YOU (${evmAddress.substring(0, 6)}...${evmAddress.substring(38)}) SECURED ${rolledReward.toUpperCase()} ADMISSION -> CODE ${newClaimCode}!`, 
        status: 'SUCCESS', 
        color: '#00f0ff' 
      };
      setTerminalLogs(prev => [newRealLog, ...prev]);

      playSuccessSound(isMuted);
      setIsSuccessModalOpen(true);
      setCurrentSessionState(rolledReward === 'gtd' ? 'success_gtd' : 'success_fcfs');
      setCurrentDialogueIndex(0);
    } else {
      // Record failure in Supabase so they can't try again
      if (evmAddress) {
        try {
          const { error } = await supabase
            .from('gacha_claims')
            .insert([
              {
                ip_address: `wallet-${evmAddress.toLowerCase()}`, // Use a unique placeholder to satisfy UNIQUE NOT NULL db constraint
                wallet_address: evmAddress.toLowerCase(),
                claimed_code: 'NONE',
                reward_type: 'failure'
              }
            ]);

          if (error) {
            console.error("Supabase insert failure error:", error);
          }
        } catch (e) {
          console.error("Supabase failure record connection failed:", e);
        }
      }

      setGachaResult('failure');
      localStorage.setItem('turc_chapter1_gacha_result', 'failure');
      localStorage.setItem('turc_chapter1_evm_address', evmAddress);
      
      const nowTime = new Date().toLocaleTimeString();
      const newRealLog = { time: nowTime, text: `YOU (${evmAddress.substring(0, 6)}...${evmAddress.substring(38)}) ACCESSED ADMISSION DRAW -> ZONK (SLOTS EXHAUSTED)`, status: 'DENIED', color: '#ff007f' };
      setTerminalLogs(prev => [newRealLog, ...prev]);

      playFailureSound(isMuted);
      setIsFailureModalOpen(true);
      setCurrentSessionState('failure');
      setCurrentDialogueIndex(0);
    }
  };

  const handleShareBreach = () => {
    playConfirmSound(isMuted);
    const typeText = rewardType ? rewardType.toUpperCase() : '';
    const text = encodeURIComponent(`I successfully cleared the Chapter I Gateway Trial and secured one of the 1,100 limited @TurcNFT Academy ${typeText} admission codes!\n\nCODE: ${claimedCode}\n\nJoin the trial! #AcademyRecruit`);
    const url = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(url, '_blank');
  };

  const handleRetryRaid = () => {
    playConfirmSound(isMuted);
    setIsFailureModalOpen(false);
    setCurrentSessionState('gacha_ready');
    setCurrentDialogueIndex(0);
  };

  const getProgressPercentage = () => {
    if (gachaResult === 'success') return 100;
    if (hasRaided) return 95;
    if (verificationCompleted) {
      if (/^0x[0-9a-fA-F]{40}$/.test(evmAddress.trim())) return 80;
      return 60;
    }
    // Scale steps 1 to 4 from 0% to 50%
    return Math.floor(((currentStep - 1) / 4) * 50);
  };

  const startVideo = () => {
    setVideoStarted(true);
    // Explicit first interaction audio initialization to satisfy browser rules
    initAudio();
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.error("Failed to autoplay video:", err);
      });
    }
  };

  const handleVideoEnded = () => {
    setShowIntroVideo(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#070708',
        position: 'relative',
        overflowX: 'hidden'
      }}
    >
      {/* Intro Video Ceremony Overlay */}
      <AnimatePresence>
        {showIntroVideo && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: '#000',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}
          >
            {/* CRT effect on video screen */}
            <div className="crt-overlay" style={{ opacity: 0.15, pointerEvents: 'none' }}></div>

            {/* Always keep the video element in the DOM to preload and buffer in the background instantly! */}
            <div style={{ 
              position: 'relative', 
              width: '100%', 
              height: '100%', 
              display: videoStarted ? 'flex' : 'none', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <video
                ref={videoRef}
                src="/Academy Ceremony.mp4"
                preload="auto"
                playsInline
                webkit-playsinline="true"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  zIndex: 1
                }}
                onEnded={handleVideoEnded}
                onWaiting={() => setIsBuffering(true)}
                onPlaying={() => setIsBuffering(false)}
                onCanPlay={() => setIsBuffering(false)}
                onSeeked={() => setIsBuffering(false)}
                onSeeking={() => setIsBuffering(true)}
                muted={videoMuted}
              />

              {/* Glowing Buffering Loader */}
              {isBuffering && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '15px',
                  background: 'rgba(5, 5, 5, 0.7)',
                  padding: '20px 30px',
                  borderRadius: '12px',
                  border: '1.5px solid var(--neon-blue)',
                  boxShadow: '0 0 25px rgba(0, 240, 255, 0.25)',
                  backdropFilter: 'blur(5px)'
                }}>
                  <RefreshCw size={36} color="var(--neon-blue)" style={{ animation: 'spin 1.5s linear infinite' }} />
                  <span className="font-heading" style={{ color: 'var(--neon-blue)', fontSize: '0.9rem', letterSpacing: '1px', fontWeight: 'bold', textShadow: '0 0 5px var(--neon-blue)' }}>
                    BUFFERING TRANSMISSION...
                  </span>
                </div>
              )}

              {/* Video controls / Skip button with high responsive alignment */}
              <div className="video-controls-container">
                <button
                  onClick={() => setVideoMuted(!videoMuted)}
                  style={{
                    background: 'rgba(15,15,15,0.85)',
                    border: '1.5px solid #2d303b',
                    borderRadius: '50%',
                    width: '45px',
                    height: '45px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#fff',
                    outline: 'none',
                    transition: 'all 0.2s',
                    pointerEvents: 'auto'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--neon-blue)'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = '#2d303b'}
                >
                  {videoMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>

                <button
                  onClick={() => setShowIntroVideo(false)}
                  className="cyber-button"
                  style={{
                    padding: '10px 24px',
                    fontSize: '0.95rem',
                    background: 'rgba(15, 17, 22, 0.9)',
                    border: '1.5px solid var(--neon-pink)',
                    borderRadius: '8px',
                    boxShadow: '0 0 15px rgba(255, 0, 127, 0.2)',
                    pointerEvents: 'auto'
                  }}
                >
                  <span className="cyber-button-text font-heading" style={{ color: 'var(--neon-pink)', textShadow: '0 0 5px var(--neon-pink)' }}>
                    SKIP CEREMONY
                  </span>
                </button>
              </div>
            </div>

            {/* Click-to-Initialize Screen */}
            {!videoStarted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  textAlign: 'center',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '20px',
                  zIndex: 10
                }}
              >
                <div style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: 'rgba(0, 240, 255, 0.05)',
                  border: '2.5px solid var(--neon-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 25px rgba(0, 240, 255, 0.3)',
                  cursor: 'pointer',
                  animation: 'pulse-glow 2s infinite'
                }}
                onClick={startVideo}
                >
                  <Play size={40} color="var(--neon-blue)" style={{ marginLeft: '6px', filter: 'drop-shadow(0 0 8px var(--neon-blue))' }} />
                </div>
                <h2 className="font-heading" style={{ color: '#fff', letterSpacing: '2px', fontSize: '1.5rem', textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>
                  JOIN ACADEMY CEREMONY
                </h2>
                <p className="font-heading" style={{ color: 'var(--neon-blue)', letterSpacing: '1px', fontSize: '0.9rem', textShadow: '0 0 5px var(--neon-blue)' }}>
                  [ CLICK TO START ]
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="crt-overlay" style={{ opacity: 0.35 }}></div>

      {/* Top Progress Bar */}
      <div className="academy-top-nav" style={{
        background: 'var(--dark)',
        padding: '15px 40px',
        borderBottom: '4px solid var(--neon-pink)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 30,
        position: 'relative',
        boxShadow: '0 5px 20px rgba(255,0,127,0.2)'
      }}>
        <div className="academy-nav-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button 
            className="academy-back-btn"
            onClick={() => navigate('/')}
            style={{
              background: 'transparent',
              border: '2px solid var(--neon-pink)',
              borderRadius: '8px',
              color: 'var(--neon-pink)',
              cursor: 'pointer',
              padding: '6px 15px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              fontFamily: 'var(--font-heading)',
              fontWeight: 'bold',
              outline: 'none'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'var(--neon-pink)'; e.currentTarget.style.color = 'var(--dark)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--neon-pink)'; }}
          >
            <ArrowLeft size={18} /> <span>BACK</span>
          </button>
          
          <h2 className="academy-nav-title font-heading" style={{ color: '#fff', margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--neon-pink)' }}>⚡</span> <span className="title-text">CHAPTER 1</span>
          </h2>
        </div>
        
        <div className="academy-progress-wrapper" style={{ flex: 1, margin: '0 40px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div className="academy-progress-bar" style={{ flex: 1, height: '12px', background: '#111', borderRadius: '6px', border: '2px solid #333', overflow: 'hidden', position: 'relative' }}>
            <motion.div 
              style={{ 
                height: '100%', 
                background: 'linear-gradient(90deg, var(--neon-pink), var(--neon-blue))',
                boxShadow: '0 0 10px var(--neon-blue)'
              }}
              initial={{ width: 0 }}
              animate={{ width: `${getProgressPercentage()}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <span className="font-heading" style={{ color: '#00f0ff', fontWeight: 'bold' }}>{getProgressPercentage()}%</span>
        </div>

        {/* Wallet connection status */}
        <div style={{ display: 'flex', alignItems: 'center', marginRight: '20px' }}>
          {isValidating ? (
            <span style={{ color: 'var(--neon-blue)', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--font-heading)', fontWeight: 'bold', fontSize: '0.9rem' }}>
              <RefreshCw size={16} style={{ animation: 'spin 1.5s linear infinite' }} /> CHECKING...
            </span>
          ) : isConnected ? (
            <span 
              onClick={disconnectWallet}
              title="Click to disconnect"
              style={{ 
                color: isWhitelisted ? 'var(--neon-blue)' : 'var(--neon-pink)', 
                cursor: 'pointer',
                display: 'flex', 
                alignItems: 'center', 
                gap: '5px',
                fontFamily: 'var(--font-heading)',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                textShadow: isWhitelisted ? '0 0 10px rgba(0, 240, 255, 0.4)' : '0 0 10px rgba(255, 0, 127, 0.4)'
              }}
            >
              <Wallet size={16} /> 
              {walletAddress.substring(0, 6)}...{walletAddress.substring(38)} 
              {isWhitelisted ? ' [VERIFIED]' : ' [UNAUTHORIZED]'}
            </span>
          ) : (
            <button 
              onClick={connectWallet}
              style={{ 
                background: 'transparent', 
                border: '2px solid var(--yellow)', 
                borderRadius: '8px',
                padding: '5px 12px',
                color: 'var(--yellow)', 
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                fontFamily: 'var(--font-heading)', fontWeight: 'bold', outline: 'none',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'var(--yellow)'; e.currentTarget.style.color = 'var(--dark)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--yellow)'; }}
            >
              <Wallet size={16} /> CONNECT
            </button>
          )}
        </div>

        {/* Mute Toggle */}
        <button 
          onClick={() => setIsMuted(!isMuted)}
          style={{
            background: 'transparent',
            border: 'none',
            color: isMuted ? '#888' : 'var(--yellow)',
            cursor: 'pointer',
            padding: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s'
          }}
        >
          {isMuted ? <VolumeX size={28} /> : <Volume2 size={28} />}
        </button>
      </div>

      {/* Main Content Area */}
      {!isConnected || !isWhitelisted ? (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '2rem',
          zIndex: 10
        }}>
          {/* Warning Tapes */}
          <div className="warning-tape warning-tape-1">
            <span>SECURED GATEWAY ! RESTRICTED AREA ! SECURED GATEWAY ! RESTRICTED AREA !</span>
            <span>SECURED GATEWAY ! RESTRICTED AREA ! SECURED GATEWAY ! RESTRICTED AREA !</span>
          </div>

          <div style={{
            width: '100%',
            maxWidth: '560px',
            background: 'linear-gradient(135deg, rgba(12, 14, 18, 0.98) 0%, rgba(18, 22, 28, 0.95) 100%)',
            border: '3px solid var(--neon-pink)',
            borderRadius: '24px',
            padding: '40px',
            boxShadow: '0 0 50px rgba(255, 0, 127, 0.4), inset 0 0 30px rgba(255, 0, 127, 0.1)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'blur(10px)'
          }}>
            {/* CRT overlay inside the card */}
            <div className="crt-overlay" style={{ opacity: 0.4 }}></div>

            {/* Locked Icon */}
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              background: 'rgba(255, 0, 127, 0.08)', 
              border: '2.5px solid var(--neon-pink)', 
              marginBottom: '25px', 
              boxShadow: '0 0 25px rgba(255, 0, 127, 0.3)',
              animation: 'pulse-glow 2s infinite'
            }}>
              <Lock size={36} color="var(--neon-pink)" style={{ filter: 'drop-shadow(0 0 8px var(--neon-pink))' }} />
            </div>

            <h1 className="font-comic" style={{
              fontSize: '3.5rem',
              color: 'var(--yellow)',
              margin: '0 0 10px 0',
              textShadow: '3px 3px 0 var(--pink), -1px -1px 0 #fff',
              letterSpacing: '2px'
            }}>
              CHAPTER I GATEWAY
            </h1>

            <p style={{ 
              color: '#fff', 
              fontSize: '1.1rem', 
              margin: '0 0 30px 0', 
              lineHeight: '1.5', 
              fontFamily: 'var(--font-heading)' 
            }}>
              This gate requires wallet authentication. Only whitelisted recruits registered in the database can bypass this check.
            </p>

            {/* Validation Status / Error */}
            {isValidating ? (
              <div style={{
                background: 'rgba(0, 240, 255, 0.05)',
                border: '1.5px solid var(--neon-blue)',
                borderRadius: '12px',
                padding: '18px',
                marginBottom: '30px',
                color: 'var(--neon-blue)',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}>
                <RefreshCw size={16} style={{ animation: 'spin 1.5s linear infinite' }} />
                <span>VERIFYING RECRUIT PAPERS WITH DATABASE...</span>
              </div>
            ) : isConnected && !isWhitelisted ? (
              <div style={{
                background: 'rgba(255, 0, 127, 0.06)',
                border: '1.5px solid var(--neon-pink)',
                borderRadius: '12px',
                padding: '18px',
                marginBottom: '30px',
                color: 'var(--neon-pink)',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                lineHeight: '1.5',
                textAlign: 'left'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px', textTransform: 'uppercase' }}>
                  🛑 ENLISTMENT ALARM: ACCESS DENIED
                </div>
                <div style={{ wordBreak: 'break-all', fontSize: '0.8rem', color: '#ccc' }}>
                  Wallet: {walletAddress}
                </div>
                <div style={{ marginTop: '8px', color: '#ffb3d9' }}>
                  This wallet is not whitelisted. Access is prohibited for unauthorized recruits.
                </div>
              </div>
            ) : walletError ? (
              <div style={{
                background: 'rgba(255, 213, 0, 0.06)',
                border: '1.5px solid var(--yellow)',
                borderRadius: '12px',
                padding: '18px',
                marginBottom: '30px',
                color: 'var(--yellow)',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                lineHeight: '1.5',
                textAlign: 'left'
              }}>
                {walletError}
              </div>
            ) : null}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexDirection: 'column' }}>
              {!isConnected ? (
                <motion.button
                  className="comic-button"
                  onClick={connectWallet}
                  style={{
                    background: 'var(--neon-blue)',
                    border: '3px solid #000',
                    color: '#000',
                    padding: '16px 32px',
                    fontSize: '1.2rem',
                    borderRadius: '10px',
                    boxShadow: '4px 4px 0px #000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    fontWeight: '900',
                    cursor: 'pointer'
                  }}
                  whileHover={{ scale: 1.02, boxShadow: '6px 6px 0px #000' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Wallet size={20} />
                  <span>CONNECT WALLET</span>
                </motion.button>
              ) : (
                <motion.button
                  className="comic-button"
                  onClick={disconnectWallet}
                  style={{
                    background: 'transparent',
                    border: '3px solid #3c242b',
                    color: '#b7a2a7',
                    padding: '16px 32px',
                    fontSize: '1.1rem',
                    borderRadius: '10px',
                    boxShadow: 'none',
                    cursor: 'pointer'
                  }}
                  whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.02)', borderColor: '#835f68' }}
                  whileTap={{ scale: 0.98 }}
                >
                  DISCONNECT & TRY ANOTHER
                </motion.button>
              )}

              <motion.button
                className="comic-button"
                onClick={() => navigate('/')}
                style={{
                  background: 'transparent',
                  border: '3px solid #2d303b',
                  color: '#8d98a7',
                  padding: '14px 28px',
                  fontSize: '1rem',
                  borderRadius: '10px',
                  boxShadow: 'none',
                  cursor: 'pointer'
                }}
                whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.02)', borderColor: '#687385' }}
                whileTap={{ scale: 0.98 }}
              >
                RETURN TO HOME DECK
              </motion.button>
            </div>
          </div>
        </div>
      ) : (
        /* --- Main Split Content Interface --- */
        <div className="academy-split-container" style={{
          flex: 1,
          display: 'flex',
          position: 'relative',
          zIndex: 10,
          overflow: 'hidden'
        }}>
        
        {/* LEFT SIDE: Visual Novel Instructor Room */}
        <div className="academy-left-panel" style={{
          flex: 1.1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          position: 'relative',
          padding: '2.5rem 2rem',
          minHeight: '450px',
          background: 'transparent'
        }}>
          
          {/* Welcome Tag Badge at top-left */}
          <div className="welcome-tag" style={{
            background: 'var(--dark)',
            color: 'var(--yellow)',
            padding: '10px 20px',
            border: '3px solid var(--neon-pink)',
            transform: 'skewX(-10deg)',
            boxShadow: '4px 4px 0px var(--neon-pink)',
            position: 'absolute',
            top: '20px',
            left: '20px',
            zIndex: 10
          }}>
            <div style={{ transform: 'skewX(10deg)', whiteSpace: 'nowrap' }}>
              <h3 style={{ fontSize: '0.8rem', color: '#fff', margin: 0, whiteSpace: 'nowrap' }} className="font-heading">WELCOME TO</h3>
              <h1 style={{ fontSize: '2.2rem', margin: 0, lineHeight: '1', color: 'var(--yellow)', whiteSpace: 'nowrap' }} className="font-comic">TURC</h1>
            </div>
          </div>

          {/* Warning Diagonal Tapes */}
          <div className="warning-tape warning-tape-1" style={{ zIndex: 1, pointerEvents: 'none' }}>
            <span>WARNING ! WARNING ! WARNING ! WARNING ! WARNING ! WARNING ! WARNING ! WARNING !</span>
            <span>WARNING ! WARNING ! WARNING ! WARNING ! WARNING ! WARNING ! WARNING ! WARNING !</span>
          </div>
          <div className="warning-tape warning-tape-2" style={{ borderTopColor: '#ff007f', borderBottomColor: '#ff007f', color: '#ff007f', zIndex: 1, pointerEvents: 'none' }}>
            <span>RESTRICTED AREA ! KEEP OUT ! RESTRICTED AREA ! KEEP OUT ! RESTRICTED AREA !</span>
            <span>RESTRICTED AREA ! KEEP OUT ! RESTRICTED AREA ! KEEP OUT ! RESTRICTED AREA !</span>
          </div>

          {/* Interactive Character Avatar */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSession?.image}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.96 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              style={{ zIndex: 2, position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}
            >
              <motion.img 
                src={currentSession?.image} 
                alt="Briefing Portrait"
                style={{
                  width: '100%',
                  maxWidth: '520px',
                  height: '420px',
                  filter: 'drop-shadow(0 0 30px rgba(0, 240, 255, 0.35))',
                  marginBottom: '-20px',
                  objectFit: 'contain'
                }}
                animate={currentSession?.shake ? { x: [-6, 6, -6, 6, 0] } : { y: [0, -8, 0] }}
                transition={
                  currentSession?.shake 
                    ? { duration: 0.3, ease: "easeInOut" } 
                    : { repeat: Infinity, duration: 5, ease: 'easeInOut' }
                }
              />
            </motion.div>
          </AnimatePresence>

          {/* Typewriter Dialogue Box */}
          <motion.div 
            className="dialogue-box"
            onClick={handleDialogueClick}
            key={`dialogue-box-${currentSessionState}`}
            initial={{ scale: 0.96, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', bounce: 0.3 }}
            style={{
              width: '100%',
              maxWidth: '750px',
              background: 'linear-gradient(135deg, rgba(11, 13, 17, 0.96) 0%, rgba(18, 20, 26, 0.9) 100%)',
              border: '3px solid var(--neon-pink)',
              borderRadius: '16px',
              padding: '35px 25px 25px 25px',
              fontFamily: 'var(--font-heading)',
              fontSize: '1.25rem',
              color: '#f0f3f8',
              position: 'relative',
              boxShadow: '10px 10px 0px rgba(0,0,0,0.8), inset 0 0 30px rgba(255,0,127,0.08)',
              zIndex: 10,
              backdropFilter: 'blur(12px)',
              lineHeight: '1.6',
              cursor: 'pointer',
              marginTop: '15px'
            }}
            whileHover={{ scale: 1.01 }}
            onMouseEnter={() => !isDone && playClickSound(isMuted)}
          >
            {/* Holographic Name Tag */}
            <div className="dialogue-name-tag" style={{
              position: 'absolute',
              top: '-20px',
              left: '20px',
              background: 'var(--yellow)',
              border: '2px solid #000',
              padding: '6px 24px',
              borderRadius: '6px',
              transform: 'skewX(-10deg)',
              boxShadow: '3px 3px 0px var(--neon-pink)',
              zIndex: 11
            }}>
              <h3 className="font-comic" style={{ 
                margin: 0, 
                color: '#111', 
                fontSize: '1.4rem', 
                letterSpacing: '2px',
                transform: 'skewX(10deg)',
                textShadow: '0.5px 0.5px 0 #fff'
              }}>
                {currentSession?.name || 'INSTRUCTOR'}
              </h3>
            </div>

            {/* Rendered Typewriter Text */}
            <div style={{ width: '100%', minHeight: '80px' }}>
              <span style={{ textShadow: '0 0 4px rgba(255,255,255,0.4)', letterSpacing: '0.5px' }}>{displayedText}</span>
              {!isDone && <span style={{ opacity: 0.8, animation: 'pulse-glow 0.8s infinite', marginLeft: '3px', color: 'var(--neon-pink)' }}>_</span>}
              
              {isDone && currentDialogueIndex < dialogueSessions[currentSessionState].length - 1 && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: [0, 1, 0] }} 
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  style={{ 
                    position: 'absolute',
                    bottom: '12px',
                    right: '20px',
                    color: 'var(--neon-pink)', 
                    fontSize: '1.05rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: '900'
                  }}
                >
                  NEXT BRIEFING <Play size={14} fill="currentColor" />
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        {/* RIGHT SIDE: Enlistment & Verification Controls Room */}
        <div className="academy-right-panel" style={{
          flex: 1,
          background: 'transparent',
          borderLeft: '3px solid var(--neon-blue)',
          padding: '2.5rem 3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          position: 'relative',
          overflowY: 'auto'
        }}>
          {/* Logo Center at top of right panel */}
          <div className="hero-logo-container" style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 20,
            marginBottom: '30px'
          }}>
            <h1 className="font-comic hero-logo" style={{
              fontSize: '5rem',
              margin: 0,
              background: 'linear-gradient(to bottom, #00f0ff, #0044ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(4px 4px 0px #ff007f) drop-shadow(-2px -2px 0px #111)',
              WebkitTextStroke: '2px #111'
            }}>TURC</h1>
            
            {/* Subtitle */}
            <div style={{
              background: '#111',
              color: 'var(--yellow)',
              padding: '2px 8px',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              fontFamily: 'var(--font-heading)',
              border: '2px solid #111',
              marginTop: '-5px',
              zIndex: 5,
              whiteSpace: 'nowrap',
              letterSpacing: '1px'
            }}>
              THE URBAN REEF COLLECTION
            </div>
          </div>

          {/* Lock Cover during visual dialogues */}
          <AnimatePresence>
            {!isDone && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(5, 6, 8, 0.8)',
                  backdropFilter: 'blur(4px) grayscale(70%)',
                  zIndex: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'not-allowed',
                  gap: '15px'
                }}
              >
                <motion.div
                  style={{
                    background: 'rgba(15,15,15,0.9)',
                    border: '2px solid var(--yellow)',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    color: 'var(--yellow)',
                    fontFamily: 'var(--font-heading)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 0 25px rgba(255,213,0,0.2)',
                    animation: 'pulse-glow 2s infinite',
                    fontWeight: '900',
                    fontSize: '1.05rem',
                    letterSpacing: '1px'
                  }}
                >
                  <Lock size={18} className="zap-pulsing" style={{ color: 'var(--yellow)' }} />
                  INSTRUCTOR MR. BARRY TRANSMITTING BRIEFING...
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Remaining Supply Tracker HUD Card */}
          <div style={{
            background: 'rgba(15, 17, 22, 0.9)',
            border: '2px solid #232733',
            borderRadius: '12px',
            padding: '18px 24px',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
            zIndex: 5
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(0,240,255,0.08)', border: '1.5px solid var(--neon-blue)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                <Activity size={20} color="var(--neon-blue)" style={{ animation: 'zap-flicker 3s infinite alternate' }} />
              </div>
              <div>
                <div style={{ color: '#687385', fontSize: '0.8rem', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>Available Supply</div>
                <div className="font-heading" style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '900', display: 'flex', gap: '15px' }}>
                  <span>FCFS: {remainingFcfs}/1000</span>
                  <span>GTD: {remainingGtd}/100</span>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div className="font-comic" style={{ color: 'var(--neon-pink)', fontSize: '2.5rem', lineHeight: '1', textShadow: '0 0 10px rgba(255,0,127,0.4)' }}>
                {remainingSupply} <span style={{ fontSize: '1.2rem', color: '#687385' }}>/ 1100</span>
              </div>
            </div>
          </div>

          {/* Warning Flashing Labels */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '2rem', zIndex: 5 }}>
            <span className="zap-pulsing" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: '900', background: 'rgba(255,0,127,0.1)', border: '1px solid var(--neon-pink)', color: 'var(--neon-pink)', padding: '4px 10px', borderRadius: '5px', fontFamily: 'monospace', letterSpacing: '1px' }}>
              ⚠️ LIMITED ACCESS
            </span>
            <span className="zap-pulsing" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: '900', background: 'rgba(0,240,255,0.1)', border: '1px solid var(--neon-blue)', color: 'var(--neon-blue)', padding: '4px 10px', borderRadius: '5px', fontFamily: 'monospace', letterSpacing: '1px' }}>
              🚨 1,100 WINNERS ONLY
            </span>
          </div>

          {verificationCompleted ? (
            <>
              {gachaResult ? (
                /* GACHA LOCKED SCREEN */
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(20,22,28,0.98) 0%, rgba(12,13,17,0.99) 100%)',
                    border: gachaResult === 'success' ? '3px solid var(--neon-blue)' : '3px solid var(--neon-pink)',
                    borderRadius: '20px',
                    padding: '30px 28px',
                    boxShadow: gachaResult === 'success' 
                      ? '0 0 35px rgba(0, 240, 255, 0.25), inset 0 0 20px rgba(0, 240, 255, 0.05)'
                      : '0 0 35px rgba(255, 0, 127, 0.25), inset 0 0 20px rgba(255, 0, 127, 0.05)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {/* Futuristic scanline texture overlay */}
                    <div style={{
                      position: 'absolute',
                      top: 0, left: 0, width: '100%', height: '100%',
                      background: 'linear-gradient(rgba(255,255,255,0.01) 50%, rgba(0,0,0,0) 50%)',
                      backgroundSize: '100% 4px',
                      pointerEvents: 'none'
                    }}></div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '25px' }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: gachaResult === 'success' ? 'rgba(0, 240, 255, 0.08)' : 'rgba(255, 0, 127, 0.08)',
                        border: gachaResult === 'success' ? '2.5px solid var(--neon-blue)' : '2.5px solid var(--neon-pink)',
                        boxShadow: gachaResult === 'success' ? '0 0 15px rgba(0, 240, 255, 0.3)' : '0 0 15px rgba(255, 0, 127, 0.3)'
                      }}>
                        {gachaResult === 'success' ? <Unlock size={28} color="var(--neon-blue)" /> : <ShieldAlert size={28} color="var(--neon-pink)" />}
                      </div>
                    </div>

                    {gachaResult === 'success' && (
                      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <span style={{
                          fontSize: '0.85rem',
                          fontWeight: '900',
                          letterSpacing: '2px',
                          background: 'rgba(0, 240, 255, 0.12)',
                          color: 'var(--neon-blue)',
                          border: '1.5px solid var(--neon-blue)',
                          padding: '4px 14px',
                          borderRadius: '6px',
                          textTransform: 'uppercase',
                          fontFamily: 'monospace'
                        }}>
                          BREACH STATUS: SUCCESS
                        </span>
                      </div>
                    )}
 
                    <h3 className="font-comic" style={{
                      color: '#fff',
                      fontSize: '2.2rem',
                      textAlign: 'center',
                      margin: '0 0 15px 0',
                      textShadow: gachaResult === 'success' ? '0 0 10px rgba(0, 240, 255, 0.4)' : '0 0 10px rgba(255, 0, 127, 0.4)'
                    }}>
                      {gachaResult === 'success' ? 'GATE ACCESS GRANTED' : 'ADMISSION TRIAL COMPLETED'}
                    </h3>
 
                    <p style={{
                      color: '#8d98a7',
                      fontSize: '0.95rem',
                      textAlign: 'center',
                      lineHeight: '1.5',
                      marginBottom: '25px',
                      fontFamily: 'var(--font-body)'
                    }}>
                      {gachaResult === 'success' 
                        ? `Your unique access signature has been authorized and registered. Welcome to the ranks.`
                        : `Your enlistment trial draw has completed. Unfortunately, your admission draw was not selected for the limited FCFS/GTD slots. Stand by for future deployment!`
                      }
                    </p>
 
                    {/* Stats table / details */}
                    <div style={{
                      background: '#07080a',
                      border: '1.5px solid #232733',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '25px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1a1e27', paddingBottom: '8px' }}>
                        <span style={{ color: '#687385', fontSize: '0.8rem', fontWeight: 'bold', fontFamily: 'monospace' }}>CADET WALLET</span>
                        <span style={{ color: '#fff', fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: 'bold' }}>
                          {evmAddress ? `${evmAddress.substring(0, 6)}...${evmAddress.substring(38)}` : 'UNKNOWN'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1a1e27', paddingBottom: '8px' }}>
                        <span style={{ color: '#687385', fontSize: '0.8rem', fontWeight: 'bold', fontFamily: 'monospace' }}>GACHA STATUS</span>
                        <span style={{ color: gachaResult === 'success' ? 'var(--neon-blue)' : 'var(--neon-pink)', fontSize: '0.85rem', fontWeight: 'bold', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                          {gachaResult === 'success' ? 'SUCCESS' : 'FAILED'}
                        </span>
                      </div>
 
                      {gachaResult === 'success' ? (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1a1e27', paddingBottom: '8px' }}>
                            <span style={{ color: '#687385', fontSize: '0.8rem', fontWeight: 'bold', fontFamily: 'monospace' }}>REWARD LEVEL</span>
                            <span style={{ color: 'var(--yellow)', fontSize: '0.85rem', fontWeight: 'bold', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                              {rewardType === 'gtd' ? 'Guaranteed (GTD)' : 'First Come First Serve (FCFS)'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', paddingTop: '4px' }}>
                            <span style={{ color: '#687385', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '1.5px', textTransform: 'uppercase' }}>ACCESS CODE</span>
                            <span className="font-comic" style={{ color: 'var(--neon-blue)', fontSize: '2.5rem', letterSpacing: '2px', textShadow: '0 0 10px rgba(0, 240, 255, 0.4)' }}>
                              {claimedCode}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                          <span style={{ color: '#687385', fontSize: '0.8rem', fontWeight: 'bold', fontFamily: 'monospace' }}>INITIATION BLOCK</span>
                          <span style={{ color: 'var(--neon-pink)', fontSize: '0.85rem', fontWeight: 'bold', fontFamily: 'monospace' }}>
                            TRIAL COMPLETED
                          </span>
                        </div>
                      )}
                    </div>
 
                    {gachaResult === 'success' ? (
                      <motion.button
                        className="comic-button"
                        onClick={handleShareBreach}
                        style={{
                          width: '100%',
                          background: 'var(--neon-pink)',
                          border: '3px solid #000',
                          color: '#fff',
                          padding: '16px 20px',
                          fontSize: '1.15rem',
                          borderRadius: '10px',
                          boxShadow: '4px 4px 0px #000',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px',
                          cursor: 'pointer'
                        }}
                        whileHover={{ scale: 1.02, boxShadow: '6px 6px 0px #000' }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Share2 size={18} />
                        <span>SHARE ENLISTMENT STATUS</span>
                      </motion.button>
                    ) : (
                      <div style={{ textAlign: 'center', color: '#ff007f', fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 'bold', animation: 'zap-flicker 2s infinite' }}>
                        ⚠️ ONE TRIAL DRAW PER RECRUIT ENFORCED.
                      </div>
                    )}

                    {/* CHAPTER II NARRATIVE BRIDGE PREVIEW */}
                    <div style={{
                      marginTop: '25px',
                      borderTop: '2px dashed rgba(0, 240, 255, 0.15)',
                      paddingTop: '20px'
                    }}>
                      <div style={{
                        background: 'rgba(255, 0, 127, 0.05)',
                        border: '1px solid rgba(255, 0, 127, 0.25)',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="font-heading" style={{ color: 'var(--neon-pink)', fontSize: '0.85rem', fontWeight: '900', letterSpacing: '1.2px' }}>
                            NEXT OPERATION PREVIEW
                          </span>
                          <span style={{
                            fontSize: '0.7rem',
                            color: '#ff007f',
                            background: 'rgba(255,0,127,0.15)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            fontFamily: 'monospace'
                          }}>
                            STAND BY
                          </span>
                        </div>
                        <div className="font-heading" style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 'bold' }}>
                          DEEP REEF SIMULATION
                        </div>
                        <p style={{ color: '#687385', fontSize: '0.78rem', margin: 0, lineHeight: '1.4' }}>
                          Initialize cadet training protocols. Simulation grid deployment starts upon chapter activation. Stand by for launch!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* 3. EVM INPUT CARD */}
                  <div style={{ marginBottom: '2rem' }}>
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(20,22,28,0.95) 0%, rgba(12,13,17,0.98) 100%)',
                      border: '2px solid #2c303d',
                      borderRadius: '16px',
                      padding: '24px 28px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                      position: 'relative'
                    }}>
                      <form onSubmit={handleEvmSubmit}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                          <Wallet size={18} color="var(--yellow)" />
                          <label className="font-heading" style={{ color: 'var(--yellow)', fontSize: '1rem', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>
                            ENTER YOUR EVM ADDRESS
                          </label>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ flex: 1, position: 'relative' }}>
                            <input 
                              type="text" 
                              placeholder="0x..." 
                              value={evmAddress}
                              onChange={(e) => {
                                setEvmAddress(e.target.value);
                                if (currentSessionState === 'briefing' && currentDialogueIndex === dialogueSessions.briefing.length - 1) {
                                  setCurrentSessionState('evm_entry');
                                  setCurrentDialogueIndex(0);
                                }
                              }}
                              onFocus={handleEvmInputFocus}
                              disabled={currentSessionState === 'raid_needed' || hasRaided || isScanning}
                              style={{
                                width: '100%',
                                background: '#07080a',
                                border: /^0x[0-9a-fA-F]{40}$/.test(evmAddress.trim()) ? '2px solid var(--neon-blue)' : '2px solid #2d303b',
                                borderRadius: '10px',
                                color: '#fff',
                                padding: '16px 20px',
                                fontSize: '1.1rem',
                                outline: 'none',
                                transition: 'all 0.3s',
                                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.7)',
                                fontFamily: 'monospace',
                                letterSpacing: '0.5px'
                              }}
                            />
                            
                            {/* Glowing highlight indicator */}
                            <div style={{
                              position: 'absolute',
                              bottom: -2, left: '10%', right: '10%', height: '2px',
                              background: 'linear-gradient(90deg, transparent, var(--neon-blue), transparent)',
                              opacity: /^0x[0-9a-fA-F]{40}$/.test(evmAddress.trim()) ? 1 : 0,
                              transition: 'opacity 0.3s'
                            }}></div>
                          </div>

                          {/* EVM Address locking button */}
                          {!(currentSessionState === 'raid_needed' || hasRaided) && (
                            <motion.button
                              type="submit"
                              disabled={!/^0x[0-9a-fA-F]{40}$/.test(evmAddress.trim())}
                              style={{
                                background: /^0x[0-9a-fA-F]{40}$/.test(evmAddress.trim()) ? 'var(--neon-blue)' : '#232733',
                                color: /^0x[0-9a-fA-F]{40}$/.test(evmAddress.trim()) ? '#000' : '#4b5563',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '0 24px',
                                fontWeight: '900',
                                fontSize: '0.95rem',
                                cursor: /^0x[0-9a-fA-F]{40}$/.test(evmAddress.trim()) ? 'pointer' : 'not-allowed',
                                letterSpacing: '1px',
                                transition: 'all 0.2s'
                              }}
                              whileHover={/^0x[0-9a-fA-F]{40}$/.test(evmAddress.trim()) ? { scale: 1.03 } : {}}
                              whileTap={/^0x[0-9a-fA-F]{40}$/.test(evmAddress.trim()) ? { scale: 0.97 } : {}}
                            >
                              LOCK ADDRESS
                            </motion.button>
                          )}
                        </div>
                        
                        <div style={{ marginTop: '10px', minHeight: '18px' }}>
                          {evmAddress.length > 0 && !/^0x[0-9a-fA-F]{40}$/.test(evmAddress.trim()) && (
                            <span style={{ color: 'var(--neon-pink)', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                              ⚠️ INVALID EVM FORMAT (Must start with 0x followed by 40 hex characters)
                            </span>
                          )}
                          {/^0x[0-9a-fA-F]{40}$/.test(evmAddress.trim()) && (
                            <span style={{ color: 'var(--neon-blue)', fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 'bold' }}>
                              ✓ VALID EVM FORMAT. Coordinates verified.
                            </span>
                          )}
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* 4. PRIMARY INITIATION BROADCAST BUTTON */}
                  <div style={{ marginBottom: '1.8rem' }}>
                    <motion.button
                      disabled={!/^0x[0-9a-fA-F]{40}$/.test(evmAddress.trim()) || hasRaided || isScanning}
                      onClick={handlePerformRaid}
                      className="comic-button"
                      style={{
                        width: '100%',
                        padding: '20px',
                        fontSize: '1.4rem',
                        letterSpacing: '1px',
                        background: hasRaided ? 'rgba(0, 240, 255, 0.08)' : 'var(--neon-pink)',
                        border: hasRaided ? '3px solid rgba(0, 240, 255, 0.3)' : '3px solid #000',
                        color: hasRaided ? 'var(--neon-blue)' : '#fff',
                        opacity: (!/^0x[0-9a-fA-F]{40}$/.test(evmAddress.trim()) && !hasRaided) ? 0.35 : 1,
                        pointerEvents: (!/^0x[0-9a-fA-F]{40}$/.test(evmAddress.trim()) || hasRaided || isScanning) ? 'none' : 'auto',
                        boxShadow: hasRaided ? 'none' : '4px 4px 0 #000',
                        justifyContent: 'center'
                      }}
                      whileHover={!hasRaided ? { scale: 1.02 } : {}}
                      whileTap={!hasRaided ? { scale: 0.98 } : {}}
                    >
                      {hasRaided ? (
                        <>
                          <CheckCircle size={22} color="var(--neon-blue)" style={{ filter: 'drop-shadow(0 0 5px var(--neon-blue))' }} />
                          <span>INITIATION POST SHARED</span>
                        </>
                      ) : (
                        <>
                          <Repeat size={22} />
                          <span>SHARE INITIATION POST</span>
                        </>
                      )}
                    </motion.button>
                  </div>

                  {/* 5. ACCESS TRIAL / SECONDARY BUTTON */}
                  <div style={{ marginBottom: '2.5rem' }}>
                    <motion.button
                      disabled={!hasRaided || isScanning || gachaResult === 'success' || ipBlocked}
                      onClick={handleGachaDraw}
                      className="cyber-button"
                      style={{
                        width: '100%',
                        padding: '22px',
                        fontSize: '1.4rem',
                        fontWeight: '900',
                        background: 'rgba(11, 13, 17, 0.95)',
                        border: 'none',
                        opacity: (!hasRaided || gachaResult === 'success' || ipBlocked) ? 0.35 : 1,
                        pointerEvents: (!hasRaided || isScanning || gachaResult === 'success' || ipBlocked) ? 'none' : 'auto',
                        boxShadow: ipBlocked 
                          ? '0 0 35px rgba(255, 0, 127, 0.4), inset 0 0 20px rgba(255, 0, 127, 0.2)' 
                          : hasRaided 
                            ? '0 0 35px rgba(0, 240, 255, 0.4), inset 0 0 20px rgba(0, 240, 255, 0.2)' 
                            : 'none',
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px'
                      }}
                      animate={hasRaided && gachaResult !== 'success' && !ipBlocked ? {
                        scale: [1, 1.015, 1],
                        boxShadow: [
                          '0 0 20px rgba(0, 240, 255, 0.3), inset 0 0 10px rgba(0, 240, 255, 0.1)',
                          '0 0 40px rgba(0, 240, 255, 0.6), inset 0 0 20px rgba(0, 240, 255, 0.3)',
                          '0 0 20px rgba(0, 240, 255, 0.3), inset 0 0 10px rgba(0, 240, 255, 0.1)'
                        ]
                      } : ipBlocked ? {
                        boxShadow: '0 0 20px rgba(255, 0, 127, 0.3), inset 0 0 10px rgba(255, 0, 127, 0.1)'
                      } : {}}
                      transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    >
                      <Sparkles size={24} className="zap-pulsing" style={{ color: ipBlocked ? 'var(--neon-pink)' : 'var(--neon-blue)' }} />
                      <span className="cyber-button-text font-heading" style={{ color: ipBlocked ? 'var(--neon-pink)' : hasRaided ? 'var(--neon-blue)' : '#fff', textShadow: ipBlocked ? '0 0 10px var(--neon-pink)' : hasRaided ? '0 0 10px var(--neon-blue)' : 'none' }}>
                        {ipBlocked ? 'INITIATION LOCKED: IP ALREADY USED' : 'JOIN ACADEMY'}
                      </span>
                    </motion.button>
                  </div>
                </>
              )}
            </>
          ) : (
            /* STEP-BY-STEP VERIFICATION WIZARD */
            <div style={{ marginBottom: '2rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(20,22,28,0.95) 0%, rgba(12,13,17,0.98) 100%)',
                border: '2px solid #2c303d',
                borderRadius: '16px',
                padding: '24px 28px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                position: 'relative'
              }}>
                {/* Steps Progress HUD header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,240,255,0.15)', paddingBottom: '12px', marginBottom: '20px' }}>
                  <span className="font-heading" style={{ color: 'var(--neon-blue)', fontSize: '0.95rem', fontWeight: '900', letterSpacing: '1.2px' }}>
                    GATE SECURITY COMPLIANCE
                  </span>
                  <span className="font-heading" style={{ color: 'var(--neon-pink)', fontSize: '0.95rem', fontWeight: '900' }}>
                    STEP {currentStep} / 4
                  </span>
                </div>

                {/* Progress dots/bars */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '25px' }}>
                  {[1, 2, 3, 4].map(stepNum => (
                    <div key={stepNum} style={{
                      flex: 1,
                      height: '4px',
                      borderRadius: '2px',
                      background: stepNum < currentStep ? 'var(--neon-pink)' : stepNum === currentStep ? 'var(--neon-blue)' : '#232733',
                      boxShadow: stepNum === currentStep ? '0 0 8px var(--neon-blue)' : 'none',
                      transition: 'all 0.3s ease'
                    }} />
                  ))}
                </div>

                {/* STEP 1: FOLLOW TWITTER */}
                {currentStep === 1 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h3 className="font-heading" style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: 'var(--yellow)', border: '1px solid var(--yellow)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>STEP 1</span>
                      FOLLOW OFFICIAL TWITTER
                    </h3>
                    <p style={{ color: '#8d98a7', fontSize: '0.95rem', marginBottom: '20px', lineHeight: '1.4' }}>
                      Recruit, you must establish contact with headquarters. Follow our official account to authorize enlistment.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <button 
                        onClick={() => {
                          window.open('https://x.com/TurcNFT', '_blank');
                          setStep1Clicked(true);
                          playConfirmSound(isMuted);
                        }}
                        className="comic-button"
                        style={{
                          padding: '12px',
                          fontSize: '1.1rem',
                          boxShadow: '2px 2px 0 #000',
                          background: 'var(--neon-blue)',
                          color: '#000',
                          borderColor: '#000',
                          justifyContent: 'center',
                          width: '100%'
                        }}
                      >
                        <TwitterIcon size={18} color="#000" />
                        <span>FOLLOW @TurcNFT</span>
                      </button>

                      <button 
                        disabled={!step1Clicked || verifyingStep !== null}
                        onClick={() => handleVerifyStep(1)}
                        className="cyber-button"
                        style={{
                          padding: '12px',
                          fontSize: '1rem',
                          opacity: step1Clicked ? 1 : 0.4,
                          cursor: step1Clicked && verifyingStep === null ? 'pointer' : 'not-allowed',
                          width: '100%',
                          borderRadius: '8px',
                          justifyContent: 'center'
                        }}
                      >
                        {verifyingStep === 1 ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <RefreshCw size={16} className="zap-pulsing" style={{ animation: 'spin 1.5s linear infinite' }} />
                            VERIFYING RECORD... {verifyProgress}%
                          </span>
                        ) : (
                          <span>VERIFY STATUS</span>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: LIKE & RETWEET */}
                {currentStep === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h3 className="font-heading" style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: 'var(--yellow)', border: '1px solid var(--yellow)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>STEP 2</span>
                      LIKE & RETWEET ANNOUNCEMENT
                    </h3>
                    <p style={{ color: '#8d98a7', fontSize: '0.95rem', marginBottom: '20px', lineHeight: '1.4' }}>
                      Engage with the primary post. Retweet and Like the announcement post to authorize your registry.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <button 
                        onClick={() => {
                          window.open('https://x.com/TurcNFT/status/2058220693406556202?s=20', '_blank');
                          setStep2Clicked(true);
                          playConfirmSound(isMuted);
                        }}
                        className="comic-button"
                        style={{
                          padding: '12px',
                          fontSize: '1.1rem',
                          boxShadow: '2px 2px 0 #000',
                          background: 'var(--neon-pink)',
                          color: '#fff',
                          borderColor: '#000',
                          justifyContent: 'center',
                          width: '100%'
                        }}
                      >
                        <Repeat size={18} />
                        <span>LIKE & RETWEET TWEET</span>
                      </button>

                      <button 
                        disabled={!step2Clicked || verifyingStep !== null}
                        onClick={() => handleVerifyStep(2)}
                        className="cyber-button"
                        style={{
                          padding: '12px',
                          fontSize: '1rem',
                          opacity: step2Clicked ? 1 : 0.4,
                          cursor: step2Clicked && verifyingStep === null ? 'pointer' : 'not-allowed',
                          width: '100%',
                          borderRadius: '8px',
                          justifyContent: 'center'
                        }}
                      >
                        {verifyingStep === 2 ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <RefreshCw size={16} className="zap-pulsing" style={{ animation: 'spin 1.5s linear infinite' }} />
                            SYNCHRONIZING RECORDS... {verifyProgress}%
                          </span>
                        ) : (
                          <span>VERIFY STATUS</span>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: SUBMIT QUOTE TWEET LINK */}
                {currentStep === 3 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h3 className="font-heading" style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: 'var(--yellow)', border: '1px solid var(--yellow)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>STEP 3</span>
                      QUOTE TWEET SUBMISSION
                    </h3>
                    <p style={{ color: '#8d98a7', fontSize: '0.95rem', marginBottom: '20px', lineHeight: '1.4' }}>
                      Quote tweet the announcement and paste the URL of your post below to register your link.
                    </p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type="text"
                          placeholder="https://x.com/username/status/..."
                          value={quoteTweetUrl}
                          onChange={(e) => setQuoteTweetUrl(e.target.value)}
                          onFocus={() => playTypeSound(isMuted)}
                          style={{
                            width: '100%',
                            background: '#07080a',
                            border: isQuoteTweetUrlValid(quoteTweetUrl) ? '2px solid var(--neon-blue)' : '2px solid #2d303b',
                            borderRadius: '8px',
                            color: '#fff',
                            padding: '12px 15px',
                            fontSize: '0.95rem',
                            outline: 'none',
                            transition: 'all 0.3s',
                            fontFamily: 'monospace'
                          }}
                        />
                      </div>
                      
                      {quoteTweetUrl.length > 0 && !isQuoteTweetUrlValid(quoteTweetUrl) && (
                        <span style={{ color: 'var(--neon-pink)', fontSize: '0.8rem', fontFamily: 'monospace', marginTop: '-5px' }}>
                          ⚠️ Invalid link format. Must be a valid X/Twitter status link.
                        </span>
                      )}

                      <button 
                        disabled={!isQuoteTweetUrlValid(quoteTweetUrl) || verifyingStep !== null}
                        onClick={() => handleVerifyStep(3)}
                        className="cyber-button"
                        style={{
                          padding: '12px',
                          fontSize: '1rem',
                          opacity: isQuoteTweetUrlValid(quoteTweetUrl) ? 1 : 0.4,
                          cursor: isQuoteTweetUrlValid(quoteTweetUrl) && verifyingStep === null ? 'pointer' : 'not-allowed',
                          width: '100%',
                          borderRadius: '8px',
                          justifyContent: 'center'
                        }}
                      >
                        {verifyingStep === 3 ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <RefreshCw size={16} className="zap-pulsing" style={{ animation: 'spin 1.5s linear infinite' }} />
                            ANALYZING LINK... {verifyProgress}%
                          </span>
                        ) : (
                          <span>SUBMIT ENLISTMENT LINK</span>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: ANTI-BOT GATEWAY (CAPTCHA) */}
                {currentStep === 4 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h3 className="font-heading" style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: 'var(--yellow)', border: '1px solid var(--yellow)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>STEP 4</span>
                      ANTI-BOT RECRUIT EVALUATION
                    </h3>
                    <p style={{ color: '#8d98a7', fontSize: '0.95rem', marginBottom: '15px', lineHeight: '1.4' }}>
                      Trial verification active. Recruit, confirm you are not a simulation bot. Select the matching target code.
                    </p>

                    <div style={{ 
                      background: '#07080a', 
                      border: captchaError ? '2px solid var(--neon-pink)' : '2px solid #2d303b', 
                      borderRadius: '10px', 
                      padding: '15px',
                      marginBottom: '15px',
                      textAlign: 'center',
                      animation: captchaError ? 'glitch 0.3s 2' : 'none'
                    }}>
                      <div style={{ fontSize: '0.8rem', color: '#687385', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
                        TRIAL TARGET CODE
                      </div>
                      <div className="font-comic" style={{ color: 'var(--yellow)', fontSize: '2rem', textShadow: '0 0 8px rgba(255,213,0,0.4)', letterSpacing: '1px' }}>
                        {captchaTarget}
                      </div>
                    </div>

                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(3, 1fr)', 
                      gap: '10px',
                      marginBottom: '15px'
                    }}>
                      {captchaOptions.map((code, idx) => (
                        <motion.button
                          key={`${code}-${idx}`}
                          onClick={() => handleCaptchaClick(code)}
                          className="cyber-button"
                          style={{
                            padding: '12px 0',
                            fontSize: '1rem',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: 'none',
                            border: '1.5px solid #2d303b',
                            background: 'rgba(20, 22, 28, 0.95)',
                            width: '100%'
                          }}
                          whileHover={{ scale: 1.05, borderColor: 'var(--neon-blue)', boxShadow: '0 0 10px rgba(0, 240, 255, 0.2)' }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {code}
                        </motion.button>
                      ))}
                    </div>

                    {captchaError && (
                      <span style={{ display: 'block', color: 'var(--neon-pink)', fontSize: '0.8rem', fontFamily: 'monospace', textAlign: 'center', marginBottom: '10px' }}>
                        ❌ CHALLENGE FAILED! Evaluation codes reset.
                      </span>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* LOG FEED REMOVED */}
        </div>
      </div>
      )}

      {/* --- FAKE SCANNING TERMINAL OVERLAY --- */}
      <AnimatePresence>
        {isScanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(4, 5, 7, 0.96)',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(8px)'
            }}
          >
            <div style={{
              width: '90%',
              maxWidth: '520px',
              background: 'rgba(10, 12, 16, 0.95)',
              border: '3px solid var(--neon-blue)',
              borderRadius: '20px',
              padding: '40px',
              boxShadow: '0 0 50px rgba(0, 240, 255, 0.3), inset 0 0 20px rgba(0, 240, 255, 0.1)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div className="crt-overlay" style={{ opacity: 0.4 }}></div>

              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(0, 240, 255, 0.05)', border: '2.5px solid var(--neon-blue)', marginBottom: '25px', boxShadow: '0 0 20px rgba(0, 240, 255, 0.2)' }}>
                <RefreshCw size={32} color="var(--neon-blue)" style={{ animation: 'spin 1.5s linear infinite' }} />
              </div>

              <h2 className="font-comic" style={{ color: '#fff', fontSize: '3rem', margin: '0 0 8px 0', letterSpacing: '1.5px', textShadow: '0 0 10px rgba(0, 240, 255, 0.5)' }}>
                ACADEMY ADMISSION DRAW
              </h2>

              <p style={{ color: 'var(--neon-blue)', fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: 'bold', margin: '0 0 30px 0', letterSpacing: '1.5px', animation: 'zap-flicker 2s infinite' }}>
                {scanMessage}
              </p>

              <div style={{ height: '14px', background: '#090a0d', border: '1.5px solid #232733', borderRadius: '7px', overflow: 'hidden', position: 'relative', marginBottom: '20px' }}>
                <motion.div 
                  style={{ height: '100%', background: 'linear-gradient(90deg, var(--neon-pink), var(--neon-blue))', boxShadow: '0 0 10px var(--neon-blue)' }}
                  animate={{ width: `${scanProgress}%` }}
                  transition={{ ease: 'easeInOut' }}
                />
              </div>

              <div style={{ fontFamily: 'monospace', color: '#687385', fontSize: '0.85rem' }}>
                EVALUATION INDEX: {scanProgress}% // CLASSIFIED ADMISSION PROCESS
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- CINEMATIC GACHA SUCCESS MODAL --- */}
      <AnimatePresence>
        {isSuccessModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(3, 4, 5, 0.95)',
              zIndex: 110,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              backdropFilter: 'blur(10px)'
            }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 30 }}
              transition={{ type: 'spring', bounce: 0.4 }}
              style={{
                width: '100%',
                maxWidth: '560px',
                background: 'linear-gradient(135deg, rgba(12, 14, 18, 0.98) 0%, rgba(18, 22, 28, 0.95) 100%)',
                border: '3px solid var(--neon-blue)',
                borderRadius: '24px',
                padding: '40px',
                boxShadow: '0 0 50px rgba(0, 240, 255, 0.4), inset 0 0 30px rgba(0, 240, 255, 0.1)',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div className="crt-overlay" style={{ opacity: 0.4 }}></div>

              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(0, 240, 255, 0.08)', border: '2.5px solid var(--neon-blue)', marginBottom: '25px', boxShadow: '0 0 25px rgba(0, 240, 255, 0.3)', animation: 'zap-flicker 4s infinite' }}>
                <Unlock size={36} color="var(--neon-blue)" style={{ filter: 'drop-shadow(0 0 8px var(--neon-blue))' }} />
              </div>

              <h2 className="font-comic" style={{
                fontSize: rewardType === 'gtd' ? '3.6rem' : '3.8rem',
                color: 'var(--yellow)',
                margin: '0 0 8px 0',
                textShadow: '3px 3px 0 var(--neon-pink), -1px -1px 0 #fff',
                letterSpacing: '2px'
              }}>
                {rewardType === 'gtd' ? 'GTD ACCESS GRANTED' : 'FCFS ACCESS GRANTED'}
              </h2>

              <p style={{ color: '#fff', fontSize: '1.2rem', margin: '0 0 30px 0', lineHeight: '1.5', fontFamily: 'var(--font-heading)' }}>
                {rewardType === 'gtd' ? (
                  <>
                    Congratulations, Cadet.<br />
                    You successfully cleared the Gate Trial and secured a Guaranteed spot.
                  </>
                ) : (
                  <>
                    Congratulations, Cadet.<br />
                    You successfully cleared the Gate Trial. Slots are limited, claim your reward immediately!
                  </>
                )}
              </p>

              <div style={{
                background: '#07080b',
                border: '2px solid var(--neon-pink)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '35px',
                boxShadow: '0 0 20px rgba(255,0,127,0.15)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, width: '100%', height: '100%',
                  background: 'linear-gradient(rgba(255,0,127,0.05) 50%, rgba(0,0,0,0) 50%)',
                  backgroundSize: '100% 6px',
                  pointerEvents: 'none'
                }}></div>
                
                <div style={{ color: '#687385', fontSize: '0.8rem', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Your Unique Access Code
                </div>
                <div className="font-comic" style={{
                  fontSize: '3.6rem',
                  color: 'var(--neon-blue)',
                  letterSpacing: '4px',
                  margin: 0,
                  textShadow: '0 0 15px rgba(0,240,255,0.6)'
                }}>
                  {claimedCode}
                </div>
              </div>

              <p style={{ color: '#8d98a7', fontSize: '0.95rem', margin: '0 0 30px 0', lineHeight: '1.5' }}>
                You are among the lucky 1,100 recruits. Share your status to complete enlistment.
              </p>

              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <motion.button
                  className="comic-button"
                  onClick={() => {
                    playConfirmSound(isMuted);
                    setIsSuccessModalOpen(false);
                  }}
                  style={{
                    background: 'transparent',
                    border: '3px solid #2d303b',
                    color: '#8d98a7',
                    padding: '16px 28px',
                    fontSize: '1.1rem',
                    borderRadius: '10px',
                    boxShadow: 'none'
                  }}
                  whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.02)', borderColor: '#687385' }}
                  whileTap={{ scale: 0.98 }}
                >
                  CLOSE WINDOW
                </motion.button>

                <motion.button
                  className="comic-button"
                  onClick={handleShareBreach}
                  style={{
                    background: 'var(--neon-pink)',
                    border: '3px solid #000',
                    color: '#fff',
                    padding: '16px 32px',
                    fontSize: '1.15rem',
                    borderRadius: '10px',
                    boxShadow: '4px 4px 0px #000',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                  whileHover={{ scale: 1.02, boxShadow: '6px 6px 0px #000' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Share2 size={18} />
                  <span>SHARE ENLISTMENT STATUS</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- CINEMATIC GACHA FAILURE MODAL --- */}
      <AnimatePresence>
        {isFailureModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(5, 2, 3, 0.96)',
              zIndex: 110,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              backdropFilter: 'blur(12px)'
            }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 30 }}
              transition={{ type: 'spring', bounce: 0.4 }}
              style={{
                width: '100%',
                maxWidth: '540px',
                background: 'linear-gradient(135deg, rgba(14, 10, 11, 0.98) 0%, rgba(24, 15, 17, 0.96) 100%)',
                border: '3px solid var(--neon-pink)',
                borderRadius: '24px',
                padding: '45px 40px',
                boxShadow: '0 0 50px rgba(255, 0, 127, 0.4), inset 0 0 30px rgba(255, 0, 127, 0.1)',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div className="crt-overlay" style={{ opacity: 0.45 }}></div>

              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255, 0, 127, 0.08)', border: '2.5px solid var(--neon-pink)', marginBottom: '25px', boxShadow: '0 0 25px rgba(255, 0, 127, 0.3)', animation: 'zap-flicker 3s infinite' }}>
                <ShieldAlert size={38} color="var(--neon-pink)" style={{ filter: 'drop-shadow(0 0 8px var(--neon-pink))' }} />
              </div>

              <h2 className="font-comic" style={{
                fontSize: '4.5rem',
                color: 'var(--neon-pink)',
                margin: '0 0 8px 0',
                textShadow: '3px 3px 0 #000, -1px -1px 0 #fff',
                letterSpacing: '2px',
                animation: 'glitch 0.3s infinite alternate'
              }}>ACCESS DENIED</h2>

              <p style={{ color: '#fff', fontSize: '1.25rem', margin: '0 0 25px 0', lineHeight: '1.5', fontFamily: 'var(--font-heading)' }}>
                This admission slot has already been claimed by another recruit.
              </p>

              <div style={{
                background: 'rgba(255, 0, 127, 0.06)',
                border: '1.5px dashed var(--neon-pink)',
                borderRadius: '12px',
                padding: '18px',
                marginBottom: '35px',
                color: '#ecdfdf',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                lineHeight: '1.5'
              }}>
                ACADEMY RECORDED: Admission draw completed. Your recruit credentials have been registered. You have already utilized your trial draw attempt.
              </div>

              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <motion.button
                  className="comic-button"
                  onClick={() => {
                    playClickSound(isMuted);
                    setIsFailureModalOpen(false);
                    navigate('/');
                  }}
                  style={{
                    background: 'transparent',
                    border: '3px solid #3c242b',
                    color: '#b7a2a7',
                    padding: '16px 28px',
                    fontSize: '1.1rem',
                    borderRadius: '10px',
                    boxShadow: 'none'
                  }}
                  whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.02)', borderColor: '#835f68' }}
                  whileTap={{ scale: 0.98 }}
                >
                  RETURN TO HOME DECK
                </motion.button>

                <motion.button
                  className="comic-button"
                  onClick={() => {
                    playConfirmSound(isMuted);
                    setIsFailureModalOpen(false);
                  }}
                  style={{
                    background: 'var(--neon-pink)',
                    border: '3px solid #000',
                    color: '#fff',
                    padding: '16px 32px',
                    fontSize: '1.15rem',
                    borderRadius: '10px',
                    boxShadow: '4px 4px 0px #000',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontWeight: '900'
                  }}
                  whileHover={{ scale: 1.02, boxShadow: '6px 6px 0px #000' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>CLOSE WINDOW</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 5px var(--neon-pink); }
          50% { box-shadow: 0 0 20px var(--neon-pink), 0 0 35px var(--neon-pink); }
          100% { box-shadow: 0 0 5px var(--neon-pink); }
        }
      `}</style>
    </motion.div>
  );
};

export default Chapter1;
