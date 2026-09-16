import type { Pattern, KitVoices, MasterFXParams } from '../types/drum';
import { DRUM_VOICE_SPECS } from './voiceSpecs';
import { SynthEngine } from './synthEngine';

// Converts AudioBuffer to WAV Blob
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  const result = interleave(buffer);
  const dataSize = result.length * 2;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + dataSize, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * numChannels * 2, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, numChannels * 2, true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, dataSize, true);

  // Write 16-bit PCM samples
  let offset = 44;
  for (let i = 0; i < result.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, result[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function interleave(buffer: AudioBuffer): Float32Array {
  const channels = buffer.numberOfChannels;
  const len = buffer.length;
  if (channels === 1) return buffer.getChannelData(0);

  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  const result = new Float32Array(len * 2);

  for (let i = 0; i < len; i++) {
    result[i * 2] = left[i];
    result[i * 2 + 1] = right[i];
  }
  return result;
}

export async function exportPatternToWav(
  pattern: Pattern,
  voices: KitVoices,
  masterFX: MasterFXParams,
  loops = 2
): Promise<Blob> {
  const bpm = pattern.bpm;
  const secondsPerStep = (60 / bpm) / 4;
  const totalSteps = pattern.stepCount * loops;
  const duration = totalSteps * secondsPerStep + 1.5; // Extra tail for decay/reverb

  const sampleRate = 44100;
  const offlineCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

  // Synthesize into offline context
  const engine = new SynthEngine();
  // Assign context hack by casting to AudioContext for offline rendering
  (engine as unknown as { ctx: AudioContext }).ctx = offlineCtx as unknown as AudioContext;
  engine.init();
  engine.updateMasterFX(masterFX);

  let currentTime = 0.05;
  const swing = (pattern.swing || 0) / 100;

  for (let loop = 0; loop < loops; loop++) {
    for (let step = 0; step < pattern.stepCount; step++) {
      let stepDur = secondsPerStep;
      if (step % 2 === 1) {
        stepDur += secondsPerStep * swing * 0.5;
      } else {
        stepDur -= secondsPerStep * swing * 0.5;
      }

      DRUM_VOICE_SPECS.forEach((spec) => {
        const track = pattern.data[spec.id];
        if (track && track[step] && track[step].active) {
          const s = track[step];
          const params = voices[spec.id];
          if (params) {
            const flamCount = s.flam === 'double' ? 1 : s.flam === 'triple' ? 2 : 0;
            engine.triggerVoice(spec.id, params, currentTime, s.velocity, s.accent, flamCount);
          }
        }
      });

      currentTime += Math.max(0.02, stepDur);
    }
  }

  const renderedBuffer = await offlineCtx.startRendering();
  return audioBufferToWav(renderedBuffer);
}
