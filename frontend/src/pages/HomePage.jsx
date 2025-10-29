import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard'; 

export default function HomePage() {
    const [cartas, setCartas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cardNameToAdd, setCardNameToAdd] = useState('');
    const [quantidadeToAdd, setQuantidadeToAdd] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [searching, setSearching] = useState(false);

    const navigate = useNavigate();
    const catalogApiUrl = '/api/catalogo_proxy';

    const token = localStorage.getItem('authToken');

    const fetchCatalog = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${catalogApiUrl}/cartas`);

            const data = await response.json();
            console.log('Resultado search:', data);

            if (!response.ok) throw new Error(data.message || 'Erro ao buscar carta.');

            let cards = Array.isArray(data) ? data : (data ? [data] : []);

            cards = cards
            .filter(c => c)
            .map(c => {
                if (c.id != null && typeof c.id === 'string' && /^\d+$/.test(c.id)) {
                return { ...c, id: Number(c.id) };
                }
                return c;
            })
            .filter(c => c.id != null);

            if (cards.length === 0) {
            alert('Nenhuma carta encontrada.');
            return;
            }

            setCartas(cards);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchCatalog();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        navigate('/'); 
    };

    const handleAddCard = async (e) => {
        e.preventDefault();
        if (!cardNameToAdd.trim()) return;

        try {
            const response = await fetch(`${catalogApiUrl}/cartas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ nome: cardNameToAdd, quantidade: quantidadeToAdd })
            });
            
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Erro ao adicionar carta");

            setCardNameToAdd('');
            fetchCatalog();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteCard = async (cardId, cardName) => {
        if (!confirm(`Tem certeza que deseja deletar a carta "${cardName}"?`)) return;

        try {
            const response = await fetch(`${catalogApiUrl}/cartas/${cardId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status !== 204) {
                 const data = await response.json();
                 throw new Error(data.message || 'Falha ao deletar a carta.');
            }
            fetchCatalog();
        } catch (err) {
            alert(err.message);
        }
    };
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        try {
            setSearching(true);
            const response = await fetch(`${catalogApiUrl}/cartas/search?nome=${encodeURIComponent(searchTerm)}`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Erro ao buscar carta.');

            setCartas(data);
        } catch (err) {
            alert(err.message);
        } finally {
            setSearching(false);
        }
    };

    if (loading) return <p>Carregando catálogo...</p>;
    if (error) return <p className="error">{error}</p>;

    return (
        <div className="homepage-content">
            {token && (
                <form 
                    id="add-card-form" 
                    onSubmit={handleAddCard} 
                    className="add-card-form-style-b">
                    <input 
                        type="text" 
                        placeholder="Nome exato da carta (API YGOPro)"
                        value={cardNameToAdd}
                        onChange={(e) => setCardNameToAdd(e.target.value)}
                        required
                    />
                    <input
                        type="number"
                        min="0"
                        value={quantidadeToAdd}
                        onChange={(e) => setQuantidadeToAdd(Number(e.target.value))}
                        required
                        placeholder="Qtd"
                        style={{ width: '80px', textAlign: 'center' }}
                    />
                    <button type="submit">Adicionar Carta</button>
                </form>
            )}
            <section className="card-grid-section">
                <div className="section-header">
                    <h2>Catálogo Completo</h2> 
                </div>
                <div className="card-grid">
                    {cartas.map(carta => (
                        <ProductCard key={carta.id} carta={carta} /> 
                    ))}
                </div>
            </section>
            
            {cartas.length === 0 && !loading && (
                 <p>{token ? 'Catálogo vazio. Adicione cartas.' : 'Catálogo vazio.'}</p>
            )}
        </div>
    );
}