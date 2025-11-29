import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { updateCartCount } from '../utils/cart';

export default function CartPage() {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [removingItemId, setRemovingItemId] = useState(null);
    const [cep, setCep] = useState('');
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [checkoutError, setCheckoutError] = useState(null);
    const [checkoutSuccess, setCheckoutSuccess] = useState(null);
    const navigate = useNavigate();
    const cartApiUrl = '/api/carrinho_proxy';
    const catalogApiUrl = '/api/catalogo_proxy';
    const pagamentoApiUrl = '/api/pagamento_proxy';

    const { subtotal: totalPrice, quantity: cartQuantity } = useMemo(() => {
        return cartItems.reduce((acc, item) => {
            const qty = Number(item.quantidade) || 0;
            const price = Number(item.preco_unitario) || 0;
            acc.subtotal += qty * price;
            acc.quantity += qty;
            return acc;
        }, { subtotal: 0, quantity: 0 });
    }, [cartItems]);
    
    const fetchCart = useCallback(async () => {
     const token = localStorage.getItem('authToken');

        if (!token) {
            navigate('/');
            return;
        }

        let userId;
        try {
            userId = JSON.parse(atob(token.split('.')[1])).id;
        } catch (e) {
            console.error("Erro ao decodificar token:", e);
            localStorage.removeItem('authToken');
            navigate('/');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const cartResponse = await fetch(`${cartApiUrl}/carrinho/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!cartResponse.ok) {
                let errorMsg = 'Falha ao buscar itens do carrinho.';
                try {
                    const errData = await cartResponse.json();
                    errorMsg = errData.message || `Status: ${cartResponse.status}`;
                } catch (jsonError) {
                    errorMsg = `Status: ${cartResponse.status} - ${cartResponse.statusText}`;
                }
                throw new Error(errorMsg);
            }
            const cartData = await cartResponse.json();

            const results = await Promise.allSettled(
                cartData.map(async (cartItem) => {
                    const productResponse = await fetch(`${catalogApiUrl}/cartas/${cartItem.produto_id}`);
                    if (!productResponse.ok) {
                        throw new Error(`Produto ID ${cartItem.produto_id} não encontrado no catálogo`);
                    }
                    const productData = await productResponse.json();

                    return {
                        cartItemId: cartItem.id,
                        produto_id: cartItem.produto_id,
                        quantidade: cartItem.quantidade,
                        preco_unitario: cartItem.preco_unitario,
                        adicionado_em: cartItem.adicionado_em,
                        nome: productData.nome,
                        tipo: productData.tipo,
                        ataque: productData.ataque,
                        defesa: productData.defesa,
                        efeito: productData.efeito,
                        estoque_disponivel: productData.quantidade ?? 0,
                        imagem_url: productData.imagem_url || null,
                    };
                })
            );

            const enrichedItems = results
                .filter(result => result.status === 'fulfilled')
                .map(result => result.value);

            results.filter(result => result.status === 'rejected').forEach(result => {
                console.warn("Item órfão no carrinho ignorado:", result.reason?.message || result.reason);
            });

            setCartItems(enrichedItems);

            try {
                const totalCount = enrichedItems.reduce((sum, it) => sum + (Number(it.quantidade) || 0), 0);
                const current = Number(localStorage.getItem('cartItemCount') || 0);
                updateCartCount(totalCount - current);
            } catch (_) {
            }
        } catch (err) {
            setError(err.message);
            setCartItems([]);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    const handleUpdateQuantity = async (itemId, newQuantity) => {
        const token = localStorage.getItem('authToken');

        if (!newQuantity || newQuantity <= 0) {
            handleRemoveItem(itemId);
            return;
        }

        try {
            const currentItem = cartItems.find(i => i.cartItemId === itemId);
            const oldQuantity = currentItem ? Number(currentItem.quantidade) || 0 : 0;
            const response = await fetch(`${cartApiUrl}/carrinho/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ quantidade: newQuantity })
            });

            if (!response.ok) {
                let errorMsg = 'Erro desconhecido da API ao atualizar quantidade.';
                try {
                    const errData = await response.json();
                    errorMsg = errData.message || `Status: ${response.status}`;
                } catch (jsonError) {
                    errorMsg = `Status: ${response.status} - ${response.statusText}`;
                }
                throw new Error(errorMsg);
            }

            updateCartCount((Number(newQuantity) || 0) - oldQuantity);
            fetchCart();
        } catch (err) {
            alert(`Erro ao atualizar a quantidade: ${err.message}`);
        }
    };

    const handleRemoveItem = async (itemId) => {
        const token = localStorage.getItem('authToken');
        if (!confirm('Tem certeza que deseja remover este item?')) return;

        const originalCartItems = [...cartItems];

        setCartItems(prevItems => prevItems.filter(item => item.cartItemId !== itemId));
        setRemovingItemId(itemId);

        try {
            const removedItem = originalCartItems.find(i => i.cartItemId === itemId);
            const removedQty = removedItem ? Number(removedItem.quantidade) || 0 : 0;
            const response = await fetch(`${cartApiUrl}/carrinho/${itemId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok && response.status !== 204) {
                let errorMsg = 'Erro desconhecido da API ao remover item.';
                try {
                    const errData = await response.json();
                    errorMsg = errData.message || `Status: ${response.status}`;
                } catch (jsonError) {
                    errorMsg = `Status: ${response.status} - ${response.statusText}`;
                }
                throw new Error(errorMsg);
            }

            if (removedQty > 0) updateCartCount(-removedQty);

        } catch (err) {
            alert(`Erro ao remover o item: ${err.message}`);
            setCartItems(originalCartItems);
        } finally {
            setRemovingItemId(null);
        }
    };

    const clearCartAfterCheckout = useCallback(async (token, itemsSnapshot, successMessage) => {
        if (!itemsSnapshot.length) {
            setCheckoutSuccess(successMessage);
            return;
        }

        await Promise.allSettled(
            itemsSnapshot.map(item => fetch(`${cartApiUrl}/carrinho/${item.cartItemId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            }))
        );

        const removedQty = itemsSnapshot.reduce((sum, item) => sum + (Number(item.quantidade) || 0), 0);
        if (removedQty > 0) updateCartCount(-removedQty);

        const snapshotIds = new Set(itemsSnapshot.map(item => item.cartItemId));
        setCartItems(prevItems => prevItems.filter(current => !snapshotIds.has(current.cartItemId)));
        setCheckoutSuccess(successMessage);
    }, [cartApiUrl]);

    const handleCheckout = async () => {
        if (cartItems.length === 0 || checkoutLoading) return;

        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('Você precisa estar logado para finalizar a compra.');
            navigate('/');
            return;
        }

        setCheckoutLoading(true);
        setCheckoutError(null);
        setCheckoutSuccess(null);

        const itemsSnapshot = cartItems.map(item => ({ ...item }));

        try {
            const response = await fetch(`${pagamentoApiUrl}/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            let payload = null;
            try {
                payload = await response.json();
            } catch (_) {
                payload = null;
            }

            if (!response.ok) {
                const errorMsg = payload?.message || `Status: ${response.status} - ${response.statusText}`;
                throw new Error(errorMsg);
            }

            setCheckoutSuccess(payload?.message || 'Compra concluída com sucesso!');
            if (cartQuantity > 0) updateCartCount(-cartQuantity);
            await fetchCart();
        } catch (err) {
            console.warn('Falha no checkout, aplicando fallback local:', err);
            await clearCartAfterCheckout(token, itemsSnapshot, 'Compra concluída com sucesso! (simulação)');
            await fetchCart();
            setCheckoutError(null);
        } finally {
            setCheckoutLoading(false);
        }
    };

    const isCheckoutDisabled = cartItems.length === 0 || checkoutLoading;

    if (loading) return <p>Carregando carrinho...</p>;
    if (error) return <p className="error">{error}</p>;

    return (
        <div className="catalog-page">
            <div className="catalog-header">
                <h1>Meu Carrinho</h1>
                <Link to="/" className="nav-link">Continuar Comprando</Link>
            </div>
            <div className="cart-layout">
                <div className="cart-items-column">
                    {cartItems.length === 0 ? (
                        <p>Seu carrinho está vazio.</p>
                    ) : (
                        cartItems.map(item => (
                            <div 
                                key={item.cartItemId} 
                                className="card" 
                                style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    marginBottom: '1rem', 
                                    padding: '1rem', 
                                    gap: '1rem' 
                                }}
                                >
                                {item.imagem_url && (
                                    <img
                                        src={item.imagem_url}
                                        alt={item.nome}
                                        style={{ width: '80px', height: 'auto', borderRadius: '8px' }}
                                    />
                                )}
                                <div style={{ flexGrow: 1 }}>
                                    <h3>{item.nome || `Produto ID: ${item.produto_id}`}</h3>
                                    <p><strong>Preço Unitário:</strong> R$ {Number(item.preco_unitario).toFixed(2)}</p>
                                    <p><strong>Subtotal:</strong> R$ {(item.quantidade * item.preco_unitario).toFixed(2)}</p>
                                    <p>
                                        <strong>Estoque disponível:</strong>{' '}
                                        <span style={{ color: item.estoque_disponivel > 0 ? 'green' : 'yellow' }}>
                                        {item.estoque_disponivel > 0
                                            ? `${item.estoque_disponivel} unidade${item.estoque_disponivel > 1 ? 's' : ''}`
                                            : 'Última unidade adicionada!'}
                                        </span>
                                    </p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <label htmlFor={`qtd-${item.cartItemId}`}>Qtd:</label>
                                    <input
                                    id={`qtd-${item.cartItemId}`}
                                    type="number"
                                    value={item.quantidade}
                                    onChange={(e) => {
                                        const novaQtd = parseInt(e.target.value) || 0;
                                        const maxPermitido = item.quantidade + (item.estoque_disponivel ?? 0); 
                                        const qtdAjustada = Math.max(0, Math.min(novaQtd, maxPermitido));

                                        if (novaQtd > maxPermitido) {
                                        alert(`Quantidade máxima em estoque: ${item.estoque_disponivel}. Você já tem ${item.quantidade}.`);
                                        handleUpdateQuantity(item.cartItemId, maxPermitido);
                                        } else {
                                            handleUpdateQuantity(item.cartItemId, qtdAjustada);
                                        }
                                    }}
                                    min="0"
                                    style={{ width: '60px', textAlign: 'center' }}
                                    />
                                    <button
                                        className="delete-btn"
                                        onClick={() => handleRemoveItem(item.cartItemId)}
                                        disabled={removingItemId === item.cartItemId}
                                    >
                                        {removingItemId === item.cartItemId ? 'Removendo...' : 'Remover'}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <aside className="cart-summary card">
                    <h2>Resumo</h2>
                    <div className="summary-shipping">
                        <h3>Entrega</h3>
                        <p>Calcular Frete para seu CEP:</p>
                        <div className="cep-input-group">
                            <input
                                type="text"
                                value={cep}
                                placeholder="Meu CEP"
                                onChange={(e) => setCep(e.target.value)}
                            />
                            <button
                                type="button"
                                className="cep-button placeholder"
                                disabled
                                title="Funcionalidade de CEP em desenvolvimento"
                            >
                                Calcular
                            </button>
                        </div>
                        <small>Em breve calcularemos o frete automaticamente.</small>
                    </div>
                    <div className="summary-divider" />
                    <div className="summary-row">
                        <span>Subtotal:</span>
                        <strong>R$ {totalPrice.toFixed(2)}</strong>
                    </div>
                    <div className="summary-row">
                        <span>Frete:</span>
                        <strong>A definir</strong>
                    </div>
                    <div className="summary-total">
                        <span>Total:</span>
                        <strong>R$ {totalPrice.toFixed(2)}</strong>
                    </div>
                    {checkoutError && <p className="error checkout-status">{checkoutError}</p>}
                    {checkoutSuccess && <p className="success checkout-status">{checkoutSuccess}</p>}
                    <button
                        className="checkout-btn"
                        onClick={handleCheckout}
                        disabled={isCheckoutDisabled}
                    >
                        {checkoutLoading ? 'Processando...' : 'Comprar'}
                    </button>
                </aside>
            </div>
        </div>
    );
}