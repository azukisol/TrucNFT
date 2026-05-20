import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Volume2, VolumeX, Menu, Hourglass, Check, ChevronDown, Shield, Zap } from 'lucide-react';
import { CyberpunkSoundtrack } from './soundtrack';
import { supabase } from './supabaseClient';

const generateMockLogs = (count) => {
  const mockWallets = [
    '0x3F8B...C210', '0x7E12...9F81', '0x9A45...2B34', '0x5C90...7D11', '0x1B88...8A4C',
    '0x6D31...5E29', '0x4F02...3A12', '0x8B77...0C45', '0x2D9A...99FF', '0x0E55...11AA'
  ];
  const items = [];
  const baseTime = Date.now();
  for (let i = 0; i < count; i++) {
    // Create timestamps older than 3 hours so they show up as JOINED
    const createdTime = baseTime - (3 * 3600 * 1000 + (i + 1) * 3600 * 1000 + Math.random() * 1800 * 1000);
    items.push({
      id: `mock-${i}-${createdTime}`,
      wallet_address: mockWallets[i % mockWallets.length],
      created_at: new Date(createdTime).toISOString(),
      isMock: true
    });
  }
  return items;
};

const mapRowToLog = (row) => {
  const now = Date.now();
  const createdTime = new Date(row.created_at).getTime();
  const elapsedMs = now - createdTime;

  let event;
  if (elapsedMs < 900000) { // < 15 mins
    event = { status: 'IN QUEUE', color: '#ffb000', msg: 'application form submitted', icon: 'Hourglass' };
  } else if (elapsedMs < 10800000) { // < 3 hours
    event = { status: 'VERIFIED', color: '#00f0ff', msg: 'security clearance granted', icon: 'Check' };
  } else { // >= 3 hours
    event = { status: 'JOINED', color: '#00ff41', msg: 'has entered the Academy ranks', icon: 'Check' };
  }

  const wallet = row.wallet_address.includes('...') 
    ? row.wallet_address 
    : (row.wallet_address.substring(0, 6) + '...' + row.wallet_address.substring(row.wallet_address.length - 4));

  return {
    id: row.id || `${row.wallet_address}-${row.created_at}`,
    wallet: wallet,
    event: event,
    time: new Date(row.created_at).toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    created_at: row.created_at
  };
};

const LiveTerminalTicker = () => {
  const [dbSubmissions, setDbSubmissions] = useState([]);
  const [logs, setLogs] = useState([]);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('academy_submissions')
        .select('id, wallet_address, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching submissions:", error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error("Error fetching submissions:", err);
      return [];
    }
  };

  // Poll database for new submissions every 10 seconds
  useEffect(() => {
    const loadData = async () => {
      const data = await fetchSubmissions();
      setDbSubmissions(data);
    };

    loadData();
    const dbInterval = setInterval(loadData, 10000);
    return () => clearInterval(dbInterval);
  }, []);

  // Update UI and map items to logs list every 5 seconds to recalculate elapsed time status
  useEffect(() => {
    const updateLogsList = () => {
      const realCount = dbSubmissions.length;
      let combined = [...dbSubmissions];

      if (realCount < 5) {
        const mocks = generateMockLogs(5 - realCount);
        combined = [...combined, ...mocks];
      }

      // Sort combined array (real + mocks) by created_at DESC
      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Take top 5 for the visual feed
      const top5 = combined.slice(0, 5);
      const formatted = top5.map(mapRowToLog);
      setLogs(formatted);
    };

    updateLogsList();
    const uiInterval = setInterval(updateLogsList, 5000);
    return () => clearInterval(uiInterval);
  }, [dbSubmissions]);

  return (
    <div className="ticker-container" style={{
      width: '100%',
      height: '100%',
      background: '#050505',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 30px',
      gap: '12px',
      zIndex: 1,
      pointerEvents: 'none',
      perspective: '1000px',
      overflow: 'hidden'
    }}>
      <div className="ticker-header" style={{ 
        color: '#00f0ff', 
        fontSize: '0.9rem', 
        fontWeight: '900', 
        letterSpacing: '3px', 
        marginBottom: '5px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        fontFamily: 'var(--font-heading)',
        borderBottom: '2px solid rgba(0, 240, 255, 0.3)',
        paddingBottom: '8px',
        textShadow: '0 0 10px rgba(0,240,255,0.5)'
      }}>
        <div className="ticker-header-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '10px', height: '10px', background: '#00f0ff', boxShadow: '0 0 15px #00f0ff', animation: 'pulse 1s infinite' }}></div>
          TURC NETWORK :: LIVE
        </div>
        <div style={{ fontSize: '0.7rem', color: '#666', letterSpacing: '1px' }}>GLOBAL FEED</div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <AnimatePresence>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              className="ticker-logs"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, padding: 0, margin: 0, border: 'none' }}
              transition={{ duration: 0.3 }}
              style={{
                background: 'rgba(20, 20, 20, 0.95)',
                borderLeft: `4px solid ${log.event.color}`,
                padding: '16px 14px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.6)'
              }}
            >
              {/* Icon Circle */}
              <div style={{
                minWidth: '46px', height: '46px', borderRadius: '50%',
                border: `2px solid ${log.event.color}55`,
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                background: 'rgba(0,0,0,0.8)'
              }}>
                {log.event.icon === 'Hourglass' ? <Hourglass size={20} color={log.event.color} /> : <Check size={24} color={log.event.color} />}
              </div>
              
              {/* Content */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: log.event.color, fontSize: '0.85rem', fontWeight: '900', letterSpacing: '0.5px' }}>[{log.event.status}]</span>
                  <span style={{ color: '#666', fontSize: '0.75rem', fontFamily: 'monospace' }}>{log.time}</span>
                </div>
                <div style={{ color: '#ccc', fontSize: '0.85rem', lineHeight: '1.5' }}>
                  Wallet <span style={{ color: '#fff' }}>{log.wallet}</span><br />
                  <span style={{ color: '#999', fontSize: '0.85rem' }}>{log.event.msg}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px', color: '#555', fontSize: '0.85rem' }}>
        <ChevronDown size={14} /> Pull to refresh
      </div>
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const soundtrackRef = useRef(null);

  useEffect(() => {
    soundtrackRef.current = new CyberpunkSoundtrack();
    
    // Try to start immediately (browser might block it)
    soundtrackRef.current.start();
    
    // Fallback for browser autoplay policy: start on first interaction
    const handleFirstInteraction = () => {
      if (soundtrackRef.current && soundtrackRef.current.ctx.state === 'suspended') {
        soundtrackRef.current.start();
      }
      window.removeEventListener('click', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      if (soundtrackRef.current) {
        soundtrackRef.current.stop();
      }
    };
  }, []);

  const toggleMusic = () => {
    if (!isMusicPlaying) {
      soundtrackRef.current.start();
      setIsMusicPlaying(true);
    } else {
      soundtrackRef.current.stop();
      setIsMusicPlaying(false);
    }
  };

  return (
    <motion.div 
      className="main-home-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: '2rem',
        backgroundColor: '#111',
        backgroundImage: "url('/assets/desktop_bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <style>{`
        @keyframes pulseScale {
          0% { transform: scale(1) rotate(-15deg); }
          50% { transform: scale(1.1) rotate(-10deg); }
          100% { transform: scale(1) rotate(-15deg); }
        }
      `}</style>
      {/* Warning Tapes */}
      <div className="warning-tape warning-tape-1">
        <span>WARNING ! WARNING ! WARNING ! WARNING ! WARNING ! WARNING ! WARNING ! WARNING !</span>
        <span>WARNING ! WARNING ! WARNING ! WARNING ! WARNING ! WARNING ! WARNING ! WARNING !</span>
      </div>
      <div className="warning-tape warning-tape-2" style={{ borderTopColor: '#ff007f', borderBottomColor: '#ff007f', color: '#ff007f' }}>
        <span>RESTRICTED AREA ! KEEP OUT ! RESTRICTED AREA ! KEEP OUT ! RESTRICTED AREA !</span>
        <span>RESTRICTED AREA ! KEEP OUT ! RESTRICTED AREA ! KEEP OUT ! RESTRICTED AREA !</span>
      </div>

      {/* Header / Nav */}
      <div className="header-container" style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        zIndex: 20
      }}>
        <div className="welcome-tag" style={{
          background: 'var(--dark)',
          color: 'var(--yellow)',
          padding: '10px 20px',
          border: '3px solid var(--neon-pink)',
          transform: 'skewX(-10deg)',
          boxShadow: '4px 4px 0px var(--neon-pink)'
        }}>
          <div style={{ transform: 'skewX(10deg)', whiteSpace: 'nowrap' }}>
            <h3 style={{ fontSize: '1rem', color: '#fff', margin: 0, whiteSpace: 'nowrap' }} className="font-heading">WELCOME TO</h3>
            <h1 style={{ fontSize: '3rem', margin: 0, lineHeight: '1', color: 'var(--yellow)', whiteSpace: 'nowrap' }} className="font-comic">TURC</h1>
          </div>
        </div>

        {/* Mobile Top Right Buttons */}
        <div className="mobile-nav-buttons" style={{ display: 'flex', gap: '10px', position: 'absolute', top: '20px', right: '20px', zIndex: 100 }}>
          <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{
                background: '#000', border: '2px solid #fff', borderRadius: '50%',
                width: '45px', height: '45px', display: 'flex', flexDirection: 'column',
                justifyContent: 'center', alignItems: 'center', gap: '5px', cursor: 'pointer',
                outline: 'none', padding: 0
              }}
            >
              <div style={{ width: '20px', height: '2px', background: '#fff', borderRadius: '2px' }}></div>
              <div style={{ width: '20px', height: '2px', background: '#fff', borderRadius: '2px' }}></div>
              <div style={{ width: '20px', height: '2px', background: '#fff', borderRadius: '2px' }}></div>
          </button>
          
          <button 
            onClick={toggleMusic} 
            style={{
              background: '#000', border: '2px solid var(--yellow)', borderRadius: '50%',
              width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', outline: 'none', padding: 0
            }}
          >
            {isMusicPlaying ? <Volume2 size={20} color="var(--yellow)" /> : <VolumeX size={20} color="var(--yellow)" />}
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                className="mobile-dropdown-menu"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'absolute',
                  top: '55px',
                  right: '0',
                  background: 'rgba(17,17,17,0.95)',
                  backdropFilter: 'blur(15px)',
                  border: '2px solid var(--neon-pink)',
                  borderRadius: '15px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '15px',
                  minWidth: '180px',
                  textAlign: 'right',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.9), 0 0 20px rgba(255,0,127,0.3)',
                  zIndex: 100
                }}
              >
                <a href="#" style={{ color: 'var(--neon-pink)', textDecoration: 'none', fontWeight: '900', fontSize: '1.1rem' }} className="font-heading">HOME</a>
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('/academy'); }} style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold' }} className="font-heading">ACADEMY</a>

                <a href="#" style={{ color: '#888', textDecoration: 'none', fontWeight: 'bold', cursor: 'not-allowed' }} className="font-heading">NEX CHAPTER (SOON)</a>
                <a href="#" style={{ color: '#888', textDecoration: 'none', fontWeight: 'bold', cursor: 'not-allowed' }} className="font-heading">NEXT CHAPTER (SOON)</a>
                <div style={{ height: '1px', background: '#333', margin: '5px 0' }}></div>
                <button 
                  onClick={toggleMusic}
                  style={{ 
                    background: 'none', border: 'none', padding: 0, 
                    color: isMusicPlaying ? 'var(--yellow)' : '#888', 
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                    gap: '8px', fontFamily: 'var(--font-heading)', fontWeight: 'bold'
                  }}
                >
                  <Volume2 size={20} /> BGM
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Logo Center */}
        <div className="hero-logo-container" style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 20
        }}>
          <h1 className="font-comic hero-logo" style={{
            fontSize: '6rem',
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
            TRAIN. UNLOCK. RISE. CONQUER.
          </div>
          
          {/* Desktop Nav */}
          <nav className="desktop-nav nav-container" style={{
            background: 'var(--dark)',
            padding: '10px 30px',
            borderRadius: '30px',
            border: '2px solid var(--neon-pink)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '20px',
            marginTop: '10px',
            boxShadow: '0 4px 0px #ff007f'
          }}>
            <a href="#" style={{ color: 'var(--neon-pink)', textDecoration: 'none', fontWeight: 'bold' }} className="font-heading">HOME</a>
            <span style={{ color: '#555' }}>|</span>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/academy'); }} style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold', cursor: 'pointer' }} className="font-heading">ACADEMY</a>
            <span style={{ color: '#555' }}>|</span>

            <a href="#" style={{ color: '#888', textDecoration: 'none', fontWeight: 'bold', cursor: 'not-allowed' }} className="font-heading">NEX CHAPTER (SOON)</a>
            <span style={{ color: '#555' }}>|</span>
            <a href="#" style={{ color: '#888', textDecoration: 'none', fontWeight: 'bold', cursor: 'not-allowed' }} className="font-heading">NEXT CHAPTER (SOON)</a>
            <span style={{ color: '#555' }}>|</span>
            <button 
              onClick={toggleMusic}
              style={{ 
                background: 'none', border: 'none', padding: 0, 
                color: isMusicPlaying ? 'var(--yellow)' : '#888', 
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                fontFamily: 'var(--font-heading)', fontWeight: 'bold', outline: 'none'
              }}
            >
              {isMusicPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />} BGM
            </button>
          </nav>
        </div>

      {/* Main Content (TV) */}
      <div className="main-content-wrapper" style={{
        position: 'relative',
        marginTop: '120px',
        zIndex: 15,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        maxWidth: '1200px'
      }}>
        {/* Center TV */}
        <motion.div
          className="tv-container"
          style={{
            width: '100%',
            maxWidth: '700px',
            aspectRatio: '16/10',
            height: 'auto',
            background: 'var(--dark)',
            borderRadius: '40px',
            border: '10px solid #222',
            boxShadow: '20px 20px 0px #000, inset 0 0 50px rgba(0,0,0,0.8)',
            position: 'relative',
            padding: '20px',
            display: 'flex',
            zIndex: 16
          }}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
        >
          {/* TV Screen */}
          <div className="tv-screen-wrapper" style={{
            flex: 1,
            background: '#000',
            borderRadius: '20px',
            overflow: 'hidden',
            position: 'relative',
            border: '4px solid #444',
            display: 'flex',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,1)'
          }}>
            {/* Screen Content - Live Stats Ticker */}
            <LiveTerminalTicker />
            

          </div>
          
          {/* TV Dials */}
          <div className="tv-dials" style={{
            width: '80px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '30px'
          }}>
            <div style={{ width: '50px', height: '50px', background: '#333', borderRadius: '50%', border: '4px solid #111', boxShadow: 'inset 0 4px 0 #555' }}></div>
            <div style={{ width: '50px', height: '50px', background: '#333', borderRadius: '50%', border: '4px solid #111', boxShadow: 'inset 0 4px 0 #555' }}></div>
            <div style={{ width: '40px', height: '20px', background: '#ff007f', borderRadius: '10px', marginTop: '20px', border: '2px solid #111' }}></div>
          </div>
        </motion.div>
      </div>

      {/* Enter Button */}
      <motion.button 
        className="cyber-button"
        style={{
          marginTop: '25px',
          zIndex: 20,
          width: '90%',
          maxWidth: '400px'
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/academy')}
      >
        <span className="cyber-button-text">ENTER THE ACADEMY</span>
      </motion.button>

    </motion.div>
  );
};

export default Home;
