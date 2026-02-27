import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import MatchFinder from './pages/MatchFinder';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import MyTeam from './pages/MyTeam';
import Contact from './pages/Contact';
import { ChevronLeft, LogOut, User, Shield, Settings, MessageSquare, Menu, X } from 'lucide-react';
import logoImg from './assets/logo.png';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

const Navigation = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="glass-card header-container">
      <nav className="nav-container">
        <Link to="/" className="logo-container" onClick={closeMenu}>
          <div className="logo-icon-wrapper">
            <img src={logoImg} alt="Matchvibe Logo" className="logo-img" />
            <div className="logo-glow"></div>
          </div>
          <div className="logo-title-group">
            <h1 className="logo-title">MATCHVIBE</h1>
            <div className="logo-subtext">AMATEUR SOCCER MATCHING</div>
          </div>
        </Link>

        {/* 햄버거 버튼 (모바일 전용) */}
        <button
          className="hamburger-btn"
          onClick={() => setMenuOpen(prev => !prev)}
          aria-label="메뉴 열기"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <ul className={`nav-menu${menuOpen ? ' nav-menu-open' : ''}`}>
          <li>
            <NavLink to="/register" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMenu}>
              팀 등록하기
            </NavLink>
          </li>
          <li>
            <NavLink to="/matches" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMenu}>
              매칭 신청
            </NavLink>
          </li>
          <li>
            <NavLink to="/contact" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMenu}>
              <MessageSquare size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              문의하기
            </NavLink>
          </li>
          <li>
            {user ? (
              <div className="auth-user-area">
                {isAdmin && (
                  <span className="admin-badge">
                    <Shield size={12} /> 관리자
                  </span>
                )}
                <NavLink to="/my-team" className={({ isActive }) => isActive ? 'nav-link active nav-myteam' : 'nav-link nav-myteam'} onClick={closeMenu}>
                  <Settings size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  내 팀 관리
                </NavLink>
                <span className="auth-email">{user.email.split('@')[0]}</span>
                <button className="btn-signout" onClick={handleSignOut}>
                  <LogOut size={15} /> 로그아웃
                </button>
              </div>
            ) : (
              <NavLink to="/login" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link nav-login'} onClick={closeMenu}>
                <User size={15} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                로그인
              </NavLink>
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="stadium-bg"></div>
        <div className="star-field"></div>

        <Navigation />

        <main style={{ flex: 1, padding: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%', position: 'relative' }}>
          <BackLink />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/matches" element={<MatchFinder />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/my-team" element={<MyTeam />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>

        <footer style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          &copy; 2026 MATCHVIBE. CHAMPIONS EXPERIENCE FOR AMATEURS.
        </footer>
      </AuthProvider>
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
