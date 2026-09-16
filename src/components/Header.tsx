import React, { useState, useRef } from 'react';
import { Play, Square, Disc, Save, Download, FolderOpen, Zap } from 'lucide-react';
import type { KitPreset, Pattern } from '../types/drum';
import confetti from 'canvas-confetti';

interface HeaderProps {
  isPlaying: boolean;
  isRecording: boolean;
  bpm: number;
  swing: number;
  selectedKit: KitPreset;
  kitPresets: KitPreset[];
  activePattern: Pattern;
  activeBank: 'A' | 'B' | 'C' | 'D';
  onTogglePlay: () => void;
  onToggleRecord: () => void;
  onBpmChange: (newBpm: number) => void;
  onSwingChange: (newSwing: number) => void;
  onKitChange: (kitId: string) => void;
  onBankChange: (bank: 'A' | 'B' | 'C' | 'D') => void;
  onSavePattern: () => void;
  onExportWav: () => void;
  onOpenPresetManager: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isPlaying,
  isRecording,
  bpm,
  swing,
  selectedKit,
  kitPresets,
  activePattern,
  activeBank,
  onTogglePlay,
  onToggleRecord,
  onBpmChange,
  onSwingChange,
  onKitChange,
  onBankChange,
  onSavePattern,
  onExportWav,
  onOpenPresetManager,
}) => {
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const tapTimeoutRef = useRef<number | null>(null);

  // Tap Tempo Logic
  const handleTapTempo = () => {
    const now = performance.now();
    const newTapTimes = [...tapTimes, now].filter((t) => now - t < 3000); // Keep taps within last 3 sec

    setTapTimes(newTapTimes);

    if (newTapTimes.length > 1) {
      const intervals = [];
      for (let i = 1; i < newTapTimes.length; i++) {
        intervals.push(newTapTimes[i] - newTapTimes[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 40 && calculatedBpm <= 240) {
        onBpmChange(calculatedBpm);
      }
    }

    if (tapTimeoutRef.current !== null) {
      window.clearTimeout(tapTimeoutRef.current);
    }
    tapTimeoutRef.current = window.setTimeout(() => setTapTimes([]), 2000);
  };

  const handleExportWithConfetti = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.2 },
      colors: [selectedKit.accentColor, '#f43f5e', '#3b82f6', '#10b981'],
    });
    onExportWav();
  };

  return (
    <header className="bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border-b border-zinc-800 p-3 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-3">
        
        {/* Brand & Pattern Title */}
        <div className="flex items-center justify-between w-full lg:w-auto gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shadow-inner"
              style={{ boxShadow: `0 0 15px ${selectedKit.accentColor}40` }}
            >
              <Disc
                className={`w-6 h-6 ${isPlaying ? 'animate-spin' : ''}`}
                style={{ color: selectedKit.accentColor }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-widest text-zinc-100 uppercase italic">
                  PULSE<span style={{ color: selectedKit.accentColor }}>808</span>
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-zinc-400">
                  ANALOGUE
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate max-w-[180px] font-medium">
                {activePattern.name}
              </p>
            </div>
          </div>

          {/* Quick Bank Selectors (A B C D) */}
          <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-lg border border-zinc-800">
            {(['A', 'B', 'C', 'D'] as const).map((bank) => (
              <button
                key={bank}
                onClick={() => onBankChange(bank)}
                className={`w-7 h-7 rounded text-xs font-bold font-mono transition-all ${
                  activeBank === bank
                    ? 'bg-zinc-700 text-white shadow'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                }`}
                style={{
                  borderBottom: activeBank === bank ? `2px solid ${selectedKit.accentColor}` : 'none',
                }}
              >
                {bank}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Transport & Tempo Controls */}
        <div className="flex items-center flex-wrap justify-center gap-2 w-full lg:w-auto">
          {/* Play/Stop */}
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 ${
              isPlaying
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 ring-2 ring-emerald-400/50'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
            }`}
          >
            {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            {isPlaying ? 'Stop' : 'Play'}
          </button>

          {/* Record */}
          <button
            onClick={onToggleRecord}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95 ${
              isRecording
                ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-900/50'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'
            }`}
            title="Record drum pads live with auto-quantize"
          >
            <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-white' : 'bg-rose-500'}`} />
            Rec
          </button>

          {/* BPM Slider & Numeric Input */}
          <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800">
            <span className="text-xs font-mono font-bold text-zinc-400">BPM</span>
            <input
              type="number"
              min={40}
              max={240}
              value={bpm}
              onChange={(e) => onBpmChange(Number(e.target.value))}
              className="w-12 bg-zinc-950 border border-zinc-700 rounded text-center text-xs font-mono font-bold text-zinc-100 p-0.5 focus:outline-none focus:border-orange-500"
            />
            <input
              type="range"
              min={40}
              max={240}
              value={bpm}
              onChange={(e) => onBpmChange(Number(e.target.value))}
              className="w-20 accent-orange-500 cursor-pointer hidden sm:block"
            />
          </div>

          {/* Tap Tempo */}
          <button
            onClick={handleTapTempo}
            className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-mono font-bold active:scale-90 transition-transform"
          >
            TAP
          </button>

          {/* Swing Selector */}
          <div className="flex items-center gap-1 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800 hidden sm:flex">
            <span className="text-xs font-mono font-bold text-zinc-400">SWING</span>
            <select
              value={swing}
              onChange={(e) => onSwingChange(Number(e.target.value))}
              className="bg-zinc-950 border border-zinc-700 rounded text-xs font-mono font-bold text-zinc-200 p-0.5 focus:outline-none"
            >
              <option value={0}>Straight (0%)</option>
              <option value={15}>Light (15%)</option>
              <option value={30}>Groove (30%)</option>
              <option value={50}>Heavy (50%)</option>
              <option value={65}>Shuffle (65%)</option>
            </select>
          </div>
        </div>

        {/* Right: Kit Presets & Storage Actions */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          {/* Kit Preset Dropdown */}
          <div className="flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1.5 rounded-xl border border-zinc-800">
            <Zap className="w-3.5 h-3.5" style={{ color: selectedKit.accentColor }} />
            <select
              value={selectedKit.id}
              onChange={(e) => onKitChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-zinc-200 focus:outline-none cursor-pointer"
            >
              {kitPresets.map((kit) => (
                <option key={kit.id} value={kit.id} className="bg-zinc-900 text-zinc-200">
                  {kit.name}
                </option>
              ))}
            </select>
          </div>

          {/* Save Pattern */}
          <button
            onClick={onSavePattern}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
            title="Save Pattern to Browser Storage"
          >
            <Save className="w-4 h-4" />
          </button>

          {/* Manage Beats / Storage */}
          <button
            onClick={onOpenPresetManager}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors flex items-center gap-1"
            title="Load / Manage Beats"
          >
            <FolderOpen className="w-4 h-4" />
          </button>

          {/* Export WAV */}
          <button
            onClick={handleExportWithConfetti}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg shadow-orange-900/30 active:scale-95 transition-all"
            title="Export Pattern to WAV Audio File"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">WAV</span>
          </button>
        </div>

      </div>
    </header>
  );
};
