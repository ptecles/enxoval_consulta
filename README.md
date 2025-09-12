# Busca Produtos para Bebê

Uma aplicação React TypeScript para busca de produtos para bebê com autenticação integrada ao Hotmart via Make.com.

## Funcionalidades

- Login com email de comprador Hotmart
- Busca de produtos por texto
- Filtros por marca e categoria
- Links diretos para os produtos
- Interface responsiva e amigável

## Estrutura do Projeto

- `src/` - Código fonte da aplicação
  - `components/` - Componentes React reutilizáveis
  - `contexts/` - Context API para gerenciamento de estado
  - `services/` - Serviços para busca de produtos
  - `App.tsx` - Componente principal da aplicação
- `public/` - Arquivos estáticos e template HTML
- `build/` - Versão compilada para produção

## Configuração Local

Para executar este projeto localmente:

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm start
```

## Implantação (Deployment)

Esta aplicação está configurada para fácil implantação no Netlify:

1. Faça login no [Netlify](https://www.netlify.com/)
2. Clique em "New site from Git"
3. Selecione seu repositório
4. Use as configurações padrão (já definidas no arquivo netlify.toml)
5. Clique em "Deploy site"

## Integração com Make.com e Hotmart

Esta aplicação utiliza o Make.com para integrar com o Hotmart e verificar emails autorizados. Siga estas instruções detalhadas para configurar a integração:

### Passo 1: Criar uma Planilha Google

1. Acesse o [Google Sheets](https://sheets.google.com) e crie uma nova planilha
2. Nomeie-a como "Clientes Hotmart" ou algo similar
3. Configure as seguintes colunas:
   - Email (Coluna A)
   - Data da Compra (Coluna B)
   - Produto (Coluna C)
   - Status (Coluna D)

### Passo 2: Criar o Cenário de Webhook Hotmart no Make.com

1. **Cadastre-se/faça login no Make.com**
   - Acesse [Make.com](https://www.make.com) e crie uma conta ou faça login

2. **Crie um novo cenário**
   - Clique em "Criar um novo cenário"
   - Pesquise e selecione "Webhooks" como seu gatilho

3. **Configure o gatilho do webhook**
   - Selecione "Webhook personalizado"
   - Clique em "Adicionar" para criar o webhook
   - Copie a URL do webhook gerada (você precisará disso para o Hotmart)

4. **Adicione um módulo de análise JSON**
   - Clique no ícone "+" após seu webhook
   - Pesquise por "JSON" e selecione "Analisar JSON"
   - Configure-o para analisar os dados do webhook do Hotmart
   - No campo "Estrutura de dados", você pode colar uma amostra do payload do webhook Hotmart
   - Mapeie os campos importantes (especialmente o email do comprador)

5. **Adicione o módulo Google Sheets**
   - Clique no ícone "+" após seu analisador JSON
   - Pesquise por "Google Sheets" e selecione-o
   - Escolha a ação "Adicionar uma linha"
   - Conecte sua conta do Google
   - Selecione sua planilha "Clientes Hotmart"
   - Mapeie os campos:
     - Email: `{{1.data.buyer.email}}`
     - Data da Compra: `{{formatDate(now; "YYYY-MM-DD HH:mm:ss")}}`
     - Produto: `{{1.data.product.name}}`
     - Status: `{{1.data.purchase.status}}`

6. **Adicione uma resposta de webhook**
   - Clique no ícone "+" após o Google Sheets
   - Selecione "Webhooks" e "Retornar uma resposta"
   - Defina a resposta como: `{"success": true}`

7. **Salve e ative seu cenário**
   - Clique em "Salvar" no painel inferior
   - Alterne o cenário para "Ativado"

### Passo 3: Configurar o Hotmart para Enviar Webhooks

1. Faça login na sua conta Hotmart
2. Vá para "Desenvolvedores" > "Webhooks"
3. Clique em "Adicionar Webhook"
4. Cole a URL do webhook que você copiou do Make.com
5. Selecione os eventos que deseja rastrear (no mínimo "Compra Aprovada")
6. Salve sua configuração de webhook

### Passo 4: Criar o Webhook de Verificação de Email no Make.com

1. **Crie outro cenário no Make.com**
   - Clique em "Criar um novo cenário"
   - Selecione "Webhooks" como seu gatilho

2. **Configure o gatilho do webhook**
   - Selecione "Webhook personalizado"
   - Clique em "Adicionar" para criar o webhook
   - Copie a URL do webhook gerada (você usará isso em sua aplicação React)

3. **Adicione um roteador para lidar com a solicitação**
   - Clique no ícone "+" após seu webhook
   - Pesquise por "Roteador" e adicione-o
   - Configure uma rota para solicitações POST

4. **Adicione o módulo de pesquisa do Google Sheets**
   - Clique no ícone "+" após seu roteador
   - Pesquise por "Google Sheets" e selecione-o
   - Escolha a ação "Pesquisar linhas"
   - Conecte sua conta do Google
   - Selecione sua planilha "Clientes Hotmart"
   - Defina os critérios de pesquisa:
     - Coluna: Email
     - Valor: `{{1.data.email}}`

5. **Adicione uma resposta de webhook**
   - Clique no ícone "+" após o Google Sheets
   - Selecione "Webhooks" e "Retornar uma resposta"
   - Defina a resposta como:
   ```json
   {
     "authorized": {{if(isEmpty(2.rows); false; true)}},
     "token": "{{generateToken(32)}}",
     "email": "{{1.data.email}}"
   }
   ```

6. **Salve e ative seu cenário**
   - Clique em "Salvar" no painel inferior
   - Alterne o cenário para "Ativado"

### Passo 5: Atualizar sua Aplicação React

Atualize o arquivo `.env.production` com a URL do seu webhook de verificação:

```
REACT_APP_VERIFICATION_WEBHOOK_URL=https://hook.us1.make.com/sua-url-de-verificacao
```

## Scripts Disponíveis

- `npm start` - Executa a aplicação em modo de desenvolvimento
- `npm test` - Inicia o executor de testes
- `npm run build` - Compila a aplicação para produção

## Mais Informações

- [Documentação React](https://reactjs.org/)
- [Documentação TypeScript](https://www.typescriptlang.org/)
- [Documentação Make.com](https://www.make.com/en/help)
- [Documentação Hotmart](https://developers.hotmart.com/)
