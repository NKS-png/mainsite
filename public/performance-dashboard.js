// Advanced Performance Metrics Dashboard for Animation Portfolio
class PerformanceDashboard {
    constructor() {
        this.metrics = {
            fps: [],
            memoryUsage: [],
            loadTimes: [],
            interactionLatencies: [],
            errors: [],
            performance: {}
        };
        
        this.isVisible = false;
        this.updateInterval = null;
        this.init();
    }

    init() {
        this.createDashboardUI();
        this.startMonitoring();
        this.setupEventListeners();
    }

    createDashboardUI() {
        // Create dashboard container
        this.dashboard = document.createElement('div');
        this.dashboard.id = 'performance-dashboard';
        this.dashboard.className = 'performance-dashboard';
        this.dashboard.innerHTML = `
            <div class="dashboard-header">
                <h3>Performance Dashboard</h3>
                <div class="dashboard-controls">
                    <button class="dashboard-toggle" aria-label="Toggle dashboard">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </button>
                    <button class="dashboard-close" aria-label="Close dashboard">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
            </div>
            
            <div class="dashboard-content">
                <div class="metrics-grid">
                    <!-- Real-time FPS -->
                    <div class="metric-card">
                        <div class="metric-header">
                            <h4>FPS</h4>
                            <span class="metric-value" id="current-fps">60</span>
                        </div>
                        <div class="metric-chart">
                            <canvas id="fps-chart" width="200" height="80"></canvas>
                        </div>
                        <div class="metric-info">
                            <span class="metric-status" id="fps-status">Optimal</span>
                        </div>
                    </div>

                    <!-- Memory Usage -->
                    <div class="metric-card">
                        <div class="metric-header">
                            <h4>Memory</h4>
                            <span class="metric-value" id="current-memory">--</span>
                        </div>
                        <div class="metric-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" id="memory-progress"></div>
                            </div>
                        </div>
                        <div class="metric-info">
                            <span class="metric-status" id="memory-status">Normal</span>
                        </div>
                    </div>

                    <!-- Load Time -->
                    <div class="metric-card">
                        <div class="metric-header">
                            <h4>Load Time</h4>
                            <span class="metric-value" id="current-load">--</span>
                        </div>
                        <div class="metric-chart">
                            <canvas id="load-chart" width="200" height="80"></canvas>
                        </div>
                        <div class="metric-info">
                            <span class="metric-status" id="load-status">Fast</span>
                        </div>
                    </div>

                    <!-- Interaction Latency -->
                    <div class="metric-card">
                        <div class="metric-header">
                            <h4>Response</h4>
                            <span class="metric-value" id="current-latency">--</span>
                        </div>
                        <div class="metric-chart">
                            <canvas id="latency-chart" width="200" height="80"></canvas>
                        </div>
                        <div class="metric-info">
                            <span class="metric-status" id="latency-status">Responsive</span>
                        </div>
                    </div>
                </div>

                <!-- Performance Tests Panel -->
                <div class="tests-panel">
                    <h4>Performance Tests</h4>
                    <div class="tests-grid">
                        <button class="test-btn" data-test="accessibility">Accessibility</button>
                        <button class="test-btn" data-test="responsive">Responsive</button>
                        <button class="test-btn" data-test="animations">Animations</button>
                        <button class="test-btn" data-test="video">Video Performance</button>
                        <button class="test-btn" data-test="audio">Audio Performance</button>
                        <button class="test-btn" data-test="memory">Memory Usage</button>
                    </div>
                </div>

                <!-- Real-time Logs -->
                <div class="logs-panel">
                    <h4>Performance Logs</h4>
                    <div class="logs-container" id="performance-logs">
                        <div class="log-entry log-info">Performance monitoring started</div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.dashboard);
        this.styleDashboard();
        this.initCharts();
    }

    styleDashboard() {
        const style = document.createElement('style');
        style.textContent = `
            .performance-dashboard {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 400px;
                max-height: 80vh;
                background: rgba(0, 0, 0, 0.95);
                backdrop-filter: blur(20px);
                border-radius: 16px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: white;
                font-family: 'Inter', system-ui, sans-serif;
                z-index: 10000;
                transform: translateX(450px);
                transition: transform 0.3s ease;
                overflow: hidden;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
            }

            .performance-dashboard.visible {
                transform: translateX(0);
            }

            .dashboard-header {
                padding: 16px 20px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: rgba(255, 255, 255, 0.05);
            }

            .dashboard-header h3 {
                margin: 0;
                font-size: 14px;
                font-weight: 600;
                color: #0B79FF;
            }

            .dashboard-controls {
                display: flex;
                gap: 8px;
            }

            .dashboard-toggle,
            .dashboard-close {
                width: 32px;
                height: 32px;
                border: none;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                color: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }

            .dashboard-toggle:hover,
            .dashboard-close:hover {
                background: rgba(255, 255, 255, 0.2);
            }

            .dashboard-close {
                display: none;
            }

            .dashboard-content {
                padding: 16px;
                max-height: calc(80vh - 60px);
                overflow-y: auto;
            }

            .metrics-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin-bottom: 20px;
            }

            .metric-card {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                padding: 12px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .metric-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }

            .metric-header h4 {
                margin: 0;
                font-size: 11px;
                font-weight: 500;
                text-transform: uppercase;
                color: rgba(255, 255, 255, 0.7);
                letter-spacing: 0.5px;
            }

            .metric-value {
                font-size: 14px;
                font-weight: 700;
                color: #0B79FF;
            }

            .metric-chart {
                margin: 8px 0;
            }

            .metric-progress {
                margin: 8px 0;
            }

            .progress-bar {
                width: 100%;
                height: 4px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 2px;
                overflow: hidden;
            }

            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #10B981, #F59E0B, #EF4444);
                border-radius: 2px;
                transition: width 0.3s ease;
            }

            .metric-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .metric-status {
                font-size: 10px;
                font-weight: 500;
                padding: 2px 6px;
                border-radius: 4px;
                text-transform: uppercase;
            }

            .metric-status.optimal { background: rgba(16, 185, 129, 0.2); color: #10B981; }
            .metric-status.fast { background: rgba(16, 185, 129, 0.2); color: #10B981; }
            .metric-status.responsive { background: rgba(16, 185, 129, 0.2); color: #10B981; }
            .metric-status.normal { background: rgba(16, 185, 129, 0.2); color: #10B981; }
            .metric-status.warning { background: rgba(245, 158, 11, 0.2); color: #F59E0B; }
            .metric-status.critical { background: rgba(239, 68, 68, 0.2); color: #EF4444; }

            .tests-panel {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 16px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .tests-panel h4 {
                margin: 0 0 12px 0;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                color: rgba(255, 255, 255, 0.7);
                letter-spacing: 0.5px;
            }

            .tests-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 8px;
            }

            .test-btn {
                padding: 8px 12px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                color: white;
                font-size: 11px;
                cursor: pointer;
                transition: all 0.2s;
                text-transform: uppercase;
                font-weight: 500;
            }

            .test-btn:hover {
                background: rgba(255, 255, 255, 0.2);
                border-color: #0B79FF;
            }

            .test-btn.running {
                background: rgba(11, 121, 255, 0.2);
                border-color: #0B79FF;
                color: #0B79FF;
            }

            .logs-panel {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                padding: 16px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .logs-panel h4 {
                margin: 0 0 12px 0;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                color: rgba(255, 255, 255, 0.7);
                letter-spacing: 0.5px;
            }

            .logs-container {
                max-height: 200px;
                overflow-y: auto;
                font-size: 10px;
                font-family: 'Monaco', 'Menlo', monospace;
            }

            .log-entry {
                padding: 4px 8px;
                margin-bottom: 2px;
                border-radius: 4px;
                opacity: 0.8;
            }

            .log-entry.log-info { background: rgba(59, 130, 246, 0.1); color: #3B82F6; }
            .log-entry.log-success { background: rgba(16, 185, 129, 0.1); color: #10B981; }
            .log-entry.log-warning { background: rgba(245, 158, 11, 0.1); color: #F59E0B; }
            .log-entry.log-error { background: rgba(239, 68, 68, 0.1); color: #EF4444; }

            canvas {
                width: 100%;
                height: 80px;
                border-radius: 4px;
            }

            .dashboard-content::-webkit-scrollbar {
                width: 4px;
            }

            .dashboard-content::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 2px;
            }

            .dashboard-content::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.3);
                border-radius: 2px;
            }

            @media (max-width: 768px) {
                .performance-dashboard {
                    width: calc(100vw - 20px);
                    right: 10px;
                    transform: translateY(-450px);
                }

                .performance-dashboard.visible {
                    transform: translateY(0);
                }

                .metrics-grid {
                    grid-template-columns: 1fr;
                }

                .tests-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;
        document.head.appendChild(style);
    }

    initCharts() {
        // Initialize charts for real-time data visualization
        this.charts = {
            fps: this.createLineChart('fps-chart', '#10B981'),
            load: this.createLineChart('load-chart', '#0B79FF'),
            latency: this.createLineChart('latency-chart', '#F59E0B')
        };
    }

    createLineChart(canvasId, color) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;
        
        const ctx = canvas.getContext('2d');
        canvas.width = 200;
        canvas.height = 80;
        
        return {
            ctx,
            data: [],
            color,
            draw() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                
                const stepX = canvas.width / Math.max(this.data.length - 1, 1);
                
                this.data.forEach((value, index) => {
                    const x = index * stepX;
                    const y = canvas.height - (value / Math.max(...this.data, 1)) * canvas.height * 0.8 - 10;
                    
                    if (index === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                });
                
                ctx.stroke();
            },
            addData(value) {
                this.data.push(value);
                if (this.data.length > 20) {
                    this.data.shift();
                }
                this.draw();
            }
        };
    }

    startMonitoring() {
        // Start real-time monitoring
        this.updateInterval = setInterval(() => {
            this.updateMetrics();
        }, 1000);

        this.monitorFPS();
        this.monitorMemory();
        this.monitorInteractions();
    }

    monitorFPS() {
        let lastTime = performance.now();
        let frameCount = 0;

        const measureFPS = (currentTime) => {
            frameCount++;
            if (currentTime >= lastTime + 1000) {
                const fps = Math.round(frameCount * 1000 / (currentTime - lastTime));
                this.metrics.fps.push(fps);
                this.addLogEntry(`FPS: ${fps}`, fps >= 55 ? 'success' : fps >= 30 ? 'warning' : 'error');
                
                if (this.charts.fps) {
                    this.charts.fps.addData(fps);
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            requestAnimationFrame(measureFPS);
        };

        requestAnimationFrame(measureFPS);
    }

    monitorMemory() {
        if ('memory' in performance) {
            const updateMemory = () => {
                const memory = performance.memory;
                const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
                this.metrics.memoryUsage.push(usedMB);
                
                const progressFill = document.getElementById('memory-progress');
                if (progressFill) {
                    progressFill.style.width = Math.min((usedMB / 100) * 100, 100) + '%';
                }
                
                if (this.charts.load) {
                    this.charts.load.addData(usedMB);
                }
            };

            updateMemory();
            setInterval(updateMemory, 2000);
        }
    }

    monitorInteractions() {
        // Monitor interaction latency
        ['click', 'mouseenter', 'mouseleave', 'touchstart', 'touchend'].forEach(eventType => {
            document.addEventListener(eventType, (e) => {
                const startTime = performance.now();
                
                setTimeout(() => {
                    const latency = Math.round(performance.now() - startTime);
                    this.metrics.interactionLatencies.push(latency);
                    
                    if (this.charts.latency) {
                        this.charts.latency.addData(latency);
                    }
                }, 0);
            });
        });
    }

    updateMetrics() {
        // Update dashboard display
        const currentFPS = this.metrics.fps[this.metrics.fps.length - 1] || 60;
        const currentMemory = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1] || 0;
        const currentLatency = this.metrics.interactionLatencies[this.metrics.interactionLatencies.length - 1] || 0;
        
        // Update displays
        this.updateElement('current-fps', currentFPS);
        this.updateElement('current-memory', currentMemory > 0 ? `${currentMemory}MB` : '--');
        this.updateElement('current-latency', currentLatency > 0 ? `${currentLatency}ms` : '--');
        
        // Update status indicators
        this.updateStatus('fps-status', 
            currentFPS >= 55 ? 'optimal' : 
            currentFPS >= 30 ? 'warning' : 'critical',
            currentFPS >= 55 ? 'Optimal' : 
            currentFPS >= 30 ? 'Degraded' : 'Critical'
        );
        
        this.updateStatus('memory-status',
            currentMemory < 50 ? 'normal' : 
            currentMemory < 100 ? 'warning' : 'critical',
            currentMemory < 50 ? 'Normal' : 
            currentMemory < 100 ? 'Warning' : 'Critical'
        );
        
        this.updateStatus('latency-status',
            currentLatency < 50 ? 'responsive' : 
            currentLatency < 100 ? 'warning' : 'critical',
            currentLatency < 50 ? 'Responsive' : 
            currentLatency < 100 ? 'Slow' : 'Critical'
        );
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    updateStatus(id, className, text) {
        const element = document.getElementById(id);
        if (element) {
            element.className = `metric-status ${className}`;
            element.textContent = text;
        }
    }

    addLogEntry(message, type = 'info') {
        const logsContainer = document.getElementById('performance-logs');
        if (!logsContainer) return;

        const logEntry = document.createElement('div');
        logEntry.className = `log-entry log-${type}`;
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        
        logsContainer.appendChild(logEntry);
        logsContainer.scrollTop = logsContainer.scrollHeight;
        
        // Keep only last 50 entries
        while (logsContainer.children.length > 50) {
            logsContainer.removeChild(logsContainer.firstChild);
        }
    }

    setupEventListeners() {
        const toggleBtn = this.dashboard.querySelector('.dashboard-toggle');
        const closeBtn = this.dashboard.querySelector('.dashboard-close');
        const testBtns = this.dashboard.querySelectorAll('.test-btn');
        
        toggleBtn?.addEventListener('click', () => this.toggle());
        closeBtn?.addEventListener('click', () => this.hide());
        
        testBtns.forEach(btn => {
            btn.addEventListener('click', () => this.runTest(btn.dataset.test, btn));
        });
    }

    toggle() {
        this.isVisible = !this.isVisible;
        this.dashboard.classList.toggle('visible', this.isVisible);
        this.dashboard.querySelector('.dashboard-toggle').style.display = this.isVisible ? 'none' : 'block';
        this.dashboard.querySelector('.dashboard-close').style.display = this.isVisible ? 'block' : 'none';
        
        if (this.isVisible) {
            this.addLogEntry('Dashboard opened');
        } else {
            this.addLogEntry('Dashboard closed');
        }
    }

    hide() {
        this.isVisible = false;
        this.dashboard.classList.remove('visible');
        this.dashboard.querySelector('.dashboard-toggle').style.display = 'block';
        this.dashboard.querySelector('.dashboard-close').style.display = 'none';
        this.addLogEntry('Dashboard hidden');
    }

    async runTest(testName, button) {
        button.classList.add('running');
        this.addLogEntry(`Starting ${testName} test...`, 'info');
        
        try {
            let result;
            
            switch (testName) {
                case 'accessibility':
                    result = await this.testAccessibility();
                    break;
                case 'responsive':
                    result = await this.testResponsive();
                    break;
                case 'animations':
                    result = await this.testAnimations();
                    break;
                case 'video':
                    result = await this.testVideo();
                    break;
                case 'audio':
                    result = await this.testAudio();
                    break;
                case 'memory':
                    result = await this.testMemory();
                    break;
            }
            
            this.addLogEntry(`${testName} test completed: ${result ? 'PASS' : 'FAIL'}`, result ? 'success' : 'error');
        } catch (error) {
            this.addLogEntry(`${testName} test failed: ${error.message}`, 'error');
        } finally {
            button.classList.remove('running');
        }
    }

    async testAccessibility() {
        const items = document.querySelectorAll('.portfolio-item');
        let passed = 0;
        
        items.forEach(item => {
            if (item.hasAttribute('tabindex') || item.hasAttribute('role')) passed++;
        });
        
        return passed / items.length >= 0.8;
    }

    async testResponsive() {
        const grid = document.querySelector('.portfolio-grid');
        if (!grid) return false;
        
        const styles = window.getComputedStyle(grid);
        return styles.display === 'grid';
    }

    async testAnimations() {
        const animations = document.querySelectorAll('[style*="animation"]');
        return animations.length > 0;
    }

    async testVideo() {
        const videos = document.querySelectorAll('.portfolio-video');
        return videos.length === 0 || Array.from(videos).every(v => v.readyState >= 2);
    }

    async testAudio() {
        return 'AudioContext' in window || 'webkitAudioContext' in window;
    }

    async testMemory() {
        if ('memory' in performance) {
            const memory = performance.memory;
            return memory.usedJSHeapSize < 50 * 1024 * 1024; // 50MB
        }
        return true; // Cannot test, assume OK
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        this.dashboard?.remove();
    }
}

// Auto-initialize if script is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            window.performanceDashboard = new PerformanceDashboard();
        }
    });
} else {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.performanceDashboard = new PerformanceDashboard();
    }
}