import type { Pattern, KitVoices, MasterFXParams } from '../types/drum';
import { synthEngine } from './synthEngine';
import { DRUM_VOICE_SPECS } from './voiceSpecs';

export class StepScheduler {
  private isPlaying = false;
  private currentStep = 0;
  private nextNoteTime = 0;
  private timerId: number | null = null;
  private lookaheadMs = 25; // How frequently to call scheduling function (ms)
  private scheduleAheadTime = 0.1; // How far ahead to schedule audio (sec)

  private pattern: Pattern | null = null;
  private activeVoices: KitVoices | null = null;
  private onStepChange: ((step: number) => void) | null = null;
  private isRecording = false;

  public start(
    pattern: Pattern,
    voices: KitVoices,
    masterFX: MasterFXParams,
    onStepChange: (step: number) => void,
    startStep = 0
  ) {
    if (this.isPlaying) this.stop();

    this.pattern = pattern;
    this.activeVoices = voices;
    this.onStepChange = onStepChange;
    this.currentStep = startStep;
    this.isPlaying = true;

    synthEngine.updateMasterFX(masterFX);
    const ctx = synthEngine.getAudioContext();
    synthEngine.ensureUnlocked();
    this.nextNoteTime = ctx.currentTime + 0.05;

    this.schedulerLoop();
  }

  public updatePattern(pattern: Pattern, voices: KitVoices, masterFX: MasterFXParams) {
    this.pattern = pattern;
    this.activeVoices = voices;
    synthEngine.updateMasterFX(masterFX);
  }

  public setRecording(recording: boolean) {
    this.isRecording = recording;
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  public getCurrentStep(): number {
    return this.currentStep;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  private schedulerLoop = () => {
    if (!this.isPlaying) return;

    const ctx = synthEngine.getAudioContext();
    while (this.nextNoteTime < ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.currentStep, this.nextNoteTime);
      this.advanceStep();
    }

    this.timerId = window.setTimeout(this.schedulerLoop, this.lookaheadMs);
  };

  private advanceStep() {
    if (!this.pattern) return;

    // Calculate tempo step duration
    const bpm = Math.max(30, Math.min(300, this.pattern.bpm));
    const secondsPerBeat = 60.0 / bpm;
    const stepDuration = secondsPerBeat / 4; // 16th notes

    // Swing delay on even steps (1-indexed 2nd, 4th 16th notes: 0, 2, 4...)
    let currentStepDuration = stepDuration;
    const swingAmount = (this.pattern.swing || 0) / 100; // 0 to 0.75

    if (this.currentStep % 2 === 1) {
      currentStepDuration += stepDuration * swingAmount * 0.5;
    } else {
      currentStepDuration -= stepDuration * swingAmount * 0.5;
    }

    this.nextNoteTime += Math.max(0.02, currentStepDuration);

    const totalSteps = this.pattern.stepCount || 16;
    this.currentStep = (this.currentStep + 1) % totalSteps;
  }

  private scheduleNote(stepIndex: number, time: number) {
    if (!this.pattern || !this.activeVoices) return;

    // Notify UI of active playing step
    if (this.onStepChange) {
      const timeUntilStep = Math.max(0, (time - synthEngine.getAudioContext().currentTime) * 1000);
      setTimeout(() => {
        if (this.isPlaying && this.onStepChange) {
          this.onStepChange(stepIndex);
        }
      }, timeUntilStep);
    }

    // Trigger enabled drum tracks for this step
    DRUM_VOICE_SPECS.forEach((spec) => {
      const voiceId = spec.id;
      const track = this.pattern!.data[voiceId];
      if (track && track[stepIndex] && track[stepIndex].active) {
        const step = track[stepIndex];
        const params = this.activeVoices![voiceId];
        if (params) {
          const flamCount = step.flam === 'double' ? 1 : step.flam === 'triple' ? 2 : 0;
          synthEngine.triggerVoice(voiceId, params, time, step.velocity, step.accent, flamCount);
        }
      }
    });
  }
}

export const scheduler = new StepScheduler();
