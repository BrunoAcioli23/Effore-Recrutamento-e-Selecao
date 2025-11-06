// ===================================
// CONFIGURAÇÃO DE FORMULÁRIOS - EFFORE
// ===================================

// CONFIGURAÇÃO EMAILJS (Recomendado - Mais profissional)
const EMAILJS_CONFIG = {
    serviceID: 'service_5moijx3',
    templateID: 'template_zdbwix4',
    publicKey: '9xpGaGxu_I-hoVZn0',
    enabled: true // IMPORTANTE: Mude para true!
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
        // Preparar parâmetros do template (campos dinâmicos)
        const templateParams = {
            tipo_formulario: tipoFormulario,
            from_name: formData.get('name') || '',
            from_email: formData.get('email') || '',
            
            // Campos opcionais (só envia se existir)
            phone: formData.get('phone') || '',
            company: formData.get('company') || '',
            vaga: formData.get('vaga') || '',
            cargo: formData.get('cargo') || '',
            linkedin: formData.get('linkedin') || '',
            curriculo_url: formData.get('curriculo') || '',
            message: formData.get('message') || '',
            
            // Informações extras
            date: new Date().toLocaleDateString('pt-BR'),
            time: new Date().toLocaleTimeString('pt-BR'),
            origem: formData.get('origem') || window.location.pathname
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
// FUNÇÃO PARA ENVIAR VIA FORMSUBMIT
// ===================================
async function enviarViaFormSubmit(form, assunto) {
    try {
        const formData = new FormData(form);
        formData.append('_subject', assunto);
        formData.append('_template', 'table');
        formData.append('_captcha', 'false');
        
        const nome = formData.get('name') || 'Cliente';
        const autoResponse = `Olá ${nome}! 👋

✅ Recebemos sua mensagem!

Nossa equipe entrará em contato em até 24 horas úteis.

NOSSOS CANAIS:
📞 WhatsApp: (11) 98372-0548
☎️ Telefone: (11) 4029-0828
📧 Email: brunoeffore@outlook.com

Atenciosamente,
Equipe Effore Recrutamento e Seleção`;
        
        formData.append('_autoresponse', autoResponse);
        
        const response = await fetch(FORMSUBMIT_ENDPOINT, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
        });
        
        console.log('✅ Email enviado via FormSubmit');
        return response.ok;
    } catch (error) {
        console.error('❌ Erro FormSubmit:', error);
        return false;
    }
}

// ===================================
// HANDLER PRINCIPAL - GERENCIA OS DOIS MÉTODOS
// ===================================
async function enviarFormulario(form, assunto, tipoFormulario) {
    const btn = form.querySelector('button[type=submit]');
    const textoOriginal = btn.textContent;
    
    try {
        btn.disabled = true;
        btn.innerHTML = '⏳ Enviando...';
        
        const formData = new FormData(form);
        let sucesso = false;

        // PRIORIDADE 1: Tentar EmailJS (se configurado)
        if (EMAILJS_CONFIG.enabled) {
            sucesso = await enviarViaEmailJS(formData, tipoFormulario);
        }

        // PRIORIDADE 2: Usar FormSubmit como backup
        if (!sucesso) {
            sucesso = await enviarViaFormSubmit(form, assunto);
        }

        if (sucesso) {
            alert('✅ Mensagem enviada com sucesso!');
            form.reset();
        } else {
            throw new Error('Falha no envio');
        }
        
    } catch (error) {
        console.error('Erro:', error);
        alert('❌ Erro ao enviar. Tente pelo WhatsApp: (11) 98372-0548');
    } finally {
        btn.disabled = false;
        btn.innerHTML = textoOriginal;
    }
}

// ===================================
// INICIALIZAÇÃO AUTOMÁTICA
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando formulários Effore...');
    
    // FORMULÁRIO DE CONTATO GERAL
    const formsContato = document.querySelectorAll('.contact-form');
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
