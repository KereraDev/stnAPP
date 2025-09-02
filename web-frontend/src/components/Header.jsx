import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { User, ChevronDown, LogOut, Shield, Sparkles, BookText, LayoutDashboard } from 'lucide-react';
import '../styles/Header.css';
import logoStnSaesa from '../assets/stn saesaz.jpeg';

function Header() {
  const navigate = useNavigate();
  const [optimizedLogo, setOptimizedLogo] = useState(() => {
    // Intentar cargar la imagen optimizada desde localStorage al inicializar
    return localStorage.getItem('optimized_logo') || null;
  });

  // Optimizar imagen para mejor visibilidad sin eliminar completamente el fondo
  useEffect(() => {
    const optimizeImage = async () => {
      // Si ya tenemos la imagen optimizada en caché, no la procesamos de nuevo
      const cachedLogo = localStorage.getItem('optimized_logo');
      if (cachedLogo) {
        setOptimizedLogo(cachedLogo);
        return;
      }

      // Solo procesar si no está en caché
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Hacer el fondo blanco semi-transparente en lugar de eliminarlo completamente
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Si el píxel es muy blanco, hacerlo semi-transparente
          if (r > 235 && g > 235 && b > 235) {
            const brightness = (r + g + b) / 3;
            const transparency = Math.max(0.1, 1 - (brightness - 235) / 20 * 0.7);
            data[i + 3] = Math.floor(data[i + 3] * transparency);
          }
          // Mejorar contraste de colores no blancos
          else if (r + g + b < 600) {
            data[i] = Math.min(255, r * 1.1); // R
            data[i + 1] = Math.min(255, g * 1.1); // G  
            data[i + 2] = Math.min(255, b * 1.1); // B
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        const optimizedDataURL = canvas.toDataURL('image/png');
        
        // Guardar en localStorage para persistencia
        localStorage.setItem('optimized_logo', optimizedDataURL);
        setOptimizedLogo(optimizedDataURL);
      };
      img.crossOrigin = 'anonymous';
      img.src = logoStnSaesa;
    };

    optimizeImage();
  }, []);

  let rol = '';
  let userName = '';
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // opcional: si exp existe y está vencido, lo tratamos como no logueado
      if (payload?.exp && Date.now() >= payload.exp * 1000) {
        rol = '';
      } else {
        rol = payload.rol;
      }
      userName = localStorage.getItem('userName') || 'Usuario';
    } catch {
      rol = '';
      userName = 'Usuario';
    }
  }

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    // limpiar todo lo relacionado a sesión/cachés
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('informes_list');
    localStorage.removeItem('dashboard_informes');
    setIsDropdownOpen(false);
    navigate('/', { replace: true });
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
          <div className="logo-container">
            {optimizedLogo ? (
              <img 
                src={optimizedLogo} 
                alt="STN Saesa Logo" 
                className="logo-image"
              />
            ) : (
              <img 
                src={logoStnSaesa} 
                alt="STN Saesa Logo" 
                className="logo-image"
                style={{ opacity: 0.9 }}
              />
            )}
          </div>
        </div>

        <nav className="nav-desktop">
          <Link to="/dashboard" className="nav-link">
            <LayoutDashboard />
            <span>Dashboard</span>
          </Link>
          <Link to="/informes" className="nav-link">
            <BookText className="nav-icon" />
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
              <p className="user-label">{userName}</p>
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
