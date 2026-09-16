import React, { useState } from 'react';
import type { Pattern, VoiceId, StepData } from '../../types/drum';
import { DRUM_VOICE_SPECS } from '../../audio/voiceSpecs';
import { Volume2, Sliders, Zap } from 'lucide-react';

interface StepGridProps {
  pattern: Pattern;
  activeVoiceId: VoiceId;
  currentStep: number;
  onVoiceSelect: (voiceId: VoiceId) => void;
  onStepToggle: (voiceId: VoiceId, stepIndex: number) => void;
  onStepAccentToggle: (voiceId: VoiceId, stepIndex: number) => void;
  onStepFlamCycle: (voiceId: VoiceId, stepIndex: number) => void;
  onStepVelocityChange: (voiceId: VoiceId, stepIndex: number, velocity: number) => void;
  onAuditionVoice: (voiceId: VoiceId) => void;
  onStepCountChange: (count: 16 | 32) => void;
  onClearTrack: (voiceId: VoiceId) => void;
}

export const StepGrid: React.FC<StepGridProps> = ({
  pattern,
  activeVoiceId,
  currentStep,
  onVoiceSelect,
  onStepToggle,
  onStepAccentToggle,
  onStepFlamCycle,
  onStepVelocityChange,
  onAuditionVoice,
  onStepCountChange,
  onClearTrack,
}) => {
  const [viewMode, setViewMode] = useState<'focused' | 'multitrack'>('focused');
  const [page, setPage] = useState<0 | 1>(0); // Page 0: steps 0-15, Page 1: steps 16-31

  const activeSpec = DRUM_VOICE_SPECS.find((v) => v.id === activeVoiceId) || DRUM_VOICE_SPECS[0];
  const totalSteps = pattern.stepCount || 16;
  const pageStepOffset = page * 16;
  const pageSteps = Array.from({ length: Math.min(16, totalSteps - pageStepOffset) }, (_, i) => pageStepOffset + i);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 lg:p-5 shadow-2xl space-y-4">
      
      {/* Top Controls Bar: View Mode, Page Selector, Clear */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800/80">
        
        {/* Track Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
          {DRUM_VOICE_SPECS.map((spec) => {
            const isSelected = spec.id === activeVoiceId;
            const hasHits = pattern.data[spec.id]?.some((s) => s.active);

            return (
              <button
                key={spec.id}
                onClick={() => onVoiceSelect(spec.id)}
                className={`relative px-3 py-1.5 rounded-lg font-mono font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-zinc-800 text-white shadow ring-1 ring-zinc-600'
                    : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
                style={{
                  borderLeft: isSelected ? `3px solid ${spec.color}` : 'none',
                }}
              >
                <span>{spec.shortName}</span>
                {hasHits && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: spec.color }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* View Mode & Page Selectors */}
        <div className="flex items-center gap-2">
          {/* 16 / 32 Step Selector */}
          <div className="flex items-center bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
            <button
              onClick={() => onStepCountChange(16)}
              className={`px-2 py-1 text-[11px] font-mono font-bold rounded ${
                totalSteps === 16 ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              16 Steps
            </button>
            <button
              onClick={() => onStepCountChange(32)}
              className={`px-2 py-1 text-[11px] font-mono font-bold rounded ${
                totalSteps === 32 ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              32 Steps
            </button>
          </div>

          {/* 32-step page switcher */}
          {totalSteps === 32 && (
            <div className="flex items-center bg-zinc-900 rounded-lg p-0.5 border border-zinc-800 font-mono text-[11px] font-bold">
              <button
                onClick={() => setPage(0)}
                className={`px-2 py-1 rounded ${page === 0 ? 'bg-orange-600 text-white' : 'text-zinc-400'}`}
              >
                1-16
              </button>
              <button
                onClick={() => setPage(1)}
                className={`px-2 py-1 rounded ${page === 1 ? 'bg-orange-600 text-white' : 'text-zinc-400'}`}
              >
                17-32
              </button>
            </div>
          )}

          {/* View Toggle */}
          <button
            onClick={() => setViewMode(viewMode === 'focused' ? 'multitrack' : 'focused')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono font-semibold text-zinc-300"
          >
            <Sliders className="w-3.5 h-3.5" />
            {viewMode === 'focused' ? 'Full Grid' : 'Focused'}
          </button>

          {/* Clear Track */}
          <button
            onClick={() => onClearTrack(activeVoiceId)}
            className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-rose-950 border border-zinc-800 text-xs text-rose-400 hover:text-rose-300 transition-colors"
            title="Clear active track steps"
          >
            Clear Track
          </button>
        </div>

      </div>

      {/* Main Track View Area */}
      {viewMode === 'focused' ? (
        /* FOCUSED INSTRUMENT STEP SEQUENCER MATRIX */
        <div className="space-y-4">
          
          {/* Active Track Header with Audition & Parameter info */}
          <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onAuditionVoice(activeSpec.id)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shadow-lg transition-transform active:scale-95 cursor-pointer"
                style={{ backgroundColor: activeSpec.color }}
                title="Tap to audition drum voice"
              >
                <Volume2 className="w-5 h-5" />
              </button>
              <div>
                <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                  {activeSpec.name}
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                    {activeSpec.shortName}
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Tap step pad to toggle beat. Right-click or use A/F buttons for Accent & Flam burst.
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-3 text-xs text-zinc-400 font-mono">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-orange-500 inline-block" /> Step
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block" /> Accent
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-pink-500 inline-block" /> Flam
              </span>
            </div>
          </div>

          {/* 16 Step Buttons Matrix */}
          <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-16 gap-2">
            {pageSteps.map((stepIdx) => {
              const stepData: StepData = pattern.data[activeVoiceId]?.[stepIdx] || {
                active: false,
                velocity: 0.9,
                accent: false,
                flam: 'none',
              };
              const isCurrentStep = currentStep === stepIdx;
              const isBeatGroup = Math.floor(stepIdx / 4) % 2 === 1;

              return (
                <div key={stepIdx} className="flex flex-col items-center gap-1">
                  
                  {/* Step LED Running Indicator */}
                  <div
                    className={`w-3 h-1.5 rounded-full transition-all ${
                      isCurrentStep
                        ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                        : 'bg-zinc-800'
                    }`}
                  />

                  {/* Tactile Hardware Step Pad Container */}
                  <div
                    onClick={() => onStepToggle(activeVoiceId, stepIdx)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      onStepAccentToggle(activeVoiceId, stepIdx);
                    }}
                    className={`relative w-full aspect-square rounded-xl flex flex-col items-center justify-between p-1.5 transition-all duration-100 select-none cursor-pointer active:scale-95 border ${
                      stepData.active
                        ? stepData.accent
                          ? 'bg-gradient-to-b from-amber-400 to-orange-500 text-zinc-950 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.6)] font-black'
                          : 'bg-gradient-to-b from-zinc-700 to-zinc-800 text-white border-zinc-500 shadow-md font-bold'
                        : isBeatGroup
                        ? 'bg-zinc-950/80 hover:bg-zinc-800 text-zinc-500 border-zinc-800/80'
                        : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-500 border-zinc-800'
                    }`}
                    style={{
                      borderBottomWidth: stepData.active ? '4px' : '2px',
                      borderBottomColor: stepData.active ? activeSpec.color : undefined,
                    }}
                  >
                    {/* Step Number */}
                    <span className="text-[10px] font-mono font-bold text-zinc-400 self-start">
                      {stepIdx + 1}
                    </span>

                    {/* Flam Burst Badge */}
                    {stepData.active && stepData.flam !== 'none' && (
                      <span className="text-[9px] font-black px-1 rounded bg-pink-500 text-white uppercase tracking-tighter shadow">
                        {stepData.flam === 'double' ? '2x' : '3x'}
                      </span>
                    )}

                    {/* Accent Icon indicator */}
                    {stepData.active && stepData.accent && (
                      <Zap className="w-3.5 h-3.5 fill-current text-zinc-950 self-center" />
                    )}

                    {/* Active Accent/Flam Quick Actions Bar */}
                    {stepData.active && (
                      <div className="flex items-center gap-1 w-full justify-between mt-auto">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStepAccentToggle(activeVoiceId, stepIdx);
                          }}
                          className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-mono font-bold bg-zinc-950 text-amber-400 hover:bg-zinc-800"
                          title="Toggle Accent"
                        >
                          A
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStepFlamCycle(activeVoiceId, stepIdx);
                          }}
                          className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-mono font-bold bg-pink-500 text-white hover:bg-pink-600"
                          title="Cycle Flam / Ratchet burst"
                        >
                          F
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Velocity Slider */}
                  {stepData.active && (
                    <input
                      type="range"
                      min={0.2}
                      max={1.0}
                      step={0.05}
                      value={stepData.velocity}
                      onChange={(e) =>
                        onStepVelocityChange(activeVoiceId, stepIdx, parseFloat(e.target.value))
                      }
                      className="w-full accent-orange-500 h-1 bg-zinc-800 rounded cursor-pointer"
                      title={`Velocity: ${Math.round(stepData.velocity * 100)}%`}
                    />
                  )}
                </div>
              );
            })}
          </div>

        </div>
      ) : (
        /* MULTI-TRACK MATRIX VIEW */
        <div className="space-y-2 overflow-x-auto scrollbar-none">
          {DRUM_VOICE_SPECS.map((spec) => {
            const track = pattern.data[spec.id] || [];
            return (
              <div
                key={spec.id}
                className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800/80 min-w-[640px]"
              >
                {/* Track Label */}
                <button
                  onClick={() => onVoiceSelect(spec.id)}
                  className="w-24 px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-left font-mono font-bold text-xs flex items-center justify-between text-zinc-200"
                  style={{ borderLeft: `3px solid ${spec.color}` }}
                >
                  <span>{spec.shortName}</span>
                  <Volume2
                    className="w-3 h-3 text-zinc-400 hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAuditionVoice(spec.id);
                    }}
                  />
                </button>

                {/* 16 Steps Row */}
                <div className="grid grid-cols-16 gap-1 flex-1">
                  {pageSteps.map((stepIdx) => {
                    const stepData = track[stepIdx] || { active: false, velocity: 0.9, accent: false, flam: 'none' };
                    const isCurrent = currentStep === stepIdx;
                    const isGroup = Math.floor(stepIdx / 4) % 2 === 1;

                    return (
                      <button
                        key={stepIdx}
                        onClick={() => onStepToggle(spec.id, stepIdx)}
                        className={`h-7 rounded border transition-all flex items-center justify-center font-mono text-[10px] ${
                          stepData.active
                            ? 'bg-zinc-700 text-white font-bold border-zinc-500 shadow'
                            : isGroup
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-600'
                            : 'bg-zinc-950 border-zinc-850 text-zinc-600'
                        } ${isCurrent ? 'ring-2 ring-emerald-400' : ''}`}
                        style={{
                          backgroundColor: stepData.active ? spec.color : undefined,
                        }}
                      >
                        {stepIdx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
