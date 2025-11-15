import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Footer from '../components/Footer.jsx';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [codigoSeguranca, setCodigoSeguranca] = useState('');
    const [isFuncionario, setIsFuncionario] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const navigate = useNavigate();
    const usersApiUrl = '/api/usuarios_proxy'; // clientes
    const funcionariosApiUrl = '/api/usuarios_proxy/funcionarios'; // funcionários

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            setError('As senhas não conferem.');
            return;
        }

        if (isFuncionario && codigoSeguranca.length < 6) {
            setError('O código de segurança deve ter no mínimo 6 caracteres.');
            return;
        }

        try {
            const url = isFuncionario
                ? `${funcionariosApiUrl}/registro`
                : `${usersApiUrl}/usuarios/registro`;

            const body = isFuncionario
                ? { email, senha: password, codigoSeguranca }
                : { email, senha: password };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao tentar cadastrar.');

            setSuccess('Cadastro realizado com sucesso! Redirecionando...');
            setTimeout(() => navigate('/login'), 2000);

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
                <h1>Cadastro</h1>

                <form id="register-form" onSubmit={handleRegister}>
                    
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

                    <div className="form-group">
                        <label>Confirmar Senha</label>
                        <input 
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group checkbox-group">
                        <input 
                            type="checkbox"
                            id="is-func"
                            checked={isFuncionario}
                            onChange={(e) => setIsFuncionario(e.target.checked)}
                        />
                        <label htmlFor="is-func">
                            Registrar como funcionário (requer código de segurança)
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

                    <button type="submit">Cadastrar</button>

                    <p className={`message-area ${error ? 'error' : success ? 'success' : ''}`}>
                        {error || success || '\u00A0'}
                    </p>
                </form>

                <div className="switch-link">
                    <p>Já tem uma conta? <Link to="/login">Faça o login</Link></p>
                </div>
                <div className="switch-link">
                    <p>Ou <Link to="/">veja o catálogo como visitante</Link></p>
                </div>
            </div>
        </div>
        <Footer />
        </>
    );
}