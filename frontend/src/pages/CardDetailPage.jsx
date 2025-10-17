import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function CardDetailPage() {
    const [carta, setCarta] = useState(null);
    const [loading, setLoading] = useState(true);
    const { id } = useParams();
    const catalogApiUrl = 'http://localhost:3000/api';

    useEffect(() => {
        const fetchCard = async () => {
            try {
                const response = await fetch(`${catalogApiUrl}/cartas/${id}`);
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

    if (loading) return <p>Carregando carta...</p>;
    if (!carta) return <p>Carta não encontrada. <Link to="/catalog">Voltar ao Catálogo</Link></p>;

    return (
        <div className="container">
            <div className="card" style={{margin: 'auto'}}>
                <h3>{carta.nome}</h3>
                <p><strong>Tipo:</strong> {carta.tipo || 'N/A'}</p>
                <p><strong>Ataque/Defesa:</strong> {carta.ataque ?? 'N/A'}/${carta.defesa ?? 'N/A'}</p>
                <p>{carta.efeito || 'Sem efeito especial.'}</p>
                <p className="price">R$ {carta.preco}</p>
                <button className="add-to-cart-btn">Adicionar ao Carrinho</button>
                <br/>
                <Link to="/catalog">Voltar ao Catálogo</Link>
            </div>
        </div>
    );
}