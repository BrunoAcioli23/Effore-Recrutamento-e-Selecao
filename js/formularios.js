// ===================================
// CONFIGURAÇÃO DOS FORMULÁRIOS
// ===================================

// Configuração dos formulários e provedores de envio
const FORM_CONFIG = {
    // método de envio: 'formsubmit' (atual), 'emailjs' (client-side), 'webhook' (serverless)
    provider: 'formsubmit',

    // Configuração para FormSubmit (fallback / atual)
    formsubmit: {
        endpoint: 'https://formsubmit.co/efforerecrutamentoeselecao@gmail.com'
    },

    // Configuração para EmailJS (opcional — requer conta EmailJS)
    emailjs: {
        serviceId: '',      // Ex: 'service_xxx'
        templateId: '',     // Ex: 'template_xxx'
        publicKey: ''       // Ex: 'user_xxx' (chave pública EmailJS)
    },

    // Para webhook/serverless (SendGrid, Mailgun, Postmark) — forneça a URL do endpoint
    webhook: {
        endpoint: ''
    },

    // Personalização de emails (aplicável ao FormSubmit / webhook)
    emailSettings: {
        cc: '',
        bcc: '',
        nextPage: '',
        noCaptcha: true,
        template: 'table',
        autoResponse: {
            enabled: true,
            subject: 'Recebemos sua mensagem - Effore Recrutamento',
            message: `Olá! 👋\n\nRecebemos sua mensagem e agradecemos pelo contato!\n\nNossa equipe da Effore Recrutamento e Seleção irá analisar sua solicitação e retornar em breve.\n\nTempo médio de resposta: 24 horas úteis\n\nAtenciosamente,\nEquipe Effore\n\n📞 WhatsApp: +55 11 98372-0548\n📧 Email: efforerecrutamentoeselecao@gmail.com\n📍 Salto/SP`
        }
    },

    // Mensagens de feedback
    messages: {
        success: 'Mensagem enviada com sucesso! Entraremos em contato em breve.',
        error: 'Erro ao enviar mensagem. Por favor, tente novamente ou entre em contato por WhatsApp.',
        fileError: 'Erro ao processar arquivo. Tamanho máximo: 5MB.',
        validationError: 'Por favor, preencha todos os campos obrigatórios.'
    }
};

// ===================================
// FUNÇÕES AUXILIARES
// ===================================

// Adicionar campos de configuração ao FormData
function addEmailSettings(formData, customSubject = '') {
    // Mantém compatibilidade com FormSubmit
    const settings = FORM_CONFIG.emailSettings;

    if (customSubject) formData.append('_subject', customSubject);
    if (settings.cc) formData.append('_cc', settings.cc);
    if (settings.bcc) formData.append('_bcc', settings.bcc);
    if (settings.nextPage) formData.append('_next', settings.nextPage);
    if (settings.noCaptcha) formData.append('_captcha', 'false');
    if (settings.template) formData.append('_template', settings.template);
    if (settings.autoResponse && settings.autoResponse.enabled) formData.append('_autoresponse', settings.autoResponse.message);

    return formData;
}

// ===================================
// Email provider helpers
// ===================================

async function loadEmailJSSDK() {
    if (window.emailjs) return window.emailjs;
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.emailjs.com/sdk/3.2.0/email.min.js';
        s.onload = () => {
            if (window.emailjs) {
                try {
                    if (FORM_CONFIG.emailjs.publicKey) window.emailjs.init(FORM_CONFIG.emailjs.publicKey);
                } catch (err) {
                    // init may be unnecessary if using send with public key param
                }
                resolve(window.emailjs);
            } else {
                reject(new Error('EmailJS SDK não carregado'));
            }
        };
        s.onerror = () => reject(new Error('Falha ao carregar EmailJS SDK'));
        document.head.appendChild(s);
    });
}

async function sendViaEmailJS(form, templateSubject = '') {
    try {
        const emailjsLib = await loadEmailJSSDK();
        const serviceId = FORM_CONFIG.emailjs.serviceId;
        const templateId = FORM_CONFIG.emailjs.templateId;
        const publicKey = FORM_CONFIG.emailjs.publicKey;

        if (!serviceId || !templateId || !publicKey) {
            throw new Error('EmailJS não configurado (serviceId/templateId/publicKey faltando)');
        }

        // Constrói templateParams a partir dos campos do formulário
        const data = new FormData(form);
        const templateParams = {};
        for (const [key, value] of data.entries()) {
            templateParams[key] = value;
        }
        // Assunto customizável
        if (templateSubject) templateParams['subject'] = templateSubject;

        // Envia via emailjs
        await emailjsLib.send(serviceId, templateId, templateParams, publicKey);
        return { ok: true };
    } catch (err) {
        console.error('EmailJS error:', err);
        return { ok: false, error: err };
    }
}

async function sendViaFormSubmit(formData) {
    const endpoint = FORM_CONFIG.formsubmit.endpoint;
    const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
    });
    return response;
}

async function sendViaWebhook(formData) {
    const endpoint = FORM_CONFIG.webhook.endpoint;
    if (!endpoint) throw new Error('Webhook endpoint não configurado');
    const response = await fetch(endpoint, { method: 'POST', body: formData });
    return response;
}

async function sendForm(form, customSubject = '') {
    // Decide o provider
    if (FORM_CONFIG.provider === 'emailjs') {
        const res = await sendViaEmailJS(form, customSubject);
        return res;
    }

    // Para formsubmit/webhook precisamos de FormData
    let formData = new FormData(form);
    formData = addEmailSettings(formData, customSubject);

    if (FORM_CONFIG.provider === 'webhook') {
        return await sendViaWebhook(formData);
    }

    // Fallback = formsubmit
    return await sendViaFormSubmit(formData);
}

// Mostrar mensagem de feedback
function showMessage(formElement, message, type = 'success') {
    // Remove mensagens anteriores
    const existingMsg = formElement.querySelector('.form-message');
    if (existingMsg) existingMsg.remove();

    // Cria nova mensagem
    const messageDiv = document.createElement('div');
    messageDiv.className = `form-message ${type}`;
    messageDiv.textContent = message;
    
    formElement.appendChild(messageDiv);

    // Remove a mensagem após 5 segundos
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Validar email
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validar arquivo (tamanho máximo 5MB)
function isValidFile(file) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    return file && file.size <= maxSize;
}

// Limpar formulário
function resetForm(form) {
    form.reset();
}

// ===================================
// FORMULÁRIO DE CONTATO GERAL
// ===================================

function initContactForm() {
    const contactForms = document.querySelectorAll('.contact-form');
    
    contactForms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            try {
                // Desabilita botão durante envio
                submitBtn.disabled = true;
                submitBtn.textContent = 'Enviando...';
                
                let formData = new FormData(form);
                
                // Validações
                const email = formData.get('email');
                if (!isValidEmail(email)) {
                    showMessage(form, 'Por favor, insira um email válido.', 'error');
                    return;
                }
                
                // Envia o formulário usando o provider configurado
                const sendResult = await sendForm(form, '💬 Nova Mensagem de Contato - Effore');

                if (sendResult && sendResult.ok) {
                    showMessage(form, FORM_CONFIG.messages.success, 'success');
                    resetForm(form);
                } else {
                    throw new Error('Erro no envio');
                }
                
            } catch (error) {
                console.error('Erro:', error);
                showMessage(form, FORM_CONFIG.messages.error, 'error');
            } finally {
                // Reabilita botão
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    });
}

// ===================================
// FORMULÁRIO B2B (PARA EMPRESAS)
// ===================================

function initB2BForm() {
    const b2bForm = document.querySelector('.contact-form-b2b');
    
    if (!b2bForm) return;
    
    b2bForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = b2bForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';
            
            // Envia o formulário usando o provider configurado
            const sendResult = await sendForm(b2bForm, '🏢 Nova Solicitação B2B - Effore Recrutamento');

            if (sendResult && sendResult.ok) {
                showMessage(b2bForm, 'Solicitação enviada! Nossa equipe entrará em contato em breve.', 'success');
                resetForm(b2bForm);
            } else {
                throw new Error('Erro no envio');
            }
            
        } catch (error) {
            console.error('Erro:', error);
            showMessage(b2bForm, FORM_CONFIG.messages.error, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

// ===================================
// FORMULÁRIO DE BANCO DE TALENTOS
// ===================================

function initTalentForm() {
    const talentForm = document.querySelector('.talent-form');
    
    if (!talentForm) return;
    
    talentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = talentForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';
            
            let formData = new FormData(talentForm);
            const fileInput = talentForm.querySelector('#cv-upload');
            
            // Validar arquivo
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                if (!isValidFile(file)) {
                    showMessage(talentForm, FORM_CONFIG.messages.fileError, 'error');
                    return;
                }
            }
            
            // Envia usando provider configurado (EmailJS / FormSubmit / Webhook)
            const sendResult = await sendForm(talentForm, '📄 Novo Currículo - Banco de Talentos Effore');

            if (sendResult && sendResult.ok) {
                showMessage(talentForm, 'Currículo enviado com sucesso! Guardaremos seus dados para futuras oportunidades.', 'success');
                resetForm(talentForm);
            } else {
                throw new Error('Erro no envio');
            }
            
        } catch (error) {
            console.error('Erro:', error);
            showMessage(talentForm, FORM_CONFIG.messages.error, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

// ===================================
// VALIDAÇÃO EM TEMPO REAL
// ===================================

function initRealTimeValidation() {
    // Validação de email em tempo real
    const emailInputs = document.querySelectorAll('input[type="email"]');
    
    emailInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value && !isValidEmail(this.value)) {
                this.setCustomValidity('Por favor, insira um email válido');
                this.reportValidity();
            } else {
                this.setCustomValidity('');
            }
        });
        
        input.addEventListener('input', function() {
            this.setCustomValidity('');
        });
    });
    
    // Validação de arquivo
    const fileInput = document.querySelector('#cv-upload');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                const file = this.files[0];
                const fileInfo = document.createElement('small');
                fileInfo.className = 'file-info';
                fileInfo.textContent = `Arquivo selecionado: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
                
                // Remove info anterior
                const existingInfo = this.parentElement.querySelector('.file-info');
                if (existingInfo) existingInfo.remove();
                
                this.parentElement.appendChild(fileInfo);
                
                // Valida tamanho
                if (!isValidFile(file)) {
                    fileInfo.style.color = '#e74c3c';
                    fileInfo.textContent = 'Arquivo muito grande! Máximo: 5MB';
                    this.value = '';
                }
            }
        });
    }
}

// ===================================
// INICIALIZAÇÃO
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando formulários...');
    
    initContactForm();
    initB2BForm();
    initTalentForm();
    initRealTimeValidation();
    
    console.log('Formulários inicializados com sucesso!');
});

// ===================================
// ESTILOS PARA MENSAGENS (CSS-in-JS)
// ===================================

// Adiciona estilos dinamicamente
const style = document.createElement('style');
style.textContent = `
    .form-message {
        margin-top: 15px;
        padding: 15px;
        border-radius: 8px;
        font-weight: 500;
        animation: slideIn 0.3s ease-out;
    }
    
    .form-message.success {
        background-color: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }
    
    .form-message.error {
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }
    
    .file-info {
        display: block;
        margin-top: 8px;
        color: #2c3e50;
        font-size: 0.9em;
    }
    
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    button[type="submit"]:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;
document.head.appendChild(style);
