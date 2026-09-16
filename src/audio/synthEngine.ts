import type { VoiceId, VoiceParams, MasterFXParams } from '../types/drum';

// Helper to create a distortion curve for WaveShaperNode
function makeDistortionCurve(amount: number): Float32Array {
  const k = typeof amount === 'number' ? amount : 50;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  if (k === 0) {
    for (let i = 0; i < n_samples; ++i) curve[i] = (i / n_samples) * 2 - 1;
    return curve;
  }
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

// Helper to create a synthetic warm room reverb impulse response
function createReverbImpulse(ctx: BaseAudioContext, duration = 1.8, decay = 2.5): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = rate * duration;
  const impulse = ctx.createBuffer(2, length, rate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const n = i / length;
    const env = Math.pow(1 - n, decay);
    left[i] = (Math.random() * 2 - 1) * env;
    right[i] = (Math.random() * 2 - 1) * env;
  }
  return impulse;
}

// Generate shared white noise buffer
function createNoiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  const bufferSize = ctx.sampleRate * 2; // 2 seconds of noise
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export class SynthEngine {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private reverbImpulse: AudioBuffer | null = null;

  // Nodes for Master FX
  private masterGain: GainNode | null = null;
  private masterDrive: WaveShaperNode | null = null;
  private masterFilter: BiquadFilterNode | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedbackGain: GainNode | null = null;
  private delayDryGain: GainNode | null = null;
  private delayWetGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbWetGain: GainNode | null = null;
  
  public analyserNode: AnalyserNode | null = null;

  // Active voice gain nodes for choking (e.g., Open Hat choking)
  private activeOpenHatGain: GainNode | null = null;

  public init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx();

    this.noiseBuffer = createNoiseBuffer(this.ctx);
    this.reverbImpulse = createReverbImpulse(this.ctx);

    // Build Master FX Chain
    this.masterGain = this.ctx.createGain();
    this.masterDrive = this.ctx.createWaveShaper();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.masterDrive.curve = makeDistortionCurve(10) as any;
    this.masterDrive.oversample = '4x';

    this.masterFilter = this.ctx.createBiquadFilter();
    this.masterFilter.type = 'lowpass';
    this.masterFilter.frequency.value = 18000;

    this.masterCompressor = this.ctx.createDynamicsCompressor();
    this.masterCompressor.threshold.value = -12;
    this.masterCompressor.knee.value = 10;
    this.masterCompressor.ratio.value = 4;
    this.masterCompressor.attack.value = 0.005;
    this.masterCompressor.release.value = 0.1;

    // Delay Network
    this.delayNode = this.ctx.createDelay(1.0);
    this.delayNode.delayTime.value = 0.25;
    this.delayFeedbackGain = this.ctx.createGain();
    this.delayFeedbackGain.gain.value = 0.3;
    this.delayDryGain = this.ctx.createGain();
    this.delayWetGain = this.ctx.createGain();
    this.delayWetGain.gain.value = 0.0;

    this.delayNode.connect(this.delayFeedbackGain);
    this.delayFeedbackGain.connect(this.delayNode);

    // Reverb Network
    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = this.reverbImpulse;
    this.reverbWetGain = this.ctx.createGain();
    this.reverbWetGain.gain.value = 0.1;

    // Analyser
    this.analyserNode = this.ctx.createAnalyser();
    this.analyserNode.fftSize = 2048;

    // Routing:
    // Voices -> masterGain -> masterDrive -> masterFilter -> masterCompressor -> [Dry + Delay + Reverb] -> analyserNode -> destination
    this.masterGain.connect(this.masterDrive);
    this.masterDrive.connect(this.masterFilter);
    this.masterFilter.connect(this.masterCompressor);

    // Split to Dry, Delay, Reverb
    this.masterCompressor.connect(this.delayDryGain);
    this.masterCompressor.connect(this.delayNode);
    this.delayNode.connect(this.delayWetGain);

    this.masterCompressor.connect(this.reverbNode);
    this.reverbNode.connect(this.reverbWetGain);

    // Sum outputs
    this.delayDryGain.connect(this.analyserNode);
    this.delayWetGain.connect(this.analyserNode);
    this.reverbWetGain.connect(this.analyserNode);

    this.analyserNode.connect(this.ctx.destination);
  }

  public getAudioContext(): AudioContext {
    if (!this.ctx) this.init();
    return this.ctx!;
  }

  public ensureUnlocked() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public updateMasterFX(params: MasterFXParams) {
    if (!this.ctx || !this.masterDrive || !this.masterFilter || !this.delayNode || !this.delayWetGain || !this.reverbWetGain || !this.masterCompressor || !this.delayFeedbackGain) return;

    const time = this.ctx.currentTime;
    
    // Master Drive
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.masterDrive.curve = makeDistortionCurve(params.drive * 0.8) as any;

    // Filter Cutoff & Res
    this.masterFilter.frequency.setTargetAtTime(Math.max(40, params.filterCutoff), time, 0.02);
    this.masterFilter.Q.setTargetAtTime((params.filterRes / 100) * 15, time, 0.02);

    // Delay
    const maxDelay = 0.75;
    const calculatedDelayTime = Math.max(0.05, (params.delayTime / 100) * maxDelay);
    this.delayNode.delayTime.setTargetAtTime(calculatedDelayTime, time, 0.02);
    this.delayFeedbackGain.gain.setTargetAtTime((params.delayFeedback / 100) * 0.75, time, 0.02);
    this.delayWetGain.gain.setTargetAtTime((params.delayTime > 0 ? (params.delayFeedback / 100) * 0.5 : 0), time, 0.02);

    // Reverb
    this.reverbWetGain.gain.setTargetAtTime((params.reverbMix / 100) * 0.6, time, 0.02);

    // Compressor
    const compThresh = -40 + (1 - params.compThreshold / 100) * 36;
    this.masterCompressor.threshold.setTargetAtTime(compThresh, time, 0.02);
  }

  public triggerVoice(
    voiceId: VoiceId,
    params: VoiceParams,
    time?: number,
    velocity = 1.0,
    accent = false,
    flamCount = 0
  ) {
    if (!this.ctx) this.init();
    const ctx = this.ctx!;
    this.ensureUnlocked();

    const startTime = time ?? ctx.currentTime;
    const gainFactor = velocity * (accent ? 1.4 : 1.0);

    // Flam/Ratchet multi-hit trigger burst support
    if (flamCount > 0) {
      const burstDelay = 0.045; // 45ms ratchet
      for (let i = 0; i <= flamCount; i++) {
        const subTime = startTime + i * burstDelay;
        const subVol = velocity * (1 - i * 0.2) * (accent ? 1.4 : 1.0);
        this.synthesizeVoice(voiceId, params, subTime, subVol);
      }
      return;
    }

    this.synthesizeVoice(voiceId, params, startTime, gainFactor);
  }

  private synthesizeVoice(voiceId: VoiceId, params: VoiceParams, startTime: number, gainFactor: number) {
    const ctx = this.ctx!;
    if (!this.masterGain) return;

    // Choke Open Hat if Closed Hat triggers
    if (voiceId === 'closedHat' && this.activeOpenHatGain) {
      try {
        this.activeOpenHatGain.gain.setTargetAtTime(0, startTime, 0.01);
      } catch (e) {
        // ignore timing exceptions
      }
    }

    // Voice Panner & Gain Node
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (panner) {
      panner.pan.value = Math.max(-1, Math.min(1, params.pan / 100));
    }

    const voiceGain = ctx.createGain();
    const vol = (params.volume / 100) * gainFactor;
    voiceGain.gain.setValueAtTime(vol, startTime);

    // Connect voice output
    if (panner) {
      voiceGain.connect(panner);
      panner.connect(this.masterGain);
    } else {
      voiceGain.connect(this.masterGain);
    }

    // Voice-specific Analog Drive saturator
    let destNode: AudioNode = voiceGain;
    if (params.drive > 5) {
      const voiceDrive = ctx.createWaveShaper();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      voiceDrive.curve = makeDistortionCurve(params.drive * 0.5) as any;
      voiceDrive.connect(voiceGain);
      destNode = voiceDrive;
    }

    switch (voiceId) {
      case 'kick':
        this.synthKick(destNode, params, startTime);
        break;
      case 'snare':
        this.synthSnare(destNode, params, startTime);
        break;
      case 'lowTom':
        this.synthTom(destNode, params, startTime, 60);
        break;
      case 'midTom':
        this.synthTom(destNode, params, startTime, 110);
        break;
      case 'highTom':
        this.synthTom(destNode, params, startTime, 175);
        break;
      case 'rim':
        this.synthRim(destNode, params, startTime);
        break;
      case 'clap':
        this.synthClap(destNode, params, startTime);
        break;
      case 'closedHat':
        this.synthHat(destNode, params, startTime, false);
        break;
      case 'openHat':
        this.activeOpenHatGain = voiceGain;
        this.synthHat(destNode, params, startTime, true);
        break;
      case 'cowbell':
        this.synthCowbell(destNode, params, startTime);
        break;
      case 'cymbal':
        this.synthCymbal(destNode, params, startTime);
        break;
    }
  }

  // --- VOICE SYNTHESIS CIRCUITS --- //

  private synthKick(dest: AudioNode, params: VoiceParams, startTime: number) {
    const ctx = this.ctx!;
    const decaySec = 0.15 + (params.decay / 100) * 0.85; // 0.15s to 1.0s
    const startFreq = 120 + (params.pitch / 100) * 180; // 120Hz - 300Hz initial drop
    const endFreq = 35 + (params.pitch / 100) * 35;     // 35Hz - 70Hz sub boom

    // Sub sine oscillator
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + 0.06);

    // Osc Gain Envelope
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(1.0, startTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, startTime + decaySec);

    osc.connect(oscGain);

    // Click transient (Highpass pop at attack)
    const clickOsc = ctx.createOscillator();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(800 + (params.tone / 100) * 1200, startTime);
    
    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.7 * (params.tone / 50), startTime);
    clickGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.015);

    clickOsc.connect(clickGain);

    // Mix to destination
    oscGain.connect(dest);
    clickGain.connect(dest);

    osc.start(startTime);
    clickOsc.start(startTime);

    osc.stop(startTime + decaySec + 0.05);
    clickOsc.stop(startTime + 0.02);
  }

  private synthSnare(dest: AudioNode, params: VoiceParams, startTime: number) {
    const ctx = this.ctx!;
    const decaySec = 0.1 + (params.decay / 100) * 0.45;
    const snappyAmount = params.snappy !== undefined ? params.snappy / 100 : 0.7;

    // Body Tone (Dual Sines)
    const bodyFreq1 = 170 + (params.pitch / 100) * 80;
    const bodyFreq2 = 320 + (params.pitch / 100) * 100;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(bodyFreq1, startTime);
    osc2.frequency.setValueAtTime(bodyFreq2, startTime);
    osc1.frequency.exponentialRampToValueAtTime(bodyFreq1 * 0.5, startTime + 0.04);
    osc2.frequency.exponentialRampToValueAtTime(bodyFreq2 * 0.5, startTime + 0.04);

    const bodyGain = ctx.createGain();
    bodyGain.gain.setValueAtTime(1.0 - snappyAmount * 0.5, startTime);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

    osc1.connect(bodyGain);
    osc2.connect(bodyGain);

    // Snappy Filtered Noise
    if (this.noiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(800 + (params.tone / 100) * 3500, startTime);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(snappyAmount * 1.2, startTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + decaySec);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(dest);

      noise.start(startTime);
      noise.stop(startTime + decaySec + 0.05);
    }

    bodyGain.connect(dest);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + 0.15);
    osc2.stop(startTime + 0.15);
  }

  private synthTom(dest: AudioNode, params: VoiceParams, startTime: number, baseFreq: number) {
    const ctx = this.ctx!;
    const decaySec = 0.15 + (params.decay / 100) * 0.5;
    const startFreq = (baseFreq + (params.pitch / 100) * 120) * 2.2;
    const targetFreq = baseFreq + (params.pitch / 100) * 120;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(targetFreq, startTime + 0.045);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(1.0, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + decaySec);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(startTime);
    osc.stop(startTime + decaySec + 0.05);
  }

  private synthRim(dest: AudioNode, params: VoiceParams, startTime: number) {
    const ctx = this.ctx!;
    const centerFreq = 1400 + (params.pitch / 100) * 1000;

    // Resonant bridged-T click
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(centerFreq, startTime);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = centerFreq;
    filter.Q.value = 12;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(1.0, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(startTime);
    osc.stop(startTime + 0.05);
  }

  private synthClap(dest: AudioNode, params: VoiceParams, startTime: number) {
    const ctx = this.ctx!;
    if (!this.noiseBuffer) return;

    const decaySec = 0.15 + (params.decay / 100) * 0.4;
    const cutoff = 800 + (params.tone / 100) * 2200;

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = cutoff;
    filter.Q.value = 2.5;

    const gain = ctx.createGain();
    const t = startTime;

    // 808 stagger envelope: 3 rapid bursts then exponential decay tail
    gain.gain.setValueAtTime(0, t);
    gain.gain.setValueAtTime(0.9, t);
    gain.gain.setValueAtTime(0.1, t + 0.008);
    gain.gain.setValueAtTime(0.85, t + 0.016);
    gain.gain.setValueAtTime(0.1, t + 0.024);
    gain.gain.setValueAtTime(1.0, t + 0.032);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.032 + decaySec);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noise.start(startTime);
    noise.stop(startTime + 0.035 + decaySec);
  }

  private synthHat(dest: AudioNode, params: VoiceParams, startTime: number, isOpen: boolean) {
    const ctx = this.ctx!;
    const decaySec = isOpen ? 0.25 + (params.decay / 100) * 0.65 : 0.04 + (params.decay / 100) * 0.12;

    // 6 metallic ring-mod square waves (808 circuit)
    const baseRatios = [200, 304, 369, 540, 800, 890];
    const pitchOffset = (params.pitch - 50) * 6;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6000 + (params.tone / 100) * 4000, startTime);

    const hatGain = ctx.createGain();
    hatGain.gain.setValueAtTime(1.0, startTime);
    hatGain.gain.exponentialRampToValueAtTime(0.001, startTime + decaySec);

    baseRatios.forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq + pitchOffset, startTime);
      osc.connect(filter);
      osc.start(startTime);
      osc.stop(startTime + decaySec + 0.05);
    });

    filter.connect(hatGain);
    hatGain.connect(dest);
  }

  private synthCowbell(dest: AudioNode, params: VoiceParams, startTime: number) {
    const ctx = this.ctx!;
    const decaySec = 0.1 + (params.decay / 100) * 0.4;
    const pitchOffset = (params.pitch - 50) * 8;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'square';
    osc2.type = 'square';

    osc1.frequency.setValueAtTime(540 + pitchOffset, startTime);
    osc2.frequency.setValueAtTime(800 + pitchOffset, startTime);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000 + (params.tone / 100) * 1500, startTime);
    filter.Q.value = 3;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(1.0, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + decaySec);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + decaySec + 0.05);
    osc2.stop(startTime + decaySec + 0.05);
  }

  private synthCymbal(dest: AudioNode, params: VoiceParams, startTime: number) {
    const ctx = this.ctx!;
    const decaySec = 0.3 + (params.decay / 100) * 1.2;

    if (this.noiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(4500 + (params.tone / 100) * 4500, startTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.8, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + decaySec);

      noise.connect(hp);
      hp.connect(gain);
      gain.connect(dest);

      noise.start(startTime);
      noise.stop(startTime + decaySec + 0.05);
    }
  }
}

export const synthEngine = new SynthEngine();
