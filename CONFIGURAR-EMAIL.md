# 📧 Guia de Configuração de Emails Profissionais

## 🎯 Problema Atual
Os emails do FormSubmit estão muito simples e chegando sem conteúdo formatado.

## ✅ Soluções Disponíveis

### **OPÇÃO 1: EmailJS (RECOMENDADO)** 🌟
Sistema profissional e GRATUITO com templates HTML personalizáveis!

#### Vantagens:
- ✅ Templates HTML personalizados e bonitos
- ✅ 200 emails/mês GRÁTIS
- ✅ Emails profissionais com logo da empresa
- ✅ Auto-resposta automática personalizada
- ✅ Estatísticas de envio
- ✅ Sem limite de formulários

#### Passo a Passo:

**1. Criar Conta no EmailJS**
- Acesse: https://www.emailjs.com/
- Clique em "Sign Up" (Cadastro gratuito)
- Confirme seu email

**2. Adicionar Serviço de Email**
- No dashboard, vá em "Email Services"
- Clique em "Add New Service"
- Escolha seu provedor (Gmail, Outlook, etc.)
- Siga as instruções para conectar

**3. Criar Template UNIVERSAL (Funciona para TODOS os formulários)**
- Vá em "Email Templates"
- Clique em "Create New Template"
- Use este template HTML DINÂMICO que se adapta a qualquer formulário:

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff; }
        .header { background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%); padding: 30px 20px; text-align: center; color: white; border-radius: 8px 8px 0 0; }
        .logo { max-width: 200px; height: auto; margin-bottom: 15px; }
        .header h1 { margin: 10px 0; font-size: 24px; }
        .header p { margin: 5px 0; font-size: 16px; opacity: 0.95; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; margin: 0; }
        .info-row { padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
        .label { font-weight: bold; color: #ff6b35; display: inline-block; min-width: 120px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; border-top: 2px solid #ff6b35; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <!-- Logo da Effore -->
            <img src="https://raw.githubusercontent.com/BrunoAcioli23/Effore-Recrutamento-e-Selecao/main/assets/Logo-Agencia.png" 
                 alt="Effore Recrutamento e Seleção" 
                 class="logo">
            <h1>{{tipo_formulario}}</h1>
            <p>Conectando Talentos às Melhores Oportunidades</p>
        </div>
        
        <div class="content">
            <h2>Informações do Contato:</h2>
            
            <!-- Campos que aparecem em TODOS os formulários -->
            <div class="info-row">
                <span class="label">Nome:</span> {{from_name}}
            </div>
            <div class="info-row">
                <span class="label">Email:</span> {{from_email}}
            </div>
            
            <!-- Campos OPCIONAIS (só aparecem se preenchidos) -->
            {{#if phone}}
            <div class="info-row">
                <span class="label">Telefone:</span> {{phone}}
            </div>
            {{/if}}
            
            {{#if company}}
            <div class="info-row">
                <span class="label">Empresa:</span> {{company}}
            </div>
            {{/if}}
            
            {{#if vaga}}
            <div class="info-row">
                <span class="label">Vaga de Interesse:</span> {{vaga}}
            </div>
            {{/if}}
            
            {{#if cargo}}
            <div class="info-row">
                <span class="label">Cargo Atual:</span> {{cargo}}
            </div>
            {{/if}}
            
            {{#if linkedin}}
            <div class="info-row">
                <span class="label">LinkedIn:</span> <a href="{{linkedin}}">{{linkedin}}</a>
            </div>
            {{/if}}
            
            {{#if curriculo_url}}
            <div class="info-row">
                <span class="label">Currículo:</span> <a href="{{curriculo_url}}">Baixar Arquivo</a>
            </div>
            {{/if}}
            
            <!-- Data e Origem -->
            <div class="info-row">
                <span class="label">Data/Hora:</span> {{date}} às {{time}}
            </div>
            <div class="info-row">
                <span class="label">Origem:</span> {{origem}}
            </div>
            
            <!-- Mensagem (se houver) -->
            {{#if message}}
            <h3>Mensagem:</h3>
            <div style="background: white; padding: 15px; border-left: 4px solid #ff6b35; margin-top: 10px;">
                {{message}}
            </div>
            {{/if}}
        </div>
        
        <div class="footer">
            <p>📧 Responda diretamente para: {{from_email}}</p>
            <p>💼 Effore Recrutamento e Seleção | Conectando Talentos</p>
        </div>
    </div>
</body>
</html>
```

**💡 Como funciona:**
- Use `{{#if campo}}` para campos opcionais (só aparecem se enviados)
- Todos os formulários usam o MESMO template
- O template se adapta automaticamente aos campos disponíveis!
- ✨ **Logo incluída no cabeçalho!**

---

### 🎨 **Sobre a Logo no Email:**

A logo está sendo carregada do GitHub:
```
https://raw.githubusercontent.com/BrunoAcioli23/Effore-Recrutamento-e-Selecao/main/assets/Logo-Agencia.png
```

**Alternativas de hospedagem (se preferir):**

1. **Imgur** (Recomendado - Simples):
   - Acesse: https://imgur.com/upload
   - Faça upload da logo
   - Clique com botão direito → "Copiar endereço da imagem"
   - Substitua no template

2. **Google Drive**:
   - Faça upload da logo
   - Compartilhe como "Qualquer pessoa com o link"
   - Use: `https://drive.google.com/uc?export=view&id=SEU_FILE_ID`

3. **Seu próprio site**:
   - Se tiver hospedagem web
   - Use: `https://www.efforerecursoshumanos.com.br/assets/logo.png`

**⚠️ Importante:** A imagem precisa estar em uma URL pública para aparecer nos emails!

---

**4. Pegar suas Credenciais**
- Vá em "Account" → "General"
- Copie sua "Public Key"
- Anote o "Service ID" e "Template ID"

**5. Atualizar o código**
No arquivo `js/formularios.js`, altere:
```javascript
const EMAILJS_CONFIG = {
    serviceID: 'seu_service_id_aqui',
    templateID: 'seu_template_id_aqui',
    publicKey: 'sua_public_key_aqui',
    enabled: true // IMPORTANTE: Mude para true!
};
```

**6. Adicionar SDK do EmailJS**
Adicione esta linha no `<head>` das suas páginas HTML:
```html
<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
```

---

### **OPÇÃO 2: FormSubmit Melhorado** ⚡
Já está implementado! Os emails agora chegam com:

✅ Assunto personalizado por tipo de formulário
✅ Template em tabela (mais organizado)
✅ Auto-resposta profissional ao cliente
✅ Informações completas formatadas
✅ Dados de contato da empresa

**Nenhuma configuração adicional necessária!**

---

### **OPÇÃO 3: Integração com Firebase + Email** 🔥
Os contatos já são salvos no Firebase automaticamente! Você pode:

1. **Ver no Painel Admin** (`admin/admin.html`)
2. **Receber notificações** via Firebase Cloud Functions
3. **Exportar relatórios** de contatos

---

## 🎨 Exemplo de Email que o Cliente Recebe (Auto-Resposta)

```
Olá Bruno! 👋

✅ Recebemos sua mensagem com sucesso!

Nossa equipe da Effore Recrutamento e Seleção irá analisar 
sua solicitação e retornar em breve.

━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 RESUMO DO SEU CONTATO
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nome: Bruno
Email: bruno@exemplo.com
Telefone: (11) 98765-4321
Empresa: Empresa XYZ
Data/Hora: 05/11/2025 20:30
━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏱️ Tempo médio de resposta: 24 horas úteis

NOSSOS CANAIS DE ATENDIMENTO:
📞 WhatsApp: (11) 98372-0548
☎️ Telefone: (11) 4029-0828
📧 Email: brunoeffore@outlook.com
🌐 Site: www.efforerecursoshumanos.com.br
📍 Endereço: Salto/SP
📱 Instagram: @effore_recrutamento_selecao

Atenciosamente,
Equipe Effore Recrutamento e Seleção
Conectando talentos às melhores oportunidades! ✨
```

---

## 📊 Comparação das Opções

| Recurso | FormSubmit | EmailJS | Firebase |
|---------|-----------|---------|----------|
| Grátis | ✅ Ilimitado | ✅ 200/mês | ✅ Sim |
| Templates HTML | ❌ | ✅ | ⚠️ Complexo |
| Auto-resposta | ✅ | ✅ | ⚠️ Precisa configurar |
| Fácil setup | ✅ | ✅ | ❌ |
| Profissional | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## 👁️ Preview do Email com Logo

```
╔══════════════════════════════════════════════════════╗
║                                                      ║
║              [LOGO EFFORE AQUI]                     ║
║                                                      ║
║         💬 Nova Mensagem de Contato                 ║
║    Conectando Talentos às Melhores Oportunidades   ║
║                                                      ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  📋 Informações do Contato:                         ║
║                                                      ║
║  Nome:        João Silva                            ║
║  Email:       joao@email.com                        ║
║  Telefone:    (11) 98765-4321                       ║
║  Data/Hora:   05/11/2025 às 20:30                  ║
║  Origem:      Página de Contato                     ║
║                                                      ║
║  Mensagem:                                           ║
║  ┃ Gostaria de mais informações sobre serviços     ║
║                                                      ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  📧 Responda diretamente para: joao@email.com       ║
║  💼 Effore Recrutamento e Seleção                   ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
```

**Design profissional com:**
- ✅ Logo da empresa no topo
- ✅ Gradiente laranja (cores da marca)
- ✅ Layout limpo e organizado
- ✅ Bordas arredondadas
- ✅ Responsivo (funciona em mobile)

---

## 📝 Exemplos de Uso do Template Universal

### Exemplo 1: Formulário de Contato Simples
```javascript
const templateParams = {
    tipo_formulario: '💬 Nova Mensagem de Contato',
    from_name: 'João Silva',
    from_email: 'joao@email.com',
    phone: '(11) 98765-4321',
    message: 'Gostaria de mais informações sobre serviços',
    date: new Date().toLocaleDateString('pt-BR'),
    time: new Date().toLocaleTimeString('pt-BR'),
    origem: 'Página de Contato'
};
```

### Exemplo 2: Formulário de Candidatura
```javascript
const templateParams = {
    tipo_formulario: '🎯 Nova Candidatura',
    from_name: 'Maria Santos',
    from_email: 'maria@email.com',
    phone: '(11) 91234-5678',
    vaga: 'Desenvolvedor Full Stack',
    cargo: 'Desenvolvedor Pleno',
    linkedin: 'https://linkedin.com/in/mariasantos',
    curriculo_url: 'https://drive.google.com/file/curriculo.pdf',
    message: 'Tenho 5 anos de experiência em React e Node.js',
    date: new Date().toLocaleDateString('pt-BR'),
    time: new Date().toLocaleTimeString('pt-BR'),
    origem: 'Página de Vagas'
};
```

### Exemplo 3: Formulário de Lead (Empresa)
```javascript
const templateParams = {
    tipo_formulario: '🏢 Nova Empresa Interessada',
    from_name: 'Carlos Oliveira',
    from_email: 'carlos@empresa.com',
    phone: '(11) 4567-8900',
    company: 'Tech Solutions LTDA',
    message: 'Precisamos contratar 3 desenvolvedores',
    date: new Date().toLocaleDateString('pt-BR'),
    time: new Date().toLocaleTimeString('pt-BR'),
    origem: 'Página Para Empresas'
};
```

**✨ Vantagens:**
- ✅ **1 único template** para todos os formulários
- ✅ Campos opcionais **não aparecem** se vazios
- ✅ **Fácil manutenção** - altere em um só lugar
- ✅ **Flexível** - adicione novos campos quando quiser

---

## �🚀 Recomendação Final

**Para começar AGORA:** Use FormSubmit (já está configurado e melhorado!)

**Para emails mais profissionais:** Configure EmailJS (leva 10 minutos)

**Para sistema completo:** Use EmailJS + Firebase (melhor opção!)

---

## 🆘 Precisa de Ajuda?

Se tiver dúvidas na configuração, posso ajudar! Basta me informar qual opção você escolheu.
