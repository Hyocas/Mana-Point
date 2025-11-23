import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export default function EditProfilePage() {
    const [nomeCompleto, setNomeCompleto] = useState('');
    const [dataNascimento, setDataNascimento] = useState('');
    const [endereco, setEndereco] = useState('');
    
    const [senhaAtual, setSenhaAtual] = useState('');
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });
    
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) return navigate('/login');

        const fetchCurrentData = async () => {
            try {
                const decoded = jwtDecode(token);
                const isFuncionario = decoded.cargo === 'funcionario';
                const endpoint = isFuncionario ? '/api/usuarios_proxy/funcionarios/me' : '/api/usuarios_proxy/usuarios/me';

                const response = await fetch(endpoint, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setEndereco(data.endereco || '');
                    setNomeCompleto(data.nome_completo || '');
                    
                    if (data.data_nascimento) {
                        const dateObj = new Date(data.data_nascimento);
                        const dateStr = dateObj.toISOString().split('T')[0];
                        setDataNascimento(dateStr);
                    }
                }
            } catch (error) {
                console.error("Erro ao carregar dados:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCurrentData();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });

        if (!senhaAtual) {
            setMessage({ text: 'Por favor, insira sua senha atual para salvar.', type: 'error' });
            return;
        }

        if (novaSenha && novaSenha !== confirmarSenha) {
            setMessage({ text: 'As novas senhas não coincidem.', type: 'error' });
            return;
        }

        const token = localStorage.getItem('authToken');
        if (!token) return navigate('/login');

        try {
            const decoded = jwtDecode(token);
            const isFuncionario = decoded.cargo === 'funcionario';
            const endpoint = isFuncionario ? '/api/usuarios_proxy/funcionarios/me' : '/api/usuarios_proxy/usuarios/me';

            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    nomeCompleto,
                    dataNascimento,
                    endereco,
                    senhaAtual,
                    novaSenha
                })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ text: 'Perfil atualizado com sucesso!', type: 'success' });
                setNovaSenha('');
                setConfirmarSenha('');
                setSenhaAtual('');
                setTimeout(() => navigate('/minha-conta'), 1500);
            } else {
                throw new Error(data.message || 'Erro ao atualizar');
            }

        } catch (error) {
            setMessage({ text: error.message, type: 'error' });
        }
    };

    if (loading) return <div className="account-page-wrapper"><p>Carregando...</p></div>;

    return (
        <div className="account-page-wrapper">
            <div className="account-card">
                <div style={{ marginBottom: '20px' }}>
                    <Link to="/minha-conta" className="back-link">← Voltar</Link>
                </div>
                
                <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Editar Perfil</h2>
                
                {message.text && (
                    <div className={`message-area ${message.type === 'success' ? 'success' : 'error'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    
                    <div className="account-grid">
                        <div className="form-group">
                            <label>Nome Completo</label>
                            <input
                                type="text"
                                value={nomeCompleto}
                                onChange={(e) => setNomeCompleto(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Data de Nascimento</label>
                            <input
                                type="date"
                                value={dataNascimento}
                                onChange={(e) => setDataNascimento(e.target.value)}
                                style={{
                                    backgroundColor: 'var(--background-dark)',
                                    border: '1px solid var(--background-light)',
                                    color: 'var(--text-color)',
                                    padding: '12px',
                                    borderRadius: '5px',
                                    width: '100%'
                                }}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Editar endereço de Entrega</label>
                        <input
                            type="text"
                            value={endereco}
                            onChange={(e) => setEndereco(e.target.value)}
                            placeholder="Rua, Número, Bairro..."
                        />
                    </div>

                    <hr style={{ border: 0, borderTop: '1px solid var(--background-light)', margin: '20px 0' }} />
                    <p style={{ color: 'var(--muted-text)', fontSize: '0.9rem', fontStyle: 'italic', marginBottom: '15px' }}>
                        Preencha abaixo APENAS se quiser trocar de senha.
                    </p>

                    <div className="account-grid">
                        <div className="form-group">
                            <label>Nova Senha (Opcional)</label>
                            <input
                                type="password"
                                value={novaSenha}
                                onChange={(e) => setNovaSenha(e.target.value)}
                                placeholder="Nova senha"
                            />
                        </div>

                        <div className="form-group">
                            <label>Confirmar Nova Senha</label>
                            <input
                                type="password"
                                value={confirmarSenha}
                                onChange={(e) => setConfirmarSenha(e.target.value)}
                                placeholder="Repita a nova senha"
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ 
                        backgroundColor: 'var(--background-dark)', 
                        padding: '15px', 
                        borderRadius: '8px', 
                        border: '1px solid var(--danger)',
                        marginTop: '10px'
                    }}>
                        <label style={{ color: 'var(--danger)' }}>Senha Atual (Obrigatório para Salvar)</label>
                        <input
                            type="password"
                            value={senhaAtual}
                            onChange={(e) => setSenhaAtual(e.target.value)}
                            placeholder="Digite sua senha atual"
                            required
                            style={{ borderColor: 'var(--danger)' }}
                        />
                    </div>

                    <div className="account-actions">
                        <button type="button" onClick={() => navigate('/minha-conta')} className="btn-secondary">
                            Cancelar
                        </button>
                        <button type="submit" className="btn-edit">
                            Salvar Alterações
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}