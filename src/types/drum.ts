export type VoiceId = 
  | 'kick'
  | 'snare'
  | 'lowTom'
  | 'midTom'
  | 'highTom'
  | 'rim'
  | 'clap'
  | 'closedHat'
  | 'openHat'
  | 'cowbell'
  | 'cymbal';

export interface VoiceParams {
  pitch: number;      // 0 - 100 (maps to frequency offset/pitch sweep)
  decay: number;      // 0 - 100 (maps to envelope release time)
  tone: number;       // 0 - 100 (maps to lowpass/highpass filter cutoff)
  snappy?: number;    // 0 - 100 (for snare/clap: noise level vs body level)
  drive: number;      // 0 - 100 (saturation / distortion level)
  pan: number;        // -100 to 100 (stereo pan)
  volume: number;     // 0 - 100 (voice gain level)
}

export type KitVoices = Record<VoiceId, VoiceParams>;

export interface KitPreset {
  id: string;
  name: string;
  description: string;
  accentColor: string;
  voices: KitVoices;
}

export interface StepData {
  active: boolean;
  velocity: number;   // 0.1 to 1.0
  accent: boolean;    // Boosts gain & envelope
  flam: 'none' | 'double' | 'triple'; // Ratchet / burst hits per step
}

export type TrackSteps = StepData[];

export type PatternData = Record<VoiceId, TrackSteps>;

export interface Pattern {
  id: string;
  name: string;
  bpm: number;
  swing: number;      // 0 - 75%
  stepCount: 16 | 32;
  kitId: string;
  data: PatternData;
  created: number;
}

export interface PatternBank {
  A: Pattern;
  B: Pattern;
  C: Pattern;
  D: Pattern;
}

export interface MasterFXParams {
  drive: number;        // 0 - 100 master tape drive
  filterCutoff: number; // 20 - 20000 Hz
  filterRes: number;    // 0 - 100
  delayTime: number;    // 0 - 100 (maps to 0 to 0.75s)
  delayFeedback: number;// 0 - 100
  reverbMix: number;    // 0 - 100
  compThreshold: number;// 0 - 100
}

export interface DrumVoiceSpec {
  id: VoiceId;
  name: string;
  shortName: string;
  category: 'kick' | 'snare' | 'tom' | 'perc' | 'hat' | 'cymbal';
  color: string;
  hasSnappy?: boolean;
}
