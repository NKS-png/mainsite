// Enhanced Animation Controller with Sophisticated Interactive Features
class EnhancedAnimationController {
    constructor() {
        this.init();
    }

    init() {
        this.registerGSAPPlugins();
        this.initPortfolioHoverEffects();
        this.initVideoController();
        // Ambient audio UI and tones are disabled to keep the animation
        // portfolio completely silent and focused on visuals.
        // this.initAudioController();
        this.initScrollAnimations();
        this.initTouchInteractions();
        this.preloadAssets();
        this.setupIntersectionObserver();
    }

    registerGSAPPlugins() {
        // Register advanced GSAP plugins
        if (typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
        }
        if (typeof MotionPathPlugin !== 'undefined') {
            gsap.registerPlugin(MotionPathPlugin);
        }
    }

    // Sophisticated Portfolio Hover Effects
    initPortfolioHoverEffects() {
        const portfolioItems = document.querySelectorAll('.portfolio-item');
        
        portfolioItems.forEach(item => {
            this.setupPortfolioHover(item);
        });
    }

    setupPortfolioHover(item) {
        const media = item.querySelector('.portfolio-media');
        const overlay = item.querySelector('.portfolio-overlay');
        const title = item.querySelector('.portfolio-title');
        const description = item.querySelector('.portfolio-description');
        const metadata = item.querySelector('.portfolio-metadata');
        const actions = item.querySelector('.portfolio-actions');

        // Initial setup
        if (overlay) {
            overlay.style.opacity = '0';
            overlay.style.transform = 'translateY(100%)';
        }

        // Sophisticated hover effects
        item.addEventListener('mouseenter', (e) => {
            this.animatePortfolioEnter(item, media, overlay, title, description, metadata, actions);
            this.playHoverSound();
        });

        item.addEventListener('mouseleave', (e) => {
            this.animatePortfolioExit(item, media, overlay, title, description, metadata, actions);
        });

        // Enhanced click handler
        item.addEventListener('click', (e) => {
            this.handlePortfolioClick(item, e);
        });
    }

    animatePortfolioEnter(item, media, overlay, title, description, metadata, actions) {
        const tl = gsap.timeline();

        // Scale and glow effect on media
        if (media) {
            tl.to(media, {
                scale: 1.05,
                duration: 0.6,
                ease: "back.out(1.7)"
            }, 0);
        }

        // Slide up overlay with gradient
        if (overlay) {
            tl.to(overlay, {
                opacity: 1,
                y: 0,
                duration: 0.4,
                ease: "power2.out"
            }, 0.1);
        }

        // Animate title with subtle glow
        if (title) {
            tl.fromTo(title, {
                y: 20,
                opacity: 0,
                scale: 0.95
            }, {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 0.3,
                ease: "power2.out"
            }, 0.2);
        }

        // Reveal description with typing effect
        if (description) {
            tl.fromTo(description, {
                y: 10,
                opacity: 0
            }, {
                y: 0,
                opacity: 0.9,
                duration: 0.3,
                ease: "power2.out"
            }, 0.25);
        }

        // Show metadata with staggered animation
        if (metadata) {
            const metaItems = metadata.querySelectorAll('.meta-item');
            tl.fromTo(metaItems, {
                y: 15,
                opacity: 0,
                scale: 0.9
            }, {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 0.2,
                stagger: 0.05,
                ease: "power2.out"
            }, 0.3);
        }

        // Animate action buttons
        if (actions) {
            const buttons = actions.querySelectorAll('.action-btn');
            tl.fromTo(buttons, {
                y: 20,
                opacity: 0,
                scale: 0.8
            }, {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 0.2,
                stagger: 0.1,
                ease: "back.out(1.7)"
            }, 0.35);
        }

        // Add subtle particle effects
        this.createHoverParticles(item);
    }

    animatePortfolioExit(item, media, overlay, title, description, metadata, actions) {
        const tl = gsap.timeline();

        // Reset media
        if (media) {
            tl.to(media, {
                scale: 1,
                duration: 0.4,
                ease: "power2.out"
            }, 0);
        }

        // Hide overlay
        if (overlay) {
            tl.to(overlay, {
                opacity: 0,
                y: "100%",
                duration: 0.3,
                ease: "power2.in"
            }, 0);
        }

        // Hide all elements
        [title, description, metadata, actions].forEach(element => {
            if (element) {
                tl.to(element, {
                    opacity: 0,
                    y: -10,
                    duration: 0.2,
                    ease: "power2.in"
                }, 0.1);
            }
        });

        // Remove particles
        this.removeHoverParticles(item);
    }

    // Enhanced Video Controller
    initVideoController() {
        const videos = document.querySelectorAll('.portfolio-video');
        
        videos.forEach(video => {
            this.setupVideoPlayer(video);
        });
    }

    setupVideoPlayer(video) {
        const container = video.closest('.portfolio-item');
        const overlay = container.querySelector('.video-overlay');
        const playBtn = container.querySelector('.play-button');
        const pauseBtn = container.querySelector('.pause-button');
        // Use the inner progress fill element when present, falling back
        // to the legacy single-bar selector for backwards compatibility.
        const progressBar =
            container.querySelector('.video-progress-fill') ||
            container.querySelector('.video-progress');
        const volumeBtn = container.querySelector('.volume-button');
        // Support both the compact control fullscreen icon (.fullscreen-btn),
        // any legacy selector (.fullscreen-button), and the CTA-style button
        // in the overlay (.btn-fullscreen).
        const fullscreenBtn = container.querySelector('.fullscreen-btn, .fullscreen-button, .btn-fullscreen');

        // Auto-play with user gesture consideration
        video.addEventListener('loadstart', () => {
            this.showVideoLoader(container);
        });

        video.addEventListener('canplay', () => {
            this.hideVideoLoader(container);
            if (!video.paused) {
                this.startVideoAnimation(video);
            }
        });

        // Enhanced play/pause controls
        if (playBtn) {
            playBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.playVideo(video);
                this.hideControlsTemporarily(container);
            });
        }

        if (pauseBtn) {
            pauseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.pauseVideo(video);
                this.showControls(container);
            });
        }

        // Volume control with smooth transitions
        if (volumeBtn) {
            volumeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleVolume(video, volumeBtn);
            });
        }

        // Fullscreen functionality
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFullscreen(video);
            });
        }

        // Advanced progress bar interaction
        if (progressBar) {
            this.setupProgressBar(progressBar, video);
        }

        // Auto-loop with smooth transitions
        video.addEventListener('ended', () => {
            gsap.to(video, {
                opacity: 0,
                duration: 0.2,
                onComplete: () => {
                    video.currentTime = 0;
                    gsap.to(video, {
                        opacity: 1,
                        duration: 0.3
                    });
                    video.play();
                }
            });
        });

        // Mouse interaction for controls
        container.addEventListener('mouseenter', () => {
            if (!video.paused) {
                this.showControls(container);
            }
        });

        container.addEventListener('mouseleave', () => {
            if (!video.paused) {
                this.hideControlsTemporarily(container);
            }
        });
    }

    playVideo(video) {
        video.play().then(() => {
            this.startVideoAnimation(video);
            this.playVideoSound();
        }).catch(err => {
            console.warn('Video play failed:', err);
        });
    }

    pauseVideo(video) {
        video.pause();
        this.stopVideoAnimation(video);
        this.pauseVideoSound();
    }

    startVideoAnimation(video) {
        const container = video.closest('.portfolio-item');
        
        // Subtle breathing animation
        gsap.to(container, {
            scale: 1.02,
            duration: 2,
            ease: "power2.inOut",
            repeat: -1,
            yoyo: true
        });
    }

    stopVideoAnimation(video) {
        const container = video.closest('.portfolio-item');
        gsap.killTweensOf(container);
        gsap.to(container, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out"
        });
    }

    // Audio Controller for Ambient Sounds
    initAudioController() {
        this.audioContext = null;
        this.ambientSound = null;
        this.soundEnabled = false;
        this.createAudioUI();
    }

    createAudioUI() {
        const audioToggle = document.createElement('button');
        audioToggle.id = 'audioToggle';
        audioToggle.className = 'audio-toggle';
        audioToggle.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="audio-label">Ambient Sound</span>
        `;
        
        document.body.appendChild(audioToggle);
        this.setupAudioToggle(audioToggle);
    }

    setupAudioToggle(toggle) {
        toggle.addEventListener('click', () => {
            this.toggleAmbientAudio();
        });

        // Add hover effect
        toggle.addEventListener('mouseenter', () => {
            if (!this.soundEnabled) {
                this.playHoverSound();
            }
        });
    }

    toggleAmbientAudio() {
        this.soundEnabled = !this.soundEnabled;
        const toggle = document.getElementById('audioToggle');
        
        if (this.soundEnabled) {
            this.startAmbientAudio();
            toggle.classList.add('active');
            this.playUISound();
        } else {
            this.stopAmbientAudio();
            toggle.classList.remove('active');
        }
    }

    startAmbientAudio() {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            // Create subtle ambient sound using Web Audio API
            this.createAmbientTone();
            
        } catch (err) {
            console.warn('Audio context not available:', err);
        }
    }

    stopAmbientAudio() {
        if (this.ambientSound) {
            this.ambientSound.stop();
            this.ambientSound = null;
        }
    }

    createAmbientTone() {
        // Create a very subtle ambient tone
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(110, this.audioContext.currentTime); // Low A note
        gainNode.gain.setValueAtTime(0.001, this.audioContext.currentTime); // Very quiet
        
        oscillator.start();
        this.ambientSound = oscillator;
        
        // Fade in gradually
        gainNode.gain.linearRampToValueAtTime(0.003, this.audioContext.currentTime + 2);
    }

    playHoverSound() {
        if (!this.soundEnabled) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.2);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.2);
        } catch (err) {
            // Silent fail if audio context not available
        }
    }

    playVideoSound() {
        if (!this.soundEnabled) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.002, this.audioContext.currentTime + 0.1);
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.3);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.3);
        } catch (err) {
            // Silent fail
        }
    }

    pauseVideoSound() {
        if (!this.soundEnabled) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(330, this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.001, this.audioContext.currentTime + 0.05);
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.15);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.15);
        } catch (err) {
            // Silent fail
        }
    }

    playUISound() {
        if (!this.soundEnabled) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.001, this.audioContext.currentTime + 0.05);
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.2);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.2);
        } catch (err) {
            // Silent fail
        }
    }

    // Touch interactions for mobile
    initTouchInteractions() {
        const items = document.querySelectorAll('.portfolio-item');
        
        items.forEach(item => {
            let touchTimeout;
            
            item.addEventListener('touchstart', (e) => {
                touchTimeout = setTimeout(() => {
                    this.animatePortfolioEnter(
                        item,
                        item.querySelector('.portfolio-media'),
                        item.querySelector('.portfolio-overlay'),
                        item.querySelector('.portfolio-title'),
                        item.querySelector('.portfolio-description'),
                        item.querySelector('.portfolio-metadata'),
                        item.querySelector('.portfolio-actions')
                    );
                }, 300);
            });
            
            item.addEventListener('touchend', (e) => {
                clearTimeout(touchTimeout);
                
                if (Date.now() - e.timeStamp < 300) {
                    // Short tap - treat as click
                    this.handlePortfolioClick(item, e);
                } else {
                    // Long tap - show hover effect briefly
                    setTimeout(() => {
                        this.animatePortfolioExit(
                            item,
                            item.querySelector('.portfolio-media'),
                            item.querySelector('.portfolio-overlay'),
                            item.querySelector('.portfolio-title'),
                            item.querySelector('.portfolio-description'),
                            item.querySelector('.portfolio-metadata'),
                            item.querySelector('.portfolio-actions')
                        );
                    }, 1000);
                }
            });
            
            item.addEventListener('touchmove', () => {
                clearTimeout(touchTimeout);
            });
        });
    }

    // Asset preloading for performance
    preloadAssets() {
        const videos = document.querySelectorAll('.portfolio-video');
        
        videos.forEach(video => {
            video.preload = 'metadata';
            
            // Preload first few seconds
            video.addEventListener('loadedmetadata', () => {
                if (video.duration > 5) {
                    video.currentTime = Math.min(5, video.duration * 0.1);
                }
            });
        });
    }

    // Intersection Observer for performance
    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const video = entry.target.querySelector('video');
                    if (video && video.paused) {
                        video.play().catch(err => {
                            console.warn('Autoplay prevented:', err);
                        });
                    }
                } else {
                    const video = entry.target.querySelector('video');
                    if (video && !video.paused) {
                        video.pause();
                    }
                }
            });
        }, {
            threshold: 0.5
        });

        document.querySelectorAll('.portfolio-item').forEach(item => {
            observer.observe(item);
        });
    }

    // Particle effects for hover
    createHoverParticles(container) {
        for (let i = 0; i < 5; i++) {
            const particle = document.createElement('div');
            particle.className = 'hover-particle';
            particle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: rgba(59, 130, 246, 0.6);
                border-radius: 50%;
                pointer-events: none;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                z-index: 10;
            `;
            
            container.appendChild(particle);
            
            gsap.fromTo(particle, {
                opacity: 0,
                scale: 0
            }, {
                opacity: 1,
                scale: 1,
                duration: 0.2,
                delay: i * 0.05,
                onComplete: () => {
                    gsap.to(particle, {
                        y: -20,
                        opacity: 0,
                        duration: 1,
                        ease: "power2.out",
                        onComplete: () => particle.remove()
                    });
                }
            });
        }
    }

    removeHoverParticles(container) {
        const particles = container.querySelectorAll('.hover-particle');
        particles.forEach(particle => {
            gsap.to(particle, {
                opacity: 0,
                scale: 0,
                duration: 0.2,
                onComplete: () => particle.remove()
            });
        });
    }

    // Handle portfolio item clicks
    handlePortfolioClick(item, e) {
        const video = item.querySelector('video');
        const isVideo = video && !video.paused;
        
        if (isVideo) {
            // Pause video
            this.pauseVideo(video);
            this.showControls(item);
        } else {
            // Open fullscreen lightbox
            this.openFullscreenView(item);
        }
    }

    // Fullscreen lightbox functionality
    openFullscreenView(item) {
        const video = item.querySelector('video');
        const image = item.querySelector('img');
        const title = item.querySelector('.portfolio-title')?.textContent || 'Artwork';
        
        // Create fullscreen overlay
        const overlay = document.createElement('div');
        overlay.className = 'fullscreen-overlay';
        overlay.innerHTML = `
            <div class="fullscreen-container">
                <div class="fullscreen-media">
                    ${video ? `
                        <video src="${video.src}" autoplay loop muted playsinline class="fullscreen-video"></video>
                    ` : `
                        <img src="${image.src}" alt="${title}" class="fullscreen-image">
                    `}
                </div>
                <div class="fullscreen-controls">
                    <button class="fs-close" aria-label="Close fullscreen">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                    <div class="fs-info">
                        <h3>${title}</h3>
                        <div class="fs-metadata">
                            <span class="fs-category">Animation</span>
                            <span class="fs-date">${new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Animate in
        gsap.fromTo(overlay, {
            opacity: 0
        }, {
            opacity: 1,
            duration: 0.3,
            ease: "power2.out"
        });
        
        gsap.fromTo(overlay.querySelector('.fullscreen-container'), {
            scale: 0.8,
            opacity: 0
        }, {
            scale: 1,
            opacity: 1,
            duration: 0.4,
            ease: "back.out(1.7)"
        });
        
        // Setup controls
        const closeBtn = overlay.querySelector('.fs-close');
        closeBtn.addEventListener('click', () => this.closeFullscreenView(overlay));
        
        // Escape key to close
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeFullscreenView(overlay);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
        
        // Click outside to close
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeFullscreenView(overlay);
            }
        });
        
        this.playUISound();
    }

    closeFullscreenView(overlay) {
        gsap.to(overlay, {
            opacity: 0,
            duration: 0.3,
            ease: "power2.in",
            onComplete: () => {
                overlay.remove();
            }
        });
        
        this.playUISound();
    }

    // Utility methods for video controls
    showVideoLoader(container) {
        const loader = container.querySelector('.video-loader') || 
                      document.createElement('div');
        loader.className = 'video-loader';
        loader.innerHTML = `
            <div class="loader-spinner"></div>
            <span>Loading...</span>
        `;
        
        if (!container.querySelector('.video-loader')) {
            container.appendChild(loader);
        }
        
        gsap.fromTo(loader, {
            opacity: 0,
            scale: 0.8
        }, {
            opacity: 1,
            scale: 1,
            duration: 0.3,
            ease: "back.out(1.7)"
        });
    }

    hideVideoLoader(container) {
        const loader = container.querySelector('.video-loader');
        if (loader) {
            gsap.to(loader, {
                opacity: 0,
                scale: 0.8,
                duration: 0.2,
                onComplete: () => loader.remove()
            });
        }
    }

    showControls(container) {
        const controls = container.querySelector('.portfolio-controls');
        if (controls) {
            gsap.to(controls, {
                opacity: 1,
                y: 0,
                duration: 0.3,
                ease: "power2.out"
            });
        }
    }

    hideControlsTemporarily(container) {
        const controls = container.querySelector('.portfolio-controls');
        if (controls) {
            setTimeout(() => {
                gsap.to(controls, {
                    opacity: 0,
                    y: 10,
                    duration: 0.3,
                    ease: "power2.in"
                });
            }, 2000);
        }
    }

    setupProgressBar(progressBar, video) {
        let isDragging = false;
        
        const updateProgress = () => {
            if (!isDragging && video.duration) {
                const progress = (video.currentTime / video.duration) * 100;
                progressBar.style.width = `${progress}%`;
            }
        };
        
        video.addEventListener('timeupdate', updateProgress);
        
        progressBar.addEventListener('mousedown', () => {
            isDragging = true;
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
            }
        });
        
        progressBar.addEventListener('click', (e) => {
            const rect = progressBar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const newTime = (clickX / rect.width) * video.duration;
            video.currentTime = newTime;
        });
    }
    
    toggleVolume(video, button) {
        // Keep all portfolio videos silent by design. The volume control
        // becomes a visual affordance only and will not unmute audio.
        video.muted = true;
        if (button) {
            button.classList.add('muted');
        }
    }

    toggleFullscreen(video) {
        if (video.requestFullscreen) {
            video.requestFullscreen();
        } else if (video.webkitRequestFullscreen) {
            video.webkitRequestFullscreen();
        } else if (video.msRequestFullscreen) {
            video.msRequestFullscreen();
        }
    }
}

// Initialize enhanced animations
const enhancedAnimationController = new EnhancedAnimationController();

// Global export
window.EnhancedAnimationController = EnhancedAnimationController;
window.enhancedAnimationController = enhancedAnimationController;