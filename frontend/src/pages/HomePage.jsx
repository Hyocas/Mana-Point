import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import * as jwtDecodeModule from 'jwt-decode';
const jwtDecode = jwtDecodeModule && jwtDecodeModule.default ? jwtDecodeModule.default : jwtDecodeModule;

export default function HomePage() {
    const [cartas, setCartas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cardNameToAdd, setCardNameToAdd] = useState('');
    const [quantidadeToAdd, setQuantidadeToAdd] = useState(1);

    const navigate = useNavigate();
    const catalogApiUrl = '/api/catalogo_proxy';
    const carrinhoApiUrl = '/api/carrinho_proxy';

    const token = localStorage.getItem('authToken');
    const [searchParams] = useSearchParams();

    // ---------------- Funcionário ----------------
    let isFuncionario = false;
    if (token) {
        try {
            const decoded = jwtDecode(token);
            isFuncionario = decoded.cargo === "funcionario";
        } catch (err) {
            console.warn("Token inválido ou malformado.");
        }
    }

    // ------------------- Fetch catálogo -------------------
    const fetchCatalog = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${catalogApiUrl}/cartas`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Erro ao buscar cartas.');

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

            setCartas(cards);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const query = searchParams.get('search');

        const searchCards = async (term) => {
            try {
                setLoading(true);
                setError(null);
                const response = await fetch(`${catalogApiUrl}/cartas/search?nome=${encodeURIComponent(term)}`);
                const data = await response.json();
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

                setCartas(cards);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (query) {
            searchCards(query);
        } else {
            fetchCatalog();
        }
    }, [searchParams]);

    // ------------------- Adicionar carta -------------------
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
            if (data.jaExistente) {
                alert(data.message);
            } else {
                alert("Carta adicionada com sucesso!");
            }
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
                throw new Error(data.message || 'Falha ao deletar carta.');
            }
            fetchCatalog();
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <p>Carregando catálogo...</p>;
    if (error) return <p className="error">{error}</p>;

    return (
        <div className="homepage-content">

            {isFuncionario && (
                <form 
                    id="add-card-form" 
                    onSubmit={handleAddCard}
                    className="add-card-form-style-b"
                    style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}
                >
                    <input 
                        type="text" 
                        placeholder="Nome exato da carta (API YGOPro)"
                        value={cardNameToAdd}
                        onChange={(e) => setCardNameToAdd(e.target.value)}
                        required
                        style={{ flexGrow: 1 }}
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
                    <h3>Catálogo Completo</h3> 
                </div>
                <div className="card-grid">
                    {cartas.map(carta => (
                        <ProductCard 
                            key={carta.id} 
                            carta={carta} 
                            onDelete={isFuncionario ? () => handleDeleteCard(carta.id, carta.nome) : null}
                        />
                    ))}
                </div>
            </section>

            {cartas.length === 0 && !loading && (
                <p>{isFuncionario ? 'Catálogo vazio. Adicione cartas.' : 'Nenhuma carta encontrada.'}</p>
            )}
        </div>
    );
}