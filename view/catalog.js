// catalog.js (versão atualizada)
document.addEventListener('DOMContentLoaded', () => {
    const headerNav = document.getElementById('header-nav');
    const catalogContainer = document.getElementById('catalog-container');
    const catalogApiUrl = 'http://localhost:3000/api';

    // Verifica se existe um token no "baú"
    const token = localStorage.getItem('authToken');

    if (token) {
        // Se o usuário ESTÁ logado, mostra o botão de Logout
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logout-btn';
        logoutBtn.textContent = 'Logout';
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('authToken');
            window.location.href = 'index.html';
        });
        headerNav.appendChild(logoutBtn);
    } else {
        // Se o usuário NÃO ESTÁ logado, mostra o link de Voltar
        const backLink = document.createElement('a');
        backLink.href = 'index.html';
        backLink.textContent = 'Voltar para Login';
        backLink.className = 'nav-link'; // Usaremos essa classe para estilizar
        headerNav.appendChild(backLink);
    }

    // Função para buscar e mostrar o catálogo (continua a mesma)
    const fetchCatalog = async () => {
        try {
            const response = await fetch(`${catalogApiUrl}/cartas`);
            if (!response.ok) throw new Error('Não foi possível carregar o catálogo.');
            
            const cartas = await response.json();
            catalogContainer.innerHTML = '';
            if (cartas.length === 0) {
                catalogContainer.innerHTML = '<p>Nenhuma carta encontrada.</p>';
                return;
            }

            cartas.forEach(carta => {
                const cardElement = document.createElement('div');
                cardElement.className = 'card';
                cardElement.innerHTML = `
                    <h3>${carta.nome}</h3>
                    <p><strong>Tipo:</strong> ${carta.tipo || 'N/A'}</p>
                    <p><strong>Ataque/Defesa:</strong> ${carta.ataque}/${carta.defesa}</p>
                    <p>${carta.efeito || 'Sem efeito especial.'}</p>
                    <p class="price">R$ ${carta.preco}</p>
                `;
                catalogContainer.appendChild(cardElement);
            });
        } catch (error) {
            catalogContainer.innerHTML = `<p class="error">${error.message}</p>`;
        }
    };

    fetchCatalog();
});