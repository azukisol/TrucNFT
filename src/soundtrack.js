export class CyberpunkSoundtrack {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.isPlaying = false;
    this.bpm = 110; // Slightly slower, menacing cyberpunk tempo
    this.nextNoteTime = 0;
    this.current16thNote = 0;
    this.timerID = null;
    
    // Master volume control
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3; // Prevent clipping
    
    // Compressor to glue the track together
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-20, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(10, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.01, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.1, this.ctx.currentTime);
    
    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.ctx.destination);
    
    // Notes for arpeggio (C minor scale/pentatonic vibe)
    this.arpNotes = [261.63, 196.00, 311.13, 196.00, 261.63, 392.00, 311.13, 196.00];
    this.bassFreq = 65.41; // C2
    this.chordProgression = [65.41, 65.41, 51.91, 58.27]; // C2, C2, Ab1, Bb1
  }

  nextNote() {
    const secondsPerBeat = 60.0 / this.bpm;
    this.nextNoteTime += 0.25 * secondsPerBeat;
    this.current16thNote++;
    if (this.current16thNote === 16) {
      this.current16thNote = 0;
    }
  }

  playKick(time) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    // Pitch envelope for punchy kick
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.3);
    
    // Amp envelope
    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
    
    osc.start(time);
    osc.stop(time + 0.3);
  }

  playSnare(time) {
    // Noise buffer for the snare "snap"
    const bufferSize = this.ctx.sampleRate * 0.2; 
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    noise.connect(noiseFilter);
    
    const noiseGain = this.ctx.createGain();
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    
    noiseGain.gain.setValueAtTime(0.5, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    noise.start(time);
    
    // Tonal body of the snare
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    
    osc.frequency.setValueAtTime(200, time);
    osc.frequency.exponentialRampToValueAtTime(50, time + 0.1);
    oscGain.gain.setValueAtTime(0.4, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
    
    osc.start(time);
    osc.stop(time + 0.2);
  }

  playHihat(time) {
    // Quick noise burst
    const bufferSize = this.ctx.sampleRate * 0.05; 
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 8000;
    noise.connect(noiseFilter);
    
    const noiseGain = this.ctx.createGain();
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    
    noiseGain.gain.setValueAtTime(0.15, time); // Keep hihat subtle
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
    noise.start(time);
  }

  playBass(time) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    
    // Thick sawtooth bass
    osc.type = 'sawtooth';
    
    // Simple 4-bar progression changing every 8 16th notes
    // Normally would need a bar counter, but we'll use a hack with Date.now() or just keep it drone-like.
    // Let's implement a simple sequence by keeping track of beats
    // For simplicity, we just use the current16thNote to pick a rhythmic variation
    const root = this.bassFreq; 
    osc.frequency.setValueAtTime(root, time);
    
    // Plucky filter envelope
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, time);
    filter.frequency.exponentialRampToValueAtTime(100, time + 0.15);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    // 16th note pulsing rhythm
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.05, time + 0.15);
    
    osc.start(time);
    osc.stop(time + 0.15);
  }

  playArp(time) {
    // Only play on certain off-beats to create syncopation
    if (this.current16thNote % 2 === 0) return; 
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    
    // Square wave for retro game feel
    osc.type = 'square';
    
    const note = this.arpNotes[(this.current16thNote - 1) / 2 % this.arpNotes.length];
    // Octave higher
    osc.frequency.setValueAtTime(note * 2, time);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, time);
    filter.frequency.exponentialRampToValueAtTime(500, time + 0.1);
    
    osc.connect(filter);
    filter.connect(gain);
    
    // Echo/Delay effect simulation (simple)
    gain.connect(this.masterGain);
    
    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    
    osc.start(time);
    osc.stop(time + 0.1);
  }
  
  playAmbientPad(time) {
    if (this.current16thNote !== 0) return; // Trigger once per measure
    
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    
    osc1.type = 'sine';
    osc2.type = 'triangle';
    
    // Minor chord C - Eb - G
    osc1.frequency.setValueAtTime(130.81, time); // C3
    osc2.frequency.setValueAtTime(155.56, time); // Eb3
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, time);
    // Slow filter sweep
    filter.frequency.linearRampToValueAtTime(800, time + 1);
    filter.frequency.linearRampToValueAtTime(400, time + 2);
    
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    // Slow attack, long release
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.15, time + 0.5);
    gain.gain.linearRampToValueAtTime(0, time + 2.0);
    
    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 2.0);
    osc2.stop(time + 2.0);
  }

  scheduleNote() {
    while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
      
      // Kick on 0, 4, 8, 12
      if (this.current16thNote % 4 === 0) {
        this.playKick(this.nextNoteTime);
      }
      
      // Snare on 4, 12
      if (this.current16thNote % 8 === 4) {
        this.playSnare(this.nextNoteTime);
      }
      
      // Hihat on off-beats
      if (this.current16thNote % 2 === 0) {
        this.playHihat(this.nextNoteTime);
      }
      
      this.playBass(this.nextNoteTime);
      this.playArp(this.nextNoteTime);
      this.playAmbientPad(this.nextNoteTime);

      this.nextNote();
    }
    this.timerID = window.setTimeout(this.scheduleNote.bind(this), 25.0);
  }

  start() {
    if (this.isPlaying) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isPlaying = true;
    this.current16thNote = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.scheduleNote();
  }

  stop() {
    this.isPlaying = false;
    window.clearTimeout(this.timerID);
  }
}
