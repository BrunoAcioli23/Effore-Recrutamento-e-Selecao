# 🏢 Effore Recrutamento e Seleção - Website

Site institucional da Effore Recrutamento e Seleção, empresa especializada em conectar talentos às melhores oportunidades.

## 📁 Estrutura do Projeto

```
Effore-Recrutamento-e_Seleção/
│
├── index.html              # Página inicial
├── CNAME                   # Configuração de domínio customizado
├── README.md              # Documentação do projeto
│
├── 📁 pages/              # Páginas HTML do site
│   ├── vagas.html         # Página de vagas abertas
│   ├── para-empresa.html  # Página para empresas
│   ├── blog.html          # Blog/notícias
│   ├── contato.html       # Página de contato
│   └── limpar-dados.html  # Utilitário de limpeza de dados
│
├── 📁 js/                 # Scripts JavaScript
│   ├── efeitos.js         # Animações e efeitos visuais
│   ├── formularios.js     # Lógica dos formulários
│   ├── vagas.js           # Gerenciamento de vagas (público)
│   ├── home-vagas.js      # Vagas na página inicial
│   ├── blog.js            # Funcionalidades do blog
│   └── firebase-config-public.js  # Configuração Firebase (público)
│
├── 📁 css/                # Estilos
│   └── style.css          # Estilos globais do site
│
├── 📁 admin/              # Área administrativa
│   ├── login.html         # Página de login
│   ├── admin.html         # Painel administrativo
│   ├── admin-vagas.js     # Gerenciamento de vagas (admin)
│   ├── firebase-auth.js   # Autenticação Firebase
│   └── firebase-config.js # Configuração Firebase (admin)
│
└── 📁 assets/             # Recursos estáticos
    ├── Logo-Agencia.png
    ├── Simbolo-Logo.png
    └── [outros arquivos de mídia]
```

## 🚀 Tecnologias Utilizadas

- **HTML5** - Estrutura das páginas
- **CSS3** - Estilização e layouts responsivos
- **JavaScript (ES6+)** - Interatividade e lógica
- **Firebase** - Backend (Firestore Database + Authentication)
- **Font Awesome** - Ícones
- **Google Fonts (Poppins, Inter)** - Tipografia

## 📝 Páginas do Site

### Público
- **Home** (`index.html`) - Página inicial com apresentação da empresa
- **Vagas** (`pages/vagas.html`) - Listagem de vagas abertas
- **Para Empresas** (`pages/para-empresa.html`) - Informações para empresas contratantes
- **Blog** (`pages/blog.html`) - Notícias e artigos
- **Contato** (`pages/contato.html`) - Formulário de contato

### Administrativo
- **Login** (`admin/login.html`) - Autenticação de administradores
- **Painel** (`admin/admin.html`) - Gerenciamento de vagas e candidaturas

## 🔧 Funcionalidades

### Para Candidatos
- Visualizar vagas disponíveis
- Filtrar vagas por localização e tipo de contrato
- Candidatar-se às vagas
- Acompanhar status de candidaturas

### Para Empresas
- Visualizar serviços oferecidos
- Entrar em contato através do formulário
- Conhecer o processo de recrutamento

### Para Administradores
- Criar, editar e excluir vagas
- Visualizar candidaturas
- Gerenciar conteúdo do site
- Análise de métricas

## 🌐 Deploy

O site está configurado para deploy no **GitHub Pages** com domínio customizado:
- **Domínio**: www.efforerecursoshumanos.com.br
- **Arquivo de configuração**: `CNAME`

## 📱 Responsividade

O site é totalmente responsivo e otimizado para:
- 📱 Mobile (até 768px)
- 💻 Tablet (768px - 1024px)
- 🖥️ Desktop (1024px+)

## 🔐 Segurança

- Autenticação via Firebase Authentication
- Regras de segurança do Firestore configuradas
- Separação de configurações públicas e administrativas
- Validação de formulários no client-side e server-side

## 📞 Contato

- **Email**: contato@effore.com.br
- **Telefone**: (11) 4029-0828
- **WhatsApp**: (11) 98372-0548
- **Instagram**: [@effore_recrutamento_selecao](https://www.instagram.com/effore_recrutamento_selecao/)

---

© 2025 Effore Recrutamento e Seleção. Todos os direitos reservados.
