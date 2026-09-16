import React from 'react';
import type { VoiceId, VoiceParams } from '../../types/drum';
import { DRUM_VOICE_SPECS } from '../../audio/voiceSpecs';
import { Knob } from '../Controls/Knob';
import { RotateCcw, Volume2 } from 'lucide-react';

interface VoiceSculptorProps {
  activeVoiceId: VoiceId;
  params: VoiceParams;
  onVoiceSelect: (voiceId: VoiceId) => void;
  onParamChange: (param: keyof VoiceParams, val: number) => void;
  onResetParams: () => void;
  onAuditionVoice: (voiceId: VoiceId) => void;
}

export const VoiceSculptor: React.FC<VoiceSculptorProps> = ({
  activeVoiceId,
  params,
  onVoiceSelect,
  onParamChange,
  onResetParams,
  onAuditionVoice,
}) => {
  const spec = DRUM_VOICE_SPECS.find((v) => v.id === activeVoiceId) || DRUM_VOICE_SPECS[0];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 lg:p-5 shadow-2xl space-y-4">
      {/* Header & Voice Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white shadow-lg cursor-pointer"
            style={{ backgroundColor: spec.color }}
            onClick={() => onAuditionVoice(spec.id)}
            title="Click to audition sound"
          >
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2 uppercase tracking-wider">
              {spec.name}
            </h2>
            <span className="text-xs text-zinc-400">Analogue Voice Parameter Sculptor</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Voice Switcher Dropdown */}
          <select
            value={activeVoiceId}
            onChange={(e) => onVoiceSelect(e.target.value as VoiceId)}
            className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-zinc-200 focus:outline-none"
          >
            {DRUM_VOICE_SPECS.map((v) => (
              <option key={v.id} value={v.id} className="bg-zinc-900 text-zinc-200">
                {v.shortName} - {v.name}
              </option>
            ))}
          </select>

          {/* Reset Params */}
          <button
            onClick={onResetParams}
            className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Reset parameters to kit default"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Rotary Control Knobs Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-4 py-2 bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
        
        {/* Pitch Sweep Knob */}
        <Knob
          label="Pitch"
          value={params.pitch}
          min={0}
          max={100}
          color={spec.color}
          onChange={(val) => onParamChange('pitch', val)}
        />

        {/* Envelope Decay Knob */}
        <Knob
          label="Decay"
          value={params.decay}
          min={0}
          max={100}
          color={spec.color}
          onChange={(val) => onParamChange('decay', val)}
        />

        {/* Filter Tone Cutoff Knob */}
        <Knob
          label="Tone"
          value={params.tone}
          min={0}
          max={100}
          color={spec.color}
          onChange={(val) => onParamChange('tone', val)}
        />

        {/* Snappy Noise Ratio (for Snare / Clap) */}
        {spec.hasSnappy && params.snappy !== undefined && (
          <Knob
            label="Snappy"
            value={params.snappy}
            min={0}
            max={100}
            color="#ec4899"
            onChange={(val) => onParamChange('snappy', val)}
          />
        )}

        {/* Voice Analog Drive */}
        <Knob
          label="Drive"
          value={params.drive}
          min={0}
          max={100}
          color="#f43f5e"
          onChange={(val) => onParamChange('drive', val)}
        />

        {/* Stereo Panner */}
        <Knob
          label="Pan"
          value={params.pan}
          min={-100}
          max={100}
          color="#38bdf8"
          onChange={(val) => onParamChange('pan', val)}
        />

        {/* Voice Volume */}
        <Knob
          label="Volume"
          value={params.volume}
          min={0}
          max={100}
          color="#10b981"
          onChange={(val) => onParamChange('volume', val)}
        />

      </div>
    </div>
  );
};
