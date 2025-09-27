document.addEventListener('DOMContentLoaded', () => {
    const headerNav = document.getElementById('header-nav');
    const catalogContainer = document.getElementById('catalog-container');
    const addCardForm = document.getElementById('add-card-form');
    const addCardBtn = document.getElementById('addCardBtn');
    const catalogApiUrl = 'http://localhost:3000/api';

    const token = localStorage.getItem('authToken');

    if (token) {
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logout-btn';
        logoutBtn.textContent = 'Logout';
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('authToken');
            window.location.href = 'index.html';
        });
        headerNav.appendChild(logoutBtn);

        if (addCardForm) addCardForm.style.display = 'block';

        addCardBtn.addEventListener('click', async () => {
            const nome = document.getElementById('nomeCarta').value.trim();
            if (!nome) return alert("Digite o nome da carta!");

            try {
                const response = await fetch(`${catalogApiUrl}/cartas`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ nome })
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Erro ao adicionar carta");

                document.getElementById('nomeCarta').value = "";
                fetchCatalog();
            } catch (error) {
                alert(error.message);
            }
        });
    } else {
        const backLink = document.createElement('a');
        backLink.href = 'index.html';
        backLink.textContent = 'Voltar para Login';
        backLink.className = 'nav-link';
        headerNav.appendChild(backLink);
    }

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
                    <p><strong>Ataque/Defesa:</strong> ${carta.ataque ?? 'N/A'}/${carta.defesa ?? 'N/A'}</p>
                    <p>${carta.efeito || 'Sem efeito especial.'}</p>
                    <p class="price">R$ ${carta.preco}</p>
                `;

                if (token) {
                    const deleteBtn = document.createElement('button');
                    deleteBtn.textContent = 'Deletar';
                    deleteBtn.className = 'delete-btn';
                    deleteBtn.onclick = async () => {
                        if (confirm(`Tem certeza que deseja deletar a carta "${carta.nome}"?`)) {
                            try {
                                const delResponse = await fetch(`${catalogApiUrl}/cartas/${carta.id}`, {
                                    method: 'DELETE',
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });
                                if (!delResponse.ok) throw new Error('Falha ao deletar a carta.');
                                fetchCatalog();
                            } catch (error) {
                                alert(error.message);
                            }
                        }
                    };
                    cardElement.appendChild(deleteBtn);
                }

                catalogContainer.appendChild(cardElement);
            });
        } catch (error) {
            catalogContainer.innerHTML = `<p class="error">${error.message}</p>`;
        }
    };

    fetchCatalog();
});