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

    const currentCount = Number(localStorage.getItem('cartItemCount') || 0);
    const newCount = currentCount + 1;
    localStorage.setItem('cartItemCount', newCount);
    
    window.dispatchEvent(new Event('cartUpdated'));

  } catch (error) {
    alert(`Falha ao adicionar ao carrinho: ${error.message}`);
  }
};