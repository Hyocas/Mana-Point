import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Footer from '../components/Footer.jsx';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [codigoSeguranca, setCodigoSeguranca] = useState('');
    const [isFuncionario, setIsFuncionario] = useState(false);
    const [error, setError] = useState('');
    
    const navigate = useNavigate();
    const usersApiUrl = '/api/usuarios_proxy';
    const funcionariosApiUrl = '/api/usuarios_proxy/funcionarios';

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const url = isFuncionario
                ? `${funcionariosApiUrl}/login`
                : `${usersApiUrl}/usuarios/login`;

            const body = isFuncionario
                ? { email, senha: password, codigoSeguranca }
                : { email, senha: password };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao tentar fazer login.');

            localStorage.setItem('authToken', data.token);
            navigate('/');

        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <>
        <div className="container">
            <div className="auth-card">
                <div className="logo-container">
                    <img src="/logo-transparente.png" alt="Mana-Point Logo" className="logo-img" />
                </div>

                <h1>Login</h1>

                <form id="login-form" onSubmit={handleLogin}>

                    <div className="form-group">
                        <label>Email</label>
                        <input 
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Senha</label>
                        <input 
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group checkbox-group">
                        <input 
                            type="checkbox"
                            id="login-func"
                            checked={isFuncionario}
                            onChange={(e) => setIsFuncionario(e.target.checked)}
                        />
                        <label htmlFor="login-func">
                            Entrar como funcionário (requer código de segurança)
                        </label>
                    </div>

                    {isFuncionario && (
                        <div className="form-group">
                            <label>Código de Segurança</label>
                            <input 
                                type="password"
                                value={codigoSeguranca}
                                onChange={(e) => setCodigoSeguranca(e.target.value)}
                                required={isFuncionario}
                            />
                        </div>
                    )}

                    <button type="submit">Entrar</button>

                    <p className={`message-area ${error ? 'error' : ''}`}>
                        {error || '\u00A0'}
                    </p>
                </form>

                <div className="switch-link">
                    <p>Não tem uma conta? <Link to="/register">Cadastre-se</Link></p>
                </div>
                <div className="switch-link">
                    <p>Ou <Link to="/">Veja o catálogo como visitante</Link></p>
                </div>
            </div>
        </div>
        <Footer />
        </>
    );
}
