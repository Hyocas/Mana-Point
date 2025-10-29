import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart } from 'lucide-react';

export default function Header() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const token = localStorage.getItem('authToken');

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    alert(`Busca por "${searchTerm}" na categoria "${category}" ainda não implementada.`);
  };

  const handleLogout = () => {
      localStorage.removeItem('authToken');
      window.location.reload();
  };

  return (
    <header className="main-header style-b">
      <div className="header-content style-b">
        <Link to="/" className="logo-link">
          <img src="/logo-transparente.png" alt="Mana-Point Logo" className="header-logo" />
        </Link>
        
        <form className="search-bar style-b" onSubmit={handleSearch}>
          <select 
            className="category-select" 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">Todas</option>
            <option value="yugioh">Yu-Gi-Oh!</option>
            <option value="pokemon">Pokémon</option>
            <option value="magic">Magic</option>
          </select>
          <input 
            type="text" 
            placeholder="Buscar em Todas..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
          <button type="submit"><Search size={18} /></button>
        </form>
        
        <div className="header-actions style-b">
           {token ? (
             <button onClick={handleLogout} className="auth-button">Sair</button>
           ) : (
             <button onClick={() => navigate('/login')} className="auth-button">Entrar</button>
           )}
          <Link to="/carrinho" className="action-item" title="Ver Carrinho">
            <ShoppingCart size={24} />           
            <span className="cart-count">0</span>
          </Link>
        </div>
      </div>
    </header>
  );
}