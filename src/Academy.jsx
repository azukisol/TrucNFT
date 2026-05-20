import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Repeat, MessageSquare, Wallet, CheckCircle, Play, Volume2, VolumeX, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AcademySoundtrack } from './academy_soundtrack';
import { supabase } from './supabaseClient';

const TwitterIcon = ({ size, color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 4.076H5.078z"/>
  </svg>
);

const steps = [
  { id: 1, title: 'FOLLOW CHECK', icon: TwitterIcon, desc: 'Verify Twitter/X Follow' },
  { id: 2, title: 'RETWEET MISSION', icon: Repeat, desc: 'Spread the signal' },
  { id: 3, title: 'QUOTE TWEET', icon: MessageSquare, desc: 'Why do you deserve entry?' },
  { id: 4, title: 'EVM ADDRESS', icon: Wallet, desc: 'Await judgment' }
];

const dialogueSessions = {
  1: [
    { text: "Yo recruit! Welcome to the TURC Academy. I am your instructor.", image: "/assets/bear_wave.png", name: "INSTRUCTOR", shake: false },
    { text: "Before we let you inside the gates, you need to prove your loyalty. Follow our official network! Show me what you've got!", image: "/assets/bear_sunglasses.png", name: "INSTRUCTOR", shake: true }
  ],
  2: [
    { text: "Impressive... but following isn't enough.", image: "/assets/bear_thinking.png", name: "INSTRUCTOR", shake: false },
    { text: "Hold up, let me take over. A true member spreads the signal. Retweet the transmission!", image: "/assets/shark_smirk.png", name: "SHARK OFFICER", shake: true }
  ],
  3: [
    { text: "Not bad at all! You actually got past the Shark. I'm impressed.", image: "/assets/bear_thumbs_up.png", name: "INSTRUCTOR", shake: false },
    { text: "Now, we need to know your true intentions. Quote tweet our transmission and tell the world why you deserve to be one of us.", image: "/assets/bear_peace.png", name: "INSTRUCTOR", shake: false }
  ],
  4: [
    { text: "This is it. The final step. You've made it this far.", image: "/assets/bear_scared.png", name: "INSTRUCTOR", shake: false },
    { text: "Drop your EVM wallet address below. If you're worthy, you'll be granted access. Await judgment...", image: "/assets/shark_sunglasses.png", name: "SHARK OFFICER", shake: true }
  ]
};

// --- Web Audio API Game Sounds ---
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

// Custom Hook for Typewriter Effect with Sound
function useTypewriter(text, speed = 30, isMutedRef) {
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
      // Try to init audio in case it wasn't yet
      if (isMutedRef && !isMutedRef.current && !audioCtx) {
        initAudio();
      }

      timerRef.current = setInterval(() => {
        if (i < text.length) {
          setDisplayedText(prev => {
            // Prevent duplicate appending if skip has already filled it
            if (prev.length >= text.length) {
              return prev;
            }
            // Use prev.length to determine the next character to append,
            // preventing race conditions from asynchronous state batching.
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

const Academy = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [quoteTweetUrl, setQuoteTweetUrl] = useState('');
  const [evmAddress, setEvmAddress] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [queuePosition, setQueuePosition] = useState(null);
  const [hasClickedFollow, setHasClickedFollow] = useState(false);
  const [hasClickedRetweet, setHasClickedRetweet] = useState(false);
  const [hasClickedQuote, setHasClickedQuote] = useState(false);
  const [isTyping, setIsTyping] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(isMuted);
  const bgmRef = useRef(null);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Setup soundtrack instance
  useEffect(() => {
    bgmRef.current = new AcademySoundtrack();
    return () => {
      if (bgmRef.current) bgmRef.current.stop();
    };
  }, []);

  // Play/pause background music based on mute state
  useEffect(() => {
    if (bgmRef.current) {
      if (!isMuted) {
        // Try starting it (if AudioContext is suspended, it will wait for interaction)
        bgmRef.current.start();
      } else {
        bgmRef.current.stop();
      }
    }
  }, [isMuted]);

  // Initialize audio context on first interaction with the page
  useEffect(() => {
    const handleFirstInteraction = () => {
      initAudio();
      if (!isMutedRef.current && bgmRef.current) {
        bgmRef.current.start();
      }
      window.removeEventListener('click', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    return () => window.removeEventListener('click', handleFirstInteraction);
  }, []);

  const currentSession = dialogueSessions[currentStep]?.[currentDialogueIndex];
  const { displayedText, isDone, skip } = useTypewriter(currentSession?.text || '', 30, isMutedRef);

  useEffect(() => {
    if (!currentSession) return;
    const isLastSession = currentDialogueIndex === dialogueSessions[currentStep].length - 1;
    if (isDone && isLastSession) {
      setIsTyping(false);
    } else {
      setIsTyping(true);
    }
  }, [isDone, currentDialogueIndex, currentStep, currentSession]);

  const handleBoxClick = () => {
    if (!isDone) {
      skip();
    } else if (currentDialogueIndex < dialogueSessions[currentStep].length - 1) {
      playClickSound(isMuted);
      setCurrentDialogueIndex(c => c + 1);
    }
  };

  const handleNext = async () => {
    playConfirmSound(isMuted);
    setLoading(true);
    setSubmitError('');

    if (currentStep === 4) {
      const cleanAddress = evmAddress.trim();
      if (!/^0x[0-9a-fA-F]{40}$/.test(cleanAddress)) {
        setSubmitError("Invalid EVM address. Must start with 0x followed by 40 hex characters.");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('academy_submissions')
          .insert([
            {
              quote_tweet_url: quoteTweetUrl,
              wallet_address: cleanAddress,
              followed_turcnft: true,
              retweeted_transmission: true
            }
          ])
          .select();

        if (error) {
          console.error("Supabase insertion error:", error);
          setSubmitError(error.message || "Failed to submit database entry.");
          setLoading(false);
          return;
        }

        if (data && data.length > 0) {
          setQueuePosition(data[0].queue_number);
        }

        setLoading(false);
        setIsSubmitted(true);
      } catch (err) {
        console.error("Supabase connection error:", err);
        setSubmitError(err.message || "Network error. Failed to connect to database.");
        setLoading(false);
      }
    } else {
      setTimeout(() => {
        setLoading(false);
        setInputValue('');
        if (currentStep < 4) {
          setCurrentStep(c => c + 1);
          setCurrentDialogueIndex(0);
          setIsTyping(true);
        }
      }, 1500);
    }
  };

  const progressPercentage = (currentStep - 1) * 25 + (isSubmitted ? 25 : 0);

  if (isSubmitted) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          minHeight: '100vh',
          background: '#000',
          color: '#00f0ff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div className="crt-overlay" style={{ opacity: 0.8, background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(255, 255, 255, 0.1) 50%)' }}></div>
        
        <motion.div 
          initial={{ top: '50%' }}
          animate={{ top: '-20%' }}
          transition={{ duration: 1, ease: 'easeIn' }}
          className="warning-tape warning-tape-1" style={{ width: '200%', left: '-50%' }}
        >
          <span>SYSTEM BREACH ! SYSTEM BREACH ! SYSTEM BREACH !</span>
        </motion.div>
        
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring', bounce: 0.6 }}
          style={{ zIndex: 10, textAlign: 'center' }}
        >
          <h1 className="font-comic" style={{
            fontSize: '6rem',
            color: 'var(--yellow)',
            textShadow: '4px 4px 0px var(--neon-pink), -2px -2px 0px #fff',
            animation: 'glitch 2s infinite'
          }}>APPLICATION RECEIVED</h1>
          
          <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
            <img src="/assets/shark_thumbs_up.png" style={{ width: '150px', filter: 'drop-shadow(0 0 20px var(--neon-blue))' }} alt="Character" />
            <div style={{
              background: 'rgba(0,240,255,0.1)',
              border: '2px solid var(--neon-blue)',
              padding: '20px',
              borderRadius: '20px',
              fontFamily: 'var(--font-heading)',
              color: '#fff',
              fontSize: '1.5rem',
              boxShadow: '0 0 20px rgba(0,240,255,0.5)'
            }}>
              "System verified. You are now inside the queue. Prepare yourself..."
            </div>
          </div>

          <div style={{
            marginTop: '40px',
            fontFamily: 'var(--font-heading)',
            fontSize: '2rem',
            color: '#fff'
          }}>
            QUEUE POSITION: <span style={{ color: 'var(--neon-pink)' }}>#{queuePosition !== null ? queuePosition.toLocaleString() : '...'}</span>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Determine shake animation
  const characterVariants = {
    idle: { y: [0, -10, 0] },
    shake: { x: [-5, 5, -5, 5, 0], y: [-2, 2, -2, 2, 0] }
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
        background: '#0a0a0a'
      }}
    >
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
            <span style={{ color: 'var(--neon-pink)' }}>⚡</span> <span className="title-text">ACADEMY TERMINAL</span>
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
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <span className="font-heading" style={{ color: '#00f0ff', fontWeight: 'bold' }}>{progressPercentage}%</span>
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

      {/* Main Split Content */}
      <div className="academy-split-container" style={{
        flex: 1,
        display: 'flex',
        position: 'relative',
        zIndex: 10,
        overflow: 'hidden'
      }}>
        
        {/* Left Side: Visual Novel Area */}
        <div className="academy-left-panel" style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          position: 'relative',
          padding: '2rem',
          minHeight: '600px',
          background: 'linear-gradient(180deg, #111 0%, #000 100%)'
        }}>
          
          {/* Animated Background Rays for Character */}
          <motion.div 
            style={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              width: '1000px',
              height: '1000px',
              background: 'conic-gradient(from 0deg, transparent 0deg 15deg, rgba(0,240,255,0.05) 15deg 30deg, transparent 30deg 45deg, rgba(0,240,255,0.05) 45deg 60deg, transparent 60deg 75deg, rgba(0,240,255,0.05) 75deg 90deg, transparent 90deg 105deg, rgba(0,240,255,0.05) 105deg 120deg, transparent 120deg 135deg, rgba(0,240,255,0.05) 135deg 150deg, transparent 150deg 165deg, rgba(0,240,255,0.05) 165deg 180deg, transparent 180deg 195deg, rgba(0,240,255,0.05) 195deg 210deg, transparent 210deg 225deg, rgba(0,240,255,0.05) 225deg 240deg, transparent 240deg 255deg, rgba(0,240,255,0.05) 255deg 270deg, transparent 270deg 285deg, rgba(0,240,255,0.05) 285deg 300deg, transparent 300deg 315deg, rgba(0,240,255,0.05) 315deg 330deg, transparent 330deg 345deg, rgba(0,240,255,0.05) 345deg 360deg)',
              zIndex: 0,
              marginLeft: '-500px',
              marginTop: '-500px'
            }}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 80, ease: 'linear' }}
          />

          {/* Grid Floor */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: 'linear-gradient(transparent, rgba(255,0,127,0.2))',
            backgroundImage: 'linear-gradient(rgba(255,0,127,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,127,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            transform: 'perspective(500px) rotateX(60deg)',
            transformOrigin: 'bottom',
            zIndex: 1
          }}></div>

          {/* Character Image */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSession?.image}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.4, type: 'spring' }}
              style={{ zIndex: 2, position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}
            >
              <motion.img 
                src={currentSession?.image} 
                alt="Interviewer"
                style={{
                  width: '90%',
                  maxWidth: '550px',
                  filter: 'drop-shadow(0 0 25px rgba(0, 240, 255, 0.4))',
                  marginBottom: '-10px',
                  objectFit: 'contain'
                }}
                variants={characterVariants}
                animate={currentSession?.shake ? "shake" : "idle"}
                transition={
                  currentSession?.shake 
                    ? { duration: 0.4, ease: "easeInOut" } 
                    : { repeat: Infinity, duration: 4, ease: 'easeInOut' }
                }
              />
            </motion.div>
          </AnimatePresence>

          {/* Visual Novel Dialogue Box */}
          <motion.div 
            className="dialogue-box"
            onClick={handleBoxClick}
            key={`dialogue-${currentStep}-${currentDialogueIndex}`}
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', bounce: 0.4 }}
            style={{
              width: '90%',
              maxWidth: '800px',
              background: 'linear-gradient(135deg, rgba(15, 15, 15, 0.95) 0%, rgba(30, 30, 30, 0.9) 100%)',
              border: '4px solid var(--neon-pink)',
              borderRadius: '15px',
              padding: '40px 30px 30px 30px',
              fontFamily: 'var(--font-heading)',
              fontSize: '1.4rem',
              color: '#fff',
              position: 'relative',
              boxShadow: '15px 15px 0px rgba(0,0,0,0.6), inset 0 0 40px rgba(255,0,127,0.1)',
              zIndex: 10,
              backdropFilter: 'blur(10px)',
              lineHeight: '1.6',
              cursor: 'pointer',
              marginBottom: '20px'
            }}
            whileHover={{ scale: 1.01 }}
            onMouseEnter={() => !isDone && playClickSound(isMuted)}
          >
            {/* Name Tag */}
            <div className="dialogue-name-tag" style={{
              position: 'absolute',
              top: '-25px',
              left: '20px',
              background: 'var(--yellow)',
              border: '3px solid var(--dark)',
              padding: '8px 30px',
              borderRadius: '5px',
              transform: 'skewX(-15deg)',
              boxShadow: '4px 4px 0px var(--neon-pink)',
              zIndex: 11
            }}>
              <h3 className="font-comic" style={{ 
                margin: 0, 
                color: 'var(--dark)', 
                fontSize: '1.8rem', 
                letterSpacing: '3px',
                transform: 'skewX(15deg)',
                textShadow: '1px 1px 0 #fff'
              }}>
                {currentSession?.name || 'INSTRUCTOR'}
              </h3>
            </div>

            {/* Displayed Text */}
            <div style={{ width: '100%', minHeight: '90px' }}>
              <span style={{ textShadow: '0 0 5px rgba(255,255,255,0.5)' }}>{displayedText}</span>
              {!isDone && <span style={{ opacity: 0.7, animation: 'pulse-glow 0.8s infinite', marginLeft: '5px' }}>_</span>}
              
              {isDone && currentDialogueIndex < dialogueSessions[currentStep].length - 1 && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: [0, 1, 0] }} 
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  style={{ 
                    position: 'absolute',
                    bottom: '15px',
                    right: '25px',
                    color: 'var(--neon-pink)', 
                    fontSize: '1.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  NEXT <Play size={16} fill="currentColor" />
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Side: Verification Panel */}
        <div className="academy-right-panel" style={{
          flex: 1,
          background: 'url("/assets/noise.png"), rgba(15, 15, 15, 0.98)',
          backgroundBlendMode: 'overlay',
          borderLeft: '4px solid var(--neon-blue)',
          padding: '3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)'
        }}>
          {/* Decorative Panel Elements */}
          <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: '10px' }}>
            <div style={{ width: '10px', height: '10px', background: 'var(--neon-pink)', borderRadius: '50%', animation: 'blink 2s infinite' }}></div>
            <div style={{ width: '10px', height: '10px', background: 'var(--yellow)', borderRadius: '50%', animation: 'blink 3s infinite' }}></div>
            <div style={{ width: '10px', height: '10px', background: 'var(--neon-blue)', borderRadius: '50%', animation: 'blink 1.5s infinite' }}></div>
          </div>

          {/* Lock Overlay when typing */}
          <AnimatePresence>
            {isTyping && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(0,0,0,0.7)',
                  backdropFilter: 'blur(3px) grayscale(50%)',
                  zIndex: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'not-allowed'
                }}
              >
                <div style={{
                  background: 'rgba(20,20,20,0.9)',
                  border: '2px solid var(--yellow)',
                  padding: '15px 30px',
                  borderRadius: '10px',
                  color: 'var(--yellow)',
                  fontFamily: 'var(--font-heading)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  boxShadow: '0 0 30px rgba(255,213,0,0.2)',
                  animation: 'pulse-glow 2s infinite'
                }}>
                  <div style={{ width: '12px', height: '12px', background: 'var(--neon-pink)', borderRadius: '50%', animation: 'glitch 1s infinite' }}></div>
                  INSTRUCTOR IS SPEAKING...
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ maxWidth: '600px', width: '100%', margin: '0 auto', opacity: isTyping ? 0.4 : 1, transition: 'opacity 0.5s', pointerEvents: isTyping ? 'none' : 'auto' }}>
            
            {/* Step Indicators */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '3rem' }}>
              {steps.map(s => (
                <div key={s.id} style={{
                  flex: 1,
                  height: '8px',
                  borderRadius: '4px',
                  background: s.id < currentStep ? 'var(--neon-blue)' : s.id === currentStep ? 'var(--neon-pink)' : '#333',
                  boxShadow: s.id === currentStep ? '0 0 15px var(--neon-pink)' : 'none',
                  transition: 'all 0.3s ease'
                }}></div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ type: 'spring', bounce: 0.4 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: '60px', height: '60px',
                    borderRadius: '15px',
                    background: 'var(--neon-pink)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff',
                    border: '3px solid #fff',
                    boxShadow: '0 0 20px rgba(255,0,127,0.4)',
                    transform: 'rotate(-5deg)'
                  }}>
                    {React.createElement(steps[currentStep-1].icon, { size: 30 })}
                  </div>
                  <div>
                    <div style={{ color: 'var(--neon-blue)', fontFamily: 'var(--font-heading)', fontWeight: 'bold', letterSpacing: '1px' }}>MISSION 0{currentStep}</div>
                    <h2 className="font-comic" style={{ color: '#fff', fontSize: '3.5rem', margin: 0, letterSpacing: '2px', textShadow: '2px 2px 0 var(--neon-pink)' }}>
                      {steps[currentStep-1].title}
                    </h2>
                  </div>
                </div>
                
                <p style={{ color: '#ccc', fontSize: '1.2rem', marginBottom: '2.5rem', borderLeft: '3px solid #555', paddingLeft: '15px' }}>
                  {steps[currentStep-1].desc}
                </p>

                {/* Content based on Step */}
                <div style={{
                  background: '#151515',
                  border: '2px solid #333',
                  borderRadius: '20px',
                  padding: '35px',
                  minHeight: '220px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8)'
                }}>
                  {currentStep === 1 && (
                    <motion.a 
                      href="https://x.com/TurcNFT"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        setHasClickedFollow(true);
                        playConfirmSound(isMuted);
                      }}
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', bounce: 0.6 }}
                      style={{ 
                        textAlign: 'center',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        padding: '10px'
                      }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <TwitterIcon size={70} color="#1DA1F2" style={{ marginBottom: '20px', display: 'inline-block', filter: 'drop-shadow(0 0 10px rgba(29, 161, 242, 0.5))' }} />
                        {hasClickedFollow && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            style={{
                              position: 'absolute',
                              bottom: 12,
                              right: -5,
                              background: '#151515',
                              borderRadius: '50%',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <CheckCircle size={24} color="var(--neon-blue)" style={{ filter: 'drop-shadow(0 0 5px var(--neon-blue))' }} />
                          </motion.div>
                        )}
                      </div>
                      <h3 style={{ color: '#fff', fontFamily: 'var(--font-heading)', fontSize: '1.8rem', margin: 0 }}>Follow @TurcNFT</h3>
                      <p style={{ color: hasClickedFollow ? 'var(--neon-blue)' : '#888', marginTop: '10px', transition: 'color 0.2s' }}>
                        {hasClickedFollow ? '✓ Follow link clicked. Scanning authorized!' : 'Click here to visit X and follow our page.'}
                      </p>
                      {!hasClickedFollow && (
                        <div style={{
                          marginTop: '15px',
                          color: 'var(--yellow)',
                          border: '1px dashed var(--yellow)',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontFamily: 'var(--font-heading)',
                          fontSize: '0.9rem',
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                          animation: 'pulse-glow 2.5s infinite'
                        }}>
                          Follow Required
                        </div>
                      )}
                    </motion.a>
                  )}

                  {currentStep === 2 && (
                    <motion.a 
                      href="https://x.com/TurcNFT/status/2056392348264010076?s=20"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        setHasClickedRetweet(true);
                        playConfirmSound(isMuted);
                      }}
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', bounce: 0.6 }}
                      style={{ 
                        width: '100%', 
                        background: '#0a0a0a', 
                        padding: '25px', 
                        borderRadius: '15px', 
                        border: '2px solid #222', 
                        position: 'relative', 
                        overflow: 'hidden',
                        display: 'block',
                        textDecoration: 'none',
                        cursor: 'pointer'
                      }}
                      whileHover={{ scale: 1.02, borderColor: 'var(--neon-blue)', boxShadow: '0 0 15px rgba(0, 240, 255, 0.2)' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--neon-blue)' }}></div>
                      
                      <div style={{ position: 'absolute', top: 15, right: 15 }}>
                        {hasClickedRetweet ? (
                          <CheckCircle size={22} color="var(--neon-blue)" style={{ filter: 'drop-shadow(0 0 5px var(--neon-blue))' }} />
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--yellow)', background: 'rgba(255, 213, 0, 0.1)', border: '1px solid var(--yellow)', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>RETWEET</span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
                        <div style={{ width: '45px', height: '45px', background: 'var(--yellow)', borderRadius: '50%', boxShadow: '0 0 10px rgba(255,213,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          <img src="/assets/hay_transparent.png" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.2)' }} alt="" />
                        </div>
                        <div>
                          <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>TurcNFT</div>
                          <div style={{ color: '#666', fontSize: '0.9rem' }}>@TurcNFT</div>
                        </div>
                      </div>
                      <p style={{ color: '#ddd', fontSize: '1.15rem', lineHeight: '1.5', margin: 0 }}>
                        We are opening the Academy gates. Will you be the one to enter? ⚡🐻🦈
                      </p>
                      
                      {hasClickedRetweet ? (
                        <p style={{ color: 'var(--neon-blue)', fontSize: '0.9rem', marginTop: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          ✓ Retweet link clicked. Scanning authorized!
                        </p>
                      ) : (
                        <p style={{ color: '#888', fontSize: '0.9rem', marginTop: '15px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          Click this card to retweet the official transmission.
                        </p>
                      )}
                    </motion.a>
                  )}

                  {currentStep === 3 && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {/* Quote Tweet Intent Card */}
                      <motion.a 
                        href="https://x.com/TurcNFT/status/2056392348264010076?s=20"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          setHasClickedQuote(true);
                          playConfirmSound(isMuted);
                        }}
                        style={{ 
                          width: '100%', 
                          background: '#0a0a0a', 
                          padding: '20px', 
                          borderRadius: '15px', 
                          border: '1px solid #333', 
                          position: 'relative', 
                          overflow: 'hidden',
                          display: 'block',
                          textDecoration: 'none',
                          cursor: 'pointer'
                        }}
                        whileHover={{ scale: 1.02, borderColor: 'var(--neon-pink)', boxShadow: '0 0 15px rgba(255, 0, 127, 0.2)' }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--neon-pink)' }}></div>
                        
                        <div style={{ position: 'absolute', top: 15, right: 15 }}>
                          {hasClickedQuote ? (
                            <CheckCircle size={20} color="var(--neon-pink)" style={{ filter: 'drop-shadow(0 0 5px var(--neon-pink))' }} />
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--yellow)', background: 'rgba(255, 213, 0, 0.1)', border: '1px solid var(--yellow)', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>QUOTE TARGET</span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
                          <div style={{ width: '35px', height: '35px', background: 'var(--yellow)', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src="/assets/hay_transparent.png" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.2)' }} alt="" />
                          </div>
                          <div>
                            <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.95rem' }}>TurcNFT</div>
                            <div style={{ color: '#666', fontSize: '0.8rem' }}>@TurcNFT</div>
                          </div>
                        </div>
                        <p style={{ color: '#aaa', fontSize: '0.95rem', lineHeight: '1.4', margin: 0, fontStyle: 'italic' }}>
                          "We are opening the Academy gates. Will you be the one to enter? ⚡🐻🦈"
                        </p>
                        
                        <div style={{
                          marginTop: '15px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          color: hasClickedQuote ? 'var(--neon-pink)' : 'var(--yellow)',
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          fontFamily: 'var(--font-heading)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          <span>{hasClickedQuote ? '✓ Link clicked. Now paste your quote URL below!' : '⚡ Click to Quote Tweet on X'}</span>
                        </div>
                      </motion.a>

                      {/* Submit Input Section */}
                      <div style={{ width: '100%', opacity: hasClickedQuote ? 1 : 0.5, pointerEvents: hasClickedQuote ? 'auto' : 'none', transition: 'all 0.3s' }}>
                        <label style={{ color: '#00f0ff', marginBottom: '10px', display: 'block', fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>SUBMIT QUOTE TWEET URL</label>
                        <input 
                          type="text" 
                          placeholder="https://x.com/your-quote-tweet"
                          value={quoteTweetUrl}
                          onChange={(e) => setQuoteTweetUrl(e.target.value)}
                          onFocus={() => playTypeSound(isMuted)}
                          style={{
                            width: '100%',
                            background: '#0a0a0a',
                            border: '2px solid var(--neon-blue)',
                            color: '#fff',
                            padding: '18px',
                            borderRadius: '12px',
                            fontSize: '1.1rem',
                            outline: 'none',
                            boxShadow: 'inset 0 0 15px rgba(0,240,255,0.1)',
                            transition: 'all 0.3s'
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div style={{ width: '100%' }}>
                      <label style={{ color: 'var(--yellow)', marginBottom: '10px', display: 'block', fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>ENTER EVM WALLET</label>
                      <input 
                        type="text" 
                        placeholder="0x..."
                        value={evmAddress}
                        onChange={(e) => setEvmAddress(e.target.value)}
                        onFocus={() => playTypeSound(isMuted)}
                        style={{
                          width: '100%',
                          background: '#0a0a0a',
                          border: '2px solid var(--yellow)',
                          color: '#fff',
                          padding: '18px',
                          borderRadius: '12px',
                          fontSize: '1.2rem',
                          outline: 'none',
                          boxShadow: 'inset 0 0 15px rgba(255,213,0,0.1)',
                          transition: 'all 0.3s'
                        }}
                      />
                    </div>
                  )}

                  {/* Loading Overlay */}
                  {loading && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.85)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        backdropFilter: 'blur(5px)'
                      }}
                    >
                      <div style={{
                        width: '60px', height: '60px',
                        border: '5px solid #222',
                        borderTopColor: 'var(--neon-pink)',
                        borderRightColor: 'var(--neon-blue)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      <div className="font-heading" style={{ color: '#fff', marginTop: '15px', fontSize: '1.2rem', letterSpacing: '2px' }}>
                        VERIFYING<span style={{ animation: 'blink 1.5s infinite' }}>...</span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {submitError && (
                  <div style={{ color: 'var(--neon-pink)', marginTop: '15px', textShadow: '0 0 10px rgba(255, 0, 127, 0.5)', fontFamily: 'monospace', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <span>⚠️ ERROR: {submitError}</span>
                  </div>
                )}

                <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <motion.button
                    className="comic-button"
                    onClick={handleNext}
                    onMouseEnter={() => !loading && playTypeSound(isMuted)}
                    disabled={loading || (currentStep === 1 && !hasClickedFollow) || (currentStep === 2 && !hasClickedRetweet) || (currentStep === 3 && (!hasClickedQuote || quoteTweetUrl.length < 5)) || (currentStep === 4 && !/^0x[0-9a-fA-F]{40}$/.test(evmAddress.trim()))}
                    style={{
                      opacity: (loading || (currentStep === 1 && !hasClickedFollow) || (currentStep === 2 && !hasClickedRetweet) || (currentStep === 3 && (!hasClickedQuote || quoteTweetUrl.length < 5)) || (currentStep === 4 && !/^0x[0-9a-fA-F]{40}$/.test(evmAddress.trim()))) ? 0.4 : 1,
                      pointerEvents: (loading || (currentStep === 1 && !hasClickedFollow) || (currentStep === 2 && !hasClickedRetweet) || (currentStep === 3 && (!hasClickedQuote || quoteTweetUrl.length < 5)) || (currentStep === 4 && !/^0x[0-9a-fA-F]{40}$/.test(evmAddress.trim()))) ? 'none' : 'auto',
                      width: '100%',
                      padding: '22px',
                      fontSize: '1.6rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '15px',
                      background: currentStep === 4 ? 'var(--yellow)' : 'var(--neon-pink)',
                      color: 'var(--dark)'
                    }}
                    whileHover={{ scale: 1.03, boxShadow: '0 0 20px ' + (currentStep === 4 ? 'var(--yellow)' : 'var(--neon-pink)') }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {currentStep === 4 
                      ? 'COMPLETE PROTOCOL' 
                      : (currentStep === 1 && !hasClickedFollow) 
                        ? 'FOLLOW REQUIRED' 
                        : (currentStep === 2 && !hasClickedRetweet)
                          ? 'RETWEET REQUIRED'
                          : (currentStep === 3 && !hasClickedQuote)
                            ? 'QUOTE TWEET REQUIRED'
                            : 'INITIATE SCAN'}
                    <Play size={24} fill="currentColor" />
                  </motion.button>
                </div>

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Additional CSS Animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </motion.div>
  );
};

export default Academy;
