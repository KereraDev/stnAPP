import { Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { User, ChevronDown, LogOut, Shield, Sparkles, BookText, LayoutDashboard } from 'lucide-react';
import '../styles/Header.css';

function Header() {
  let rol = '';
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      rol = payload.rol;
    } catch {
      rol = '';
    }
  }

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <div className="logo-icon">
            <Sparkles className="logo-icon-svg" />
          </div>
          <div>
            <h1 className="logo-title">STN Saesa</h1>
            <p className="logo-subtitle">Sistema de Lavados</p>
          </div>
        </div>

        <nav className="nav-desktop">
          <Link to="/dashboard" className="nav-link">
          <LayoutDashboard />
          <span>Dashboard</span>
          </Link>
          <Link to="/informes" className="nav-link">
          <BookText className="nav-icon"/>
          <span>Informes</span>
          </Link>
          {rol === 'admin' && (
            <Link to="/admin" className="nav-link">
              <Shield className="nav-icon" />
              <span>Panel Admin</span>
            </Link>
          )}
        </nav>

        <div className="user-menu" ref={dropdownRef}>
          <button className="user-button" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
            <div className="user-icon-bg">
              <User className="user-icon" />
            </div>
            <div className="user-info">
              <p className="user-label">Usuario</p>
              <p className="user-role">{rol || 'No identificado'}</p>
            </div>
            <ChevronDown className={`chevron ${isDropdownOpen ? 'rotate' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="dropdown">
              <div className="dropdown-header">
                <p className="dropdown-title">Información de usuario</p>
                <p className="dropdown-role">
                  {rol === 'admin' && <Shield className="dropdown-icon" />}
                  {rol || 'No identificado'}
                </p>
              </div>
              <button className="dropdown-item logout" onClick={handleLogout}>
                <LogOut className="dropdown-icon" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
