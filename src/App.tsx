import { useState, useEffect } from 'react';
import type { Pattern, VoiceId, VoiceParams, MasterFXParams, KitPreset, PatternBank } from './types/drum';
import { KIT_PRESETS } from './audio/presets';
import { synthEngine } from './audio/synthEngine';
import { scheduler } from './audio/scheduler';
import { exportPatternToWav } from './audio/wavExporter';
import {
  loadSavedPatterns,
  saveSinglePattern,
  deletePattern,
  DEMO_PATTERNS,
} from './services/storage';

import { Header } from './components/Header';
import { Oscilloscope } from './components/Visualizer/Oscilloscope';
import { StepGrid } from './components/Sequencer/StepGrid';
import { DrumPads } from './components/PadMatrix/DrumPads';
import { VoiceSculptor } from './components/Synthesizer/VoiceSculptor';
import { MasterPanel } from './components/MasterFX/MasterPanel';
import { PresetManagerModal } from './components/Storage/PresetManagerModal';

import { Grid, Radio, Sliders, Flame } from 'lucide-react';

const DEFAULT_MASTER_FX: MasterFXParams = {
  drive: 15,
  filterCutoff: 18000,
  filterRes: 10,
  delayTime: 0,
  delayFeedback: 30,
  reverbMix: 10,
  compThreshold: 40,
};

export function App() {
  // App State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState<'sequencer' | 'pads' | 'synth' | 'master'>('sequencer');

  // Active Kit & Patterns
  const [selectedKit, setSelectedKit] = useState<KitPreset>(KIT_PRESETS[0]);
  const [activeVoiceId, setActiveVoiceId] = useState<VoiceId>('kick');
  const [voiceParams, setVoiceParams] = useState<Record<VoiceId, VoiceParams>>(KIT_PRESETS[0].voices);
  const [masterFX, setMasterFX] = useState<MasterFXParams>(DEFAULT_MASTER_FX);

  // Bank patterns (A, B, C, D)
  const [activeBank, setActiveBank] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [patternBank, setPatternBank] = useState<PatternBank>({
    A: DEMO_PATTERNS[0],
    B: DEMO_PATTERNS[1],
    C: DEMO_PATTERNS[2],
    D: DEMO_PATTERNS[3],
  });

  // Saved Patterns Library
  const [savedPatterns, setSavedPatterns] = useState<Pattern[]>([]);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);

  const activePattern = patternBank[activeBank];

  // Initialize storage patterns
  useEffect(() => {
    const loaded = loadSavedPatterns();
    setSavedPatterns(loaded);
  }, []);

  // Update Scheduler when pattern, kit, or master FX change
  useEffect(() => {
    if (isPlaying) {
      scheduler.updatePattern(activePattern, voiceParams, masterFX);
    }
  }, [activePattern, voiceParams, masterFX, isPlaying]);

  // Spacebar shortcut for Play/Stop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        handleTogglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, activePattern, voiceParams, masterFX]);

  // Transport Handlers
  const handleTogglePlay = () => {
    if (isPlaying) {
      scheduler.stop();
      setIsPlaying(false);
      setCurrentStep(0);
    } else {
      scheduler.start(
        activePattern,
        voiceParams,
        masterFX,
        (step) => setCurrentStep(step),
        0
      );
      setIsPlaying(true);
    }
  };

  const handleToggleRecord = () => {
    const newRec = !isRecording;
    setIsRecording(newRec);
    scheduler.setRecording(newRec);
  };

  // Kit Change Handler
  const handleKitChange = (kitId: string) => {
    const kit = KIT_PRESETS.find((k) => k.id === kitId) || KIT_PRESETS[0];
    setSelectedKit(kit);
    setVoiceParams(kit.voices);
  };

  // Pattern Data Modifiers
  const updateActivePattern = (updater: (prev: Pattern) => Pattern) => {
    setPatternBank((prev: PatternBank) => {
      const updatedPattern = updater(prev[activeBank]);
      return {
        ...prev,
        [activeBank]: updatedPattern,
      };
    });
  };

  const handleStepToggle = (voiceId: VoiceId, stepIndex: number) => {
    updateActivePattern((prev: Pattern) => {
      const track = [...(prev.data[voiceId] || [])];
      const current = track[stepIndex] || { active: false, velocity: 0.9, accent: false, flam: 'none' };
      track[stepIndex] = {
        ...current,
        active: !current.active,
      };
      return {
        ...prev,
        data: {
          ...prev.data,
          [voiceId]: track,
        },
      };
    });
  };

  const handleStepAccentToggle = (voiceId: VoiceId, stepIndex: number) => {
    updateActivePattern((prev: Pattern) => {
      const track = [...(prev.data[voiceId] || [])];
      const current = track[stepIndex];
      if (!current) return prev;
      track[stepIndex] = {
        ...current,
        accent: !current.accent,
      };
      return {
        ...prev,
        data: {
          ...prev.data,
          [voiceId]: track,
        },
      };
    });
  };

  const handleStepFlamCycle = (voiceId: VoiceId, stepIndex: number) => {
    updateActivePattern((prev: Pattern) => {
      const track = [...(prev.data[voiceId] || [])];
      const current = track[stepIndex];
      if (!current) return prev;
      const nextFlam = current.flam === 'none' ? 'double' : current.flam === 'double' ? 'triple' : 'none';
      track[stepIndex] = {
        ...current,
        flam: nextFlam,
      };
      return {
        ...prev,
        data: {
          ...prev.data,
          [voiceId]: track,
        },
      };
    });
  };

  const handleStepVelocityChange = (voiceId: VoiceId, stepIndex: number, velocity: number) => {
    updateActivePattern((prev: Pattern) => {
      const track = [...(prev.data[voiceId] || [])];
      const current = track[stepIndex];
      if (!current) return prev;
      track[stepIndex] = {
        ...current,
        velocity,
      };
      return {
        ...prev,
        data: {
          ...prev.data,
          [voiceId]: track,
        },
      };
    });
  };

  // Live Pad Hit Handler (Audition & Live Record)
  const handleAuditionVoice = (voiceId: VoiceId) => {
    const params = voiceParams[voiceId];
    if (params) {
      synthEngine.triggerVoice(voiceId, params);
    }

    // Auto-record to current step if recording is active
    if (isRecording && isPlaying) {
      const stepToRecord = scheduler.getCurrentStep();
      handleStepToggle(voiceId, stepToRecord);
    }
  };

  // Voice Parameter Modification
  const handleParamChange = (param: keyof VoiceParams, val: number) => {
    setVoiceParams((prev) => ({
      ...prev,
      [activeVoiceId]: {
        ...prev[activeVoiceId],
        [param]: val,
      },
    }));
  };

  const handleResetParams = () => {
    setVoiceParams((prev) => ({
      ...prev,
      [activeVoiceId]: selectedKit.voices[activeVoiceId],
    }));
  };

  // Storage Handlers
  const handleSaveCurrentPattern = () => {
    const updatedList = saveSinglePattern(activePattern);
    setSavedPatterns(updatedList);
  };

  const handleSaveNewPatternWithName = (name: string) => {
    const newPat: Pattern = {
      ...activePattern,
      id: `pattern_${Date.now()}`,
      name,
      created: Date.now(),
    };
    const updatedList = saveSinglePattern(newPat);
    setSavedPatterns(updatedList);
    setPatternBank((prev: PatternBank) => ({
      ...prev,
      [activeBank]: newPat,
    }));
  };

  const handleDeletePattern = (id: string) => {
    const updatedList = deletePattern(id);
    setSavedPatterns(updatedList);
  };

  const handleSelectPattern = (pattern: Pattern) => {
    setPatternBank((prev: PatternBank) => ({
      ...prev,
      [activeBank]: pattern,
    }));
    // If pattern specifies a kit, set it
    if (pattern.kitId) {
      handleKitChange(pattern.kitId);
    }
  };

  const handleExportWav = async () => {
    try {
      const blob = await exportPatternToWav(activePattern, voiceParams, masterFX, 2);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activePattern.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_beat.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('WAV export error:', e);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none pb-20 sm:pb-6">
      
      {/* Top Header & Transport */}
      <Header
        isPlaying={isPlaying}
        isRecording={isRecording}
        bpm={activePattern.bpm}
        swing={activePattern.swing}
        selectedKit={selectedKit}
        kitPresets={KIT_PRESETS}
        activePattern={activePattern}
        activeBank={activeBank}
        onTogglePlay={handleTogglePlay}
        onToggleRecord={handleToggleRecord}
        onBpmChange={(bpm) => updateActivePattern((p: Pattern) => ({ ...p, bpm }))}
        onSwingChange={(swing) => updateActivePattern((p: Pattern) => ({ ...p, swing }))}
        onKitChange={handleKitChange}
        onBankChange={(bank) => setActiveBank(bank)}
        onSavePattern={handleSaveCurrentPattern}
        onExportWav={handleExportWav}
        onOpenPresetManager={() => setIsPresetModalOpen(true)}
      />

      {/* Main Studio Body */}
      <main className="max-w-7xl w-full mx-auto p-3 sm:p-5 flex-1 space-y-4">
        
        {/* Oscilloscope Audio Visualizer Banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
          <div className="md:col-span-3">
            <Oscilloscope kitColor={selectedKit.accentColor} isPlaying={isPlaying} />
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex flex-col justify-between h-[64px] shadow-inner">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-400">
              <span>PATTERN BANK</span>
              <span style={{ color: selectedKit.accentColor }}>BANK {activeBank}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-300">
              <span className="truncate">{activePattern.name}</span>
              <span className="font-mono text-orange-400 font-bold">{activePattern.bpm} BPM</span>
            </div>
          </div>
        </div>

        {/* View Tabs Bar */}
        <div className="flex items-center overflow-x-auto max-w-full scrollbar-none gap-2 border-b border-zinc-800 pb-2 px-1">
          <button
            onClick={() => setActiveTab('sequencer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider whitespace-nowrap flex-shrink-0 transition-all ${
              activeTab === 'sequencer'
                ? 'bg-zinc-800 text-white shadow ring-1 ring-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
            style={{ borderBottom: activeTab === 'sequencer' ? `3px solid ${selectedKit.accentColor}` : 'none' }}
          >
            <Grid className="w-4 h-4" /> Sequencer
          </button>

          <button
            onClick={() => setActiveTab('pads')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider whitespace-nowrap flex-shrink-0 transition-all ${
              activeTab === 'pads'
                ? 'bg-zinc-800 text-white shadow ring-1 ring-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
            style={{ borderBottom: activeTab === 'pads' ? `3px solid ${selectedKit.accentColor}` : 'none' }}
          >
            <Radio className="w-4 h-4" /> Drum Pads
          </button>

          <button
            onClick={() => setActiveTab('synth')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider whitespace-nowrap flex-shrink-0 transition-all ${
              activeTab === 'synth'
                ? 'bg-zinc-800 text-white shadow ring-1 ring-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
            style={{ borderBottom: activeTab === 'synth' ? `3px solid ${selectedKit.accentColor}` : 'none' }}
          >
            <Sliders className="w-4 h-4" /> Voice Synthesizer
          </button>

          <button
            onClick={() => setActiveTab('master')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider whitespace-nowrap flex-shrink-0 transition-all ${
              activeTab === 'master'
                ? 'bg-zinc-800 text-white shadow ring-1 ring-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
            style={{ borderBottom: activeTab === 'master' ? `3px solid ${selectedKit.accentColor}` : 'none' }}
          >
            <Flame className="w-4 h-4" /> Master FX
          </button>
        </div>

        {/* Active Tab View Rendering */}
        {activeTab === 'sequencer' && (
          <StepGrid
            pattern={activePattern}
            activeVoiceId={activeVoiceId}
            currentStep={currentStep}
            onVoiceSelect={(voiceId) => setActiveVoiceId(voiceId)}
            onStepToggle={handleStepToggle}
            onStepAccentToggle={handleStepAccentToggle}
            onStepFlamCycle={handleStepFlamCycle}
            onStepVelocityChange={handleStepVelocityChange}
            onAuditionVoice={handleAuditionVoice}
            onStepCountChange={(count) => updateActivePattern((p: Pattern) => ({ ...p, stepCount: count }))}
            onClearTrack={(voiceId) =>
              updateActivePattern((p: Pattern) => ({
                ...p,
                data: {
                  ...p.data,
                  [voiceId]: Array.from({ length: p.stepCount }, () => ({
                    active: false,
                    velocity: 0.9,
                    accent: false,
                    flam: 'none',
                  })),
                },
              }))
            }
          />
        )}

        {activeTab === 'pads' && (
          <DrumPads
            activeVoiceId={activeVoiceId}
            isRecording={isRecording}
            onPadTrigger={handleAuditionVoice}
            onVoiceSelect={(voiceId) => setActiveVoiceId(voiceId)}
          />
        )}

        {activeTab === 'synth' && (
          <VoiceSculptor
            activeVoiceId={activeVoiceId}
            params={voiceParams[activeVoiceId]}
            onVoiceSelect={(voiceId) => setActiveVoiceId(voiceId)}
            onParamChange={handleParamChange}
            onResetParams={handleResetParams}
            onAuditionVoice={handleAuditionVoice}
          />
        )}

        {activeTab === 'master' && (
          <MasterPanel
            params={masterFX}
            onChange={(newParams) => setMasterFX(newParams)}
            onReset={() => setMasterFX(DEFAULT_MASTER_FX)}
          />
        )}

      </main>

      {/* Preset & Beat Storage Modal */}
      <PresetManagerModal
        isOpen={isPresetModalOpen}
        savedPatterns={savedPatterns}
        activePatternId={activePattern.id}
        onClose={() => setIsPresetModalOpen(false)}
        onSelectPattern={handleSelectPattern}
        onDeletePattern={handleDeletePattern}
        onSaveNewPattern={handleSaveNewPatternWithName}
        onImportPattern={(imported) => {
          const updated = saveSinglePattern(imported);
          setSavedPatterns(updated);
          handleSelectPattern(imported);
        }}
      />
    </div>
  );
}

export default App;
