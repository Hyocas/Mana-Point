import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Upload } from 'lucide-react';

export default function Header() {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const [searchTerm, setSearchTerm] = useState('');

  const catalogApiUrl = '/api/catalogo_proxy';
  const carrinhoApiUrl = '/api/carrinho_proxy';

  const [ydkUploading, setYdkUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const processYdkFile = async (file) => {
    if (!file || !file.name.endsWith('.ydk')) {
        alert('Por favor, solte um arquivo .ydk válido.');
        return;
    }

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
                body: JSON.stringify({ deckList: allCardIds })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao processar arquivo .ydk');

            alert(`Catálogo atualizado com ${data.total} cartas únicas.`);
            navigate(0); 

            if (data.prompt && window.confirm(data.prompt)) {
                for (const carta of data.disponiveis) {
                    const qtdDesejada = data.idCount[String(carta.id)] || 1;
                    const qtdFinal = Math.min(qtdDesejada, carta.quantidade);

                    await fetch(`${carrinhoApiUrl}/carrinho`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            produto_id: carta.id,
                            quantidade: Number(qtdFinal)
                        })
                    });
                }
                alert('Cartas disponíveis adicionadas ao carrinho com sucesso!');
            }

        } catch (err) {
            alert(err.message);
        } finally {
            setYdkUploading(false);
        }
    };

    reader.onerror = () => {
        alert("Erro ao ler o arquivo.");
        setYdkUploading(false);
    };

    reader.readAsText(file);
  };

  const handleYdkUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      processYdkFile(file);
    }
    event.target.value = null; 
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    if (ydkUploading) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (ydkUploading) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      processYdkFile(file);
    }
  };

  const handleLogout = () => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('cartItemCount');
      window.location.reload();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      navigate('/');
    } else {
      navigate(`/?search=${encodeURIComponent(searchTerm)}`);
    }
  }

  return (
    <header className="main-header style-b">
      <input
        type="file"
        id="ydk-upload-header"
        accept=".ydk"
        onChange={handleYdkUpload}
        disabled={ydkUploading}
        style={{ display: 'none' }}
      />

      <div className="header-content style-b">
        <Link to="/" className="logo-link">
          <img src="/logo-transparente-header.png" alt="Mana-Point Logo" className="header-logo" />
        </Link>

        <form className="header-search-form" onSubmit={handleSearch}>
            <input
                type="text"
                placeholder="Pesquisar carta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" title="Buscar">
                <Search size={15} />
            </button>
        </form>
        
        <div className="header-actions style-b">
           {token ? (
             <button onClick={handleLogout} className="auth-button">Sair</button>
           ) : (
             <button onClick={() => navigate('/login')} className="auth-button">Entrar</button>
           )}

           {token && (
             <label 
                htmlFor="ydk-upload-header" 
                className="action-item" 
                title={ydkUploading ? "Enviando..." : "Arraste ou clique para enviar .YDK"}
                
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}

                style={{ 
                  cursor: ydkUploading ? 'not-allowed' : 'pointer', 
                  opacity: ydkUploading ? 0.5 : 1,
                  border: isDragging ? '2px dashed var(--accent-gold)' : '2px dashed transparent',
                  padding: '4px',
                  borderRadius: '8px',
                  transition: 'border 0.2s, opacity 0.2s'
                }}
             >
                <Upload size={24} />
             </label>
           )}
           
          <Link to="/carrinho" className="action-item" title="Ver Carrinho">
            <ShoppingCart size={24} />           
            <span className="cart-count">
              {localStorage.getItem('cartItemCount') || 0}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}