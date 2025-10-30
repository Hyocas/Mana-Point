import { NavLink } from 'react-router-dom';

const categories = [
  { name: 'Yu-Gi-Oh!', path: '/catalog' },      
];

export default function Navbar() {
  return (
    <nav className="main-navbar style-b">
      <ul>
        {categories.map(cat => (
          <li key={cat.name}>
            <NavLink 
              to={cat.path} 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              title="Categoria (em breve!)"
            >
              {cat.name}
            </NavLink>
          </li>
        ))}
         <li><span className="nav-link placeholder" title="Em breve!">Magic</span></li>
         <li><span className="nav-link placeholder" title="Em breve!">Pokémon</span></li>
         <li><span className="nav-link placeholder" title="Em breve!">Mais Produtos</span></li>
      </ul>
    </nav>
  );
}