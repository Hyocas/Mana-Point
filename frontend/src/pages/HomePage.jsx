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
const [ydkUploading, setYdkUploading] = useState(false);

const navigate = useNavigate();
const catalogApiUrl = '/api/catalogo_proxy';
const token = localStorage.getItem('authToken');

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
    fetchCatalog();
}, []);

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

// ------------------- Upload YDK -------------------
const handleYdkUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setYdkUploading(true);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
        try {
            const text = e.target.result;
            const lines = text.split('\n');

            const allCardIds = lines
                .map(line => line.trim())
                .filter(line => /^\d+$/.test(line));

            if (allCardIds.length === 0) {
                throw new Error("Nenhum ID de carta válido encontrado no arquivo.");
            }

            const cardCountMap = allCardIds.reduce((countMap, cardId) => {
                countMap[cardId] = (countMap[cardId] || 0) + 1;
                return countMap;
            }, {});

        const uniqueCardIds = Object.keys(cardCountMap);
        const response = await fetch(`${catalogApiUrl}/cartas/ydk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ deckList: uniqueCardIds })
        });

        const data = await response.json();
        
        if (!response.ok) {
             throw new Error(data.message || 'Erro ao processar arquivo .ydk');
        }
    
            alert(`Catálogo atualizado com ${data.length} cartas únicas.`);
            fetchCatalog(); // Atualiza a exibição do catálogo
            if (window.confirm("Catálogo atualizado. Deseja adicionar essas cartas ao seu carrinho agora?")) {
            console.log("Adicionando ao carrinho (lógica pendente):", cardCountMap);
            alert("Deck adicionado ao carrinho! (Funcionalidade pendente)");
            }
        } catch (err) {
            alert(err.message);
        } finally {
             event.target.value = null; // Limpa o input de arquivo
             setYdkUploading(false);
        }
    };
    reader.onerror = () => {
        alert("Erro ao ler o arquivo.");
        event.target.value = null;
        setYdkUploading(false);
    };
    
    reader.readAsText(file);
};

// ------------------- Deletar carta -------------------
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

// ------------------- Buscar carta -------------------
const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    try {
        setSearching(true);
        const response = await fetch(`${catalogApiUrl}/cartas/search?nome=${encodeURIComponent(searchTerm)}`);
        const data = await response.json();

        if (!response.ok) throw new Error(data.message || 'Erro ao buscar carta.');

        setCartas(Array.isArray(data) ? data : [data]);
    } catch (err) {
        alert(err.message);
    } finally {
        setSearching(false);
    }
};

// ------------------- Render -------------------
if (loading) return <p>Carregando catálogo...</p>;
if (error) return <p className="error">{error}</p>;

return (
    <div className="homepage-content">

        {/* Busca interna pela api */}
        <form 
            id="search-card-form" 
            onSubmit={handleSearch}
            style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
            <input
                type="text"
                placeholder="Pesquisar carta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flexGrow: 1 }}
            />
            <button type="submit" disabled={searching}>
                {searching ? 'Buscando...' : 'Buscar'}
            </button>
        </form>

        {/* Upload de arquivo .ydk */}

        <form 
             id="add-ydk-form"
             style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
             <label htmlFor="ydk-upload" style={{ flexShrink: 0 }}>Adicionar por .YDK:</label>
             <input
                 type="file"
                 id="ydk-upload"
                 accept=".ydk"
                 onChange={handleYdkUpload}
                 disabled={ydkUploading}
                 style={{ flexGrow: 1 }}
             />
             {ydkUploading && <span style={{ fontSize: '0.9em' }}>Processando...</span>}
        </form>

        {/* Adicionar carta (apenas se logado) */}
        {token && (
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

        {/* Grid de cartas */}
        <section className="card-grid-section">
            <div className="section-header">
                <h3>Catálogo Completo</h3> 
            </div>
            <div className="card-grid">
                {cartas.map(carta => (
                    <ProductCard 
                        key={carta.id} 
                        carta={carta} 
                        onDelete={token ? () => handleDeleteCard(carta.id, carta.nome) : null}
                    />
                ))}
            </div>
        </section>

        {/* Mensagem de vazio */}
        {cartas.length === 0 && !loading && (
             <p>{token ? 'Catálogo vazio. Adicione cartas.' : 'Nenhuma carta encontrada.'}</p>
        )}
    </div>
);
}