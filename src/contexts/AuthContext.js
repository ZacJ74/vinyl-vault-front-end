import { createContext, useContext, useState, useEffect } from 'react';
import { signUp, signIn } from '../api/vinylVaultApi'; 

// 1. Create the Context
const AuthContext = createContext();

// 2. Auth Provider Component
export const AuthProvider = ({ children }) => {
  // State to hold the token and user data
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // New loading state for initial check
  
  // Decode JWT to extract user data
  const getUserDataFromToken = (token) => {
    try {
      // Decode the JWT (note: this doesn't verify it, just reads it)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const decoded = JSON.parse(jsonPayload);
      const username = localStorage.getItem('username');
      
      return decoded.payload ? { 
        username: username || decoded.payload.username,
        _id: decoded.payload._id 
      } : null;
    } catch (err) {
      return null;
    }
  };
  
  // --- Helper to save state after successful login/signup ---
  const handleAuthSuccess = (newToken, username) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', username);
    setToken(newToken);
    const userData = getUserDataFromToken(newToken);
    setUser(userData || { username }); 
  };
  
  // --- Core Authentication Functions using the API Service ---
  
  const handleAuth = async (credentials, type) => {
    setIsLoading(true);
    try {
      let newToken;
      const { username, password } = credentials;

      if (type === 'signIn') {
        newToken = await signIn({ username, password });
      } else { 
        newToken = await signUp({ username, password });
      }
      
      handleAuthSuccess(newToken, username);
      return true; // Success
    } catch (error) {
      return false; // Failure
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
    setUser(null);
  };
  
  // Effect to handle initial token check and state hydration
  useEffect(() => {
    if (token) {
      const storedUser = getUserDataFromToken(token);
      if (storedUser) {
        setUser(storedUser);
      } else {
        // If token exists but user data doesn't, clear the token (expired/corrupt)
        signOut();
      }
    }
    setIsLoading(false);
  }, [token]);

  // 3. Provide the state and functions to consumers
  const contextValue = {
    token,
    user,
    isAuthenticated: !!token,
    isLoading,
    signIn: (credentials) => handleAuth(credentials, 'signIn'),
    signUp: (credentials) => handleAuth(credentials, 'signUp'),
    signOut
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 4. Custom Hook for easy consumption
export const useAuth = () => useContext(AuthContext);


