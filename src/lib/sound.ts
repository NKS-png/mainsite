// Sound utility for non-copyright sound effects using Web Audio API
class SoundManager {
  private audioContext: AudioContext | null = null;
  private backgroundMusic: AudioBufferSourceNode | null = null;
  private backgroundGain: GainNode | null = null;
  private isBackgroundPlaying = false;

  private initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  // Generate a simple click sound
  private createClickSound(frequency: number = 800, duration: number = 0.1) {
    const ctx = this.initAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }

  // Generate a toggle/switch sound
  private createToggleSound() {
    const ctx = this.initAudioContext();

    // Create two quick tones for toggle effect
    this.createClickSound(600, 0.08);
    setTimeout(() => this.createClickSound(800, 0.08), 50);
  }

  // Generate a magical sound for GIF/media play
  private createMagicSound() {
    const ctx = this.initAudioContext();

    // Create a longer sequence of ascending tones for better sync
    const frequencies = [523, 587, 659, 698, 784, 880, 988, 1047]; // C, D, E, F, G, A, B, C (C major scale)
    const duration = 0.25; // Longer duration for each tone
    const interval = 120; // Longer interval between tones

    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);
      }, index * interval);
    });
  }

  // Create ambient background music
  private createAmbientMusic() {
    const ctx = this.initAudioContext();

    // Create multiple oscillators for ambient sound
    const oscillators = [];
    const frequencies = [220, 330, 440, 550]; // A3, E4, A4, C#5 (A minor pentatonic)

    frequencies.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      if (this.backgroundGain) {
        gainNode.connect(this.backgroundGain);
      } else {
        gainNode.connect(ctx.destination);
      }

      oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
      oscillator.type = 'sine';

      // Very low volume for ambient effect
      gainNode.gain.setValueAtTime(0.02, ctx.currentTime);

      // Add slight frequency modulation for organic feel
      const modulationOsc = ctx.createOscillator();
      const modulationGain = ctx.createGain();
      modulationOsc.connect(modulationGain);
      modulationGain.connect(oscillator.frequency);
      modulationOsc.frequency.setValueAtTime(0.1 + index * 0.05, ctx.currentTime);
      modulationGain.gain.setValueAtTime(freq * 0.01, ctx.currentTime);

      oscillators.push({ oscillator, gainNode, modulationOsc, modulationGain });
    });

    return oscillators;
  }

  // Generate guitar-like sounds for different pages
  private createGuitarStrum(frequencies: number[], delays: number[] = []) {
    const ctx = this.initAudioContext();

    frequencies.forEach((freq, index) => {
      const delay = delays[index] || 0;
      setTimeout(() => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
        oscillator.type = 'triangle'; // Guitar-like tone

        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.8);
      }, delay);
    });
  }

  // Page-specific guitar sounds
  private createHomePageSound() {
    // Major chord strum - C major
    this.createGuitarStrum([261.63, 329.63, 392.00], [0, 50, 100]); // C, E, G
  }

  private createPortfolioSound() {
    // Minor chord - A minor for creative feel
    this.createGuitarStrum([220, 261.63, 329.63], [0, 30, 60]); // A, C, E
  }

  private createAboutSound() {
    // Single sustained note - E
    const ctx = this.initAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(329.63, ctx.currentTime); // E
    oscillator.type = 'triangle';

    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 1.5);
  }

  private createServicesSound() {
    // Quick arpeggio - C major scale
    const frequencies = [261.63, 293.66, 329.63, 349.23, 392.00]; // C, D, E, F, G
    const delays = [0, 100, 200, 300, 400];
    this.createGuitarStrum(frequencies, delays);
  }

  private createDashboardSound() {
    // Power chord - E5
    this.createGuitarStrum([82.41, 123.47], [0, 20]); // E, B (octave down)
  }

  // Public methods
  playClick() {
    this.createClickSound(800, 0.1);
  }

  playToggle() {
    this.createToggleSound();
  }

  playButton() {
    this.createClickSound(700, 0.12);
  }

  playMagic() {
    this.createMagicSound();
  }

  // Page entry sounds
  playHomePageSound() {
    this.createHomePageSound();
  }

  playPortfolioSound() {
    this.createPortfolioSound();
  }

  playAboutSound() {
    this.createAboutSound();
  }

  playServicesSound() {
    this.createServicesSound();
  }

  playDashboardSound() {
    this.createDashboardSound();
  }

  startBackgroundMusic() {
    if (this.isBackgroundPlaying) return;

    const ctx = this.initAudioContext();
    this.backgroundGain = ctx.createGain();
    this.backgroundGain.connect(ctx.destination);
    this.backgroundGain.gain.setValueAtTime(0.03, ctx.currentTime); // Very low volume

    const oscillators = this.createAmbientMusic();

    // Start all oscillators
    oscillators.forEach(({ oscillator, modulationOsc }) => {
      oscillator.start(ctx.currentTime);
      modulationOsc.start(ctx.currentTime);
    });

    this.isBackgroundPlaying = true;

    // Store reference for cleanup
    this.backgroundMusic = oscillators[0].oscillator;
  }

  stopBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.stop();
      this.backgroundMusic = null;
    }
    this.isBackgroundPlaying = false;
  }

  isBackgroundMusicPlaying() {
    return this.isBackgroundPlaying;
  }
}

// Export singleton instance
export const soundManager = new SoundManager();

// Utility functions for easy use
export const playClickSound = () => soundManager.playClick();
export const playToggleSound = () => soundManager.playToggle();
export const playButtonSound = () => soundManager.playButton();
export const playMagicSound = () => soundManager.playMagic();
export const startBackgroundMusic = () => soundManager.startBackgroundMusic();
export const stopBackgroundMusic = () => soundManager.stopBackgroundMusic();
export const isBackgroundMusicPlaying = () => soundManager.isBackgroundMusicPlaying();

// Page-specific sound functions
export const playHomePageSound = () => soundManager.playHomePageSound();
export const playPortfolioSound = () => soundManager.playPortfolioSound();
export const playAboutSound = () => soundManager.playAboutSound();
export const playServicesSound = () => soundManager.playServicesSound();
export const playDashboardSound = () => soundManager.playDashboardSound();