// Sound Manager for Gamification Dopamine Feedback
// Placeholder implementation - can be expanded with actual audio files

export type SoundType = 
  | 'xp_gain'
  | 'level_up'
  | 'achievement'
  | 'challenge_complete'
  | 'streak_milestone'
  | 'mystery_reward'
  | 'trade_win'
  | 'trade_loss';

class SoundManager {
  private enabled: boolean = true;
  private volume: number = 0.5;
  private sounds: Map<SoundType, string> = new Map();

  constructor() {
    // Initialize sound URLs (placeholder - replace with actual sound files)
    this.sounds.set('xp_gain', '/sounds/coin.mp3');
    this.sounds.set('level_up', '/sounds/fanfare.mp3');
    this.sounds.set('achievement', '/sounds/achievement.mp3');
    this.sounds.set('challenge_complete', '/sounds/success.mp3');
    this.sounds.set('streak_milestone', '/sounds/streak.mp3');
    this.sounds.set('mystery_reward', '/sounds/mystery.mp3');
    this.sounds.set('trade_win', '/sounds/win.mp3');
    this.sounds.set('trade_loss', '/sounds/neutral.mp3');
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  play(soundType: SoundType) {
    if (!this.enabled) return;

    // For now, use Web Audio API beep tones as placeholder
    // Replace this with actual audio file playback when sound files are added
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Different frequencies for different sounds
    const frequencies: Record<SoundType, number> = {
      xp_gain: 440,
      level_up: 880,
      achievement: 660,
      challenge_complete: 554,
      streak_milestone: 740,
      mystery_reward: 587,
      trade_win: 523,
      trade_loss: 330,
    };

    oscillator.frequency.value = frequencies[soundType];
    gainNode.gain.value = this.volume * 0.1; // Keep it subtle

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
  }

  // Preload sounds (for future implementation with actual audio files)
  async preload() {
    // TODO: Implement actual audio file preloading
    return Promise.resolve();
  }
}

export const soundManager = new SoundManager();
