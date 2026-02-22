import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import MatchFinder from './pages/MatchFinder';
import { ChevronLeft } from 'lucide-react';
import './index.css';

const Navigation = () => {
  const location = useLocation();

  return (
    <header className="glass-card header-container">
      <nav className="nav-container">
        <Link to="/" className="logo-container">
          <div className="logo-icon">
            <div className="logo-bg"></div>
            <div className="logo-text">M&V</div>
            {[0, 72, 144, 216, 288].map(deg => (
              <div key={deg} className="logo-star" style={{ transform: `rotate(${deg}deg) translateY(-22px)` }}></div>
            ))}
          </div>
          <h1 className="logo-title">
            MATCHVIBE
          </h1>
        </Link>

        <ul className="nav-menu">
          <li>
            <NavLink to="/register" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              팀 등록하기
            </NavLink>
          </li>
          <li>
            <NavLink to="/matches" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              매칭 신청
            </NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
};

function App() {
  return (
    <Router>
      <div className="stadium-bg"></div>
      <div className="star-field"></div>

      <Navigation />

      <main style={{ flex: 1, padding: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%', position: 'relative' }}>
        <BackLink />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/matches" element={<MatchFinder />} />
        </Routes>
      </main>

      <footer style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        &copy; 2026 MATCHVIBE. CHAMPIONS EXPERIENCE FOR AMATEURS.
      </footer>
    </Router>
  );
}

const BackLink = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  if (isHome) return null;

  return (
    <button
      onClick={() => navigate(-1)}
      className="btn-outline"
      style={{
        padding: '8px 16px',
        borderRadius: '10px',
        fontSize: '0.85rem',
        minWidth: 'auto',
        height: '40px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      <ChevronLeft size={18} /> 이전으로
    </button>
  );
};

export default App;
