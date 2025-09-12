import React, { createContext, useState, useEffect, useContext } from 'react';

interface User {
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check authentication status on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Check if we have a stored auth token in localStorage
      const storedEmail = localStorage.getItem('userEmail');
      const storedAuthToken = localStorage.getItem('authToken');
      
      if (storedEmail && storedAuthToken) {
        // Verify the token is still valid (optional - can implement later)
        setUser({ email: storedEmail });
        setIsAuthenticated(true);
        return true;
      } else {
        setIsAuthenticated(false);
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setUser(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  const login = async (email: string): Promise<boolean> => {
    try {
      console.log('Login attempt with email:', email);
      console.log('Current environment:', process.env.NODE_ENV);
      
      // For development/testing, use hardcoded emails if configured
      if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_DEV_EMAILS === 'true') {
        console.log('Using development mode authentication');
        // List of authorized emails for testing
        const authorizedEmails = [
          'teste@exemplo.com',
          'cliente@hotmart.com',
          'comprador@gmail.com'
        ];
        
        console.log('Authorized emails:', authorizedEmails);
        console.log('Checking if email is authorized:', email.toLowerCase());
        
        // Check if email is authorized
        if (authorizedEmails.includes(email.toLowerCase())) {
          console.log('Email authorized, setting localStorage and state');
          // Store auth info in localStorage
          localStorage.setItem('userEmail', email);
          localStorage.setItem('authToken', 'temp-token-' + Date.now());
          
          setIsAuthenticated(true);
          setUser({ email });
          return true;
        }
        console.log('Email not authorized in development mode');
        return false;
      } else {
        console.log('Verifying email with Hotmart API via Make.com');
        
        // URL do endpoint no servidor que vai intermediar a consulta à API da Hotmart
        const verificationUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
        const endpoint = `${verificationUrl}/api/verify-hotmart-customer`;
        
        console.log('Sending request to verify customer with email:', email);
        
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          });
          
          console.log('Response status:', response.status);
          const data = await response.json();
          console.log('Response data:', data);
          
          if (response.ok && data.isCustomer) {
            console.log('Email verified as Hotmart customer, setting localStorage and state');
            // Store auth info in localStorage
            localStorage.setItem('userEmail', email);
            localStorage.setItem('authToken', data.token || 'temp-token-' + Date.now());
            localStorage.setItem('customerData', JSON.stringify(data.customerData || {}));
            
            setIsAuthenticated(true);
            setUser({ email });
            return true;
          }
          console.log('Email not verified as Hotmart customer');
          return false;
        } catch (error) {
          console.error('Error verifying Hotmart customer:', error);
          return false;
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Clear localStorage
      localStorage.removeItem('userEmail');
      localStorage.removeItem('authToken');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        isLoading,
        login,
        logout,
        checkAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
