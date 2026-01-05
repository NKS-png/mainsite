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
          <form class="comment-form" onSubmit={submitComment}>
            <div class="form-group">
              <textarea
                value={newComment()}
                onInput={(e) => setNewComment(e.currentTarget.value)}
                placeholder="Share your thoughts..."
                maxlength="1000"
                rows="3"
                class="comment-input"
                disabled={isSubmitting()}
              />
              <div class="form-actions">
                <span class="char-count">{newComment().length}/1000</span>
                <button
                  type="submit"
                  class="submit-btn"
                  disabled={isSubmitting() || !newComment().trim()}
                >
                  {isSubmitting() ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div class="login-prompt">
            <p>Please <a href="/login">log in</a> to join the conversation</p>
          </div>
        )}

        {/* Error Message */}
        {error() && (
          <div class="error-message">
            {error()}
          </div>
        )}

        {/* Comments List */}
        <div class="comments-list">
          {isLoading() ? (
            <div class="loading">Loading comments...</div>
          ) : comments().length === 0 ? (
            <div class="no-comments">
              <p>No comments yet. Be the first to share your thoughts!</p>
            </div>
          ) : (
            comments().map((comment) => (
              <div class={`comment-item ${comment.user.is_admin ? 'admin-comment' : ''}`}>
                <div class="comment-header">
                  <span class={`comment-author ${comment.user.is_admin ? 'admin-author' : ''}`}>
                    {comment.user.display_name}
                    {comment.user.is_admin && <span class="admin-badge">ADMIN</span>}
                  </span>
                  <div class="comment-meta">
                    <span class="comment-date">{formatDate(comment.created_at)}</span>
                    {currentUserId() === comment.user.id && (
                      <button
                        class="delete-btn"
                        onClick={() => deleteComment(comment.id)}
                        title="Delete comment"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </button>
                    )}
                  </div>
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
          padding: 4rem 0;
          background: var(--background-secondary, #f8f9fa);
        }

        /* Dark mode background */
        [data-theme="dark"] .comments-section {
          background: var(--background-secondary-dark, #1a1a1a);
        }

        .comments-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .comments-title {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary, #1a1a1a);
          margin-bottom: 0.5rem;
        }

        /* Dark mode title */
        [data-theme="dark"] .comments-title {
          color: var(--text-primary-dark, #ffffff);
        }

        .comments-subtitle {
          color: var(--text-secondary, #666);
          font-size: 1.1rem;
        }

        /* Dark mode subtitle */
        [data-theme="dark"] .comments-subtitle {
          color: var(--text-secondary-dark, #cccccc);
        }

        .comment-form {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        /* Dark mode form */
        [data-theme="dark"] .comment-form {
          background: var(--card-background-dark, #2a2a2a);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .comment-input {
          width: 100%;
          padding: 1rem;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 1rem;
          resize: vertical;
          transition: border-color 0.2s;
          background: white;
          color: var(--text-primary, #1a1a1a);
        }

        /* Dark mode input */
        [data-theme="dark"] .comment-input {
          background: var(--input-background-dark, #333);
          border-color: var(--border-dark, #555);
          color: var(--text-primary-dark, #ffffff);
        }

        .comment-input:focus {
          outline: none;
          border-color: var(--primary-color, #0b79ff);
        }

        .comment-input:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }

        /* Dark mode disabled input */
        [data-theme="dark"] .comment-input:disabled {
          background: var(--input-disabled-dark, #444);
        }

        .form-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .char-count {
          font-size: 0.9rem;
          color: var(--text-secondary, #666);
        }

        /* Dark mode char count */
        [data-theme="dark"] .char-count {
          color: var(--text-secondary-dark, #cccccc);
        }

        .submit-btn {
          background: var(--primary-color, #0b79ff);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .submit-btn:hover:not(:disabled) {
          background: var(--primary-hover, #0056cc);
        }

        .submit-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .login-prompt {
          text-align: center;
          padding: 2rem;
          background: white;
          border-radius: 12px;
          margin-bottom: 2rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        /* Dark mode login prompt */
        [data-theme="dark"] .login-prompt {
          background: var(--card-background-dark, #2a2a2a);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }

        .login-prompt a {
          color: var(--primary-color, #0b79ff);
          text-decoration: none;
          font-weight: 600;
        }

        .login-prompt a:hover {
          text-decoration: underline;
        }

        .error-message {
          background: #fee;
          color: #c33;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          text-align: center;
        }

        /* Dark mode error */
        [data-theme="dark"] .error-message {
          background: var(--error-background-dark, #3a1a1a);
          color: var(--error-text-dark, #ff6b6b);
        }

        .comments-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .comment-item {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        /* Dark mode comment item */
        [data-theme="dark"] .comment-item {
          background: var(--card-background-dark, #2a2a2a);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }

        .comment-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }

        .comment-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .comment-author {
          font-weight: 600;
          color: var(--text-primary, #1a1a1a);
        }

        /* Dark mode author */
        [data-theme="dark"] .comment-author {
          color: var(--text-primary-dark, #ffffff);
        }

        .comment-date {
          font-size: 0.9rem;
          color: var(--text-secondary, #666);
        }

        /* Dark mode date */
        [data-theme="dark"] .comment-date {
          color: var(--text-secondary-dark, #cccccc);
        }

        .delete-btn {
          background: none;
          border: none;
          color: var(--text-secondary, #666);
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          transition: all 0.2s;
          opacity: 0.7;
        }

        .delete-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          opacity: 1;
        }

        /* Dark mode delete button */
        [data-theme="dark"] .delete-btn {
          color: var(--text-secondary-dark, #cccccc);
        }

        [data-theme="dark"] .delete-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
        }

        /* Admin comment styles */
        .admin-comment {
          border: 2px solid var(--primary-color, #0b79ff);
          box-shadow: 0 0 20px rgba(11, 121, 255, 0.3), 0 2px 15px rgba(0, 0, 0, 0.1);
          background: linear-gradient(135deg, rgba(11, 121, 255, 0.05), rgba(245, 158, 11, 0.05));
          position: relative;
        }

        .admin-comment::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, var(--primary-color, #0b79ff), var(--accent-color, #f59e0b), var(--primary-color, #0b79ff));
          border-radius: 14px;
          z-index: -1;
          opacity: 0.8;
          animation: adminGlow 2s ease-in-out infinite alternate;
        }

        /* Dark mode admin comment */
        [data-theme="dark"] .admin-comment {
          background: linear-gradient(135deg, rgba(11, 121, 255, 0.1), rgba(245, 158, 11, 0.1));
          box-shadow: 0 0 25px rgba(11, 121, 255, 0.4), 0 2px 15px rgba(0, 0, 0, 0.3);
        }

        [data-theme="dark"] .admin-comment::before {
          background: linear-gradient(45deg, var(--primary-color, #0b79ff), var(--accent-color, #f59e0b), var(--primary-color, #0b79ff));
          opacity: 1;
        }

        @keyframes adminGlow {
          0% {
            opacity: 0.6;
            transform: scale(1);
          }
          100% {
            opacity: 1;
            transform: scale(1.002);
          }
        }

        .admin-author {
          font-weight: 700;
          color: var(--primary-color, #0b79ff);
        }

        /* Dark mode admin author */
        [data-theme="dark"] .admin-author {
          color: var(--primary-color, #4dabf7);
        }

        .admin-badge {
          background: linear-gradient(135deg, var(--primary-color, #0b79ff), var(--accent-color, #f59e0b));
          color: white;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.2rem 0.5rem;
          border-radius: 10px;
          margin-left: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 8px rgba(11, 121, 255, 0.3);
        }

        /* Dark mode admin badge */
        [data-theme="dark"] .admin-badge {
          background: linear-gradient(135deg, var(--primary-color, #0b79ff), var(--accent-color, #f59e0b));
          box-shadow: 0 2px 8px rgba(11, 121, 255, 0.5);
        }

        .comment-content {
          color: var(--text-primary, #1a1a1a);
          line-height: 1.6;
          white-space: pre-wrap;
        }

        /* Dark mode content */
        [data-theme="dark"] .comment-content {
          color: var(--text-primary-dark, #ffffff);
        }

        .loading, .no-comments {
          text-align: center;
          padding: 2rem;
          color: var(--text-secondary, #666);
        }

        /* Dark mode loading/no comments */
        [data-theme="dark"] .loading,
        [data-theme="dark"] .no-comments {
          color: var(--text-secondary-dark, #cccccc);
        }

        @media (max-width: 768px) {
          .comments-section {
            padding: 2rem 0;
          }

          .comments-title {
            font-size: 1.5rem;
          }

          .comment-form, .comment-item {
            padding: 1rem;
          }

          .comment-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }
        }
      `}</style>
    </section>
  );
}