// ===================================
// CONFIGURAÇÃO DE FORMULÁRIOS - EFFORE
// ===================================

// CONFIGURAÇÃO DO BACKEND (Firebase Functions)
const BACKEND_CONFIG = {
    // URL da Cloud Function para produção
    functionURL: 'https://us-central1-effore-recursos-humanos.cloudfunctions.net/enviarEmail',
    // Para desenvolvimento local descomente a linha abaixo:
    // functionURL: 'http://localhost:5001/effore-recursos-humanos/us-central1/enviarEmail',
    enabled: true
};

// ===================================
// FUNÇÃO PARA ENVIAR VIA FIREBASE FUNCTION
// ===================================
async function enviarViaBackend(formData, tipo) {
    if (!BACKEND_CONFIG.enabled) {
        console.error('❌ Backend não está configurado');
        return false;
    }

    try {
        // Preparar dados para envio
        const data = {
            tipo: tipo,
            nome: formData.get('name') || '',
            email: formData.get('email') || '',
            mensagem: formData.get('message') || '',
            empresa: formData.get('company') || '',
            telefone: formData.get('phone') || '',
            vaga: formData.get('vaga') || '',
            linkedin: formData.get('linkedin') || '',
            curriculo: formData.get('curriculo') || '',
            origem: window.location.pathname
        };

        console.log('📤 Enviando para backend:', data);

        // Fazer requisição para a Cloud Function
        const response = await fetch(BACKEND_CONFIG.functionURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao enviar email');
        }

        const result = await response.json();
        console.log('✅ Resposta do backend:', result);
        
        return true;

    } catch (error) {
        console.error('❌ Erro ao enviar via backend:', error);
        return false;
    }
}

// ===================================
// HANDLER PRINCIPAL - ENVIO VIA BACKEND
// ===================================
async function enviarFormulario(form, tipo) {
    const btn = form.querySelector('button[type=submit]');
    const textoOriginal = btn.textContent;
    
    // Validar campos obrigatórios
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Desabilitar botão durante envio
    btn.disabled = true;
    btn.innerHTML = '⏳ Enviando...';
    
    try {
        // Coletar dados do formulário
        const formData = new FormData(form);
        
        console.log(`📤 Enviando formulário: ${tipo}`);
        
        // Enviar via Firebase Function
        const sucesso = await enviarViaBackend(formData, tipo);
        
        if (sucesso) {
            // Sucesso!
            btn.innerHTML = '✅ Enviado!';
            btn.style.backgroundColor = '#10b981';
            
            // Mostrar mensagem de sucesso
            alert('✅ Mensagem enviada com sucesso!\n\nNossa equipe entrará em contato em breve.');
            
            // Resetar formulário após 2 segundos
            setTimeout(() => {
                form.reset();
                btn.innerHTML = textoOriginal;
                btn.disabled = false;
                btn.style.backgroundColor = '';
            }, 2000);
        } else {
            throw new Error('Falha no envio');
        }
        
    } catch (error) {
        console.error('❌ Erro ao enviar:', error);
        
        // Mostrar erro
        btn.innerHTML = '❌ Erro ao enviar';
        btn.style.backgroundColor = '#ef4444';
        
        alert('❌ Erro ao enviar mensagem.\n\nPor favor, tente novamente ou entre em contato via WhatsApp:\n(11) 98372-0548');
        
        // Resetar botão após 3 segundos
        setTimeout(() => {
            btn.innerHTML = textoOriginal;
            btn.disabled = false;
            btn.style.backgroundColor = '';
        }, 3000);
    }
}

// ===================================
// INICIALIZAÇÃO AUTOMÁTICA
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando formulários Império com Firebase Functions...');
    console.log('📧 Backend Status:', BACKEND_CONFIG.enabled ? '✅ Ativado' : '❌ Desativado');
    console.log('🌐 Function URL:', BACKEND_CONFIG.functionURL);
    
    // FORMULÁRIO DE CONTATO GERAL
    const formsContato = document.querySelectorAll('.contact-form');
    console.log(`📝 Encontrados ${formsContato.length} formulário(s) de contato`);
    formsContato.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            enviarFormulario(form, 'contato');
        });
    });

    // FORMULÁRIO DE CANDIDATURA
    const formsCandidatura = document.querySelectorAll('.candidatura-form');
    console.log(`📝 Encontrados ${formsCandidatura.length} formulário(s) de candidatura`);
    formsCandidatura.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            enviarFormulario(form, 'candidatura');
        });
    });

    // FORMULÁRIO PARA EMPRESAS
    const formsEmpresa = document.querySelectorAll('.lead-form, .empresa-form');
    console.log(`📝 Encontrados ${formsEmpresa.length} formulário(s) para empresas`);
    formsEmpresa.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            enviarFormulario(form, 'empresa');
        });
    });
    
    console.log('✅ Formulários inicializados!');
});

// ===================================
// BACKEND NODE.JS COM FIREBASE FUNCTIONS
// ===================================
/*
O sistema usa Firebase Functions com Node.js + Nodemailer

Vantagens:
- ✅ Sem limites do plano gratuito
- ✅ Total controle sobre o backend
- ✅ Backup automático no Firestore
- ✅ Escalável e confiável

HTML será gerado automaticamente pelo backend com design profissional.
*/
