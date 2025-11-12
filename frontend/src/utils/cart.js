const cartApiUrl = '/api/carrinho_proxy';

/**
 * Adiciona um item ao carrinho e atualiza o contador global.
 * @param {object} carta
 **/

export const addToCart = async (carta) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    alert('Você precisa estar logado para adicionar itens ao carrinho.');
    return;
  }

  try {
    const userId = JSON.parse(atob(token.split('.')[1])).id;

    const response = await fetch(`${cartApiUrl}/carrinho`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        usuario_id: userId,
        produto_id: carta.id,
        quantidade: 1
      })
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erro desconhecido da API.');
    }

    alert(`'${carta.nome}' adicionado ao carrinho!`);

  // Atualiza o badge usando a função utilitária centralizada
  updateCartCount(1);

  } catch (error) {
    alert(`Falha ao adicionar ao carrinho: ${error.message}`);
  }
};

/**
 * Atualiza o contador global do carrinho aplicando um delta (positivo ou negativo).
 * @param {number} delta 
 * @returns {number}
 */
export const updateCartCount = (delta = 0) => {
  const current = Number(localStorage.getItem('cartItemCount') || 0);
  const next = Math.max(0, current + Number(delta || 0));
  localStorage.setItem('cartItemCount', next);
  window.dispatchEvent(new Event('cartUpdated'));
  return next;
};

/**
 * @param {number} qty Quantidade a remover do contador (>= 0)
 */
export const removeFromCartCount = (qty = 1) => updateCartCount(-Math.abs(qty));