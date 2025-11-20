import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { addToCart } from '../utils/cart';
import { Icons } from '../utils/icons';
import ProductCard from '../components/ProductCard';

export default function CardDetailPage() {
    const [carta, setCarta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [maisCartas, setMaisCartas] = useState([]);
    const { id } = useParams();

    useEffect(() => {
        const fetchCard = async () => {
            try {
                const response = await fetch(`/api/catalogo_proxy/cartas/${id}`);
                if (!response.ok) throw new Error('Carta não encontrada.');
                const data = await response.json();
                setCarta(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchCard();
    }, [id]);

    useEffect(() => {
        const fetchMais = async () => {
            if (!carta) return;
            try {
                const resp = await fetch('/api/catalogo_proxy/cartas');
                const data = await resp.json();
                if (!resp.ok) return;
                let cards = Array.isArray(data) ? data : (data ? [data] : []);
                cards = cards
                    .filter(c => c && c.id !== carta.id)
                    .map(c => {
                        if (c.id != null && typeof c.id === 'string' && /^\d+$/.test(c.id)) {
                            return { ...c, id: Number(c.id) };
                        }
                        return c;
                    })
                    .filter(c => c.id != null)
                    .slice(0, 12);
                setMaisCartas(cards);
            } catch (e) {
                console.error(e);
            }
        };
        fetchMais();
    }, [carta]);

    const handleAddToCart = async () => {
        if (!carta || carta.quantidade <= 0) return;
        await addToCart(carta);
    };

    if (loading) return <div className="card-detail-page"><p>Carregando carta...</p></div>;
    if (!carta) return <div className="card-detail-page"><p>Carta não encontrada. <Link to="/" className="back-link">Voltar ao Catálogo</Link></p></div>;

    const isOutOfStock = carta.quantidade <= 0;

    return (
        <div className="card-detail-page">
            <div className="card-detail-back">
                <Link to="/" className="back-link">← Voltar ao Catálogo</Link>
            </div>
            <div className="card-detail-layout">
                <div className="card-detail-image-section">
                    {carta.imagem_url && (
                        <img src={carta.imagem_url} alt={carta.nome} className="card-detail-img" />
                    )}
                    <div className="card-action-block">
                        <div className="price-display">R$ {Number(carta.preco).toFixed(2)}</div>
                        <button
                            onClick={handleAddToCart}
                            disabled={isOutOfStock}
                            className="buy-btn"
                        >
                            {isOutOfStock ? 'Esgotado' : 'Adicionar ao Carrinho'}
                        </button>
                    </div>
                </div>
                <div className="card-info-section">
                    <div className="card-info-header">
                        <div className="card-subtitle">{carta.tipo || 'Card'}</div>
                        <h1 className="card-title-gradient">{carta.nome}</h1>
                        <div className="stats-row">
                            <div className="stat-badge">
                                <span style={{ color: '#e53e3e' }}>{Icons.type}</span>
                                <span>{carta.tipo?.split(' ')[0]}</span>
                            </div>
                            {carta.tipo !== 'Spell Card' && carta.tipo !== 'Trap Card' && (
                                <>
                                    <div className="stat-badge">
                                        <span style={{ color: '#e53e3e' }}>{Icons.sword}</span>
                                        <span>{carta.ataque || 0} ATK</span>
                                    </div>
                                    <div className="stat-badge">
                                        <span style={{ color: '#3182ce' }}>{Icons.shield}</span>
                                        <span>{carta.defesa || 0} DEF</span>
                                    </div>
                                </>
                            )}
                            <div className={`stat-badge ${isOutOfStock ? 'out-stock' : 'in-stock'}`}>
                                {isOutOfStock ? 'Produto indisponível' : `✔ ${carta.quantidade} em estoque`}
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 className="details-heading">Detalhes & Efeitos</h3>
                        <div className="description-box">{carta.efeito || 'Sem descrição disponível.'}</div>
                    </div>
                </div>
            </div>
            {maisCartas.length > 0 && (
                <section className="card-grid-section" style={{ marginTop: '3rem' }}>
                    <div className="section-header">
                        <h3>Outras Cartas</h3>
                        <Link to="/" className="see-all-link">Ver Catálogo</Link>
                    </div>
                    <div className="card-grid">
                        {maisCartas.map(c => (
                            <ProductCard key={c.id} carta={c} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}