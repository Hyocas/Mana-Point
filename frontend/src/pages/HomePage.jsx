import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { jwtDecode } from 'jwt-decode';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
});

const LOW_STOCK_LIMIT = 5;

export default function HomePage() {
    const [cartas, setCartas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cardNameToAdd, setCardNameToAdd] = useState('');
    const [quantidadeToAdd, setQuantidadeToAdd] = useState(1);

    const catalogApiUrl = '/api/catalogo_proxy';

    const token = localStorage.getItem('authToken');
    const [searchParams] = useSearchParams();

    // ---------------- Funcionário ----------------
    let isFuncionario = false;
    console.log("Token encontrado:", token);

    if (token) {
        try {
            const decoded = jwtDecode(token);
            console.log("Token decodificado:", decoded);

            isFuncionario = decoded.cargo === "funcionario";
            console.log("É funcionário?", isFuncionario);
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
            setQuantidadeToAdd(1);
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

    const handleDeleteAllCards = async () => {
        if (!token) {
            alert('É necessário estar autenticado como funcionário para executar esta ação.');
            return;
        }

        if (!confirm('Tem certeza que deseja deletar todo o catálogo?')) return;

        try {
            const response = await fetch(`${catalogApiUrl}/cartas`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status !== 204) {
                const data = await response.json();
                throw new Error(data.message || 'Falha ao deletar todas as cartas.');
            }
            fetchCatalog();
        } catch (err) {
            alert(err.message);
        }
    };

    const totalEstoque = cartas.reduce((sum, carta) => sum + (Number(carta.quantidade) || 0), 0);
    const lowStockCount = cartas.filter((carta) => {
        const quantidade = Number(carta.quantidade) || 0;
        return quantidade > 0 && quantidade <= LOW_STOCK_LIMIT;
    }).length;
    const zeroStockCount = cartas.filter((carta) => (Number(carta.quantidade) || 0) === 0).length;
    const sortedCartas = [...cartas].sort((a, b) => (a?.nome || '').localeCompare(b?.nome || ''));

    const formatCurrencyValue = (value) => {
        if (value === null || value === undefined || value === '') return '--';
        const parsed = Number(value);
        if (Number.isNaN(parsed)) return '--';
        return currencyFormatter.format(parsed);
    };

    const getStatusClass = (qty) => {
        if (qty === 0) return 'status-pill danger';
        if (qty <= LOW_STOCK_LIMIT) return 'status-pill warning';
        return 'status-pill success';
    };

    const getStatusLabel = (qty) => {
        if (qty === 0) return 'Esgotada';
        if (qty <= LOW_STOCK_LIMIT) return 'Baixo estoque';
        return 'Disponível';
    };

    const renderFuncionarioDashboard = () => (
        <div className="inventory-dashboard">
            <div className="inventory-header">
                <div>
                    <h2>Painel do Catálogo</h2>
                </div>
                <button type="button" className="ghost-button" onClick={fetchCatalog}>
                    Atualizar lista
                </button>
            </div>

            <div className="inventory-summary-grid">
                <div className="summary-card">
                    <span>Cartas únicas</span>
                    <strong>{cartas.length}</strong>
                </div>
                <div className="summary-card">
                    <span>Total em estoque</span>
                    <strong>{totalEstoque}</strong>
                </div>
                <div className="summary-card warning">
                    <span>Baixo estoque (&lt;= {LOW_STOCK_LIMIT})</span>
                    <strong>{lowStockCount}</strong>
                </div>
                <div className="summary-card danger">
                    <span>Esgotadas</span>
                    <strong>{zeroStockCount}</strong>
                </div>
            </div>

            <form 
                id="add-card-form"
                onSubmit={handleAddCard}
                className="quick-add-form"
            >
                <div className="quick-add-field name-field">
                    <label>Nome exato da carta</label>
                    <input
                        type="text"
                        placeholder="Nome na API YGOPro"
                        value={cardNameToAdd}
                        onChange={(e) => setCardNameToAdd(e.target.value)}
                        required
                    />
                </div>
                <div className="quick-add-field quantity-field">
                    <label>Quantidade</label>
                    <input
                        type="number"
                        min="0"
                        value={quantidadeToAdd}
                        onChange={(e) => setQuantidadeToAdd(Number(e.target.value))}
                        required
                    />
                </div>
                <div className="quick-add-actions">
                    <button type="submit">Adicionar carta(s)</button>
                    <button
                        type="button"
                        className="table-action danger quick-delete-button"
                        onClick={handleDeleteAllCards}
                    >
                        Remover catálogo
                    </button>
                </div>
            </form>

            <div className="inventory-table-wrapper">
                {sortedCartas.length === 0 ? (
                    <p className="inventory-empty">Nenhuma carta cadastrada. Utilize o formulário acima para adicionar.</p>
                ) : (
                    <table className="inventory-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Quantidade</th>
                                <th>Estoque</th>
                                <th>Preço</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedCartas.map((carta) => {
                                const quantidade = Number(carta.quantidade) || 0;
                                return (
                                    <tr key={carta.id}>
                                        <td>
                                            <div className="inventory-name-cell">
                                                <strong>{carta.nome || 'Sem nome'}</strong>
                                                {carta.modelo && <span className="inventory-subtitle">{carta.modelo}</span>}
                                            </div>
                                        </td>
                                        <td>{quantidade}</td>
                                        <td>
                                            <span className={getStatusClass(quantidade)}>{getStatusLabel(quantidade)}</span>
                                        </td>
                                        <td>{formatCurrencyValue(carta.preco)}</td>
                                        <td>
                                            <div className="inventory-actions">
                                                <button
                                                    type="button"
                                                    className="table-action danger"
                                                    onClick={() => handleDeleteCard(carta.id, carta.nome)}
                                                >
                                                    Remover
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );

    if (loading) return <p>Carregando catálogo...</p>;
    if (error) return <p className="error">{error}</p>;
    if (isFuncionario) return renderFuncionarioDashboard();

    return (
        <div className="homepage-content">
            <section className="card-grid-section">
                <div className="section-header">
                    <h3>Catálogo Completo</h3> 
                </div>
                <div className="card-grid">
                    {cartas.map(carta => (
                        <ProductCard 
                            key={carta.id} 
                            carta={carta} 
                        />
                    ))}
                </div>
            </section>

            {cartas.length === 0 && !loading && (
                <p>Nenhuma carta encontrada.</p>
            )}
        </div>
    );
}