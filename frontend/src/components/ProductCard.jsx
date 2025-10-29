import React from 'react';
import { Link } from 'react-router-dom';

export default function ProductCard({ carta }) {
  if (!carta || !carta.id) {
    return null;
  }

  const formattedPrice = Number(carta.preco).toFixed(2);

  return (
    <Link to={`/carta/${carta.id}`} className="product-card-link">
      <div className="product-card">
        {carta.imagem_url ? (
          <img src={carta.imagem_url} alt={carta.nome} className="product-card-image" />
        ) : (
          <div className="product-card-image-placeholder">
            <span>Sem Imagem</span>
          </div>
        )}
        <h4 className="product-card-name">{carta.nome}</h4>
        <p className="product-card-set-info">
          <p className="product-card-effect">{carta.efeito || 'Sem efeito especial.'}</p>
        </p>
        <p className={`product-card-stock ${carta.quantidade > 0 ? 'in-stock' : 'out-of-stock'}`}>
          {carta.quantidade > 0 ? `${carta.quantidade} un` : 'Indisponível'} 
        </p>
        <p className="product-card-price">R$ {formattedPrice}</p>
        <button className="view-details">Ver detalhes</button>
      </div>
    </Link>
  );
}