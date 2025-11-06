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

## ✉️ Personalização dos Emails dos Formulários

Atualmente os formulários usam o serviço FormSubmit (configuração padrão). Se você quer emails mais ricos (HTML), templates dinâmicos, ou um envio mais controlado, há três opções principais:

1) EmailJS (rápido, client-side)
    - Pró: Não precisa de servidor; suporta templates HTML com variáveis;
    - Contra: exige conta EmailJS e configurar Service ID, Template ID e Public Key; esses identificadores ficam no front-end (EmailJS usa chave pública);
    - Como usar: crie uma conta em https://www.emailjs.com, crie um serviço (ex: Gmail/SMTP), crie um template (com variáveis como {{name}}, {{email}}, {{message}}) e copie `serviceId`, `templateId` e `publicKey`. Em `js/formularios.js` altere `FORM_CONFIG.provider = 'emailjs'` e preencha `FORM_CONFIG.emailjs`.

2) Webhook + Serverless (SendGrid / Mailgun / Postmark)
    - Pró: total controle, seguro (chaves no servidor), uso de templates avançados (SendGrid Templates), melhores taxas de entrega;
    - Contra: requer um pequeno endpoint serverless (Netlify Functions, Vercel Serverless, Google Cloud Functions, AWS Lambda).
    - Como usar: crie uma função que aceite POST do formulário, construa o email (HTML) usando template do provedor e envie via API do SendGrid/Mailgun. Configure `FORM_CONFIG.provider = 'webhook'` e `FORM_CONFIG.webhook.endpoint` com a URL do seu function.

3) Continuar com FormSubmit (simples)
    - Pró: sem servidor, fácil de configurar;
    - Contra: templates limitados, menos controle sobre deliverability e branding.

Implementação atual
- Adicionamos suporte a `emailjs` e `webhook` em `js/formularios.js`.
- Por padrão `provider` está como `'formsubmit'`. Para testar EmailJS, mude `FORM_CONFIG.provider = 'emailjs'` e preencha os campos em `FORM_CONFIG.emailjs`.

Exemplo mínimo de configuração (em `js/formularios.js`):

```js
FORM_CONFIG.provider = 'emailjs';
FORM_CONFIG.emailjs = {
  serviceId: 'service_xxx',
  templateId: 'template_xxx',
  publicKey: 'user_xxx'
};
```

Se preferir, eu mesmo posso:
- configurar um template EmailJS de exemplo e ajustar os formulários para enviar campos bonitos (HTML);
- ou criar uma função serverless de exemplo para enviar via SendGrid (requer API key sua).

Diga qual opção prefere e eu implemento o fluxo completo com templates e testes.

Onde encontrar os templates HTML
--------------------------------
Criei exemplos prontos na pasta `email-templates/` do repositório:

- `email-templates/contact-template.html` — template para formulário de contato
- `email-templates/b2b-template.html` — template para solicitações B2B
- `email-templates/talent-template.html` — template para envio de currículos

Como usar:
- Copie o HTML desses arquivos para criar templates no EmailJS (cole o HTML no editor de template) e então use os Template IDs em `FORM_CONFIG.templates.*.emailjsTemplateId`.
- Ou use esses arquivos como base no seu serverless (webhook) para enviar via SendGrid/Mailgun/Postmark.

Observação: o frontend já gera automaticamente um campo `_html` com uma versão simples do HTML (pré-visualização) e o envia junto ao formulário — útil para seu webhook usar sem precisar reconstruir tudo no servidor.
