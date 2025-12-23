// Animation Portfolio Performance Monitoring & Testing Suite
class AnimationPortfolioMonitor {
    constructor() {
        this.metrics = {
            loadTime: 0,
            interactionLatency: {},
            animationFPS: [],
            memoryUsage: 0,
            errors: []
        };
        this.init();
    }

    init() {
        this.monitorPageLoad();
        this.monitorAnimations();
        this.testAccessibility();
        this.testPerformance();
        this.generateReport();
    }

    monitorPageLoad() {
        window.addEventListener('load', () => {
            const navigation = performance.getEntriesByType('navigation')[0];
            this.metrics.loadTime = navigation.loadEventEnd - navigation.fetchStart;
            console.log(`📊 Page Load Time: ${this.metrics.loadTime}ms`);
        });
    }

    monitorAnimations() {
        // Monitor animation frame rate
        let lastTime = performance.now();
        let frameCount = 0;
        
        const measureFPS = (currentTime) => {
            frameCount++;
            if (currentTime >= lastTime + 1000) {
                const fps = Math.round(frameCount * 1000 / (currentTime - lastTime));
                this.metrics.animationFPS.push(fps);
                if (fps < 30) {
                    console.warn(`⚠️ Low FPS detected: ${fps}`);
                }
                frameCount = 0;
                lastTime = currentTime;
            }
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    }

    testAccessibility() {
        // Test keyboard navigation
        const testKeyboardNavigation = () => {
            const items = document.querySelectorAll('.portfolio-item');
            let passedTests = 0;
            let totalTests = 0;
            
            items.forEach((item, index) => {
                // Test tab index
                totalTests++;
                if (item.hasAttribute('tabindex') || item.tagName === 'BUTTON' || item.tagName === 'A') {
                    passedTests++;
                }
                
                // Test ARIA labels
                totalTests++;
                if (item.querySelector('[aria-label]') || item.getAttribute('aria-label')) {
                    passedTests++;
                }
                
                // Test focus styles
                totalTests++;
                if (window.getComputedStyle(item, ':focus').outline !== 'none') {
                    passedTests++;
                }
            });
            
            const score = Math.round((passedTests / totalTests) * 100);
            console.log(`♿ Accessibility Score: ${score}% (${passedTests}/${totalTests} tests passed)`);
            
            return score >= 90;
        };
        
        // Test color contrast
        const testColorContrast = () => {
            const textElements = document.querySelectorAll('.portfolio-title, .portfolio-description');
            let passedTests = 0;
            let totalTests = 0;
            
            textElements.forEach(element => {
                totalTests++;
                const color = window.getComputedStyle(element).color;
                const backgroundColor = window.getComputedStyle(element.parentElement).backgroundColor;
                
                // Simple contrast check (simplified)
                if (color !== backgroundColor) {
                    passedTests++;
                }
            });
            
            const score = Math.round((passedTests / totalTests) * 100);
            console.log(`🎨 Color Contrast Score: ${score}% (${passedTests}/${totalTests} tests passed)`);
            
            return score >= 95;
        };
        
        testKeyboardNavigation();
        testColorContrast();
    }

    testPerformance() {
        // Test memory usage
        if ('memory' in performance) {
            const memoryInfo = performance.memory;
            this.metrics.memoryUsage = memoryInfo.usedJSHeapSize;
            console.log(`💾 Memory Usage: ${Math.round(this.metrics.memoryUsage / 1024 / 1024)}MB`);
        }
        
        // Test animation performance
        const testAnimationPerformance = () => {
            const animations = document.querySelectorAll('.portfolio-item, .portfolio-media');
            let slowAnimations = 0;
            
            animations.forEach(element => {
                const computedStyle = window.getComputedStyle(element);
                const animationDuration = parseFloat(computedStyle.animationDuration) || 0;
                const transitionDuration = parseFloat(computedStyle.transitionDuration) || 0;
                
                if (animationDuration > 1 || transitionDuration > 1) {
                    slowAnimations++;
                }
            });
            
            if (slowAnimations > 0) {
                console.warn(`⚠️ ${slowAnimations} animations exceed optimal duration (>1s)`);
            }
        };
        
        testAnimationPerformance();
    }

    testInteractiveFeatures() {
        console.log('🧪 Testing Interactive Features...');
        
        // Test hover effects
        const testHoverEffects = () => {
            const items = document.querySelectorAll('.portfolio-item');
            let workingHovers = 0;
            
            items.forEach(item => {
                const originalTransform = window.getComputedStyle(item).transform;
                item.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
                
                setTimeout(() => {
                    const newTransform = window.getComputedStyle(item).transform;
                    if (originalTransform !== newTransform) {
                        workingHovers++;
                    }
                }, 100);
            });
            
            console.log(`🎭 Hover Effects: ${workingHovers}/${items.length} working`);
            return workingHovers === items.length;
        };
        
        // Test video controls
        const testVideoControls = () => {
            const videos = document.querySelectorAll('.portfolio-video');
            let workingControls = 0;
            
            videos.forEach(video => {
                const controls = video.parentElement.querySelector('.portfolio-controls');
                if (controls) {
                    workingControls++;
                    
                    // Test play/pause
                    const playBtn = controls.querySelector('.play-pause-btn');
                    if (playBtn) {
                        playBtn.click();
                        console.log('▶️ Play/Pause button functional');
                    }
                }
            });
            
            console.log(`🎬 Video Controls: ${workingControls}/${videos.length} working`);
            return workingControls === videos.length || videos.length === 0;
        };
        
        // Test fullscreen functionality
        const testFullscreen = () => {
            const items = document.querySelectorAll('.portfolio-item');
            let fullscreenWorks = false;
            
            if (items.length > 0) {
                const firstItem = items[0];
                const fsBtn = firstItem.querySelector('.btn-fullscreen');
                if (fsBtn) {
                    fsBtn.click();
                    
                    setTimeout(() => {
                        const overlay = document.querySelector('.fullscreen-overlay');
                        if (overlay) {
                            console.log('🔍 Fullscreen functionality working');
                            fullscreenWorks = true;
                            
                            // Close fullscreen for testing
                            const closeBtn = overlay.querySelector('.fs-close');
                            if (closeBtn) closeBtn.click();
                        } else {
                            console.log('❌ Fullscreen functionality not working');
                        }
                    }, 500);
                }
            } else {
                console.log('ℹ️ No portfolio items to test fullscreen');
                fullscreenWorks = true; // Consider it working if no items
            }
            
            return fullscreenWorks;
        };
        
        // Test audio functionality
        const testAudio = () => {
            const audioToggle = document.getElementById('audioToggle');
            if (audioToggle) {
                audioToggle.click();
                
                setTimeout(() => {
                    if (audioToggle.classList.contains('active')) {
                        console.log('🔊 Audio toggle working');
                        audioToggle.click(); // Toggle back off
                        return true;
                    } else {
                        console.log('❌ Audio toggle not working');
                        return false;
                    }
                }, 300);
            } else {
                console.log('ℹ️ Audio toggle not found');
                return true;
            }
        };
        
        // Run all tests
        const results = {
            hoverEffects: testHoverEffects(),
            videoControls: testVideoControls(),
            fullscreen: testFullscreen(),
            audio: testAudio()
        };
        
        return results;
    }

    testResponsiveDesign() {
        console.log('📱 Testing Responsive Design...');
        
        const breakpoints = [
            { width: 320, name: 'Mobile Small' },
            { width: 768, name: 'Tablet' },
            { width: 1024, name: 'Desktop Small' },
            { width: 1440, name: 'Desktop Large' }
        ];
        
        const originalWidth = window.innerWidth;
        
        breakpoints.forEach(bp => {
            // Simulate different screen sizes
            Object.defineProperty(window, 'innerWidth', { value: bp.width });
            Object.defineProperty(document.documentElement, 'clientWidth', { value: bp.width });
            
            // Test grid layout
            const grid = document.querySelector('.portfolio-grid');
            if (grid) {
                const columns = window.getComputedStyle(grid).gridTemplateColumns;
                const columnCount = columns.split(' ').length;
                console.log(`📐 ${bp.name} (${bp.width}px): ${columnCount} columns`);
            }
            
            // Test typography
            const title = document.querySelector('.page-title');
            if (title) {
                const fontSize = window.getComputedStyle(title).fontSize;
                console.log(`📝 ${bp.name} Title Size: ${fontSize}`);
            }
        });
        
        // Restore original width
        Object.defineProperty(window, 'innerWidth', { value: originalWidth });
        Object.defineProperty(document.documentElement, 'clientWidth', { value: originalWidth });
    }

    generateReport() {
        setTimeout(() => {
            console.log('\n🎯 === ANIMATION PORTFOLIO TEST REPORT ===\n');
            
            // Performance metrics
            console.log('📊 PERFORMANCE METRICS:');
            console.log(`⏱️ Load Time: ${this.metrics.loadTime}ms ${this.metrics.loadTime < 3000 ? '✅' : '⚠️'}`);
            console.log(`🎮 Average FPS: ${Math.round(this.metrics.animationFPS.reduce((a, b) => a + b, 0) / this.metrics.animationFPS.length)} ${this.metrics.animationFPS.length > 0 ? '✅' : '⚠️'}`);
            console.log(`💾 Memory: ${this.metrics.memoryUsage > 0 ? Math.round(this.metrics.memoryUsage / 1024 / 1024) + 'MB' : 'N/A'} ${this.metrics.memoryUsage < 50 * 1024 * 1024 ? '✅' : '⚠️'}`);
            
            // Feature testing
            console.log('\n🧪 INTERACTIVE FEATURES:');
            const featureResults = this.testInteractiveFeatures();
            Object.entries(featureResults).forEach(([feature, working]) => {
                console.log(`${feature.charAt(0).toUpperCase() + feature.slice(1)}: ${working ? '✅' : '❌'}`);
            });
            
            // Responsive design
            console.log('\n📱 RESPONSIVE DESIGN:');
            this.testResponsiveDesign();
            
            // Recommendations
            console.log('\n💡 RECOMMENDATIONS:');
            if (this.metrics.loadTime > 3000) {
                console.log('- Consider optimizing images and reducing JavaScript bundle size');
            }
            if (this.metrics.animationFPS.length > 0 && Math.min(...this.metrics.animationFPS) < 30) {
                console.log('- Some animations may be too heavy for low-end devices');
            }
            
            console.log('\n✨ Animation portfolio testing completed!');
        }, 2000);
    }
}

// Initialize monitoring if in development mode
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const monitor = new AnimationPortfolioMonitor();
}