import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function CartPage() {
    // Estados para gerenciar a página
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const cartApiUrl = 'http://localhost:3002/api';
    const catalogApiUrl = 'http://localhost:3000/api';

    // Usamos useCallback para que a função não seja recriada a cada renderização
    const fetchCart = useCallback(async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            navigate('/');
            return;
        }

        // Decodifica o token para pegar o ID do usuário
        const userId = JSON.parse(atob(token.split('.')[1])).id;
        
        try {
            setLoading(true);
            setError(null);

            // 1. Busca os itens brutos do carrinho
            const cartResponse = await fetch(`${cartApiUrl}/carrinho/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!cartResponse.ok) throw new Error('Falha ao buscar itens do carrinho.');
            const cartData = await cartResponse.json();

            // 2. "Enriquece" os itens com os detalhes das cartas do serviço de catálogo
            const enrichedItems = await Promise.all(
                cartData.map(async (item) => {
                    const productResponse = await fetch(`${catalogApiUrl}/cartas/${item.produto_id}`);
                    const productData = await productResponse.json();
                    return { ...item, ...productData }; // Combina os dados do item com os dados do produto
                })
            );

            setCartItems(enrichedItems);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    // Busca o carrinho quando a página carrega
    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    // Função para atualizar a quantidade de um item
    const handleUpdateQuantity = async (itemId, newQuantity) => {
        const token = localStorage.getItem('authToken');
        if (newQuantity <= 0) {
            handleRemoveItem(itemId); // Se a quantidade for 0 ou menos, remove o item
            return;
        }
        try {
            await fetch(`${cartApiUrl}/carrinho/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ quantidade: newQuantity })
            });
            fetchCart(); // Atualiza a visualização do carrinho
        } catch (err) {
            alert('Erro ao atualizar a quantidade.');
        }
    };

    // Função para remover um item do carrinho
    const handleRemoveItem = async (itemId) => {
        const token = localStorage.getItem('authToken');
        if (!confirm('Tem certeza que deseja remover este item?')) return;
        try {
            await fetch(`${cartApiUrl}/carrinho/${itemId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchCart(); // Atualiza a visualização do carrinho
        } catch (err) {
            alert('Erro ao remover o item.');
        }
    };
    
    // Calcula o total do carrinho
    const totalPrice = cartItems.reduce((total, item) => total + (item.quantidade * item.preco_unitario), 0);

    if (loading) return <p>Carregando carrinho...</p>;
    if (error) return <p className="error">{error}</p>;

    return (
        <div className="catalog-page">
            <div className="catalog-header">
                <h1>Meu Carrinho</h1>
                <Link to="/catalog" className="nav-link">Continuar Comprando</Link>
            </div>
            {cartItems.length === 0 ? (
                <p>Seu carrinho está vazio.</p>
            ) : (
                <div>
                    {cartItems.map(item => (
                        <div key={item.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3>{item.nome}</h3>
                                <p><strong>Preço Unitário:</strong> R$ {Number(item.preco_unitario).toFixed(2)}</p>
                                <p><strong>Subtotal:</strong> R$ {(item.quantidade * item.preco_unitario).toFixed(2)}</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <label>Qtd:</label>
                                <input 
                                    type="number" 
                                    value={item.quantidade} 
                                    onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value))}
                                    min="1"
                                    style={{ width: '60px' }} 
                                />
                                <button className="delete-btn" onClick={() => handleRemoveItem(item.id)}>Remover</button>
                            </div>
                        </div>
                    ))}
                    <div style={{ textAlign: 'right', marginTop: '2rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
                        Total: R$ {totalPrice.toFixed(2)}
                    </div>
                </div>
            )}
        </div>
    );
}