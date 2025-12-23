// Advanced Lottie Animation Integration for Portfolio
class LottiePortfolioIntegration {
    constructor() {
        this.animations = new Map();
        this.lottieInstances = new Map();
        this.init();
    }

    init() {
        this.loadLottieLibrary();
        this.createLottieUI();
        this.setupPortfolioAnimations();
        this.setupIntersectionObserver();
    }

    async loadLottieLibrary() {
        if (typeof lottie !== 'undefined') return;
        
        // Load Lottie library dynamically
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js';
        
        return new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    createLottieUI() {
        // Create Lottie animation controls
        this.lottieContainer = document.createElement('div');
        this.lottieContainer.className = 'lottie-portfolio-container';
        this.lottieContainer.innerHTML = `
            <div class="lottie-hero">
                <div id="hero-lottie" class="hero-animation"></div>
                <div class="lottie-overlay">
                    <h2>Interactive Animation Portfolio</h2>
                    <p>Powered by advanced motion graphics and interactive storytelling</p>
                    <div class="lottie-controls">
                        <button class="lottie-toggle" data-animation="hero">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Animated
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .lottie-portfolio-container {
                position: relative;
                width: 100%;
                min-height: 400px;
                margin: 2rem 0;
                border-radius: 20px;
                overflow: hidden;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            }

            .lottie-hero {
                position: relative;
                height: 100%;
                min-height: 400px;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
            }

            .hero-animation {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 1;
            }

            .lottie-overlay {
                position: relative;
                z-index: 2;
                text-align: center;
                color: white;
                padding: 2rem;
                background: rgba(0, 0, 0, 0.3);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                margin: 2rem;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .lottie-overlay h2 {
                font-size: clamp(2rem, 4vw, 3rem);
                font-weight: 800;
                margin-bottom: 1rem;
                background: linear-gradient(135deg, #ffffff, #f0f0f0);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }

            .lottie-overlay p {
                font-size: 1.2rem;
                margin-bottom: 2rem;
                opacity: 0.9;
                max-width: 600px;
                margin-left: auto;
                margin-right: auto;
            }

            .lottie-controls {
                display: flex;
                gap: 1rem;
                justify-content: center;
            }

            .lottie-toggle {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.75rem 1.5rem;
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 50px;
                color: white;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
            }

            .lottie-toggle:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
            }

            .lottie-toggle svg {
                width: 20px;
                height: 20px;
            }

            @media (max-width: 768px) {
                .lottie-overlay {
                    margin: 1rem;
                    padding: 1.5rem;
                }
                
                .lottie-controls {
                    flex-direction: column;
                    align-items: center;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    setupPortfolioAnimations() {
        // Create floating particles around portfolio items
        this.createFloatingParticles();
        
        // Add Lottie loading animations to portfolio items
        this.addLottieToPortfolioItems();
        
        // Setup interactive Lottie elements
        this.setupInteractiveElements();
    }

    createFloatingParticles() {
        const particleContainer = document.createElement('div');
        particleContainer.className = 'floating-particles';
        particleContainer.innerHTML = `
            <canvas id="particles-canvas"></canvas>
        `;
        
        // Add particles styles
        const style = document.createElement('style');
        style.textContent = `
            .floating-particles {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: -1;
                opacity: 0.6;
            }

            #particles-canvas {
                width: 100%;
                height: 100%;
            }
        `;
        
        document.head.appendChild(particleContainer);
        document.head.appendChild(style);
        this.initParticleAnimation();
    }

    initParticleAnimation() {
        const canvas = document.getElementById('particles-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        let particles = [];
        
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // Create particles
        for (let i = 0; i < 50; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 3 + 1,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
        
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            particles.forEach(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                
                if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
                if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
                
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(59, 130, 246, ${particle.opacity})`;
                ctx.fill();
            });
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    addLottieToPortfolioItems() {
        // Add subtle Lottie animations to portfolio items
        const portfolioItems = document.querySelectorAll('.portfolio-item');
        
        portfolioItems.forEach((item, index) => {
            // Add loading Lottie animation
            const loader = document.createElement('div');
            loader.className = 'lottie-loader';
            loader.innerHTML = '<div class="lottie-loading"></div>';
            
            item.appendChild(loader);
            
            // Style the loader
            loader.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 10;
                display: none;
            `;
        });
    }

    setupInteractiveElements() {
        // Setup interactive Lottie elements
        const lottieToggle = document.querySelector('.lottie-toggle');
        if (lottieToggle) {
            lottieToggle.addEventListener('click', () => {
                this.toggleHeroAnimation();
            });
        }
        
        // Add hover animations to portfolio items
        this.setupPortfolioHoverAnimations();
    }

    async toggleHeroAnimation() {
        if (!this.lottieInstances.has('hero')) {
            // Create hero Lottie animation
            const heroContainer = document.getElementById('hero-lottie');
            if (!heroContainer) return;
            
            try {
                // Create a simple hero animation data structure
                const heroAnimationData = {
                    v: "5.7.4",
                    fr: 30,
                    ip: 0,
                    op: 90,
                    w: 400,
                    h: 400,
                    nm: "Hero Animation",
                    ddd: 0,
                    assets: [],
                    layers: [
                        {
                            ddd: 0,
                            ind: 1,
                            ty: 4,
                            nm: "Circle",
                            sr: 1,
                            ks: {
                                o: { a: 0, k: 100 },
                                r: { a: 1, k: [{ i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 0, s: [0] }, { i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 45, s: [360] }, { t: 90, s: [360] }] },
                                p: { a: 0, k: [200, 200, 0] },
                                a: { a: 0, k: [0, 0, 0] },
                                s: { a: 0, k: [100, 100, 100] }
                            },
                            ao: 0,
                            shapes: [
                                {
                                    ty: "gr",
                                    it: [
                                        {
                                            ind: 0,
                                            ty: "sh",
                                            ks: {
                                                a: 0,
                                                k: {
                                                    i: [[0, -60], [60, 0], [0, 60], [-60, 0]],
                                                    o: [[0, 60], [-60, 0], [0, -60], [60, 0]],
                                                    v: [[0, -60], [60, 0], [0, 60], [-60, 0]],
                                                    c: true
                                                }
                                            }
                                        },
                                        {
                                            ind: 1,
                                            ty: "st",
                                            o: { a: 0, k: 100 },
                                            w: { a: 0, k: 8 },
                                            c: { a: 0, k: [0.043, 0.475, 1] }
                                        }
                                    ]
                                }
                            ],
                            ip: 0,
                            op: 90,
                            st: 0,
                            bm: 0
                        }
                    ]
                };
                
                // Create simplified animation using GSAP instead of Lottie
                const heroLottie = this.createGSAPAnimation();
                this.lottieInstances.set('hero', heroLottie);
                
            } catch (error) {
                console.warn('Lottie animation failed, using fallback GSAP animation:', error);
                const fallbackAnimation = this.createGSAPAnimation();
                this.lottieInstances.set('hero', fallbackAnimation);
            }
        } else {
            // Toggle existing animation
            const animation = this.lottieInstances.get('hero');
            if (animation.isPlaying) {
                animation.pause();
            } else {
                animation.play();
            }
        }
    }

    createGSAPAnimation() {
        // Create a GSAP-based animation as Lottie fallback
        const canvas = document.getElementById('hero-lottie');
        if (!canvas) return null;
        
        canvas.innerHTML = '<canvas width="400" height="400" style="width: 100%; height: 100%;"></canvas>';
        const ctx = canvas.querySelector('canvas').getContext('2d');
        
        let isPlaying = false;
        let animationTime = 0;
        
        const draw = () => {
            ctx.clearRect(0, 0, 400, 400);
            
            // Draw animated circle
            ctx.beginPath();
            ctx.arc(200, 200, 80 + Math.sin(animationTime * 0.1) * 20, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
            ctx.lineWidth = 4;
            ctx.stroke();
            
            // Draw rotating lines
            for (let i = 0; i < 8; i++) {
                const angle = (animationTime * 0.05) + (i * Math.PI / 4);
                const x1 = 200 + Math.cos(angle) * 100;
                const y1 = 200 + Math.sin(angle) * 100;
                const x2 = 200 + Math.cos(angle + 0.5) * 120;
                const y2 = 200 + Math.sin(angle + 0.5) * 120;
                
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.strokeStyle = `rgba(11, 121, 255, ${0.8 - i * 0.1})`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            
            animationTime++;
        };
        
        const animate = () => {
            if (isPlaying) {
                draw();
                requestAnimationFrame(animate);
            }
        };
        
        return {
            play() {
                isPlaying = true;
                animate();
            },
            pause() {
                isPlaying = false;
            },
            isPlaying
        };
    }

    setupPortfolioHoverAnimations() {
        const portfolioItems = document.querySelectorAll('.portfolio-item');
        
        portfolioItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                this.animatePortfolioItemHover(item, true);
            });
            
            item.addEventListener('mouseleave', () => {
                this.animatePortfolioItemHover(item, false);
            });
        });
    }

    animatePortfolioItemHover(item, isHovering) {
        // Add subtle particle burst on hover
        if (isHovering) {
            this.createParticleBurst(item);
        }
        
        // Animate the media
        const media = item.querySelector('.portfolio-media');
        if (media && window.gsap) {
            gsap.to(media, {
                scale: isHovering ? 1.05 : 1,
                rotation: isHovering ? 2 : 0,
                duration: 0.4,
                ease: "back.out(1.7)"
            });
        }
    }

    createParticleBurst(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                width: 4px;
                height: 4px;
                background: linear-gradient(45deg, #0B79FF, #F59E0B);
                border-radius: 50%;
                pointer-events: none;
                left: ${centerX}px;
                top: ${centerY}px;
                z-index: 1000;
                box-shadow: 0 0 10px rgba(11, 121, 255, 0.5);
            `;
            
            document.body.appendChild(particle);
            
            // Animate particle burst
            const angle = (i / 8) * Math.PI * 2;
            const distance = 100;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            
            if (window.gsap) {
                gsap.to(particle, {
                    x: x - centerX,
                    y: y - centerY,
                    scale: 0,
                    opacity: 0,
                    duration: 0.8,
                    ease: "power2.out",
                    onComplete: () => particle.remove()
                });
            }
        }
    }

    setupIntersectionObserver() {
        // Initialize animations when elements come into view
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElementIn(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        // Observe Lottie elements
        document.querySelectorAll('.lottie-portfolio-container, .portfolio-item').forEach(el => {
            observer.observe(el);
        });
    }

    animateElementIn(element) {
        if (window.gsap) {
            gsap.fromTo(element, {
                opacity: 0,
                y: 50,
                scale: 0.9
            }, {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.8,
                ease: "back.out(1.7)"
            });
        }
    }

    destroy() {
        // Clean up animations
        this.lottieInstances.forEach(instance => {
            if (instance.pause) instance.pause();
        });
        this.lottieInstances.clear();
        
        // Remove event listeners
        const canvas = document.getElementById('particles-canvas');
        if (canvas) {
            window.removeEventListener('resize', canvas.resize);
        }
    }
}

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.lottiePortfolio = new LottiePortfolioIntegration();
    });
} else {
    window.lottiePortfolio = new LottiePortfolioIntegration();
}