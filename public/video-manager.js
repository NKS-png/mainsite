// Video Manager - Handles video autoplay, loop, and mobile behavior
class VideoManager {
    constructor() {
        this.videos = new Map();
        this.init();
    }

    init() {
        this.setupVideoObservers();
        this.handleAutoplayRestrictions();
    }

    setupVideoObservers() {
        // Intersection Observer for lazy loading and autoplay
        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;

                if (entry.isIntersecting) {
                    this.handleVideoInView(video);
                } else {
                    this.handleVideoOutOfView(video);
                }
            });
        }, {
            rootMargin: '50px',
            threshold: 0.1
        });

        // Observe all videos
        document.querySelectorAll('video').forEach(video => {
            videoObserver.observe(video);
            this.videos.set(video, {
                observer: videoObserver,
                hasPlayed: false,
                isInView: false
            });
        });
    }

    handleVideoInView(video) {
        const videoData = this.videos.get(video);
        if (!videoData) return;

        videoData.isInView = true;

        // Ensure video is properly configured
        this.configureVideo(video);

        // Try to play if not already playing
        if (video.paused && !videoData.hasPlayed) {
            this.attemptPlay(video);
        }
    }

    handleVideoOutOfView(video) {
        const videoData = this.videos.get(video);
        if (!videoData) return;

        videoData.isInView = false;

        // Pause video when out of view to save bandwidth
        if (!video.paused) {
            video.pause();
        }
    }

    configureVideo(video) {
        // Ensure proper attributes for autoplay
        video.muted = true;
        video.playsInline = true;
        video.preload = 'metadata';

        // Add error handling
        video.addEventListener('error', (e) => {
            console.warn('Video failed to load:', e);
            this.handleVideoError(video);
        });

        // Add loadeddata handler
        video.addEventListener('loadeddata', () => {
            this.handleVideoLoaded(video);
        });

        // Add ended handler for seamless loop
        video.addEventListener('ended', () => {
            this.handleVideoEnded(video);
        });

        // Add play/pause handlers
        video.addEventListener('play', () => {
            const videoData = this.videos.get(video);
            if (videoData) {
                videoData.hasPlayed = true;
            }
        });
    }

    async attemptPlay(video) {
        try {
            // Check if autoplay is allowed
            const playPromise = video.play();

            if (playPromise !== undefined) {
                await playPromise;
                console.log('Video started playing successfully');
            }
        } catch (error) {
            console.warn('Autoplay failed:', error.message);

            // Show play button overlay for user interaction
            this.showPlayOverlay(video);

            // Try again on user interaction
            const playOnInteraction = () => {
                this.attemptPlay(video);
                document.removeEventListener('click', playOnInteraction);
                document.removeEventListener('touchstart', playOnInteraction);
            };

            document.addEventListener('click', playOnInteraction, { once: true });
            document.addEventListener('touchstart', playOnInteraction, { once: true });
        }
    }

    showPlayOverlay(video) {
        // Remove existing overlay
        const existingOverlay = video.parentElement.querySelector('.video-play-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        // Create play button overlay
        const overlay = document.createElement('div');
        overlay.className = 'video-play-overlay';
        overlay.innerHTML = `
            <button class="video-play-btn" aria-label="Play video">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="rgba(0,0,0,0.7)" stroke="white" stroke-width="2"/>
                    <path d="M8 9.5L16 12L8 14.5V9.5Z" fill="white"/>
                </svg>
            </button>
        `;

        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.3);
            cursor: pointer;
            z-index: 10;
        `;

        const playBtn = overlay.querySelector('.video-play-btn');
        playBtn.style.cssText = `
            background: none;
            border: none;
            cursor: pointer;
            padding: 12px;
            border-radius: 50%;
            transition: transform 0.2s;
        `;

        playBtn.addEventListener('mouseenter', () => {
            playBtn.style.transform = 'scale(1.1)';
        });

        playBtn.addEventListener('mouseleave', () => {
            playBtn.style.transform = 'scale(1)';
        });

        overlay.addEventListener('click', () => {
            this.attemptPlay(video);
            overlay.remove();
        });

        video.parentElement.style.position = 'relative';
        video.parentElement.appendChild(overlay);
    }

    handleVideoLoaded(video) {
        console.log('Video loaded successfully');

        // Hide poster/loading state if any
        const poster = video.parentElement.querySelector('.video-poster');
        if (poster) {
            poster.style.opacity = '0';
            setTimeout(() => poster.remove(), 300);
        }
    }

    handleVideoEnded(video) {
        // Ensure seamless loop by resetting time and playing again
        video.currentTime = 0;

        // Small delay to prevent stuttering
        setTimeout(() => {
            if (this.videos.get(video)?.isInView) {
                video.play().catch(() => {
                    // If play fails, show overlay again
                    this.showPlayOverlay(video);
                });
            }
        }, 10);
    }

    handleVideoError(video) {
        console.error('Video error occurred');

        // Show fallback content
        const fallback = document.createElement('div');
        fallback.className = 'video-fallback';
        fallback.innerHTML = `
            <div style="
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--text-secondary);
                font-size: 14px;
                text-align: center;
                padding: 20px;
            ">
                <div>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin: 0 auto 12px; opacity: 0.5;">
                        <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
                        <path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    Video unavailable
                </div>
            </div>
        `;

        video.parentElement.appendChild(fallback);
        video.style.display = 'none';
    }

    handleAutoplayRestrictions() {
        // Detect if autoplay is likely to be blocked
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

        if (isMobile || isIOS) {
            // On mobile/iOS, show play overlays by default
            document.querySelectorAll('video[autoplay]').forEach(video => {
                this.showPlayOverlay(video);
            });
        }

        // Listen for user interaction to enable autoplay
        const enableAutoplay = () => {
            document.querySelectorAll('video').forEach(video => {
                const overlay = video.parentElement.querySelector('.video-play-overlay');
                if (overlay && video.paused) {
                    // Try to play now that user has interacted
                    this.attemptPlay(video);
                }
            });
        };

        document.addEventListener('click', enableAutoplay, { once: true });
        document.addEventListener('touchstart', enableAutoplay, { once: true });
        document.addEventListener('keydown', enableAutoplay, { once: true });
    }

    // Public method to manually control video
    playVideo(videoElement) {
        this.attemptPlay(videoElement);
    }

    pauseVideo(videoElement) {
        if (videoElement && !videoElement.paused) {
            videoElement.pause();
        }
    }

    // Cleanup method
    destroy() {
        this.videos.forEach((data, video) => {
            if (data.observer) {
                data.observer.unobserve(video);
            }
        });
        this.videos.clear();
    }
}

// Global video manager
const videoManager = new VideoManager();

// Export for global use
window.VideoManager = VideoManager;
window.videoManager = videoManager;