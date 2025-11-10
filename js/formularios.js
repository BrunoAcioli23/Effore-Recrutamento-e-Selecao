// ===================================
// CONFIGURAÇÃO DE FORMULÁRIOS - EFFORE
// ===================================

// CONFIGURAÇÃO EMAILJS (Recomendado - Mais profissional)
const EMAILJS_CONFIG = {
    serviceID: 'service_5moijx3',
    templateID: 'template_zdbwix4',
    publicKey: '9xpGaGxu_I-hoVZn0',
    enabled: false // DESABILITADO - Usando FormSubmit
};

// CONFIGURAÇÃO FORMSUBMIT (Backup - Já funciona)
const FORMSUBMIT_ENDPOINT = 'https://formsubmit.co/efforerecrutamentoeselecao@gmail.com';

// ===================================
// FUNÇÃO PARA ENVIAR VIA EMAILJS
// ===================================
async function enviarViaEmailJS(formData, tipoFormulario) {
    if (!EMAILJS_CONFIG.enabled || typeof emailjs === 'undefined') {
        return false; // Retorna false se não estiver configurado
    }

    try {
        // Montar mensagem completa com todos os campos
        let mensagemCompleta = `${tipoFormulario}\n\n`;
        mensagemCompleta += `═══════════════════════════════\n`;
        mensagemCompleta += `Nome: ${formData.get('name') || 'Não informado'}\n`;
        mensagemCompleta += `Email: ${formData.get('email') || 'Não informado'}\n`;
        
        if (formData.get('phone')) {
            mensagemCompleta += `Telefone: ${formData.get('phone')}\n`;
        }
        if (formData.get('company')) {
            mensagemCompleta += `Empresa: ${formData.get('company')}\n`;
        }
        if (formData.get('vaga')) {
            mensagemCompleta += `Vaga: ${formData.get('vaga')}\n`;
        }
        if (formData.get('cargo')) {
            mensagemCompleta += `Cargo: ${formData.get('cargo')}\n`;
        }
        if (formData.get('linkedin')) {
            mensagemCompleta += `LinkedIn: ${formData.get('linkedin')}\n`;
        }
        if (formData.get('curriculo')) {
            mensagemCompleta += `Currículo: ${formData.get('curriculo')}\n`;
        }
        
        mensagemCompleta += `Data/Hora: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}\n`;
        mensagemCompleta += `Origem: ${window.location.pathname}\n`;
        mensagemCompleta += `═══════════════════════════════\n\n`;
        
        if (formData.get('message')) {
            mensagemCompleta += `Mensagem:\n${formData.get('message')}`;
        }

        // Preparar parâmetros simplificados (compatível com template básico)
        const templateParams = {
            from_name: formData.get('name') || 'Não informado',
            from_email: formData.get('email') || 'nao-informado@email.com',
            message: mensagemCompleta,
            reply_to: formData.get('email') || 'nao-informado@email.com'
        };

        // Enviar email
        await emailjs.send(
            EMAILJS_CONFIG.serviceID,
            EMAILJS_CONFIG.templateID,
            templateParams,
            EMAILJS_CONFIG.publicKey
        );

        console.log('✅ Email enviado via EmailJS');
        return true;
    } catch (error) {
        console.error('❌ Erro EmailJS:', error);
        return false;
    }
}

// ===================================
// FUNÇÃO PARA ENVIAR VIA FORMSUBMIT (MÉTODO DIRETO)
// ===================================
function enviarViaFormSubmitDireto(form, assunto) {
    // Remover campos ocultos anteriores (se existirem)
    const existingHidden = form.querySelectorAll('input[type="hidden"][name^="_"]');
    existingHidden.forEach(input => input.remove());
    
    // Adicionar campos ocultos necessários
    const subjectInput = document.createElement('input');
    subjectInput.type = 'hidden';
    subjectInput.name = '_subject';
    subjectInput.value = assunto;
    form.appendChild(subjectInput);
    
    const templateInput = document.createElement('input');
    templateInput.type = 'hidden';
    templateInput.name = '_template';
    templateInput.value = 'table';
    form.appendChild(templateInput);
    
    const captchaInput = document.createElement('input');
    captchaInput.type = 'hidden';
    captchaInput.name = '_captcha';
    captchaInput.value = 'false';
    form.appendChild(captchaInput);
    
    // Redirecionar de volta para a página atual após envio
    const nextInput = document.createElement('input');
    nextInput.type = 'hidden';
    nextInput.name = '_next';
    nextInput.value = window.location.href + '?enviado=sucesso';
    form.appendChild(nextInput);
    
    const nome = form.querySelector('[name="name"]')?.value || 'Cliente';
    const autoResponseInput = document.createElement('input');
    autoResponseInput.type = 'hidden';
    autoResponseInput.name = '_autoresponse';
    autoResponseInput.value = `Olá ${nome}! 👋

✅ Recebemos sua mensagem!

Nossa equipe entrará em contato em até 24 horas úteis.

NOSSOS CANAIS:
📞 WhatsApp: (11) 98372-0548
☎️ Telefone: (11) 4029-0828
📧 Email: brunoeffore@outlook.com

Atenciosamente,
Equipe Effore Recrutamento e Seleção`;
    form.appendChild(autoResponseInput);
    
    // Configurar action e method
    form.action = FORMSUBMIT_ENDPOINT;
    form.method = 'POST';
    
    console.log('🚀 Enviando via FormSubmit (método direto)...');
    console.log('📧 Para:', FORMSUBMIT_ENDPOINT);
    console.log('📋 Assunto:', assunto);
    
    // Enviar o formulário
    form.submit();
    
    return true;
}

// ===================================
// HANDLER PRINCIPAL - ENVIO DIRETO VIA FORMSUBMIT
// ===================================
function enviarFormulario(form, assunto, tipoFormulario) {
    const btn = form.querySelector('button[type=submit]');
    const textoOriginal = btn.textContent;
    
    // Validar campos obrigatórios
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Mostrar feedback visual
    btn.disabled = true;
    btn.innerHTML = '⏳ Enviando...';
    
    console.log(`📤 Enviando formulário: ${tipoFormulario}`);
    console.log(`📧 Destino: ${FORMSUBMIT_ENDPOINT}`);
    console.log(`📋 Assunto: ${assunto}`);
    
    // Usar FormSubmit direto (método mais confiável)
    enviarViaFormSubmitDireto(form, assunto);
    
    // Nota: O formulário será redirecionado pelo FormSubmit
    // Não há need de resetar ou restaurar o botão aqui
}

// ===================================
// INICIALIZAÇÃO AUTOMÁTICA
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando formulários Effore...');
    
    // Verificar se voltou de um envio bem-sucedido
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('enviado') === 'sucesso') {
        alert('✅ Mensagem enviada com sucesso!\n\nNossa equipe entrará em contato em breve.');
        // Limpar a URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // FORMULÁRIO DE CONTATO GERAL
    const formsContato = document.querySelectorAll('.contact-form');
    console.log(`📝 Encontrados ${formsContato.length} formulário(s) de contato`);
    formsContato.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            enviarFormulario(
                form, 
                '💬 Nova Mensagem de Contato - Effore',
                '💬 Nova Mensagem de Contato'
            );
        });
    });

    // FORMULÁRIO DE CANDIDATURA
    const formsCandidatura = document.querySelectorAll('.candidatura-form');
    console.log(`📝 Encontrados ${formsCandidatura.length} formulário(s) de candidatura`);
    formsCandidatura.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const vaga = form.querySelector('[name="vaga"]')?.value || 'Candidatura Espontânea';
            enviarFormulario(
                form,
                `🎯 Nova Candidatura: ${vaga} - Effore`,
                '🎯 Nova Candidatura'
            );
        });
    });

    // FORMULÁRIO PARA EMPRESAS
    const formsEmpresa = document.querySelectorAll('.lead-form, .empresa-form');
    console.log(`📝 Encontrados ${formsEmpresa.length} formulário(s) para empresas`);
    formsEmpresa.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            enviarFormulario(
                form,
                '🏢 Nova Empresa Interessada - Effore',
                '🏢 Nova Empresa Interessada'
            );
        });
    });

    console.log('✅ Formulários inicializados!');
    console.log('📧 Email de destino:', FORMSUBMIT_ENDPOINT);
});

// ===================================
// INSTRUÇÕES DE USO
// ===================================
/*
PARA USAR EMAILJS (RECOMENDADO):

1. Crie conta em: https://www.emailjs.com/
2. Configure um serviço de email
3. Crie UM template universal (veja CONFIGURAR-EMAIL.md)
4. Copie suas credenciais
5. Atualize EMAILJS_CONFIG acima
6. Mude enabled para TRUE
7. Adicione no HTML: <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>

FORMSUBMIT já está funcionando como backup!
*/
