import { createSignal, onMount } from 'solid-js';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    display_name: string;
    is_admin?: boolean;
  };
}

interface CommentsProps {
  pageId?: string; // For future use if comments are per-page
}

export default function Comments(props: CommentsProps) {
  const [comments, setComments] = createSignal<Comment[]>([]);
  const [newComment, setNewComment] = createSignal('');
  const [isLoading, setIsLoading] = createSignal(false);
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [error, setError] = createSignal('');
  const [isLoggedIn, setIsLoggedIn] = createSignal(false);
  const [currentUserId, setCurrentUserId] = createSignal<string | null>(null);

  // Check if user is logged in
  const checkAuth = () => {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        setIsLoggedIn(true);
        setCurrentUserId(userData.id);
      } else {
        setIsLoggedIn(false);
        setCurrentUserId(null);
      }
    } catch (e) {
      setIsLoggedIn(false);
      setCurrentUserId(null);
    }
  };

  // Fetch comments
  const fetchComments = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/comments');
      const data = await response.json();

      if (response.ok) {
        setComments(data.comments || []);
      } else {
        setError(data.error || 'Failed to load comments');
      }
    } catch (err) {
      setError('Failed to load comments');
      console.error('Error fetching comments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit new comment
  const submitComment = async (e: Event) => {
    e.preventDefault();

    const content = newComment().trim();
    if (!content) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (response.ok) {
        // Add new comment to the list
        setComments(prev => [data.comment, ...prev]);
        setNewComment('');
      } else {
        setError(data.error || 'Failed to post comment');
      }
    } catch (err) {
      setError('Failed to post comment');
      console.error('Error posting comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete comment
  const deleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    setError('');

    try {
      const response = await fetch(`/api/comments?id=${commentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        // Remove comment from the list
        setComments(prev => prev.filter(comment => comment.id !== commentId));
      } else {
        setError(data.error || 'Failed to delete comment');
      }
    } catch (err) {
      setError('Failed to delete comment');
      console.error('Error deleting comment:', err);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  onMount(() => {
    checkAuth();
    fetchComments();
  });

  return (
    <section class="comments-section">
      <div class="section-container">
        <div class="comments-header">
          <h2 class="comments-title">Community Comments</h2>
          <p class="comments-subtitle">Share your thoughts and connect with fellow creatives</p>
        </div>

        {/* Comment Form */}
        {isLoggedIn() ? (
          <div class="comment-form-card">
            <form class="comment-form" onSubmit={submitComment}>
              <div class="form-group">
                <textarea
                  value={newComment()}
                  onInput={(e) => setNewComment(e.currentTarget.value)}
                  placeholder="Share your thoughts..."
                  maxlength="1000"
                  rows="4"
                  class="comment-input"
                  disabled={isSubmitting()}
                />
                <div class="form-actions">
                  <span class="char-count">{newComment().length}/1000</span>
                  <button
                    type="submit"
                    class="btn btn-primary"
                    disabled={isSubmitting() || !newComment().trim()}
                  >
                    {isSubmitting() ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div class="login-cta-card">
            <div class="cta-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H19V9Z"/>
              </svg>
            </div>
            <h3>Join the Conversation</h3>
            <p>Please log in to share your thoughts and connect with fellow creatives</p>
            <div class="cta-actions">
              <a href="/login" class="btn btn-primary">Log In</a>
              <a href="/signup" class="btn btn-secondary">Sign Up</a>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error() && (
          <div class="error-message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"/>
            </svg>
            {error()}
          </div>
        )}

        {/* Comments List */}
        <div class="comments-list">
          {isLoading() ? (
            <div class="loading-state">
              <div class="loading-spinner"></div>
              <p>Loading comments...</p>
            </div>
          ) : comments().length === 0 ? (
            <div class="empty-state">
              <div class="empty-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H19V9Z"/>
                </svg>
              </div>
              <h3>No comments yet</h3>
              <p>Be the first to share your thoughts!</p>
            </div>
          ) : (
            comments().map((comment) => (
              <div class={`comment-card ${comment.user.is_admin ? 'admin-comment' : ''}`}>
                <div class="comment-header">
                  <div class="comment-author-info">
                    <div class="author-avatar">
                      <span>{comment.user.display_name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div class="author-details">
                      <span class={`comment-author ${comment.user.is_admin ? 'admin-author' : ''}`}>
                        {comment.user.display_name}
                        {comment.user.is_admin && (
                          <span class="admin-badge">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
                            </svg>
                            ADMIN
                          </span>
                        )}
                      </span>
                      <span class="comment-date">{formatDate(comment.created_at)}</span>
                    </div>
                  </div>
                  {currentUserId() === comment.user.id && (
                    <button
                      class="delete-btn"
                      onClick={() => deleteComment(comment.id)}
                      title="Delete comment"
                      aria-label="Delete comment"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>
                  )}
                </div>
                <div class="comment-content">
                  {comment.content}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        .comments-section {
          padding: var(--spacing-20) 0;
          background: var(--bg-secondary);
          position: relative;
        }

        .comments-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background:
            radial-gradient(circle at 20% 30%, rgba(11, 121, 255, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(245, 158, 11, 0.05) 0%, transparent 50%);
          pointer-events: none;
        }

        .comments-header {
          text-align: center;
          margin-bottom: var(--spacing-12);
          position: relative;
          z-index: 1;
        }

        .comments-title {
          font-size: var(--font-size-4xl);
          font-weight: var(--font-weight-extrabold);
          margin-bottom: var(--spacing-4);
          background: linear-gradient(135deg, var(--text-primary), var(--text-secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .comments-subtitle {
          font-size: var(--font-size-lg);
          color: var(--text-secondary);
          max-width: 500px;
          margin: 0 auto;
        }

        /* Comment Form Card */
        .comment-form-card {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-2xl);
          padding: var(--spacing-8);
          margin-bottom: var(--spacing-8);
          box-shadow: var(--shadow-lg);
          position: relative;
          overflow: hidden;
        }

        .comment-form-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(11, 121, 255, 0.05), transparent);
          transition: left 0.6s;
        }

        .comment-form-card:hover::before {
          left: 100%;
        }

        .comment-form {
          position: relative;
          z-index: 1;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-4);
        }

        .comment-input {
          width: 100%;
          padding: var(--spacing-4);
          border: 2px solid var(--border-color);
          border-radius: var(--radius-lg);
          font-size: var(--font-size-base);
          font-family: var(--font-family);
          resize: vertical;
          transition: all var(--transition-fast);
          background: var(--bg-primary);
          color: var(--text-primary);
          min-height: 120px;
        }

        .comment-input:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(11, 121, 255, 0.1);
        }

        .comment-input:disabled {
          background: var(--bg-tertiary);
          cursor: not-allowed;
          opacity: 0.6;
        }

        .form-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: var(--spacing-4);
        }

        .char-count {
          font-size: var(--font-size-sm);
          color: var(--text-tertiary);
          font-weight: var(--font-weight-medium);
        }

        /* Login CTA Card */
        .login-cta-card {
          background: var(--bg-primary);
          border: 2px solid var(--border-color);
          border-radius: var(--radius-2xl);
          padding: var(--spacing-12);
          text-align: center;
          margin-bottom: var(--spacing-8);
          box-shadow: var(--shadow-lg);
          position: relative;
          overflow: hidden;
        }

        .login-cta-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(11, 121, 255, 0.03), rgba(245, 158, 11, 0.03));
          opacity: 0;
          transition: opacity var(--transition-normal);
        }

        .login-cta-card:hover::before {
          opacity: 1;
        }

        .cta-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto var(--spacing-6);
          background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-inverse);
          box-shadow: var(--shadow-lg);
          position: relative;
          z-index: 1;
        }

        .cta-icon svg {
          width: 40px;
          height: 40px;
        }

        .login-cta-card h3 {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-bold);
          margin-bottom: var(--spacing-4);
          color: var(--text-primary);
          position: relative;
          z-index: 1;
        }

        .login-cta-card p {
          color: var(--text-secondary);
          margin-bottom: var(--spacing-8);
          line-height: var(--line-height-relaxed);
          position: relative;
          z-index: 1;
        }

        .cta-actions {
          display: flex;
          gap: var(--spacing-4);
          justify-content: center;
          flex-wrap: wrap;
          position: relative;
          z-index: 1;
        }

        /* Error Message */
        .error-message {
          display: flex;
          align-items: center;
          gap: var(--spacing-3);
          background: #fef2f2;
          color: #dc2626;
          padding: var(--spacing-4);
          border-radius: var(--radius-lg);
          border: 1px solid #fecaca;
          margin-bottom: var(--spacing-6);
          font-weight: var(--font-weight-medium);
        }

        .error-message svg {
          flex-shrink: 0;
        }

        /* Comments List */
        .comments-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-6);
        }

        /* Comment Card */
        .comment-card {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-2xl);
          padding: var(--spacing-6);
          box-shadow: var(--shadow-md);
          transition: all var(--transition-normal);
          position: relative;
          overflow: hidden;
        }

        .comment-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
          border-color: rgba(11, 121, 255, 0.2);
        }

        .comment-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(11, 121, 255, 0.02), transparent);
          transition: left 0.8s;
        }

        .comment-card:hover::before {
          left: 100%;
        }

        .comment-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--spacing-4);
          position: relative;
          z-index: 1;
        }

        .comment-author-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-3);
          flex: 1;
        }

        .author-avatar {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-full);
          background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-inverse);
          font-weight: var(--font-weight-bold);
          font-size: var(--font-size-lg);
          flex-shrink: 0;
        }

        .author-details {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-1);
        }

        .comment-author {
          font-weight: var(--font-weight-semibold);
          color: var(--text-primary);
          font-size: var(--font-size-base);
        }

        .comment-date {
          font-size: var(--font-size-sm);
          color: var(--text-tertiary);
        }

        .delete-btn {
          background: none;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          padding: var(--spacing-2);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
          opacity: 0.7;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .delete-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          opacity: 1;
          transform: scale(1.1);
        }

        .comment-content {
          color: var(--text-primary);
          line-height: var(--line-height-relaxed);
          white-space: pre-wrap;
          position: relative;
          z-index: 1;
        }

        /* Admin Comment Styles */
        .admin-comment {
          border: 2px solid var(--primary-color);
          background: linear-gradient(135deg, rgba(11, 121, 255, 0.03), rgba(245, 158, 11, 0.03));
          position: relative;
        }

        .admin-comment::after {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, var(--primary-color), var(--accent-color), var(--primary-color));
          border-radius: calc(var(--radius-2xl) + 2px);
          z-index: -1;
          opacity: 0.6;
          animation: adminGlow 3s ease-in-out infinite alternate;
        }

        .admin-author {
          font-weight: var(--font-weight-bold);
          color: var(--primary-color);
        }

        .admin-badge {
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-1);
          background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
          color: var(--text-inverse);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold);
          padding: var(--spacing-1) var(--spacing-2);
          border-radius: var(--radius-full);
          margin-left: var(--spacing-2);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 8px rgba(11, 121, 255, 0.3);
        }

        @keyframes adminGlow {
          0% {
            opacity: 0.4;
            transform: scale(1);
          }
          100% {
            opacity: 0.8;
            transform: scale(1.002);
          }
        }

        /* Loading State */
        .loading-state {
          text-align: center;
          padding: var(--spacing-12);
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-2xl);
          box-shadow: var(--shadow-md);
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border-color);
          border-top: 3px solid var(--primary-color);
          border-radius: var(--radius-full);
          animation: spin 1s linear infinite;
          margin: 0 auto var(--spacing-4);
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: var(--spacing-12);
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-2xl);
          box-shadow: var(--shadow-md);
        }

        .empty-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto var(--spacing-6);
          color: var(--text-tertiary);
          opacity: 0.5;
        }

        .empty-state h3 {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-semibold);
          color: var(--text-primary);
          margin-bottom: var(--spacing-2);
        }

        .empty-state p {
          color: var(--text-secondary);
          font-size: var(--font-size-base);
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Dark Theme Support */
        [data-theme="dark"] .comment-form-card,
        [data-theme="dark"] .login-cta-card,
        [data-theme="dark"] .comment-card,
        [data-theme="dark"] .empty-state,
        [data-theme="dark"] .loading-state {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-color: rgba(255, 255, 255, 0.1);
        }

        [data-theme="dark"] .comment-input {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
        }

        [data-theme="dark"] .comment-input:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(11, 121, 255, 0.2);
        }

        [data-theme="dark"] .error-message {
          background: rgba(239, 68, 68, 0.1);
          color: #fca5a5;
          border-color: rgba(239, 68, 68, 0.2);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .comments-section {
            padding: var(--spacing-12) 0;
          }

          .comments-title {
            font-size: var(--font-size-3xl);
          }

          .comments-subtitle {
            font-size: var(--font-size-base);
          }

          .comment-form-card,
          .login-cta-card,
          .comment-card,
          .empty-state,
          .loading-state {
            padding: var(--spacing-6);
          }

          .comment-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-3);
          }

          .form-actions {
            flex-direction: column;
            align-items: stretch;
            gap: var(--spacing-3);
          }

          .cta-actions {
            flex-direction: column;
          }

          .cta-icon {
            width: 60px;
            height: 60px;
          }

          .cta-icon svg {
            width: 30px;
            height: 30px;
          }

          .author-avatar {
            width: 32px;
            height: 32px;
          }

          .author-avatar span {
            font-size: var(--font-size-base);
          }
        }

        @media (max-width: 480px) {
          .comments-title {
            font-size: var(--font-size-2xl);
          }

          .comment-form-card,
          .login-cta-card,
          .comment-card {
            padding: var(--spacing-4);
          }

          .cta-actions .btn {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
}