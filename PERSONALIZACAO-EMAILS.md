# 🎨 Guia de Personalização de Emails - Effore

## ✅ O que foi implementado

Agora seus formulários têm **emails totalmente personalizados** com:

- ✉️ **Assuntos específicos** para cada tipo de formulário
- 📋 **Templates formatados** (tabela)
- 🤖 **Auto-resposta automática** para quem envia
- 📧 **CC/BCC** para cópias de email
- 🚫 **Sem captcha** para melhor experiência
- 🎯 **Identificação clara** de cada tipo de formulário

---

## 📧 Tipos de Email Configurados

### 1. **Formulário de Contato Geral**
- 📌 **Assunto**: "💬 Nova Mensagem de Contato - Effore"
- 📍 **Onde**: `contato.html`, `index.html`, `vagas.html`

### 2. **Banco de Talentos**
- 📌 **Assunto**: "📄 Novo Currículo - Banco de Talentos Effore"
- 📍 **Onde**: `vagas.html` (formulário de upload)

### 3. **Solicitação B2B**
- 📌 **Assunto**: "🏢 Nova Solicitação B2B - Effore Recrutamento"
- 📍 **Onde**: `para-empresa.html`

---

## 🎯 Como Personalizar

Abra o arquivo `formularios.js` e edite as configurações no início do arquivo:

### 📝 Alterar Auto-Resposta

```javascript
autoResponse: {
    enabled: true, // true = ativo, false = desativado
    subject: 'Recebemos sua mensagem - Effore Recrutamento',
    message: `
        Olá! 👋
        
        [SUA MENSAGEM PERSONALIZADA AQUI]
        
        Atenciosamente,
        Equipe Effore
    `
}
```

### 📬 Adicionar CC (Cópia de Email)

Receba uma cópia de cada formulário em outro email:

```javascript
cc: 'gerente@effore.com', // Adicione o email aqui
```

### 🔒 Adicionar BCC (Cópia Oculta)

Receba cópias sem que o remetente saiba:

```javascript
bcc: 'backup@effore.com,arquivo@effore.com', // Múltiplos emails separados por vírgula
```

### 🔗 Redirecionar Após Envio

Redirecione o usuário para uma página de agradecimento:

```javascript
nextPage: 'https://effore.com/obrigado.html',
```

### 🎨 Alterar Template do Email

Escolha como os dados chegam no email:

```javascript
template: 'table', // Opções: 'box', 'table', ou deixe vazio
```

**Exemplos:**
- `'table'` = Dados em tabela organizada (recomendado)
- `'box'` = Dados em caixas
- `''` (vazio) = Email simples padrão

---

## 🚀 Personalização Avançada

### Alterar Assuntos dos Emails

No código, procure por cada função e altere o parâmetro `addEmailSettings`:

**Formulário de Contato:**
```javascript
formData = addEmailSettings(formData, 'MEU ASSUNTO PERSONALIZADO');
```

**Banco de Talentos:**
```javascript
formData = addEmailSettings(formData, 'CURRÍCULO RECEBIDO');
```

**B2B:**
```javascript
formData = addEmailSettings(formData, 'NOVA EMPRESA INTERESSADA');
```

### Criar Página de Obrigado (Opcional)

1. Crie um arquivo `obrigado.html` no seu projeto:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Obrigado - Effore</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div style="text-align: center; padding: 100px 20px;">
        <h1>✅ Mensagem Enviada!</h1>
        <p>Obrigado pelo contato. Retornaremos em breve!</p>
        <a href="index.html" class="btn btn-primary">Voltar para Home</a>
    </div>
</body>
</html>
```

2. Configure no `formularios.js`:
```javascript
nextPage: 'https://seusite.com/obrigado.html',
```

---

## 📊 Exemplo de Email que Você Receberá

### 📧 Email Principal (Para Você)

```
De: FormSubmit <noreply@formsubmit.co>
Para: brunoeffore@outlook.com
Assunto: 💬 Nova Mensagem de Contato - Effore

┌─────────────────────────────────────┐
│ name    │ João Silva                │
│ email   │ joao@exemplo.com          │
│ message │ Gostaria de mais infos... │
└─────────────────────────────────────┘
```

### 📧 Auto-Resposta (Para Quem Enviou)

```
De: FormSubmit <noreply@formsubmit.co>
Para: joao@exemplo.com
Assunto: Recebemos sua mensagem - Effore Recrutamento

Olá! 👋

Recebemos sua mensagem e agradecemos pelo contato!

Nossa equipe da Effore Recrutamento e Seleção irá analisar 
sua solicitação e retornar em breve.

Tempo médio de resposta: 24 horas úteis

Atenciosamente,
Equipe Effore

📞 WhatsApp: +55 11 98372-0548
📧 Email: brunoeffore@outlook.com
📍 Salto/SP
```

---

## 🎨 Exemplos de Personalização

### Exemplo 1: Enviar Cópia para Dois Emails

```javascript
emailSettings: {
    cc: 'gerente@effore.com',
    bcc: 'backup@effore.com',
    // ... resto das configs
}
```

### Exemplo 2: Desativar Auto-Resposta

```javascript
autoResponse: {
    enabled: false, // ← Desativa
}
```

### Exemplo 3: Mensagem de Auto-Resposta Diferente para B2B

Localize a função `initB2BForm()` e adicione:

```javascript
// Sobrescreve auto-resposta apenas para B2B
formData.append('_autoresponse', `
    Olá! 👔
    
    Recebemos sua solicitação B2B!
    
    Nossa equipe comercial entrará em contato em até 4 horas úteis.
    
    Atenciosamente,
    Time Comercial Effore
`);
```

---

## 🔧 Recursos Extras do FormSubmit

### Adicionar Honeypot (Anti-Spam)

No HTML, adicione um campo oculto:

```html
<input type="text" name="_honey" style="display:none">
```

### Desabilitar AJAX (Recarregar Página)

```javascript
formData.append('_ajax', 'false');
```

### Adicionar Reply-To Customizado

```javascript
formData.append('_replyto', email); // Usa o email do formulário
```

---

## 📱 Como Testar

1. **Abra**: `teste-formularios.html`
2. **Preencha** qualquer formulário
3. **Envie** e aguarde
4. **Verifique** seu email principal
5. **Verifique** se recebeu a auto-resposta no email que você usou no formulário

---

## ⚡ Alterações Rápidas

### Mudar TODOS os Assuntos de Uma Vez

Procure por `addEmailSettings` no código e altere os assuntos:

```javascript
// Linha ~173 - Contato Geral
formData = addEmailSettings(formData, 'SEU ASSUNTO AQUI');

// Linha ~221 - B2B
formData = addEmailSettings(formData, 'SEU ASSUNTO AQUI');

// Linha ~269 - Banco de Talentos
formData = addEmailSettings(formData, 'SEU ASSUNTO AQUI');
```

### Mudar Mensagem de Auto-Resposta

Procure por `autoResponse.message` (linha ~32) e edite:

```javascript
message: `
    Sua mensagem personalizada aqui!
    
    Pode usar múltiplas linhas.
    Emojis funcionam! 🎉
    
    - Lista com traços
    - Funciona também
`
```

---

## 🎯 Configuração Recomendada para Produção

```javascript
emailSettings: {
    cc: 'gerente@effore.com',                    // ← Cópia para gerente
    bcc: 'backup@effore.com',                    // ← Backup oculto
    nextPage: 'https://seusite.com/obrigado.html', // ← Página de agradecimento
    noCaptcha: true,                             // ← Sem captcha
    template: 'table',                           // ← Template organizado
    autoResponse: {
        enabled: true,                           // ← Auto-resposta ativa
        subject: 'Recebemos sua mensagem - Effore',
        message: `[Sua mensagem aqui]`
    }
}
```

---

## 🆘 Solução de Problemas

### Auto-Resposta Não Funciona
- ✅ Certifique-se que `enabled: true`
- ✅ Verifique se o email do formulário está correto
- ✅ Aguarde alguns minutos (pode demorar)
- ✅ Verifique a caixa de spam

### CC/BCC Não Recebe
- ✅ Confirme que ativou o FormSubmit (primeiro envio)
- ✅ Verifique se o email está correto
- ✅ Aguarde alguns minutos

### Redirecionamento Não Funciona
- ✅ Use URL completa: `https://seusite.com/pagina.html`
- ✅ Certifique-se que a página existe
- ✅ Teste em um navegador diferente

---

## 🎓 Tutoriais em Vídeo (Recomendados)

FormSubmit oferece vários recursos gratuitos:
- 📺 [FormSubmit Tutorial Oficial](https://formsubmit.co/documentation)
- 📖 [Guia Completo de Features](https://formsubmit.co/documentation)

---

## 💡 Dicas Pro

1. **Organize por Tipo**: Use emojis nos assuntos para identificar rapidamente
2. **Auto-Resposta Profissional**: Inclua tempo de resposta esperado
3. **Use BCC para Backup**: Sempre tenha uma cópia em outro email
4. **Teste Regularmente**: Envie formulários de teste toda semana
5. **Monitore Spam**: Configure filtros para evitar que emails caiam no spam

---

## 📞 Precisa de Ajuda?

- 📧 Email: brunoeffore@outlook.com
- 📱 WhatsApp: +55 11 98372-0548
- 🌐 FormSubmit Docs: https://formsubmit.co/documentation

---

**Última atualização**: 03/11/2025  
**Versão**: 2.0 (Com personalização completa)
