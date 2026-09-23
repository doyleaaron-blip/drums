// Screen Wake Lock API service to prevent mobile display timeout during playback

class WakeLockService {
  private wakeLock: WakeLockSentinel | null = null;

  public async requestLock() {
    if (!('wakeLock' in navigator)) return;

    try {
      if (!this.wakeLock) {
        this.wakeLock = await navigator.wakeLock.request('screen');
        
        this.wakeLock.addEventListener('release', () => {
          this.wakeLock = null;
        });
      }
    } catch (err) {
      // Wake Lock request can fail if low battery or tab hidden
      console.warn('Wake Lock request failed:', err);
    }
  }

  public async releaseLock() {
    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
      } catch (err) {
        // ignore
      }
      this.wakeLock = null;
    }
  }

  // Re-acquire lock if tab regains focus while playing
  public handleVisibilityChange(isPlaying: boolean) {
    if (document.visibilityState === 'visible' && isPlaying) {
      this.requestLock();
    }
  }
}

export const wakeLockService = new WakeLockService();
