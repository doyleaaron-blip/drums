import type { Pattern, PatternData, StepData, VoiceId } from '../types/drum';
import { DRUM_VOICE_SPECS } from '../audio/voiceSpecs';

const STORAGE_KEY_PATTERNS = 'pulse808_patterns_v1';

// Helper to create an empty 16/32 step track
export function createEmptyTrack(stepCount: 16 | 32 = 16): StepData[] {
  return Array.from({ length: stepCount }, () => ({
    active: false,
    velocity: 0.9,
    accent: false,
    flam: 'none',
  }));
}

// Helper to generate a blank pattern
export function createEmptyPattern(name = 'New Beat', bpm = 120, kitId = 'tr808'): Pattern {
  const data: Partial<PatternData> = {};
  DRUM_VOICE_SPECS.forEach((v) => {
    data[v.id] = createEmptyTrack(16);
  });

  return {
    id: `pattern_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name,
    bpm,
    swing: 0,
    stepCount: 16,
    kitId,
    data: data as PatternData,
    created: Date.now(),
  };
}

function createPatternDataFromGrid(grid: Partial<Record<VoiceId, number[]>>): PatternData {
  const data: Partial<PatternData> = {};

  DRUM_VOICE_SPECS.forEach((v) => {
    const hits = grid[v.id] || [];
    data[v.id] = Array.from({ length: 16 }, (_, i) => {
      const active = Boolean(hits[i]);
      return {
        active,
        velocity: active ? 0.9 : 0.7,
        accent: i === 0 || i === 8, // Accent beats 1 & 3
        flam: 'none',
      };
    });
  });

  return data as PatternData;
}

// Built-in Demo Patterns to inspire the user immediately!
export const DEMO_PATTERNS: Pattern[] = [
  {
    id: 'demo_808_hiphop',
    name: '808 Classic Boom Bap',
    bpm: 92,
    swing: 15,
    stepCount: 16,
    kitId: 'tr808',
    created: Date.now(),
    data: createPatternDataFromGrid({
      kick: [1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      closedHat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      openHat: [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      clap: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      rim: [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      cowbell: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
    }),
  },
  {
    id: 'demo_909_techno',
    name: '909 Four-on-the-Floor',
    bpm: 130,
    swing: 0,
    stepCount: 16,
    kitId: 'tr909',
    created: Date.now(),
    data: createPatternDataFromGrid({
      kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      closedHat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
      openHat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
      clap: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
      lowTom: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
      midTom: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      highTom: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    }),
  },
  {
    id: 'demo_synthwave_cyber',
    name: 'Synthwave Driving Pulse',
    bpm: 118,
    swing: 10,
    stepCount: 16,
    kitId: 'cyberbrute',
    created: Date.now(),
    data: createPatternDataFromGrid({
      kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
      snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      clap: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      closedHat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      openHat: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
      cowbell: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
    }),
  },
  {
    id: 'demo_lofi_vintage',
    name: 'Lofi Chill Beatbox',
    bpm: 84,
    swing: 25,
    stepCount: 16,
    kitId: 'cr78',
    created: Date.now(),
    data: createPatternDataFromGrid({
      kick: [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
      rim: [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
      closedHat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      openHat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    }),
  },
];

// Storage Operations
export function loadSavedPatterns(): Pattern[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PATTERNS);
    if (!raw) {
      savePatterns(DEMO_PATTERNS);
      return DEMO_PATTERNS;
    }
    const parsed = JSON.parse(raw) as Pattern[];
    return parsed.length > 0 ? parsed : DEMO_PATTERNS;
  } catch (e) {
    console.error('Failed to load saved patterns from LocalStorage', e);
    return DEMO_PATTERNS;
  }
}

export function savePatterns(patterns: Pattern[]) {
  try {
    localStorage.setItem(STORAGE_KEY_PATTERNS, JSON.stringify(patterns));
  } catch (e) {
    console.error('Failed to save patterns to LocalStorage', e);
  }
}

export function saveSinglePattern(pattern: Pattern): Pattern[] {
  const patterns = loadSavedPatterns();
  const index = patterns.findIndex((p) => p.id === pattern.id);
  if (index >= 0) {
    patterns[index] = pattern;
  } else {
    patterns.unshift(pattern);
  }
  savePatterns(patterns);
  return patterns;
}

export function deletePattern(id: string): Pattern[] {
  const patterns = loadSavedPatterns().filter((p) => p.id !== id);
  savePatterns(patterns);
  return patterns;
}

export function exportPatternAsJSON(pattern: Pattern) {
  const jsonStr = JSON.stringify(pattern, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${pattern.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_pulse808.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importPatternFromJSON(jsonText: string): Pattern | null {
  try {
    const parsed = JSON.parse(jsonText) as Pattern;
    if (parsed.name && parsed.data && parsed.bpm) {
      parsed.id = `pattern_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      return parsed;
    }
    return null;
  } catch (e) {
    console.error('Invalid pattern JSON', e);
    return null;
  }
}
