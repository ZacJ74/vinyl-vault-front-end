import React, { useState, useEffect } from 'react';
import { getAlbums, createAlbum, updateAlbum, deleteAlbum } from '../api/vinylVaultApi'; 
import { useAuth } from '../contexts/AuthContext';

function AlbumIndex() {
  const [albums, setAlbums] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState(null);
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
    setShowForm(true);
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
    if (window.confirm('Are you sure you want to delete this album?')) {
      try {
        await deleteAlbum(id);
        fetchAlbums();
      } catch (err) {
        alert('Error deleting album: ' + err.message);
      }
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
              <input
                type="url"
                id="coverImage"
                name="coverImage"
                value={formData.coverImage}
                onChange={handleChange}
              />
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AlbumIndex;