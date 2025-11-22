import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export default function AccountPage() {
    const [perfil, setPerfil] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const formatarData = (dataISO) => {
        if (!dataISO) return 'Não informado';
        const data = new Date(dataISO);
        return data.toLocaleDateString('pt-BR');
    };

    const formatarCPF = (cpf) => {
        if (!cpf) return 'Não informado';
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    };

    useEffect(() => {
        const token = localStorage.getItem('authToken');

        if (!token) {
            navigate('/login');
            return;
        }

        const fetchProfile = async () => {
            try {
                const decoded = jwtDecode(token);
                const isFuncionario = decoded.cargo === 'funcionario';
                
                const endpoint = isFuncionario 
                    ? '/api/usuarios_proxy/funcionarios/me' 
                    : '/api/usuarios_proxy/usuarios/me';

                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) {
                        handleLogout();
                        return;
                    }
                    throw new Error('Falha ao carregar dados do perfil');
                }

                const data = await response.json();
                setPerfil({ ...data, cargo: decoded.cargo });
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        navigate('/login');
    };

    if (loading) return <div className="account-page-wrapper"><p>Carregando perfil...</p></div>;
    if (error) return <div className="account-page-wrapper"><p className="error">{error}</p></div>;
    if (!perfil) return null;

    return (
        <div className="account-page-wrapper">
            <div className="account-card">
                <div className="account-header">
                    <div className="account-avatar">
                        {perfil.nome_completo ? perfil.nome_completo.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="account-title-block">
                        <h1>{perfil.nome_completo || 'Usuário sem nome'}</h1>
                        <span className="role-badge">
                            {perfil.cargo === 'funcionario' ? 'Staff / Funcionário' : 'Cliente / Duelista'}
                        </span>
                    </div>
                </div>

                <div className="account-grid">
                    <div className="account-field">
                        <label>Email</label>
                        <div className="value">{perfil.email}</div>
                    </div>

                    <div className="account-field">
                        <label>CPF</label>
                        <div className="value">{formatarCPF(perfil.cpf)}</div>
                    </div>

                    <div className="account-field">
                        <label>Data de Nascimento</label>
                        <div className="value">{formatarData(perfil.data_nascimento)}</div>
                    </div>

                    <div className="account-field">
                        <label>Membro Desde</label>
                        <div className="value">{formatarData(perfil.criado_em)}</div>
                    </div>
                    
                    <div className="account-field full-width">
                        <label>Endereço de Entrega</label>
                        <div className="value">{perfil.endereco || 'Endereço não cadastrado'}</div>
                    </div>
                </div>

                <div className="account-actions">
                    <button 
                        onClick={() => navigate('/editar-perfil')} 
                        className="btn-edit"
                    >
                        Editar Perfil
                    </button>

                    <button onClick={handleLogout} className="btn-logout">
                        Sair da Conta
                    </button>
                </div>
            </div>
        </div>
    );
}