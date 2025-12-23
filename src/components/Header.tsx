import { createSignal, onMount } from 'solid-js';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  full_name?: string;
  is_admin?: boolean;
}

interface CartSummary {
  itemCount: number;
  subtotal: number;
  total: number;
}

export default function Header() {
  const [user, setUser] = createSignal<User | null>(null);
  const [cartSummary, setCartSummary] = createSignal<CartSummary>({ itemCount: 0, subtotal: 0, total: 0 });
  const [isDarkTheme, setIsDarkTheme] = createSignal(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = createSignal(false);

  onMount(async () => {
    if (!supabase) return;
    // Check current session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await loadUserProfile(session.user.id);
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setUser(null);
      }
    });

    // Load cart summary
    await loadCartSummary();

    // Initialize theme
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setIsDarkTheme(initialTheme === 'dark');
    document.documentElement.setAttribute('data-theme', initialTheme);
  });

  const loadUserProfile = async (userId: string) => {
    if (!supabase) return;
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, is_admin')
      .eq('id', userId)
      .single();

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      setUser({
        id: user.id,
        email: user.email || '',
        full_name: profile?.full_name || user.user_metadata?.full_name,
        is_admin: profile?.is_admin || false,
      });
    }
  };

  const loadCartSummary = async () => {
    try {
      // This would need to be implemented with the cart API
      // For now, we'll use a simple approach
      const response = await fetch('/api/cart-summary');
      if (response.ok) {
        const summary = await response.json();
        setCartSummary(summary);
      } else {
        // If endpoint not present, default to empty cart --- don't spam console with 404s
        setCartSummary({ itemCount: 0, subtotal: 0, total: 0 });
      }
    } catch (error) {
      // Non-fatal: cart summary may not be implemented on all environments
      console.debug('Cart summary unavailable:', error);
    }
  };

  const handleLogout = async () => {
    await supabase!.auth.signOut();
    window.location.href = '/';
  };

  const toggleTheme = () => {
    const newTheme = isDarkTheme() ? 'light' : 'dark';
    setIsDarkTheme(!isDarkTheme());
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen());
  };

  const closeUserMenu = () => {
    setIsUserMenuOpen(false);
  };

  return (
    <header class="site-header">
      <div class="header-content">
        {/* Left side - Logo/Brand */}
        <div class="logo-section">
          <h1 class="brand-name">NKScreates</h1>
        </div>

        {/* Right side - Actions */}
        <div class="header-actions">
          {/* Theme Toggle */}
          <button
            class="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={isDarkTheme() ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <svg class="sun-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2"/>
            </svg>
            <svg class="moon-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>

          {user() ? (
            /* User Menu when logged in */
            <div class="user-menu" onClick={toggleUserMenu}>
              <div class="welcome-text">
                Hi {user()?.full_name?.split(' ')[0] || user()?.email?.split('@')[0] || 'User'}
              </div>
              <button class="user-menu-btn" aria-label="User menu">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>

              {/* Dropdown Menu */}
              <div class={`dropdown-menu ${isUserMenuOpen() ? 'show' : ''}`}>
                <a href="/profile" class="dropdown-item" onClick={closeUserMenu}>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
                  </svg>
                  Profile
                </a>
                <a href="/orders" class="dropdown-item" onClick={closeUserMenu}>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12l2 2 4-4M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="currentColor" stroke-width="2"/>
                  </svg>
                  Orders
                </a>
                {user()?.is_admin && (
                  <a href="/admin" class="dropdown-item" onClick={closeUserMenu}>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 12l2 2 4-4M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    Admin
                  </a>
                )}
                <div class="dropdown-divider"></div>
                <a href="#" class="dropdown-item logout-item" onClick={(e) => { e.preventDefault(); handleLogout(); closeUserMenu(); }}>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" stroke-width="2"/>
                  </svg>
                  Logout
                </a>
              </div>
            </div>
          ) : (
            /* Auth buttons when not logged in */
            <div class="auth-buttons">
              <a href="/login" class="auth-btn login-btn">Login</a>
              <a href="/signup" class="auth-btn signup-btn">Sign Up</a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}