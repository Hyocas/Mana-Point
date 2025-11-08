import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart } from 'lucide-react';

export default function Header() {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogout = () => {
      localStorage.removeItem('authToken');
      window.location.reload();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      navigate('/');
    } else {
      navigate(`/?search=${encodeURIComponent(searchTerm)}`);
    }
  }

  return (
    <header className="main-header style-b">
      <div className="header-content style-b">
        <Link to="/" className="logo-link">
          <img src="/logo-transparente.png" alt="Mana-Point Logo" className="header-logo" />
        </Link>

        <form className="header-search-form" onSubmit={handleSearch}>
            <input
                type="text"
                placeholder="Pesquisar carta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" title="Buscar">
                <Search size={15} />
            </button>
        </form>
        
        <div className="header-actions style-b">
           {token ? (
             <button onClick={handleLogout} className="auth-button">Sair</button>
           ) : (
             <button onClick={() => navigate('/login')} className="auth-button">Entrar</button>
           )}
          <Link to="/carrinho" className="action-item" title="Ver Carrinho">
            <ShoppingCart size={24} />           
            <span className="cart-count">
              {localStorage.getItem('cartItemCount') || 0}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}