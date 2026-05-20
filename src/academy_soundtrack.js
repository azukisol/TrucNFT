export class AcademySoundtrack {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.isPlaying = false;
    this.bpm = 85; // Slow, tense, interrogation speed
    this.nextNoteTime = 0;
    this.current16thNote = 0;
    this.timerID = null;
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.2; // Keep it subtle and background
    
    // Slight compression to glue it
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-30, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
    
    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.ctx.destination);
  }

  nextNote() {
    const secondsPerBeat = 60.0 / this.bpm;
    this.nextNoteTime += 0.25 * secondsPerBeat;
    this.current16thNote++;
    if (this.current16thNote === 32) { // 2 measure loop (32 16th notes)
      this.current16thNote = 0;
    }
  }

  playTick(time) {
    // Tense clock ticking / heartbeat
    const bufferSize = this.ctx.sampleRate * 0.015; 
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 4000;
    noise.connect(noiseFilter);
    
    const gain = this.ctx.createGain();
    noiseFilter.connect(gain);
    gain.connect(this.masterGain);
    
    // Emphasis on the first beat
    const isDownbeat = this.current16thNote % 4 === 0;
    gain.gain.setValueAtTime(isDownbeat ? 0.08 : 0.03, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.015);
    
    noise.start(time);
  }
  
  playDeepBass(time) {
    // Low, rumbling tense drone
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    
    osc.type = 'sawtooth';
    // Shift bass root slightly down on second measure
    const root = this.current16thNote >= 16 ? 29.14 : 32.70; // Bb0 to C1
    osc.frequency.setValueAtTime(root, time);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(100, time);
    filter.frequency.exponentialRampToValueAtTime(30, time + 0.8);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.8);
    
    osc.start(time);
    osc.stop(time + 0.9);
  }
  
  playEeriePad(time) {
    // Eerie background pad chord
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc1.type = 'sine';
    osc2.type = 'triangle';
    
    // C minor / Bb major interaction
    const f1 = this.current16thNote >= 16 ? 116.54 : 130.81; // Bb2 / C3
    const f2 = this.current16thNote >= 16 ? 146.83 : 155.56; // D3 / Eb3
    
    osc1.frequency.setValueAtTime(f1, time);
    osc2.frequency.setValueAtTime(f2, time);
    
    // Slight detune for eeriness
    osc2.detune.setValueAtTime(10, time);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);
    
    // Swell in and out
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.06, time + 1);
    gain.gain.linearRampToValueAtTime(0, time + 3.5);
    
    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 4);
    osc2.stop(time + 4);
  }
  
  playArpMotif(time) {
    // Quick hacker/thinking motif
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'square';
    
    // Arp notes: C5, Eb5, G5
    const notes = [523.25, 622.25, 783.99];
    const note = notes[(this.current16thNote / 2) % notes.length];
    
    osc.frequency.setValueAtTime(note, time);
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1500, time);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    gain.gain.setValueAtTime(0.03, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    
    osc.start(time);
    osc.stop(time + 0.1);
  }

  scheduleNote() {
    while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
      
      // Ticking clock every 8th note
      if (this.current16thNote % 2 === 0) {
        this.playTick(this.nextNoteTime);
      }
      
      // Deep bass pulse on beats 1 and 3
      if (this.current16thNote % 8 === 0) {
        this.playDeepBass(this.nextNoteTime);
      }
      
      // Eerie pad at the start of each measure (every 16 16th notes)
      if (this.current16thNote % 16 === 0) {
        this.playEeriePad(this.nextNoteTime);
      }
      
      // Play thinking motif on the second measure, beat 3 and 4
      if (this.current16thNote >= 24 && this.current16thNote % 2 === 0) {
        this.playArpMotif(this.nextNoteTime);
      }

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
