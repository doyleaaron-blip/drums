import type { DrumVoiceSpec } from '../types/drum';

export const DRUM_VOICE_SPECS: DrumVoiceSpec[] = [
  { id: 'kick', name: 'Bass Drum (Kick)', shortName: 'BD', category: 'kick', color: '#f97316' },
  { id: 'snare', name: 'Snare Drum', shortName: 'SD', category: 'snare', color: '#3b82f6', hasSnappy: true },
  { id: 'lowTom', name: 'Low Tom', shortName: 'LT', category: 'tom', color: '#10b981' },
  { id: 'midTom', name: 'Mid Tom', shortName: 'MT', category: 'tom', color: '#10b981' },
  { id: 'highTom', name: 'High Tom', shortName: 'HT', category: 'tom', color: '#10b981' },
  { id: 'rim', name: 'Rimshot / Clave', shortName: 'RS', category: 'perc', color: '#a855f7' },
  { id: 'clap', name: 'Hand Clap', shortName: 'CP', category: 'snare', color: '#ec4899', hasSnappy: true },
  { id: 'closedHat', name: 'Closed Hi-Hat', shortName: 'CH', category: 'hat', color: '#eab308' },
  { id: 'openHat', name: 'Open Hi-Hat', shortName: 'OH', category: 'hat', color: '#eab308' },
  { id: 'cowbell', name: 'Cowbell', shortName: 'CB', category: 'perc', color: '#06b6d4' },
  { id: 'cymbal', name: 'Crash Cymbal', shortName: 'CY', category: 'cymbal', color: '#6366f1' },
];

export const VOICE_MAP = new Map(DRUM_VOICE_SPECS.map((v) => [v.id, v]));
