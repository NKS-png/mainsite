// Admin Chat Widget with Real-time Messaging
class AdminChatController {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.unreadCount = 0;
        this.typingTimeout = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadMessages();
        this.startRealtimeUpdates();
    }

    setupEventListeners() {
        const toggle = document.getElementById('chatToggle');
        const close = document.getElementById('chatClose');
        const send = document.getElementById('chatSend');
        const input = document.getElementById('chatInput');

        if (toggle) {
            toggle.addEventListener('click', () => this.toggleChat());
            toggle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleChat();
                }
            });
        }

        if (close) {
            close.addEventListener('click', () => this.closeChat());
        }

        if (send) {
            send.addEventListener('click', () => this.sendMessage());
        }

        if (input) {
            input.addEventListener('input', () => this.handleTyping());
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // Click outside to close
        document.addEventListener('click', (e) => {
            const chatWidget = document.querySelector('.admin-chat-widget');
            const chatWindow = document.getElementById('chatWindow');

            if (this.isOpen && chatWidget && chatWindow &&
                !chatWidget.contains(e.target)) {
                this.closeChat();
            }
        });
    }

    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    openChat() {
        this.isOpen = true;
        const window = document.getElementById('chatWindow');
        const toggle = document.getElementById('chatToggle');

        if (window) {
            window.classList.add('active');
            this.markMessagesAsRead();

            // Animate opening
            if (typeof gsap !== 'undefined') {
                gsap.fromTo(window,
                    { scale: 0.8, opacity: 0 },
                    { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
                );
            }
        }

        if (toggle) {
            toggle.setAttribute('aria-expanded', 'true');
        }

        // Focus input
        setTimeout(() => {
            const input = document.getElementById('chatInput');
            if (input) input.focus();
        }, 300);
    }

    closeChat() {
        this.isOpen = false;
        const window = document.getElementById('chatWindow');
        const toggle = document.getElementById('chatToggle');

        if (window) {
            if (typeof gsap !== 'undefined') {
                gsap.to(window, {
                    scale: 0.8,
                    opacity: 0,
                    duration: 0.2,
                    ease: "power2.in",
                    onComplete: () => window.classList.remove('active')
                });
            } else {
                window.classList.remove('active');
            }
        }

        if (toggle) {
            toggle.setAttribute('aria-expanded', 'false');
        }
    }

    async loadMessages() {
        try {
            // Simulate API call - replace with actual API
            const response = await this.mockApiCall('/api/messages');
            if (response.success) {
                this.messages = response.messages;
                this.unreadCount = response.unread_count;
                this.renderMessages();
                this.updateNotificationBadge();
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    }

    async sendMessage() {
        const input = document.getElementById('chatInput');
        const sendBtn = document.getElementById('chatSend');

        if (!input || !input.value.trim()) return;

        const content = input.value.trim();
        sendBtn.disabled = true;
        sendBtn.textContent = 'Sending...';

        try {
            // Add user message to UI immediately
            this.addMessage({
                id: Date.now(),
                sender_name: 'You',
                content: content,
                message_type: 'user_to_admin',
                created_at: new Date().toISOString(),
                is_read: true
            });

            // Clear input
            input.value = '';

            // Show typing indicator
            this.showTypingIndicator();

            // Get user info for email
            const userInfo = this.getUserInfo();

            // Send to Gemini API
            const response = await fetch('/api/chatbot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: content,
                    userInfo: userInfo,
                    conversationHistory: this.messages.slice(-10) // Last 10 messages for context
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Remove typing indicator
                this.removeTypingIndicator();

                // Add bot response
                this.addMessage({
                    id: Date.now() + 1,
                    sender_name: 'NKScreates',
                    content: data.response,
                    message_type: 'admin_to_user',
                    created_at: new Date().toISOString(),
                    is_read: false
                });

                this.unreadCount++;
                this.updateNotificationBadge();
            } else {
                throw new Error(data.error || 'Failed to get response');
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            this.removeTypingIndicator();
            this.showError('Failed to send message. Please try again.');
        } finally {
            sendBtn.disabled = false;
            sendBtn.textContent = 'Send';
        }
    }

    getUserInfo() {
        // Try to get user info from localStorage or other sources
        let userInfo = {
            name: '',
            email: '',
            ip: '',
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };

        try {
            const stored = JSON.parse(localStorage.getItem('user') || 'null');
            if (stored) {
                userInfo.name = stored.name || stored.full_name || '';
                userInfo.email = stored.email || '';
            }
        } catch (e) {
            // Ignore localStorage errors
        }

        return userInfo;
    }

    removeTypingIndicator() {
        const typingEl = document.querySelector('.typing-indicator');
        if (typingEl) {
            typingEl.remove();
        }
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
            this.typingTimeout = null;
        }
    }

    addMessage(message) {
        this.messages.push(message);
        this.renderMessages();
        this.scrollToBottom();
    }

    renderMessages() {
        const container = document.getElementById('chatMessages');
        if (!container) return;

        container.innerHTML = this.messages.map(message => `
            <div class="message-item ${message.message_type === 'admin_to_user' ? 'admin' : 'user'}">
                <div class="message-avatar">
                    ${message.sender_name === 'You' ?
                        '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="4" fill="currentColor"/><path d="M4 20c0-4.418 4.03-8 9-8s9 3.582 9 8" fill="currentColor"/></svg>' :
                        '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="4" fill="currentColor"/><path d="M4 20c0-4.418 4.03-8 9-8s9 3.582 9 8" fill="currentColor"/></svg>'
                    }
                </div>
                <div class="message-content">
                    <div class="message-text">${this.formatMessage(message.content)}</div>
                    <div class="message-time">${this.formatTime(message.created_at)}</div>
                </div>
            </div>
        `).join('');

        this.scrollToBottom();
    }

    formatMessage(content) {
        // Basic formatting - escape HTML and convert line breaks
        return content
            .replace(/&/g, '&')
            .replace(/</g, '<')
            .replace(/>/g, '>')
            .replace(/\n/g, '<br>');
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    }

    scrollToBottom() {
        const container = document.getElementById('chatMessages');
        if (container) {
            setTimeout(() => {
                container.scrollTop = container.scrollHeight;
            }, 100);
        }
    }

    updateNotificationBadge() {
        const badge = document.getElementById('chatNotification');
        if (badge) {
            if (this.unreadCount > 0) {
                badge.style.display = 'flex';
                badge.textContent = this.unreadCount > 9 ? '9+' : this.unreadCount;
            } else {
                badge.style.display = 'none';
            }
        }
    }

    markMessagesAsRead() {
        this.unreadCount = 0;
        this.updateNotificationBadge();

        // Mark messages as read in API
        this.messages.forEach(message => {
            if (!message.is_read && message.message_type === 'admin_to_user') {
                message.is_read = true;
            }
        });
    }

    handleTyping() {
        const input = document.getElementById('chatInput');
        const sendBtn = document.getElementById('chatSend');

        if (input && sendBtn) {
            const hasContent = input.value.trim().length > 0;
            sendBtn.disabled = !hasContent;

            // Show typing indicator (optional)
            if (hasContent && !this.typingTimeout) {
                this.showTypingIndicator();
            }
        }
    }

    showTypingIndicator() {
        // Clear existing timeout
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }

        // Show typing indicator
        const container = document.getElementById('chatMessages');
        if (container) {
            const typingEl = document.createElement('div');
            typingEl.className = 'typing-indicator';
            typingEl.innerHTML = `
                <div class="message-item admin">
                    <div class="message-avatar">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="8" r="4" fill="currentColor"/>
                            <path d="M4 20c0-4.418 4.03-8 9-8s9 3.582 9 8" fill="currentColor"/>
                        </svg>
                    </div>
                    <div class="message-content">
                        <div class="typing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                </div>
            `;

            container.appendChild(typingEl);
            this.scrollToBottom();

            // Remove after 3 seconds
            this.typingTimeout = setTimeout(() => {
                if (typingEl.parentNode) {
                    typingEl.remove();
                }
                this.typingTimeout = null;
            }, 3000);
        }
    }

    startRealtimeUpdates() {
        // Simulate real-time updates every 30 seconds
        setInterval(() => {
            this.loadMessages();
        }, 30000);

        // Listen for Supabase realtime events (if available)
        if (typeof supabase !== 'undefined') {
            // Implement Supabase realtime subscription
            // supabase.channel('messages').on('postgres_changes', ...)
        }
    }

    showError(message) {
        const container = document.getElementById('chatMessages');
        if (container) {
            const errorEl = document.createElement('div');
            errorEl.className = 'message-error';
            errorEl.textContent = message;
            errorEl.style.cssText = `
                background: #fee2e2;
                color: #dc2626;
                padding: 8px 12px;
                border-radius: 8px;
                margin: 8px 0;
                font-size: 14px;
                text-align: center;
            `;

            container.appendChild(errorEl);
            this.scrollToBottom();

            setTimeout(() => {
                if (errorEl.parentNode) {
                    errorEl.remove();
                }
            }, 5000);
        }
    }

    // Mock API for demonstration - replace with actual API calls
    async mockApiCall(endpoint, method = 'GET', data = null) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

        switch (endpoint) {
            case '/api/messages':
                if (method === 'GET') {
                    return {
                        success: true,
                        messages: this.messages,
                        unread_count: this.unreadCount
                    };
                } else if (method === 'POST') {
                    return { success: true };
                }
                break;
        }

        return { success: false, error: 'Endpoint not found' };
    }
}

// Global admin chat controller
const adminChatController = new AdminChatController();

// Export for global use
window.AdminChatController = AdminChatController;
window.adminChatController = adminChatController;