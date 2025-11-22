import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Footer from '../components/Footer.jsx';

export default function RegisterPage() {
    const [nomeCompleto, setNomeCompleto] = useState('');
    const [cpf, setCpf] = useState('');
    const [dia, setDia] = useState('');
    const [mes, setMes] = useState('');
    const [ano, setAno] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [codigoSeguranca, setCodigoSeguranca] = useState('');
    const [isFuncionario, setIsFuncionario] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const navigate = useNavigate();
    const usersApiUrl = '/api/usuarios_proxy';
    const funcionariosApiUrl = '/api/usuarios_proxy/funcionarios';

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

        if (!nomeCompleto.trim()) {
            setError('Nome completo é obrigatório.');
            return;
        }
        const cpfDigits = cpf.replace(/\D/g,'');
        if (!cpfDigits || cpfDigits.length !== 11) {
            setError('CPF deve ter 11 dígitos.');
            return;
        }

        let dataNascimento = null;
        if (dia || mes || ano) {
            if (!(dia && mes && ano)) {
                setError('Preencha dia, mês e ano completos.');
                return;
            }
            const diaNum = parseInt(dia,10);
            const mesNum = parseInt(mes,10);
            const anoNum = parseInt(ano,10);
            const dt = new Date(anoNum, mesNum - 1, diaNum);
            if (dt.getFullYear() !== anoNum || dt.getMonth() !== mesNum - 1 || dt.getDate() !== diaNum) {
                setError('Data inválida.');
                return;
            }
            dataNascimento = `${anoNum}-${String(mesNum).padStart(2,'0')}-${String(diaNum).padStart(2,'0')}`;
        }

        try {
            const url = isFuncionario
                ? `${funcionariosApiUrl}/registro`
                : `${usersApiUrl}/usuarios/registro`;

            const bodyBase = { email, senha: password, nomeCompleto, cpf, dataNascimento }; 
            const body = isFuncionario
                ? { ...bodyBase, codigoSeguranca }
                : bodyBase;

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
                        <label>Nome Completo</label>
                        <input
                            type="text"
                            value={nomeCompleto}
                            onChange={(e) => setNomeCompleto(e.target.value)}
                            required
                        />
                    </div>

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
                        <label>CPF</label>
                        <input
                            type="text"
                            value={cpf}
                            onChange={(e) => setCpf(e.target.value)}
                            placeholder="000.000.000-00"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Data de Nascimento</label>
                        <div className="dob-row">
                            <select value={dia} onChange={e=>setDia(e.target.value)}>
                                <option value="">Dia</option>
                                {Array.from({length:31}, (_,i)=> i+1).map(d => (
                                    <option key={d} value={d}>{String(d).padStart(2,'0')}</option>
                                ))}
                            </select>
                            <select value={mes} onChange={e=>setMes(e.target.value)}>
                                <option value="">Mês</option>
                                {[
                                    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                                    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
                                ].map((m,idx) => (
                                    <option key={m} value={idx+1}>{m}</option>
                                ))}
                            </select>
                            <select value={ano} onChange={e=>setAno(e.target.value)}>
                                <option value="">Ano</option>
                                {Array.from({length: 150}, (_,i) => new Date().getFullYear() - i - 10).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
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