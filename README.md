# 🛒 PDV Inteligente v2.0

> Sistema de Ponto de Venda de alta performance, sem atrito cognitivo, com busca tolerante (fuzzy search), atalhos de teclado ágeis e integração nativa com o banco de dados **Supabase**.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fseu-usuario%2Fpdv-inteligente&env=SUPABASE_URL,SUPABASE_ANON_KEY&envDescription=Credenciais%20da%20sua%20API%20do%20Supabase&envLink=https%3A%2F%2Fsupabase.com%2Fdashboard%2Fproject%2F_%2Fsettings%2Fapi)

---

## ⚡ Recursos Principais

- **Busca Inteligente Tolerante (Fuzzy Search - F3)**:
  - Busca por nome parcial, termos invertidos (*"2l coca"*), sem distinção de acentuação (*"agua"* = *"água"*).
  - Reconhecimento e leitura imediata de código de barras numérico.
  - Navegação do autocompletar via setas `↑` / `↓` e seleção com `Enter`.
- **Atalhos Globais de Caixa**:
  - `F3`: Foca a barra de pesquisa inteligente.
  - `F5`: Intercepta o refresh do navegador e solicita confirmação para cancelamento seguro da venda.
  - `F8`: Consulta rápida de preço e estoque sem alterar o carrinho.
  - `F12`: Abre a finalização de venda e o modal de pagamento.
  - `Esc`: Fecha qualquer modal ativo.
- **Fluxo de Pagamento Completo (F12)**:
  - Suporte a Dinheiro, Cartão de Crédito, Cartão de Débito e Pix.
  - Cálculo de troco em tempo real com botões de valores sugeridos.
  - Chave e QR Code Pix instantâneo para cópia.
  - Recibo e impressão de comprovante térmico estilizado.
- **Integração com Supabase (Dual Mode)**:
  - **Full-Stack Serverless na Vercel**: Comunicação segura através de rotas `/api/*` (`/api/products`, `/api/sales`, `/api/supabase/status`).
  - **Failover Resiliente**: Se a rede ou backend oscilarem, o PDV opera com catálogo local sem travar o operador de caixa.
  - **Atualização de Estoque**: Dedução automática da quantidade em estoque a cada venda finalizada.

---

## 🚀 Como Fazer Deploy na Vercel (Passo a Passo)

### Método 1: Via Painel Web da Vercel (Recomendado)

1. **Suba este projeto para um repositório no GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: PDV Inteligente v2.0 com integracao Supabase"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/pdv-inteligente.git
   git push -u origin main
   ```

2. **Importe o projeto na Vercel**:
   - Acesse [vercel.com/new](https://vercel.com/new) e conecte sua conta do GitHub.
   - Selecione o repositório `pdv-inteligente`.
   - O Framework Preset será detectado automaticamente como **Vite**.

3. **Configure as Variáveis de Ambiente no formulário da Vercel**:
   Em **Environment Variables**, adicione as seguintes chaves do seu Supabase:

   | Nome da Variável | Valor de Exemplo | Descrição |
   | :--- | :--- | :--- |
   | `SUPABASE_URL` | `https://xyzcompany.supabase.co` | URL do seu projeto Supabase |
   | `SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Chave pública anônima do Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` *(opcional)* | Chave de serviço para escrita irrestrita |
   | `VITE_SUPABASE_URL` | `https://xyzcompany.supabase.co` | Mesma URL (para fallback no client Vite) |
   | `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Mesma chave anônima (para fallback) |

4. **Clique em "Deploy"**:
   - A Vercel executará o comando de build (`npm run build`).
   - Em menos de 1 minuto, seu PDV estará publicado com domínio seguro HTTPS e funções serverless ativas!

---

### Método 2: Via Vercel CLI (Linha de Comando)

Se você utiliza a CLI da Vercel:

```bash
# 1. Instale a CLI globalmente caso ainda não tenha
npm i -g vercel

# 2. Faça login
vercel login

# 3. Vincule e configure as variáveis
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY

# 4. Execute o deploy de produção
vercel --prod
```

---

## 🗄️ Configuração do Banco de Dados no Supabase

Se você ainda não criou as tabelas no seu projeto Supabase:

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard).
2. Selecione seu projeto e clique no menu **SQL Editor** no painel esquerdo.
3. Copie e cole todo o conteúdo do arquivo `supabase_schema.sql` (incluso na raiz deste projeto).
4. Clique em **Run** para criar as tabelas `products`, `sales`, `sale_items` com políticas RLS ativas e carregar o catálogo inicial de produtos.

---

## 🛠️ Executando Localmente

```bash
# 1. Instale as dependências
npm install

# 2. Crie o arquivo .env a partir do .env.example
cp .env.example .env
# Preencha suas credenciais do Supabase no .env

# 3. Inicie o servidor de desenvolvimento
npm run dev

# 4. Acesse no navegador
http://localhost:3000
```

---

## 📦 Scripts Disponíveis no `package.json`

| Comando | Função |
| :--- | :--- |
| `npm run dev` | Inicia o servidor de desenvolvimento local com recarga automática (`tsx server.ts`) na porta 3000. |
| `npm run build` | Compila os assets estáticos do Vite em `dist/` e o servidor para produção. |
| `npm run start` | Executa o servidor de produção localmente (`node dist/server.cjs`). |
| `npm run lint` | Valida todos os tipos TypeScript (`tsc --noEmit`). |

---

## 📁 Estrutura de Pastas

```
pdv-inteligente/
├── api/
│   └── index.ts                 # Handler das Serverless Functions na Vercel
├── public/
│   └── favicon.svg              # Ícone da aplicação
├── src/
│   ├── components/              # Componentes de interface do PDV
│   │   ├── CancelSaleModal.tsx  # Modal de cancelamento seguro (F5)
│   │   ├── Cart.tsx             # Zona C: Carrinho de compras e itens
│   │   ├── Catalog.tsx          # Zona B: Catálogo de produtos e filtros
│   │   ├── ConsultPriceModal.tsx# Modal de consulta rápida (F8)
│   │   ├── Header.tsx           # Zona A: Busca inteligente (F3), operador e relógio
│   │   ├── PaymentModal.tsx     # Modal completo de pagamento e troco (F12)
│   │   ├── ProductIcon.tsx      # Mapeamento dinâmico de ícones Lucide
│   │   ├── ShortcutsHelpModal.tsx # Guia de atalhos do teclado
│   │   ├── SupabaseInfoModal.tsx# Modal de diagnóstico da integração com o banco
│   │   └── TotalFooter.tsx      # Zona D: Barra inferior de total e finalizar (F12)
│   ├── data/
│   │   └── mockProducts.ts      # Dados de catálogo para fallback offline
│   ├── services/
│   │   └── api.ts               # Camada de comunicação com a API / Supabase
│   ├── utils/
│   │   ├── formatters.ts        # Formatador de moedas BRL e quantidades
│   │   └── fuzzySearch.ts       # Algoritmo de busca tolerante
│   ├── App.tsx                  # Componente mestre do PDV
│   ├── index.css                # Variáveis de tema e estilos Tailwind v4
│   ├── main.tsx                 # Ponto de entrada React
│   ├── types.ts                 # Definições TypeScript
│   └── vite-env.d.ts            # Tipagens do ambiente Vite
├── .env.example                 # Modelo documentado de variáveis de ambiente
├── .gitignore                   # Arquivos ignorados pelo Git e Vercel
├── index.html                   # HTML base com fontes Inter e meta tags
├── package.json                 # Dependências e scripts do projeto
├── server.ts                    # Backend Express e proxy seguro para o Supabase
├── supabase_schema.sql          # Script SQL com tabelas, RLS e carga inicial
├── tsconfig.json                # Configurações do compilador TypeScript
├── vercel.json                  # Configuração de rotas e build da Vercel
└── vite.config.ts               # Configurações do Vite e Tailwind CSS
```
