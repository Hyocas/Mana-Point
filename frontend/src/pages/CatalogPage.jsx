import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Link, useNavigate } from 'react-router-dom';

export default function CatalogPage() {
    const [cartas, setCartas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cardNameToAdd, setCardNameToAdd] = useState('');

    const navigate = useNavigate();
    const catalogApiUrl = 'http://localhost:3000/api';

    const token = localStorage.getItem('authToken');

    const fetchCatalog = async () => {
        try {
            setLoading(true);
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
                body: JSON.stringify({ nome: cardNameToAdd })
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
                        <Link to="/" className="nav-link">Fazer Login</Link>
                    )}
                </div>
            </div>

            {token && (
                <form id="add-card-form" onSubmit={handleAddCard} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <input 
                        type="text" 
                        style={{ flexGrow: 1 }}
                        placeholder="Buscar e adicionar carta pelo nome exato..."
                        value={cardNameToAdd}
                        onChange={(e) => setCardNameToAdd(e.target.value)}
                    />
                    <button style={{ width: 'auto' }} type="submit">Adicionar</button>
                </form>
            )}

            <div id="catalog-container">
                {cartas.map(carta => (
                    <Link to={`/carta/${carta.id}`} key={carta.id} style={{textDecoration: 'none', color: 'inherit'}}>
                        <div className="card">
                            <h3>{carta.nome}</h3>
                            <p><strong>Tipo:</strong> {carta.tipo || 'N/A'}</p>
                            <p><strong>Ataque/Defesa:</strong> {carta.ataque ?? 'N/A'}/${carta.defesa ?? 'N/A'}</p>
                            <p>{carta.efeito || 'Sem efeito especial.'}</p>
                        <p className="price">R$ {carta.preco}</p>
                        {token && (
                            <button className="delete-btn" onClick={() => handleDeleteCard(carta.id, carta.nome)}>Deletar</button>
                        )}
                    </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}