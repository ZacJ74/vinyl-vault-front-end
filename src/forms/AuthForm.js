import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/*
 * Reusable form component for both Sign In and Sign Up.
 * @param {string} mode - 'signin' or 'signup'
 */
function AuthForm({ mode }) {
  const [formData, setFormData] = useState({
    username: '', // Assuming 'username' is what your API expects for email/username
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  // Determine if we are in sign-in or sign-up mode
  const isSignIn = mode === 'signin';
  const pageTitle = isSignIn ? 'Sign In' : 'Sign Up';

  // Handle form field changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(''); // Clear previous errors on change
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      let success;
      
      if (isSignIn) {
        success = await signIn(formData);
      } else {
        success = await signUp(formData);
      }
      
      if (success) {
        // Redirect to the main private page upon successful authentication
        navigate('/albums', { replace: true });
      } else {
        // The API service should throw an error, but as a fallback:
        setError('Authentication failed. Check credentials/server logs.');
      }
    } catch (err) {
      // Display the error message thrown by the signIn/signUp API functions
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-form-container">
      <h2>{pageTitle} to Vinyl Vault</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username/Email:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        
        {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Processing...' : pageTitle}
        </button>
      </form>
    </div>
  );
}


export default AuthForm; 