import React, { useState, useEffect } from 'react';
import { getPublicAlbums, getReviewsForAlbum, createReview, deleteReview } from '../api/vinylVaultApi';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';

function CommunityPage() {
  const [albums, setAlbums] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedAlbum, setExpandedAlbum] = useState(null);
  const [reviews, setReviews] = useState({});
  const [showReviewForm, setShowReviewForm] = useState(null);
  const [reviewFormData, setReviewFormData] = useState({ content: '', rating: 5 });
  const [searchQuery, setSearchQuery] = useState('');
  const { isAuthenticated, user } = useAuth();
  const { showAlert, showConfirm } = useModal();

  useEffect(() => {
    fetchPublicAlbums();
  }, []);

  const fetchPublicAlbums = async () => {
    try {
      const albumData = await getPublicAlbums();
      setAlbums(albumData);
      setIsLoading(false);
    } catch (err) {
      setError("Failed to load community albums.");
      setIsLoading(false);
    }
  };

  // Group albums by user
  const getAlbumsByUser = () => {
    const filtered = searchQuery
      ? albums.filter(album => 
          album.owner?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          album.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          album.artist?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : albums;

    const grouped = {};
    filtered.forEach(album => {
      const username = album.owner?.username || 'Anonymous';
      if (!grouped[username]) {
        grouped[username] = [];
      }
      grouped[username].push(album);
    });
    return grouped;
  };

  const albumsByUser = getAlbumsByUser();

  const handleToggleReviews = async (albumId) => {
    if (expandedAlbum === albumId) {
      setExpandedAlbum(null);
    } else {
      setExpandedAlbum(albumId);
      if (!reviews[albumId]) {
        try {
          const albumReviews = await getReviewsForAlbum(albumId);
          setReviews({ ...reviews, [albumId]: albumReviews });
        } catch (err) {
          // Failed to load reviews
        }
      }
    }
  };

  const handleReviewSubmit = async (e, albumId) => {
    e.preventDefault();
    try {
      await createReview({ ...reviewFormData, album: albumId });
      const updatedReviews = await getReviewsForAlbum(albumId);
      setReviews({ ...reviews, [albumId]: updatedReviews });
      setReviewFormData({ content: '', rating: 5 });
      setShowReviewForm(null);
    } catch (err) {
      showAlert('Review Error', 'Failed to create review');
    }
  };

  const handleDeleteReview = (reviewId, albumId) => {
    showConfirm('Delete Review', 'Delete this review?', async () => {
      try {
        await deleteReview(reviewId);
        const updatedReviews = await getReviewsForAlbum(albumId);
        setReviews({ ...reviews, [albumId]: updatedReviews });
      } catch (err) {
        showAlert('Delete Error', 'Failed to delete review');
      }
    });
  };

  if (isLoading) return <div className="album-index"><p>Loading community albums...</p></div>;
  if (error) return <div className="album-index"><p className="error">{error}</p></div>;

  return (
    <div className="album-index community-page">
      <div className="index-header">
        <div className="header-content">
          <h1>🌍 Community Albums</h1>
          <p className="greeting">Discover what others are listening to!</p>
        </div>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="🔍 Search by user, album, or artist..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="btn-clear-search">
            ✕ Clear
          </button>
        )}
      </div>

      {albums.length === 0 ? (
        <p>No albums in the community yet!</p>
      ) : Object.keys(albumsByUser).length === 0 ? (
        <p>No results found for "{searchQuery}"</p>
      ) : (
        <div className="user-collections">
          {Object.entries(albumsByUser).map(([username, userAlbums]) => (
            <div key={username} className="user-collection">
              <h2 className="user-collection-header">
                👤 {username}'s Collection ({userAlbums.length})
              </h2>
              <div className="album-list">
                {userAlbums.map((album) => (
            <div key={album._id} className="album-item">
              {album.coverImage && (
                <img src={album.coverImage} alt={`${album.title} cover`} className="album-cover" />
              )}
              <div className="album-details">
                <h3>{album.title}</h3>
                <p>Artist: {album.artist}</p>
                <p>Year: {album.year}</p>
                {album.genre && <p>Genre: {album.genre}</p>}
                <p className="album-owner">Added by: {album.owner?.username || 'Anonymous'}</p>
              </div>
              
              <button 
                onClick={() => handleToggleReviews(album._id)}
                className="btn-view-reviews"
              >
                {expandedAlbum === album._id ? '▲ Hide' : '▼ View'} Reviews
              </button>

              {expandedAlbum === album._id && (
                <div className="reviews-section">
                  <div className="reviews-header">
                    <h4>Reviews ({reviews[album._id]?.length || 0})</h4>
                    {isAuthenticated && showReviewForm !== album._id && (
                      <button 
                        onClick={() => setShowReviewForm(album._id)}
                        className="btn-add-review"
                      >
                        + Add Review
                      </button>
                    )}
                  </div>

                  {showReviewForm === album._id && (
                    <form onSubmit={(e) => handleReviewSubmit(e, album._id)} className="review-form">
                      <div className="form-group">
                        <label>Rating (1-10):</label>
                        <div className="rating-input">
                          <input
                            type="range"
                            name="rating"
                            min="1"
                            max="10"
                            value={reviewFormData.rating}
                            onChange={(e) => setReviewFormData({...reviewFormData, rating: parseInt(e.target.value)})}
                          />
                          <span className="rating-value">⭐ {reviewFormData.rating}/10</span>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Your Review:</label>
                        <textarea
                          name="content"
                          value={reviewFormData.content}
                          onChange={(e) => setReviewFormData({...reviewFormData, content: e.target.value})}
                          required
                          rows="4"
                          placeholder="Share your thoughts about this album..."
                        />
                      </div>

                      <div className="form-actions">
                        <button type="submit">Submit Review</button>
                        <button type="button" onClick={() => setShowReviewForm(null)}>Cancel</button>
                      </div>
                    </form>
                  )}

                  <div className="reviews-list">
                    {!reviews[album._id] || reviews[album._id].length === 0 ? (
                      <p className="no-reviews">No reviews yet. Be the first to review!</p>
                    ) : (
                      reviews[album._id].map((review) => (
                        <div key={review._id} className="review-item">
                          <div className="review-header">
                            <div className="review-author">
                              <span className="author-name">{review.reviewer?.username || 'Anonymous'}</span>
                              <span className="review-rating">⭐ {review.rating}/10</span>
                            </div>
                            {user?._id && review.reviewer?._id === user._id && (
                              <button 
                                onClick={() => handleDeleteReview(review._id, album._id)}
                                className="btn-delete-review"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                          <p className="review-content">{review.content}</p>
                          <span className="review-date">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
                </div>
              ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CommunityPage;