
import { useState } from 'react';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

import '../styles/LoginPage.css';



function LoginForm({ onLogin, onInputFocus, onInputBlur }) {
  const [correo, setCorreo] = useState('');
  const [contraseña, setContrasena] = useState('');
  const [mostrar, setMostrar] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    onLogin({ correo, contraseña });
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <label className="login-label">
        Correo:
        <input
          className="login-input"
          type="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          required
          onFocus={onInputFocus}
          onBlur={onInputBlur}
        />
      </label>
      <label className="login-label">
        Contraseña:
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', position: 'relative' }}>
          <input
            className="login-input"
            type={mostrar ? 'text' : 'password'}
            value={contraseña}
            onChange={(e) => setContrasena(e.target.value)}
            required
            style={{ paddingRight: '38px' }}
            onFocus={onInputFocus}
            onBlur={onInputBlur}
          />
          <button
            type="button"
            onClick={() => setMostrar((v) => !v)}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              height: 'auto',
              display: 'flex',
              alignItems: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#185dc8',
              fontSize: '1.35em',
              padding: 0,
              zIndex: 2,
              opacity: 1,
              transition: 'color 0.2s',
            }}
            tabIndex={-1}
            aria-label={mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {mostrar ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
          </button>
        </div>
      </label>
      <button className="login-btn" type="submit">Entrar</button>
    </form>
  );
}

export default LoginForm;
