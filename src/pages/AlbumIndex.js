import React, { useState, useEffect } from 'react';
import { getAlbums, createAlbum, updateAlbum, deleteAlbum, searchAlbumArtwork, getReviewsForAlbum, createReview, deleteReview } from '../api/vinylVaultApi'; 
import { useAuth } from '../contexts/AuthContext';

function AlbumIndex() {
  const [albums, setAlbums] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedAlbum, setExpandedAlbum] = useState(null);
  const [reviews, setReviews] = useState({});
  const [showReviewForm, setShowReviewForm] = useState(null);
  const [reviewFormData, setReviewFormData] = useState({ content: '', rating: 5 });
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [artworkResults, setArtworkResults] = useState([]);
  const [searchingArtwork, setSearchingArtwork] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    year: '',
    genre: '',
    coverImage: ''
  });
  const { isAuthenticated, user } = useAuth(); 

  const fetchAlbums = async () => {
    try {
      const albumData = await getAlbums(); 
      setAlbums(albumData); 
      setIsLoading(false);
      setError(null);
    } catch (err) {
      setError("Failed to load albums. Please ensure the server is running.");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAlbums();
    } else {
      setIsLoading(false);
      setError("You must be signed in to view albums."); 
    }
  }, [isAuthenticated]);

  const handleOpenForm = (album = null) => {
    if (album) {
      setEditingAlbum(album);
      setFormData({
        title: album.title || '',
        artist: album.artist || '',
        year: album.year || '',
        genre: album.genre || '',
        coverImage: album.coverImage || ''
      });
    } else {
      setEditingAlbum(null);
      setFormData({
        title: '',
        artist: '',
        year: '',
        genre: '',
        coverImage: ''
      });
    }
    setArtworkResults([]);
    setShowForm(true);
  };

  const handleSearchArtwork = async () => {
    if (!formData.artist || !formData.title) {
      alert('Please enter both Artist and Title first');
      return;
    }
    
    setSearchingArtwork(true);
    try {
      const results = await searchAlbumArtwork(formData.artist, formData.title);
      setArtworkResults(results);
      if (results.length === 0) {
        alert('No album artwork found. Try adjusting the artist or title, or enter the image URL manually.');
      }
    } catch (err) {
      alert('Failed to search for artwork');
    } finally {
      setSearchingArtwork(false);
    }
  };

  const handleSelectArtwork = (artworkUrl) => {
    setFormData({ ...formData, coverImage: artworkUrl });
    setArtworkResults([]);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAlbum(null);
    setFormData({
      title: '',
      artist: '',
      year: '',
      genre: '',
      coverImage: ''
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAlbum) {
        await updateAlbum(editingAlbum._id, formData);
      } else {
        await createAlbum(formData);
      }
      handleCloseForm();
      fetchAlbums();
    } catch (err) {
      alert('Error saving album: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this album?')) return;
    
    try {
      await deleteAlbum(id);
      setAlbums(albums.filter(album => album._id !== id));
    } catch (err) {
      setError('Failed to delete album');
    }
  };

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
          console.error('Failed to load reviews');
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
      alert('Failed to create review');
    }
  };

  const handleDeleteReview = async (reviewId, albumId) => {
    if (!window.confirm('Delete this review?')) return;
    
    try {
      await deleteReview(reviewId);
      const updatedReviews = await getReviewsForAlbum(albumId);
      setReviews({ ...reviews, [albumId]: updatedReviews });
    } catch (err) {
      alert('Failed to delete review');
    }
  };

  // --- Conditional Rendering for UX ---

  if (isLoading) {
    return (
      <div className="album-index">
        <h2>Vinyl Collection</h2>
        <p>Loading your vinyl records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="album-index error">
        <h2>Error</h2>
        <p>{error}</p>
        <p>If you just signed in, check your server console for specific errors.</p>
      </div>
    );
  }

  return (
    <div className="album-index">
      <div className="index-header">
        <div className="header-content">
          <h1>My Collection</h1>
          {user?.username && <p className="greeting">Hello, {user.username}!</p>}
        </div>
        <button onClick={() => handleOpenForm()} className="btn-add">+ Add New Album</button>
      </div>

      {showForm && (
        <div className="album-form-container">
          <form onSubmit={handleSubmit} className="album-form">
            <h3>{editingAlbum ? 'Edit Album' : 'Add New Album'}</h3>
            
            <div className="form-group">
              <label htmlFor="title">Title:</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="artist">Artist:</label>
              <input
                type="text"
                id="artist"
                name="artist"
                value={formData.artist}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="year">Year:</label>
              <input
                type="number"
                id="year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="genre">Genre:</label>
              <input
                type="text"
                id="genre"
                name="genre"
                value={formData.genre}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="coverImage">Cover Image URL:</label>
              <div className="artwork-search-group">
                <input
                  type="url"
                  id="coverImage"
                  name="coverImage"
                  value={formData.coverImage}
                  onChange={handleChange}
                  placeholder="Paste URL or search below"
                />
                <button 
                  type="button" 
                  onClick={handleSearchArtwork}
                  disabled={searchingArtwork}
                  className="btn-search-artwork"
                >
                  {searchingArtwork ? 'Searching...' : '🔍 Find Artwork'}
                </button>
              </div>
              
              {artworkResults.length > 0 && (
                <div className="artwork-results">
                  <p className="results-label">Select an album cover:</p>
                  <div className="artwork-grid">
                    {artworkResults.map((result, index) => (
                      <div 
                        key={index} 
                        className="artwork-option"
                        onClick={() => handleSelectArtwork(result.artworkUrl)}
                      >
                        <img src={result.artworkUrl} alt={result.albumName} />
                        <p className="artwork-info">
                          {result.albumName}<br />
                          <span>{result.artistName}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="submit">{editingAlbum ? 'Update' : 'Create'} Album</button>
              <button type="button" onClick={handleCloseForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {albums.length === 0 ? (
        <p>You don't have any albums yet! Click "Add New Album" to get started.</p>
      ) : (
        <div className="album-list">
          <p>Total Albums: {albums.length}</p>
          {albums.map((album) => (
            <div key={album._id} className="album-item">
              {album.coverImage && (
                <img src={album.coverImage} alt={`${album.title} cover`} className="album-cover" />
              )}
              <div className="album-details">
                <h3>{album.title}</h3>
                <p>Artist: {album.artist}</p>
                <p>Year: {album.year}</p>
                {album.genre && <p>Genre: {album.genre}</p>}
              </div>
              {/* Only show Edit/Delete to the album owner */}
              {user?._id && album.owner && (album.owner._id === user._id || album.owner === user._id) && (
                <div className="album-actions">
                  <button onClick={() => handleOpenForm(album)}>Edit</button>
                  <button onClick={() => handleDelete(album._id)}>Delete</button>
                </div>
              )}
              
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
      )}
    </div>
  );
}

export default AlbumIndex;