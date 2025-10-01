import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function CatalogPage() {
    const [cartas, setCartas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newCardName, setNewCardName] = useState('');

    const navigate = useNavigate();
    const catalogApiUrl = 'http://localhost:3000/api';
    const token = localStorage.getItem('authToken');

    const fetchCatalog = async () => {
        try {
            const response = await fetch(`${catalogApiUrl}/cartas`);
            if (!response.ok) throw new Error('Falha ao buscar dados do catálogo.');
            const data = await response.json();
            setCartas(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchCatalog();
    }, []); // O array vazio [] garante que rode so uma vez

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        navigate('/'); 
    };

    const handleAddCard = async (e) => {
        e.preventDefault();
        if (!newCardName.trim()) return;

        try {
            // Nota: O backend esta espera o objeto completo, mando apenas o nome por enquanto
            // Para funcionar 100%, o backend POST /cartas precisa ser ajustado ***
            const response = await fetch(`${catalogApiUrl}/cartas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ nome: newCardName, preco: 0 }) 
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Erro ao adicionar carta");
            }

            setNewCardName('');
            fetchCatalog(); 
        } catch (err) {
            alert(err.message);
        }
    };
    
    // Função para deletar uma carta
    const handleDeleteCard = async (cardId, cardName) => {
        if (!confirm(`Tem certeza que deseja deletar a carta "${cardName}"?`)) return;

        try {
            const response = await fetch(`${catalogApiUrl}/cartas/${cardId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao deletar a carta.');
            fetchCatalog();
        } catch (err) {
            alert(err.message);
        }
    };


    if (loading) return <p>Carregando catálogo...</p>;
    if (error) return <p className="error">{error}</p>;

    return (
        <div className="catalog-page">
            <div className="catalog-header">
                <h2>Catálogo de Cartas</h2>
                <div id="header-nav">
                    {token ? (
                        <button id="logout-btn" onClick={handleLogout}>Logout</button>
                    ) : (
                        <Link to="/" className="nav-link">Voltar para Login</Link>
                    )}
                </div>
            </div>

            {/* Formulário de Adicionar Carta (só aparece se estiver logado) */}
            {token && (
                <form id="add-card-form" onSubmit={handleAddCard} style={{ marginBottom: '20px' }}>
                    <input 
                        type="text" 
                        id="nomeCarta" 
                        placeholder="Nome da nova carta"
                        value={newCardName}
                        onChange={(e) => setNewCardName(e.target.value)}
                    />
                    <button id="addCardBtn" type="submit">Adicionar Carta</button>
                </form>
            )}

            <div id="catalog-container">
                {cartas.map(carta => (
                    <div className="card" key={carta.id}>
                        <h3>{carta.nome}</h3>
                        <p><strong>Tipo:</strong> {carta.tipo || 'N/A'}</p>
                        <p><strong>Ataque/Defesa:</strong> {carta.ataque ?? 'N/A'}/${carta.defesa ?? 'N/A'}</p>
                        <p>{carta.efeito || 'Sem efeito especial.'}</p>
                        <p className="price">R$ {carta.preco}</p>

                        {/* Botão de Deletar (só aparece se estiver logado) */}
                        {token && (
                            <button 
                                className="delete-btn" 
                                onClick={() => handleDeleteCard(carta.id, carta.nome)}
                            >
                                Deletar
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}