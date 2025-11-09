import React from 'react';
import { Link } from 'react-router-dom';
import { Trash, ShoppingCart } from 'lucide-react';
import { addToCart } from '../utils/cart';

export default function ProductCard({ carta, onDelete }) {
  if (!carta || !carta.id) return null;

  const formattedPrice = Number(carta.preco).toFixed(2);

const handleBuyClick = async (e) => {
    e.preventDefault();
    await addToCart(carta);
  };

  return (
    <Link to={`/carta/${carta.id}`} className="product-card">
      {carta.imagem_url ? (
        <img src={carta.imagem_url} alt={carta.nome} className="product-card-image" />
      ) : (
        <div className="product-card-image-placeholder">
          <span>Sem Imagem</span>
        </div>
      )}

      <h4 className="product-card-name">{carta.nome}</h4>
      <div className="product-card-footer">
        <p className={`product-card-stock ${carta.quantidade > 0 ? 'in-stock' : 'out-of-stock'}`}>
          {carta.quantidade > 0 ? `${carta.quantidade} unidades` : 'Indisponível'}
        </p>
        <p className="product-card-price">R$ {formattedPrice}</p>
      </div>

      <div className="product-card-actions">
        <button
          className="action-btn buy-btn"
          title="Adicionar ao Carrinho"
          onClick={handleBuyClick}
          disabled={carta.quantidade === 0}
        >
          <ShoppingCart size={18} />
        </button>

        {onDelete && (
          <button 
            className="action-btn delete-btn"
            title="Excluir Carta"
            onClick={(e) => {
              e.preventDefault();
              onDelete(carta.id, carta.nome);
            }}
          >
            <Trash size={18} />
          </button>
        )}
      </div>
    </Link>
  );
}