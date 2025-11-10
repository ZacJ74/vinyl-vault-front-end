import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Header() {
  const { isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  return (
    <nav className="header-nav">
      <div className="nav-brand">
        <Link to="/" className="brand-link">
          <span className="vinyl-icon">🎵</span>
          <span className="brand-name">VinylVault</span>
        </Link>
      </div>
      <div className="nav-links">
        <Link to="/community">Community</Link>
        {isAuthenticated ? (
          <>
            <Link to="/albums">My Collection</Link>
            <span className="user-greeting">Hello, {user?.username}!</span>
            <button onClick={handleSignOut} className="btn-signout">Sign Out</button>
          </>
        ) : (
          <>
            <Link to="/sign-in">Sign In</Link>
            <Link to="/sign-up">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Header;