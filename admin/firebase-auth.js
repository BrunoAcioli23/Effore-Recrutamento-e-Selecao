// Sistema de Autenticação com Firebase

// O mesmo formato usado no painel ao criar o acesso ("Maria Silva" -> "maria.silva")
function gerarUsuario(nome) {
    return String(nome || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/^\.+|\.+$/g, '');
}

// O Firebase Auth so entende e-mail. Quem digita um nome de usuario tem o
// e-mail resolvido em /logins antes do login — por isso essa colecao permite
// 'get' sem autenticacao (mas nao 'list', para nao dar para varrer os e-mails).
async function resolverEmail(entrada) {
    if (entrada.includes('@')) return entrada;

    const usuario = gerarUsuario(entrada);
    if (!usuario) return null;

    const doc = await db.collection('logins').doc(usuario).get();
    return doc.exists ? doc.data().email : null;
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('admin-login-form');
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const errorMessage = document.getElementById('login-error-message');
    const btnLogin = document.getElementById('btn-login');

    if (loginForm) {
        // Verificar se já está autenticado
        auth.onAuthStateChanged((user) => {
            if (user) {
                // Usuário já está logado, redirecionar para admin
                window.location.href = 'painel.html';
            }
        });

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const identificador = emailInput.value.trim();
            const password = passwordInput.value;

            // Limpar mensagem de erro
            if (window.showLoginError) {
                errorMessage.classList.remove('show');
            } else {
                errorMessage.textContent = '';
                errorMessage.style.display = 'none';
            }

            // Desabilitar botão durante o login
            btnLogin.disabled = true;
            if (!btnLogin.classList.contains('loading')) {
                btnLogin.classList.add('loading');
            }

            try {
                const email = await resolverEmail(identificador);

                if (!email) {
                    throw { code: 'auth/user-not-found' };
                }

                // Fazer login com Firebase Authentication
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                
                console.log('Login realizado com sucesso!', userCredential.user);
                
                // Redirecionar para página admin
                window.location.href = 'painel.html';
                
            } catch (error) {
                console.error('Erro no login:', error);
                
                // Mostrar mensagem de erro específica
                let mensagemErro = 'Erro ao fazer login. Tente novamente.';
                
                switch (error.code) {
                    case 'auth/invalid-email':
                        mensagemErro = 'Usuário ou e-mail inválido.';
                        break;
                    case 'auth/user-disabled':
                        mensagemErro = 'Usuário desabilitado.';
                        break;
                    case 'auth/user-not-found':
                        mensagemErro = 'Usuário não encontrado.';
                        break;
                    case 'auth/wrong-password':
                        mensagemErro = 'Senha incorreta.';
                        break;
                    case 'auth/invalid-credential':
                        mensagemErro = 'Usuário ou senha incorretos.';
                        break;
                    case 'permission-denied':
                        mensagemErro = 'Não foi possível verificar o usuário. Tente entrar com o e-mail.';
                        break;
                    case 'auth/too-many-requests':
                        mensagemErro = 'Muitas tentativas. Tente novamente mais tarde.';
                        break;
                    case 'auth/network-request-failed':
                        mensagemErro = 'Erro de conexão. Verifique sua internet.';
                        break;
                }
                
                // Usar a nova função se disponível
                if (window.showLoginError) {
                    window.showLoginError(mensagemErro);
                } else {
                    errorMessage.textContent = mensagemErro;
                    errorMessage.style.display = 'block';
                }
                
                // Reabilitar botão
                btnLogin.disabled = false;
                btnLogin.classList.remove('loading');
            }
        });
    }
});
