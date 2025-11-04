# 🔥 Guia de Configuração do Firebase

## Passo 1: Criar Projeto no Firebase Console

1. **Acesse**: https://console.firebase.google.com/
2. **Clique em**: "Adicionar projeto" (ou "Create a project")
3. **Nome do projeto**: `Effore-Recrutamento` (ou o nome que preferir)
4. **Google Analytics**: Pode desabilitar por enquanto (não é necessário)
5. **Clique em**: "Criar projeto"
6. **Aguarde** a criação (leva ~30 segundos)

## Passo 2: Registrar o App Web

1. No console do Firebase, clique no **ícone da Web** `</>`
2. **Nome do app**: `Effore Site`
3. **NÃO marque** "Firebase Hosting" por enquanto
4. **Clique em**: "Registrar app"

## Passo 3: Copiar as Credenciais

Você verá um código similar a este:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

**IMPORTANTE**: Copie esse código! Você vai precisar dele no próximo passo.

## Passo 4: Configurar o Firestore Database

1. No menu lateral, clique em **"Firestore Database"**
2. Clique em **"Criar banco de dados"**
3. Escolha **"Iniciar no modo de teste"** (vamos configurar segurança depois)
4. Escolha a localização: **"southamerica-east1"** (São Paulo - mais rápido para o Brasil)
5. Clique em **"Ativar"**

## Passo 5: Configurar Regras de Segurança

1. Ainda no Firestore, clique na aba **"Regras"**
2. Cole este código (permite leitura pública, mas escrita apenas autenticada):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Vagas: todos podem ler, apenas admins autenticados podem escrever
    match /vagas/{vagaId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

3. **Clique em**: "Publicar"

## Passo 6: Configurar Authentication

1. No menu lateral, clique em **"Authentication"**
2. Clique em **"Vamos começar"**
3. Na aba **"Sign-in method"**, habilite:
   - **Email/senha**: Clique, ative e salve

## Passo 7: Criar Usuário Admin

1. Ainda em **Authentication**, clique na aba **"Users"**
2. Clique em **"Adicionar usuário"**
3. **Email**: seu-email@exemplo.com (use seu email real)
4. **Senha**: Crie uma senha forte (mínimo 6 caracteres)
5. **Clique em**: "Adicionar usuário"

**IMPORTANTE**: Guarde esse email e senha! Você vai usar para fazer login no painel admin.

## Passo 8: Colar as Credenciais no Arquivo de Config

1. Abra o arquivo `firebase-config.js` que foi criado no projeto
2. Cole suas credenciais do Firebase no lugar indicado:

```javascript
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

3. **Salve o arquivo**

## Passo 9: Testar o Sistema

1. Abra `login.html` no navegador
2. Use o **email e senha** que você criou no Firebase
3. Faça login
4. Você deve ser redirecionado para `admin.html`
5. Adicione uma vaga de teste
6. Abra `vagas.html` em outra aba
7. A vaga deve aparecer! 🎉

## ✅ Checklist Final

- [ ] Projeto Firebase criado
- [ ] App Web registrado
- [ ] Firestore Database ativado
- [ ] Regras de segurança configuradas
- [ ] Authentication habilitado (Email/senha)
- [ ] Usuário admin criado
- [ ] Credenciais coladas no `firebase-config.js`
- [ ] Sistema testado e funcionando

## 🆘 Problemas Comuns

### Erro: "Firebase not defined"
- Verifique se adicionou os scripts do Firebase no HTML
- Ordem correta: SDK do Firebase → firebase-config.js → outros scripts

### Erro: "Permission denied"
- Verifique as regras do Firestore
- Confirme que está logado ao tentar adicionar vagas

### Login não funciona
- Verifique se habilitou "Email/senha" no Authentication
- Confirme que criou o usuário admin
- Verifique se o email/senha estão corretos

## 📞 Precisa de Ajuda?

Se tiver dúvidas em qualquer passo, me avise que eu te ajudo! 🚀

---

**Próximo passo**: Depois que configurar tudo, vamos adicionar mais funcionalidades como:
- Upload de descrições completas das vagas
- Histórico de alterações
- Analytics de visualizações
- Notificações por email
