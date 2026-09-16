import React, { useState } from 'react';
import { DRUM_VOICE_SPECS } from '../../audio/voiceSpecs';
import type { VoiceId } from '../../types/drum';
import { Radio } from 'lucide-react';

interface DrumPadsProps {
  activeVoiceId: VoiceId;
  isRecording: boolean;
  onPadTrigger: (voiceId: VoiceId) => void;
  onVoiceSelect: (voiceId: VoiceId) => void;
}

export const DrumPads: React.FC<DrumPadsProps> = ({
  activeVoiceId,
  isRecording,
  onPadTrigger,
  onVoiceSelect,
}) => {
  const [activePad, setActivePad] = useState<VoiceId | null>(null);

  const handlePadPress = (voiceId: VoiceId) => {
    setActivePad(voiceId);
    onVoiceSelect(voiceId);
    onPadTrigger(voiceId);

    // Haptic touch vibration feedback for mobile devices
    if ('navigator' in window && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(20);
      } catch (e) {
        // ignore
      }
    }

    setTimeout(() => {
      setActivePad(null);
    }, 120);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-2xl space-y-3">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-orange-500" />
          <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
            Finger Drumming Pads
          </h2>
        </div>
        {isRecording && (
          <span className="text-xs font-mono font-bold text-rose-500 animate-pulse flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Recording Pad Hits...
          </span>
        )}
      </div>

      {/* Tactile 3x4 Drum Pad Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {DRUM_VOICE_SPECS.map((spec) => {
          const isActive = activePad === spec.id;
          const isSelected = activeVoiceId === spec.id;

          return (
            <button
              key={spec.id}
              onPointerDown={(e) => {
                e.preventDefault();
                handlePadPress(spec.id);
              }}
              className={`relative aspect-square rounded-2xl p-3 flex flex-col justify-between items-start transition-all duration-75 select-none touch-manipulation border shadow-lg ${
                isActive
                  ? 'scale-95 bg-white text-zinc-950 border-white shadow-[0_0_25px_rgba(255,255,255,0.8)]'
                  : isSelected
                  ? 'bg-zinc-800 text-white border-zinc-600 ring-2 ring-zinc-500'
                  : 'bg-gradient-to-b from-zinc-800/90 to-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
              }`}
              style={{
                boxShadow: isActive
                  ? `0 0 30px ${spec.color}`
                  : isSelected
                  ? `0 0 15px ${spec.color}40`
                  : undefined,
              }}
            >
              {/* Backlit Corner LED */}
              <div
                className="w-3 h-3 rounded-full transition-colors"
                style={{
                  backgroundColor: spec.color,
                  boxShadow: `0 0 8px ${spec.color}`,
                }}
              />

              {/* Short Name & Full Name */}
              <div className="w-full">
                <span className="text-lg font-black font-mono tracking-wider block">
                  {spec.shortName}
                </span>
                <span className="text-[10px] font-semibold text-zinc-400 block truncate uppercase">
                  {spec.name.split(' ')[0]}
                </span>
              </div>

              {/* Category indicator badge */}
              <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase self-end">
                {spec.category}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
