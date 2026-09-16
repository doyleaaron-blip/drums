import React from 'react';
import type { MasterFXParams } from '../../types/drum';
import { Knob } from '../Controls/Knob';
import { Flame } from 'lucide-react';

interface MasterPanelProps {
  params: MasterFXParams;
  onChange: (newParams: MasterFXParams) => void;
  onReset: () => void;
}

export const MasterPanel: React.FC<MasterPanelProps> = ({ params, onChange, onReset }) => {
  const handleChange = (key: keyof MasterFXParams, value: number) => {
    onChange({
      ...params,
      [key]: value,
    });
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 lg:p-5 shadow-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <div>
            <h2 className="text-base font-bold text-zinc-100 uppercase tracking-wider">
              Master Analogue Rack & Effects
            </h2>
            <p className="text-xs text-zinc-400">Master Saturation, Filter Sweep, Stereo Delay, Reverb & Compressor</p>
          </div>
        </div>

        <button
          onClick={onReset}
          className="px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono font-bold text-zinc-300"
        >
          Reset Master FX
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4 bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
        
        {/* Master Tape Drive */}
        <Knob
          label="Tape Drive"
          value={params.drive}
          min={0}
          max={100}
          color="#f97316"
          onChange={(val) => handleChange('drive', val)}
        />

        {/* Master Filter Cutoff */}
        <Knob
          label="Filter Freq"
          value={params.filterCutoff}
          min={100}
          max={18000}
          step={100}
          unit="Hz"
          color="#10b981"
          onChange={(val) => handleChange('filterCutoff', val)}
        />

        {/* Master Filter Resonance */}
        <Knob
          label="Filter Res"
          value={params.filterRes}
          min={0}
          max={100}
          color="#10b981"
          onChange={(val) => handleChange('filterRes', val)}
        />

        {/* Delay Time */}
        <Knob
          label="Delay Time"
          value={params.delayTime}
          min={0}
          max={100}
          color="#3b82f6"
          onChange={(val) => handleChange('delayTime', val)}
        />

        {/* Delay Feedback */}
        <Knob
          label="Delay Feed"
          value={params.delayFeedback}
          min={0}
          max={100}
          color="#3b82f6"
          onChange={(val) => handleChange('delayFeedback', val)}
        />

        {/* Reverb Mix */}
        <Knob
          label="Reverb"
          value={params.reverbMix}
          min={0}
          max={100}
          color="#a855f7"
          onChange={(val) => handleChange('reverbMix', val)}
        />

        {/* Compressor Threshold */}
        <Knob
          label="Comp Push"
          value={params.compThreshold}
          min={0}
          max={100}
          color="#ec4899"
          onChange={(val) => handleChange('compThreshold', val)}
        />

      </div>
    </div>
  );
};
