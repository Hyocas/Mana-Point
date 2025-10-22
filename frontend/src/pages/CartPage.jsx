import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function CartPage() {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const cartApiUrl = '/api/carrinho_proxy';
    const catalogApiUrl = '/api/catalogo_proxy';

    const fetchCart = useCallback(async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            navigate('/');
            return;
        }

        const userId = JSON.parse(atob(token.split('.')[1])).id;
        
        try {
            setLoading(true);
            setError(null);

            const cartResponse = await fetch(`${cartApiUrl}/carrinho/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!cartResponse.ok) throw new Error('Falha ao buscar itens do carrinho.');
            const cartData = await cartResponse.json();

            const enrichedItems = await Promise.all(
                cartData.map(async (item) => {
                    const productResponse = await fetch(`${catalogApiUrl}/cartas/${item.produto_id}`);
                    const productData = await productResponse.json();
                    return { ...item, ...productData };
                })
            );
            setCartItems(enrichedItems);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    const handleUpdateQuantity = async (itemId, newQuantity) => {
        const token = localStorage.getItem('authToken');
        if (newQuantity <= 0) {
            handleRemoveItem(itemId);
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
            fetchCart();
        } catch (err) {
            alert('Erro ao atualizar a quantidade.');
        }
    };

    const handleRemoveItem = async (itemId) => {
        const token = localStorage.getItem('authToken');
        if (!confirm('Tem certeza que deseja remover este item?')) return;
        try {
            await fetch(`${cartApiUrl}/carrinho/${itemId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchCart();
        } catch (err) {
            alert('Erro ao remover o item.');
        }
    };
    
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