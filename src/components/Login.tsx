import React, { useState } from 'react';
import './Login.css';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
  // onLoginSuccess: () => void;
}

const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Por favor, digite seu email.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Call the login function from AuthContext
      const success = await login(email);
      
      if (!success) {
        setError('Email não autorizado. Por favor, verifique se você comprou o produto no Hotmart.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(`Erro ao processar login: ${err instanceof Error ? err.message : 'Desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Acesso ao Buscador de Produtos</h2>
        <p className="login-description">
          Por favor, digite o email que você utilizou para comprar o curso na Hotmart.
        </p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu email da Hotmart"
              disabled={isLoading}
              required
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
        
        <div className="login-help">
          <p>Não consegue acessar? Entre em contato pelo email de suporte.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
