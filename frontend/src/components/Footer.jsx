import { useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

const iconFor = (theme) => theme === 'light' ? <Sun size={18} /> : theme === 'dark' ? <Moon size={18} /> : <Monitor size={18} />;

export default function Footer() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const selectTheme = (t) => {
    setTheme(t);
    setOpen(false);
  };

  return (
    <footer className="main-footer">
      <p>&copy; {new Date().getFullYear()} Mana-Point Card Games. Todos os direitos reservados.</p>
      <div className="footer-actions">
        <div className="dropup">
          <button className="dropup-toggle action-item" onClick={() => setOpen(v => !v)} title={`Tema: ${theme}`}>
            {iconFor(theme)}
          </button>
          {open && (
            <div className="dropup-menu">
              <button className="dropup-item" onClick={() => selectTheme('classic')}>
                {iconFor('classic')} <span>Clássico</span>
              </button>
              <button className="dropup-item" onClick={() => selectTheme('dark')}>
                {iconFor('dark')} <span>Escuro</span>
              </button>
              <button className="dropup-item" onClick={() => selectTheme('light')}>
                {iconFor('light')} <span>Claro</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}