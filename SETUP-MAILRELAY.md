# 🚀 Guia de Configuração - MailRelay

Este projeto agora usa **MailRelay** para envio de emails através do Firebase Functions.

## 📋 Pré-requisitos

1. Conta ativa no [MailRelay](https://mailrelay.com/pt)
2. Firebase CLI instalado (`npm install -g firebase-tools`)
3. Projeto Firebase configurado

## 🔧 Passo a Passo

### 1. Obter Credenciais do MailRelay

1. Acesse sua conta MailRelay
2. Vá em **Configurações → SMTP**
3. Anote suas credenciais:
   - **Servidor SMTP:** `smtp.mailrelay.com.br`
   - **Porta:** `587`
   - **Usuário:** seu email de login
   - **Senha:** sua senha de API/SMTP

### 2. Configurar Variáveis de Ambiente no Firebase

Execute os comandos abaixo no terminal (substitua pelos seus dados):

```bash  
# Navegar para a pasta do projeto
cd "c:\Users\bruno\Workspace\Effore-Recrutamento-e-Selecao"

# Fazer login no Firebase
firebase login

# Configurar as variáveis de ambiente
firebase functions:config:set mailrelay.user="seu-email@mailrelay.com"
firebase functions:config:set mailrelay.password="sua-senha-mailrelay"

# Verificar configuração
firebase functions:config:get
```

### 3. Fazer Deploy das Functions

```bash
# Deploy das functions
firebase deploy --only functions

# Ou deploy específico da função
firebase deploy --only functions:enviarEmail
```

### 4. Atualizar URL no Frontend (já configurado)

A URL já está configurada em `js/formularios.js`:
```
https://us-central1-effore-recursos-humanos.cloudfunctions.net/enviarEmail
```

### 5. Testar o Sistema

1. Acesse a página de contato: `/pages/contato`
2. Preencha o formulário
3. Envie a mensagem
4. Verifique:
   - Console do navegador (deve mostrar sucesso)
   - Email na caixa de entrada configurada
   - Firestore (coleção `emails`)

## 🔍 Verificar Status

```bash
# Ver logs das functions
firebase functions:log

# Testar localmente (opcional)
firebase emulators:start --only functions
```

## 📧 Emails Suportados

O sistema envia 3 tipos de emails:

1. **Contato Geral** - Formulário de contato
2. **Interesse de Empresa** - Formulário para empresas
3. **Candidatura** - Envio de currículos

## 🐛 Troubleshooting

### Erro de Autenticação
- Verifique se as credenciais estão corretas
- Confirme que a senha é a de API/SMTP do MailRelay
- Teste as credenciais manualmente no painel do MailRelay

### Function não encontrada
- Execute `firebase deploy --only functions`
- Aguarde alguns minutos para propagar
- Verifique a URL no Console do Firebase

### CORS Error
- A configuração CORS já está habilitada
- Verifique se o domínio está autorizado no Firebase Hosting

## 📊 Monitoramento

- **Firebase Console:** https://console.firebase.google.com/
- **MailRelay Dashboard:** https://app.mailrelay.com/
- **Logs:** `firebase functions:log`

## 🔐 Segurança

- ✅ Credenciais armazenadas com segurança no Firebase Config
- ✅ Emails salvos no Firestore para backup
- ✅ CORS configurado corretamente
- ✅ Validação de dados no backend

## 💡 Dicas

- O plano gratuito do MailRelay oferece até **75.000 emails/mês**
- Configure alertas no MailRelay para monitorar uso
- Personalize os templates HTML em `functions/index.js`
- Use o Firestore para criar relatórios de mensagens recebidas
