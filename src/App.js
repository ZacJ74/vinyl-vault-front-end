import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import { AuthProvider, useAuth } from './contexts/AuthContext';


// Import the new private page component
import AlbumIndex from './pages/AlbumIndex'; 
import HomePage from './pages/HomePage';
import CommunityPage from './pages/CommunityPage'; 
import NotFoundPage from './pages/NotFoundPage'; 
import AuthForm from './forms/AuthForm';
// --- Component Definition ---

// A helper component to protect routes based on authentication state
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    // Optional: Render a loading spinner while checking auth status
    return <div>Loading user session...</div>; 
  }

  // If authenticated, render the children (the protected component)
  // Otherwise, redirect them to the sign-in page
  return isAuthenticated ? children : <Navigate to="/sign-in" replace />;
};


function App() {
  return (
    <Router>
      {/* AuthProvider wraps the entire application to provide context */}
      <AuthProvider>
        <Header />
        <main className="container">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/sign-in" element={<AuthForm mode="signin" />} />
            <Route path="/sign-up" element={<AuthForm mode="signup" />} />

            {/* Private Route: Album Index */}
            {/* The PrivateRoute wrapper ensures this path is only accessible 
                if the user has a valid, non-expired JWT token. */}
            <Route 
              path="/albums" 
              element={
                <PrivateRoute>
                  <AlbumIndex />
                </PrivateRoute>
              } 
            />

            {/* Catch-all route for 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </AuthProvider>
    </Router>
  );
}

export default App;