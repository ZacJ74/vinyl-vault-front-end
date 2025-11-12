

const BASE_URL = process.env.REACT_APP_BACK_END_SERVER_URL;


// --- API Service Functions ---

/**
 * Handles user sign-in by sending credentials to the server.
 * @param {object} credentials - User email and password.
 * @returns {Promise<object>} - Response containing user profile and token.
 */
const signIn = async (credentials) => {
  try {
    const res = await fetch(
      `${BASE_URL}/auth/sign-in`,
      buildOptions(credentials, 'POST')
    );
    
    // Check if the response was successful
    if (res.ok) {
        const data = await res.json();
        return data.token;
    }

    // Parse error response
    const responseText = await res.text();
    try {
      const errorData = JSON.parse(responseText);
      throw new Error(errorData.err || 'Sign in failed');
    } catch (parseError) {
      throw new Error(`Sign in failed with status ${res.status}`);
    }

  } catch (error) {
    throw error;
  }
};

/*
 * Handles user sign-up by sending profile data to the server.
 * @param {object} profile - User data (name, email, password, etc.).
 * @returns {Promise<object>} - Response containing user profile and token.
 */
const signUp = async (profile) => {
  try {
    const res = await fetch(
      `${BASE_URL}/auth/sign-up`,
      buildOptions(profile, 'POST')
    );
    
    if (res.ok) {
        const data = await res.json();
        return data.token;
    }
    
    // Parse error response
    const responseText = await res.text();
    try {
      const errorData = JSON.parse(responseText);
      throw new Error(errorData.err || 'Sign up failed');
    } catch (parseError) {
      throw new Error(`Sign up failed with status ${res.status}`);
    }

  } catch (error) {
    throw error;
  }
};


// Function to get all albums (Corresponds to your instructor's 'index' function)
// Note: This function now uses the generic BASE_URL.
const getAlbums = async () => {
  try {
    const res = await fetch(`${BASE_URL}/albums`, buildOptions()); // GET request
    // IMPORTANT: fetch responses need to check for errors manually
    if (res.ok) {
        return res.json();
    }
    // Throw an error if the response status is not successful (e.g., 403 Forbidden)
    throw new Error('Failed to fetch albums: ' + res.statusText);
  } catch (err) {
    throw err;
  }
};

const getPublicAlbums = async () => {
  try {
    const res = await fetch(`${BASE_URL}/albums/public`);
    if (res.ok) {
      return res.json();
    }
    throw new Error('Failed to fetch public albums');
  } catch (err) {
    throw err;
  }
};

// Get a single album by ID
const getAlbum = async (id) => {
  try {
    const res = await fetch(`${BASE_URL}/albums/${id}`, buildOptions());
    if (res.ok) {
      return res.json();
    }
    throw new Error('Failed to fetch album');
  } catch (err) {
    throw err;
  }
};

// Create a new album
const createAlbum = async (albumData) => {
  try {
    const res = await fetch(`${BASE_URL}/albums`, buildOptions(albumData, 'POST'));
    if (res.ok) {
      return res.json();
    }
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to create album');
  } catch (err) {
    throw err;
  }
};

// Update an album
const updateAlbum = async (id, albumData) => {
  try {
    const res = await fetch(`${BASE_URL}/albums/${id}`, buildOptions(albumData, 'PUT'));
    if (res.ok) {
      return res.json();
    }
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to update album');
  } catch (err) {
    throw err;
  }
};

// Delete an album
const deleteAlbum = async (id) => {
  try {
    const res = await fetch(`${BASE_URL}/albums/${id}`, buildOptions(null, 'DELETE'));
    if (res.ok || res.status === 204) {
      return true;
    }
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to delete album');
  } catch (err) {
    throw err;
  }
};

// --- Helper Function ---

// Replicating your instructor's buildOptions to handle the JWT token securely
function buildOptions(data, method = 'GET') {
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`, 
      'Content-Type': 'application/json',
    },
  };
  // If we need to send json data with the request (POST, PUT, PATCH)
  if (data) {
    options.body = JSON.stringify(data);
  }
  return options;
}


// --- Review Functions ---

const getReviewsForAlbum = async (albumId) => {
  try {
    const res = await fetch(`${BASE_URL}/reviews/album/${albumId}`, buildOptions());
    if (res.ok) {
      return res.json();
    }
    throw new Error('Failed to fetch reviews');
  } catch (err) {
    throw err;
  }
};

const createReview = async (reviewData) => {
  try {
    const res = await fetch(`${BASE_URL}/reviews`, buildOptions(reviewData, 'POST'));
    if (res.ok) {
      return res.json();
    }
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to create review');
  } catch (err) {
    throw err;
  }
};

const deleteReview = async (reviewId) => {
  try {
    const res = await fetch(`${BASE_URL}/reviews/${reviewId}`, buildOptions(null, 'DELETE'));
    if (res.ok) {
      return true;
    }
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to delete review');
  } catch (err) {
    throw err;
  }
};

// --- External API: iTunes Search for Album Artwork ---

const searchAlbumArtwork = async (artist, albumTitle) => {
  try {
    // Clean up search terms
    const cleanArtist = artist.trim();
    const cleanTitle = albumTitle.trim();
    
    // Try exact match first
    const exactQuery = encodeURIComponent(`${cleanArtist} ${cleanTitle}`);
    let res = await fetch(`https://itunes.apple.com/search?term=${exactQuery}&entity=album&limit=10`);
    
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        // Filter and sort results by relevance
        const results = data.results
          .filter(result => result.artworkUrl100) // Only include results with artwork
          .map(result => ({
            artworkUrl: result.artworkUrl100.replace('100x100', '600x600'), // Get larger image
            albumName: result.collectionName,
            artistName: result.artistName,
            releaseDate: result.releaseDate ? new Date(result.releaseDate).getFullYear() : null
          }));
        
        if (results.length > 0) {
          return results;
        }
      }
    }
    
    // If no results, try artist-only search as fallback
    const artistQuery = encodeURIComponent(cleanArtist);
    res = await fetch(`https://itunes.apple.com/search?term=${artistQuery}&entity=album&limit=10`);
    
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return data.results
          .filter(result => result.artworkUrl100)
          .map(result => ({
            artworkUrl: result.artworkUrl100.replace('100x100', '600x600'),
            albumName: result.collectionName,
            artistName: result.artistName,
            releaseDate: result.releaseDate ? new Date(result.releaseDate).getFullYear() : null
          }));
      }
    }
    
    return [];
  } catch (err) {
    console.error('Album artwork search error:', err);
    return [];
  }
};

export { 
  getAlbums,
  getPublicAlbums, 
  getAlbum, 
  createAlbum, 
  updateAlbum, 
  deleteAlbum, 
  getReviewsForAlbum,
  createReview,
  deleteReview,
  searchAlbumArtwork,
  signIn, 
  signUp 
};