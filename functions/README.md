# 🔥 Firebase Functions - Backend Effore

Sistema de envio de emails usando Node.js, Firebase Functions e Nodemailer.

## 📦 Instalação

```bash
npm install
```

## 🚀 Deploy

```bash
# Do diretório raiz do projeto
firebase deploy --only functions
```

## 🧪 Desenvolvimento Local

```bash
# Iniciar emuladores
npm run serve

# Ou do diretório raiz:
firebase emulators:start
```

## 🔧 Configuração

### Variáveis de Ambiente

```bash
firebase functions:config:set gmail.email="seu-email@gmail.com"
firebase functions:config:set gmail.password="senha-app-16-digitos"
```

### Ver Configuração

```bash
firebase functions:config:get
```

## 📊 Logs

```bash
# Ver logs
firebase functions:log

# Logs em tempo real
firebase functions:log --follow

# Apenas erros
firebase functions:log --severity error
```

## 🎯 Endpoints

### enviarEmail (POST)

Envia emails personalizados com templates HTML.

**URL:** `https://us-central1-[PROJECT-ID].cloudfunctions.net/enviarEmail`

**Body:**
```json
{
  "tipo": "contato|empresa|candidatura",
  "nome": "Nome Completo",
  "email": "email@example.com",
  "mensagem": "Mensagem..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email enviado com sucesso!"
}
```

### healthCheck (GET)

Verifica se o serviço está funcionando.

**URL:** `https://us-central1-[PROJECT-ID].cloudfunctions.net/healthCheck`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-24T...",
  "service": "Effore Email Backend"
}
```

## 📚 Dependências

- `firebase-admin` - SDK Admin do Firebase
- `firebase-functions` - Cloud Functions runtime
- `nodemailer` - Envio de emails
- `cors` - CORS para API

## 🔐 Segurança

- CORS habilitado para todas as origens
- Validação de dados obrigatórios
- Tratamento de erros robusto
- Backup automático no Firestore

## 📝 Scripts Disponíveis

```bash
npm run serve    # Emuladores locais
npm run shell    # Firebase shell
npm run deploy   # Deploy das functions
npm run logs     # Ver logs
```

## 💾 Backup

Todos os emails são automaticamente salvos no Firestore na collection `emails`.

## 📞 Suporte

Ver documentação completa na raiz do projeto:
- `CONFIGURAR-BACKEND.md`
- `TESTAR-BACKEND.md`
- `COMANDOS-FIREBASE.md`
