const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Verificar se as credenciais foram carregadas corretamente
console.log('Verificando carregamento das variáveis de ambiente:');
console.log('- HOTMART_CLIENT_ID:', process.env.HOTMART_CLIENT_ID ? 'configurado' : 'não definido');
console.log('- HOTMART_CLIENT_SECRET:', process.env.HOTMART_CLIENT_SECRET ? 'configurado' : 'não definido');
console.log('- HOTMART_BASIC_AUTH:', process.env.HOTMART_BASIC_AUTH ? 'configurado' : 'não definido');
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const morgan = require('morgan');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const fetch = require('node-fetch');

const app = express();
const PORT = 1000;

// Habilitar CORS para todas as origens
app.use(cors());

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Gerenciador de token da Hotmart
class HotmartTokenManager {
  constructor() {
    this.accessToken = null;
    this.expiresAt = null;
    this.basicAuth = process.env.HOTMART_BASIC_AUTH;
    this.clientId = process.env.HOTMART_CLIENT_ID;
    this.clientSecret = process.env.HOTMART_CLIENT_SECRET;
    // Endpoint da Hotmart para obtenção de token
    // Usando o endpoint alternativo baseado na documentação mais recente
    this.tokenEndpoint = 'https://api-sec-vlc.hotmart.com/security/oauth/token';
    
    console.log('HotmartTokenManager inicializado com:');
    console.log('- Client ID:', this.clientId ? this.clientId.substring(0, 8) + '...' : 'não definido');
    console.log('- Client Secret:', this.clientSecret ? 'configurado' : 'não definido');
    console.log('- Basic Auth:', this.basicAuth ? 'configurado' : 'não definido');
  }

  async getAccessToken() {
    // Verificar se já temos um token válido
    if (this.accessToken && this.expiresAt && new Date() < new Date(this.expiresAt)) {
      console.log('Usando token existente que ainda é válido');
      return this.accessToken;
    }
    
    console.log('Obtendo novo token da Hotmart...');
    try {
      // Gerar o header de autorização Basic
      let authHeader;
      
      if (this.basicAuth) {
        // Se já temos o código Basic Auth completo
        if (this.basicAuth.startsWith('Basic ')) {
          // Remover o prefixo 'Basic ' para evitar duplicação
          const authValue = this.basicAuth.substring(6);
          authHeader = `Basic ${authValue}`;
        } else {
          authHeader = `Basic ${this.basicAuth}`;
        }
        console.log('Usando Basic Auth fornecido diretamente');
      } else if (this.clientId && this.clientSecret) {
        // Gerar Basic Auth a partir do client ID e secret
        const base64Credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
        authHeader = `Basic ${base64Credentials}`;
        console.log('Usando Basic Auth gerado a partir de client ID e secret');
      } else {
        throw new Error('Credenciais da Hotmart não configuradas');
      }
      
      console.log('URL do endpoint:', this.tokenEndpoint);
      
      // Usar a abordagem conforme documentação oficial da Hotmart
      // Incluir grant_type, client_id e client_secret na URL conforme documentação
      const tokenUrl = `${this.tokenEndpoint}?grant_type=client_credentials&client_id=${this.clientId}&client_secret=${this.clientSecret}`;
      console.log('URL do endpoint de token:', tokenUrl);
      
      // Verificar se o header de autorização está correto
      console.log('Header de autorização (primeiros 20 caracteres):', authHeader.substring(0, 20) + '...');
      
      // Seguir exatamente o formato do curl fornecido pela Hotmart
      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });
      
      // Exibir headers completos para debug
      console.log('Headers completos da requisição:');
      console.log('- Authorization:', authHeader);
      console.log('- Content-Type: application/json');
      
      // Verificar se a URL e os headers estão corretos conforme o exemplo curl
      console.log('Comparando com o exemplo curl:');
      console.log(`curl --location --request POST 'https://api-sec-vlc.hotmart.com/security/oauth/token?grant_type=client_credentials&client_id=:client_id&client_secret=:client_secret' \
--header 'Content-Type: application/json' \
--header 'Authorization: Basic :basic'`);
      
      // Verificar resposta
      console.log('Status da resposta do token:', tokenResponse.status);
      const responseText = await tokenResponse.text();
      console.log('Resposta do token (primeiros 100 caracteres):', responseText.substring(0, 100) + '...');
      
      if (!tokenResponse.ok) {
        throw new Error(`Erro ao obter token: ${tokenResponse.status} - ${responseText.substring(0, 100)}`);
      }
      
      // Tentar fazer parse do JSON
      let tokenData;
      try {
        tokenData = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Erro ao fazer parse da resposta: ${parseError.message}`);
      }
      
      if (!tokenData.access_token) {
        throw new Error('Token não encontrado na resposta');
      }
      
      this.accessToken = tokenData.access_token;
      
      // Calcular quando o token expira (geralmente 1 hora)
      const expiresInMs = (tokenData.expires_in || 3600) * 1000;
      this.expiresAt = new Date(Date.now() + expiresInMs);
      
      console.log(`Token obtido com sucesso. Expira em: ${this.expiresAt.toISOString()}`);
      return this.accessToken;
    } catch (error) {
      console.error('Erro ao obter token da Hotmart:', error);
      throw error;
    }
  }
}

// Instância global do gerenciador de token
const hotmartTokenManager = new HotmartTokenManager();

// Database setup with lowdb (JSON file-based DB)
const adapter = new FileSync('db.json');
const db = low(adapter);

// Set default data structure if db.json doesn't exist
db.defaults({ users: [], webhookLogs: [] }).write();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Your React app
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'hotmart-auth-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.isAuthenticated) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
};

// Routes

// Test endpoint to check if server is running
app.get('/api/test', (req, res) => {
  return res.status(200).json({ message: 'Server is running!' });
});

// Endpoint de teste para verificar o token da Hotmart
app.get('/api/test-hotmart-token', async (req, res) => {
  try {
    console.log('Testando obtenção de token da Hotmart...');
    // Forçar renovação do token se o parâmetro force=true for passado
    if (req.query.force === 'true') {
      console.log('Forçando renovação do token...');
      hotmartTokenManager.accessToken = null;
    }
    
    const token = await hotmartTokenManager.getAccessToken();
    res.json({ 
      success: true, 
      message: 'Token obtido com sucesso!', 
      token_preview: token ? token.substring(0, 10) + '...' : null,
      expires_at: hotmartTokenManager.expiresAt,
      client_id: process.env.HOTMART_CLIENT_ID ? process.env.HOTMART_CLIENT_ID.substring(0, 8) + '...' : 'não definido'
    });
  } catch (error) {
    console.error('Erro ao obter token:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao obter token', 
      error: error.message 
    });
  }
});

// Endpoint para verificar o token da Hotmart usando check_token
app.get('/api/check-hotmart-token', async (req, res) => {
  try {
    console.log('Verificando token da Hotmart...');
    // Obter token de acesso
    const accessToken = await hotmartTokenManager.getAccessToken();
    console.log('Token de acesso:', accessToken);
    
    // Endpoint check_token da Hotmart
    const apiUrl = 'https://api-sec-vlc.hotmart.com/security/oauth/check_token';
    console.log(`Verificando token em: ${apiUrl}`);
    
    // Gerar o header de autorização Basic
    let basicAuth = process.env.HOTMART_BASIC_AUTH;
    let authHeader;
    
    if (basicAuth) {
      // Se já temos o código Basic Auth completo
      if (basicAuth.startsWith('Basic ')) {
        // Remover o prefixo 'Basic ' para evitar duplicação
        const authValue = basicAuth.substring(6);
        authHeader = `Basic ${authValue}`;
      } else {
        authHeader = `Basic ${basicAuth}`;
      }
    } else {
      // Gerar Basic Auth a partir do client ID e secret
      const base64Credentials = Buffer.from(`${process.env.HOTMART_CLIENT_ID}:${process.env.HOTMART_CLIENT_SECRET}`).toString('base64');
      authHeader = `Basic ${base64Credentials}`;
    }
    
    // Verificar o token usando o endpoint check_token
    const checkTokenUrl = `${apiUrl}?token=${accessToken}`;
    const apiResponse = await fetch(checkTokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });
    
    const responseStatus = apiResponse.status;
    console.log(`Status da resposta: ${responseStatus}`);
    
    const responseData = await apiResponse.json();
    console.log('Resposta da verificação do token:', JSON.stringify(responseData, null, 2));
    
    res.json({
      success: apiResponse.ok,
      status: responseStatus,
      message: apiResponse.ok ? 'Token válido' : 'Token inválido',
      token_info: responseData
    });
  } catch (error) {
    console.error('Erro ao verificar token da Hotmart:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar token da Hotmart',
      error: error.message
    });
  }
});

// Endpoint para testar a API da Hotmart
app.get('/api/test-hotmart-api', async (req, res) => {
  try {
    console.log('Testando API da Hotmart...');
    // Obter token de acesso
    const accessToken = await hotmartTokenManager.getAccessToken();
    
    // Testar o endpoint especificado ou usar o endpoint padrão conforme documentação oficial
    const endpoint = req.query.endpoint || 'payments/api/v1/sales/history?transaction_status=APPROVED';
    const apiUrl = `https://developers.hotmart.com/${endpoint}`;
    console.log(`Testando endpoint da API Hotmart: ${apiUrl}`);
    console.log('Token de acesso (primeiros 10 caracteres):', accessToken.substring(0, 10) + '...');
    
    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const responseStatus = apiResponse.status;
    console.log(`Status da resposta: ${responseStatus}`);
    
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(`Erro na API: ${errorText}`);
      return res.status(200).json({
        success: false,
        status: responseStatus,
        message: 'Erro ao acessar API da Hotmart',
        error: errorText
      });
    }
    
    const apiData = await apiResponse.json();
    console.log('Resposta da API recebida com sucesso');
    
    res.json({
      success: true,
      status: responseStatus,
      message: 'API da Hotmart acessada com sucesso',
      data: apiData
    });
  } catch (error) {
    console.error('Erro ao acessar API da Hotmart:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao acessar API da Hotmart',
      error: error.message
    });
  }
});

// Verificar cliente na Hotmart diretamente via API
app.post('/api/verify-hotmart-customer', async (req, res) => {
  const { email, testMode } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  
  // Modo de teste para desenvolvimento - se testMode=true e email termina com @teste.com, considera como cliente válido
  if (testMode && email.toLowerCase().endsWith('@teste.com')) {
    console.log(`Modo de teste ativado para: ${email}`);
    const emailLowerCase = email.toLowerCase();
    const customerName = `Teste ${emailLowerCase.split('@')[0]}`;
    
    // Criar usuário de teste no banco local
    const testUser = {
      id: `test-${Date.now()}`,
      email: emailLowerCase,
      name: customerName,
      verified: true,
      createdAt: new Date().toISOString(),
      subscription: {
        status: 'active',
        plan: 'Teste Premium',
        startDate: new Date().toISOString()
      }
    };
    
    // Salvar no banco local
    db.get('users')
      .push(testUser)
      .write();
    
    return res.status(200).json({
      isCustomer: true,
      message: 'Cliente de teste verificado com sucesso',
      token: `test-auth-${Date.now()}`,
      customerData: testUser
    });
  }
  
  try {
    console.log(`Verificando cliente com email: ${email}`);
    
    // Primeiro, verificamos se o usuário já existe no nosso banco local
    const existingUser = db.get('users')
      .find({ email: email.toLowerCase() })
      .value();
    
    if (existingUser) {
      console.log(`Usuário encontrado no banco local: ${email}`);
      return res.status(200).json({ 
        isCustomer: true,
        message: 'Cliente verificado com sucesso',
        token: `local-auth-${Date.now()}`,
        customerData: existingUser
      });
    }
    
    // Se não existe localmente, consultamos diretamente a API da Hotmart
    console.log('Consultando API da Hotmart diretamente...');
    
    try {
      // Obter token de acesso atualizado usando o gerenciador de token
      const accessToken = await hotmartTokenManager.getAccessToken();
      
      // Usar o endpoint real da API da Hotmart para verificar se o email está entre os compradores aprovados
      console.log('Token obtido com sucesso!');
      console.log('Access Token (primeiros 10 caracteres):', accessToken.substring(0, 10) + '...');
      
      // Usar o endpoint de histórico de vendas conforme documentação oficial
      const hotmartApiUrl = 'https://developers.hotmart.com/payments/api/v1/sales/history';
      console.log(`Consultando histórico de vendas na Hotmart: ${hotmartApiUrl}?transaction_status=APPROVED`);
      
      try {
        // Gerar o header de autorização Basic
        let basicAuth = process.env.HOTMART_BASIC_AUTH;
        let authHeader;
        
        if (basicAuth) {
          // Se já temos o código Basic Auth completo
          if (basicAuth.startsWith('Basic ')) {
            // Remover o prefixo 'Basic ' para evitar duplicação
            const authValue = basicAuth.substring(6);
            authHeader = `Basic ${authValue}`;
          } else {
            authHeader = `Basic ${basicAuth}`;
          }
        } else {
          // Gerar Basic Auth a partir do client ID e secret
          const base64Credentials = Buffer.from(`${process.env.HOTMART_CLIENT_ID}:${process.env.HOTMART_CLIENT_SECRET}`).toString('base64');
          authHeader = `Basic ${base64Credentials}`;
        }
        
        // Consultar o histórico de vendas aprovadas
        const salesHistoryUrl = `${hotmartApiUrl}?transaction_status=APPROVED&buyer_email=${encodeURIComponent(email)}`;
        console.log('URL de consulta de vendas:', salesHistoryUrl);
        
        const hotmartResponse = await fetch(salesHistoryUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Status da resposta:', hotmartResponse.status);
        
        if (!hotmartResponse.ok) {
          const errorText = await hotmartResponse.text();
          console.error(`Erro na API da Hotmart: ${hotmartResponse.status} - ${errorText}`);
          
          // Tratar erros específicos
          if (hotmartResponse.status === 401) {
            return res.status(200).json({ 
              isCustomer: false, 
              message: 'Erro de autenticação com a API da Hotmart',
              error: 'Token inválido ou expirado'
            });
          }
          
          return res.status(200).json({ 
            isCustomer: false, 
            message: 'Erro ao verificar cliente na Hotmart',
            error: errorText
          });
        }
        
        // Processar a resposta para verificar se o cliente existe
        const responseData = await hotmartResponse.json();
        console.log('Resposta da API da Hotmart recebida');
        
        // Verificar se há vendas aprovadas para o email do cliente
        // A API retorna uma lista de vendas, se houver pelo menos uma venda, o cliente é válido
        const customerHasApprovedSales = responseData && 
                          responseData.data && 
                          Array.isArray(responseData.data.items) && 
                          responseData.data.items.length > 0;
        
        if (!customerHasApprovedSales) {
          console.log(`Cliente ${email} não encontrado no histórico de vendas aprovadas`);
          return res.status(200).json({ 
            isCustomer: false, 
            message: 'Email não encontrado na base de clientes da Hotmart',
            error: 'Nenhuma venda aprovada encontrada para este email'
          });
        }
        
        // Cliente encontrado com vendas aprovadas
        console.log(`Cliente ${email} encontrado no histórico de vendas aprovadas`);
        
        // Extrair informações das vendas
        const sales = responseData.data.items;
        console.log(`Total de ${sales.length} vendas encontradas para o email ${email}`);
        
        // Obter detalhes da primeira venda para usar como informações do cliente
        const firstSale = sales[0];
        const customerName = firstSale.buyer ? firstSale.buyer.name : `Cliente ${email.split('@')[0]}`;
        const emailLowerCase = email.toLowerCase();
        
        // Cliente encontrado no histórico de vendas é um cliente válido
        const isCustomerValid = true;
        
        console.log(`Cliente ${isCustomerValid ? 'validado' : 'NÃO validado'} para: ${email}`);
        
        // Criar objeto com dados do cliente baseado na resposta da API
        const userData = {
          id: firstSale.transaction || `hotmart-${Date.now()}`,
          email: emailLowerCase,
          name: customerName,
          verified: true,
          subscription: {
            status: 'active',
            plan: firstSale.product ? firstSale.product.name : 'Premium',
            startDate: firstSale.purchase_date || new Date().toISOString()
          }
        };
        
        if (isCustomerValid) {
          console.log(`Cliente encontrado na Hotmart: ${email}`);
          
          // Armazenar o cliente no banco local para futuras consultas
          const newUser = {
            id: Date.now().toString(),
            email: email.toLowerCase(),
            name: customerName,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
            hotmartData: userData
          };
          
          db.get('users')
            .push(newUser)
            .write();
          
          return res.status(200).json({
            isCustomer: true,
            message: 'Cliente verificado com sucesso',
            customerData: newUser
          });
        } else {
          console.log(`Cliente NÃO encontrado na Hotmart: ${email}`);
          return res.status(200).json({
            isCustomer: false,
            message: 'Email não encontrado na base de clientes da Hotmart'
          });
        }
      } catch (error) {
        console.error('Erro ao processar resposta da API da Hotmart:', error);
        return res.status(200).json({ 
          isCustomer: false, 
          message: 'Erro ao verificar cliente na Hotmart',
          error: error.message
        });
      }
    } catch (apiError) {
      console.error('Erro ao chamar API da Hotmart:', apiError);
      return res.status(500).json({ 
        isCustomer: false, 
        message: 'Erro ao verificar cliente na Hotmart',
        error: apiError.message
      });
    }
  } catch (error) {
    console.error('Erro ao verificar cliente na Hotmart:', error);
    return res.status(500).json({ 
      isCustomer: false, 
      message: 'Erro ao verificar cliente na Hotmart',
      error: error.message
    });
  }
});

// Get all users (for debugging only)
app.get('/api/users', (req, res) => {
  const users = db.get('users').value();
  return res.status(200).json({ users });
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { email } = req.body;
  
  console.log('Login attempt with email:', email);
  console.log('Current users in DB:', db.get('users').value());
  
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  
  // Check if email exists in our database
  const user = db.get('users')
    .find({ email: email.toLowerCase() })
    .value();
  
  console.log('Found user:', user);
  
  if (user) {
    // Set session data
    req.session.isAuthenticated = true;
    req.session.userEmail = email.toLowerCase();
    
    return res.status(200).json({ 
      success: true,
      message: 'Login successful',
      user: { email: user.email }
    });
  } else {
    return res.status(401).json({ 
      success: false,
      message: 'Email not found. Please check if you have purchased the product on Hotmart.'
    });
  }
});

// Check authentication status
app.get('/api/auth-status', (req, res) => {
  if (req.session.isAuthenticated) {
    const user = db.get('users')
      .find({ email: req.session.userEmail })
      .value();
      
    return res.status(200).json({ 
      isAuthenticated: true,
      user: { email: user.email }
    });
  } else {
    return res.status(200).json({ isAuthenticated: false });
  }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to logout' });
    }
    res.clearCookie('connect.sid');
    return res.status(200).json({ message: 'Logged out successfully' });
  });
});

// Hotmart webhook endpoint
app.post('/api/webhook/hotmart', (req, res) => {
  const data = req.body;
  
  // Log webhook data
  db.get('webhookLogs')
    .push({
      timestamp: new Date().toISOString(),
      data: data
    })
    .write();
  
  // Check if this is a purchase confirmation
  if (data.event === 'PURCHASE_APPROVED' || data.event === 'PURCHASE_COMPLETE') {
    const email = data.data?.buyer?.email;
    
    if (email) {
      // Check if user already exists
      const existingUser = db.get('users')
        .find({ email: email.toLowerCase() })
        .value();
      
      if (!existingUser) {
        // Add new user
        db.get('users')
          .push({
            email: email.toLowerCase(),
            createdAt: new Date().toISOString(),
            hotmartData: data.data
          })
          .write();
        
        console.log(`Added new user: ${email}`);
      }
    }
  }
  
  // Always return 200 to Hotmart
  return res.status(200).json({ success: true });
});

// Protected route example
app.get('/api/protected', isAuthenticated, (req, res) => {
  res.json({ message: 'This is protected data' });
});

// For manual user addition (development/testing)
app.post('/api/admin/add-user', (req, res) => {
  const { email, adminKey } = req.body;
  
  // Simple admin key check (replace with proper admin auth in production)
  if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'dev-admin-key') {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  
  // Check if user already exists
  const existingUser = db.get('users')
    .find({ email: email.toLowerCase() })
    .value();
  
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }
  
  // Add new user
  db.get('users')
    .push({
      email: email.toLowerCase(),
      createdAt: new Date().toISOString(),
      addedManually: true
    })
    .write();
  
  return res.status(201).json({ 
    success: true,
    message: `User ${email} added successfully`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
