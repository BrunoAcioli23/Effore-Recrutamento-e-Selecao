// ===================================
// CONFIGURAÇÃO DOS FORMULÁRIOS
// ===================================

// Configuração do FormSubmit (serviço gratuito de envio de formulários)
const FORM_CONFIG = {
    // Substitua pelo seu email do FormSubmit ou use EmailJS
    endpoint: 'https://formsubmit.co/brunoeffore@outlook.com',
    // Se true, envia via fetch (AJAX). Se false, usa submissão nativa do formulário (recomendado para FormSubmit
    // quando quiser autoresponse/templates funcionando corretamente).
    useAjax: false,
    
    // Personalização de emails
    emailSettings: {
        // Email para receber cópias (opcional)
        cc: '', // Ex: 'copia@exemplo.com'
        
        // Email oculto para cópias (opcional)
        bcc: '', // Ex: 'gerente@exemplo.com'
        
        // URL de redirecionamento após envio (opcional)
        nextPage: '', // Ex: 'https://seusite.com/obrigado.html'
        
        // Desativar captcha (true = sem captcha)
        noCaptcha: true,
        
        // Template do email (box, table, ou deixe vazio para padrão)
        template: 'table',
        
        // Mensagem de auto-resposta para o usuário
        autoResponse: {
            enabled: true,
            subject: 'Recebemos sua mensagem - Effore Recrutamento',
            message: `
                Olá! 👋
                
                Recebemos sua mensagem e agradecemos pelo contato!
                
                Nossa equipe da Effore Recrutamento e Seleção irá analisar sua solicitação e retornar em breve.
                
                Tempo médio de resposta: 24 horas úteis
                
                Atenciosamente,
                Equipe Effore
                
                📞 WhatsApp: +55 11 98372-0548
                📧 Email: brunoeffore@outlook.com
                📍 Salto/SP
            `
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
    const settings = FORM_CONFIG.emailSettings;
    
    // Assunto do email
    if (customSubject) {
        formData.append('_subject', customSubject);
    }
    
    // CC (cópia)
    if (settings.cc) {
        formData.append('_cc', settings.cc);
    }
    
    // BCC (cópia oculta)
    if (settings.bcc) {
        formData.append('_bcc', settings.bcc);
    }
    
    // Redirecionamento
    if (settings.nextPage) {
        formData.append('_next', settings.nextPage);
    }
    
    // Captcha
    if (settings.noCaptcha) {
        formData.append('_captcha', 'false');
    }
    
    // Template
    if (settings.template) {
        formData.append('_template', settings.template);
    }
    
    // Auto-resposta
    if (settings.autoResponse && settings.autoResponse.enabled) {
        formData.append('_autoresponse', settings.autoResponse.message);
    }
    
    return formData;
}

// Quando não usamos AJAX, adiciona inputs hidden diretamente no formulário para que o envio nativo do
// navegador contenha os campos especiais do FormSubmit (_subject, _cc, _bcc, _next, _captcha, _template e _autoresponse).
function addHiddenSettingsToForm(form, customSubject = '') {
    const settings = FORM_CONFIG.emailSettings;

    function appendHidden(name, value) {
        if (!value) return;
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
    }

    // Assunto
    if (customSubject) appendHidden('_subject', customSubject);

    // CC / BCC
    if (settings.cc) appendHidden('_cc', settings.cc);
    if (settings.bcc) appendHidden('_bcc', settings.bcc);

    // Redirecionamento
    if (settings.nextPage) appendHidden('_next', settings.nextPage);

    // Captcha
    if (settings.noCaptcha) appendHidden('_captcha', 'false');

    // Template
    if (settings.template) appendHidden('_template', settings.template);

    // Auto-resposta
    if (settings.autoResponse && settings.autoResponse.enabled) appendHidden('_autoresponse', settings.autoResponse.message);

    return form;
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
                
                // Adiciona configurações de email personalizadas
                // Se configurado para submissão nativa (sem AJAX), adiciona hidden fields e submete o form
                if (!FORM_CONFIG.useAjax) {
                    // adiciona hidden inputs e configura action/method
                    addHiddenSettingsToForm(form, '💬 Nova Mensagem de Contato - Effore');
                    form.action = FORM_CONFIG.endpoint;
                    form.method = 'POST';
                    // garante enctype se houver arquivos
                    if (form.querySelector('input[type="file"]')) form.enctype = 'multipart/form-data';
                    // submete nativamente
                    form.submit();
                    return;
                }

                // Envio via AJAX (fetch)
                formData = addEmailSettings(formData, '💬 Nova Mensagem de Contato - Effore');
                const response = await fetch(FORM_CONFIG.endpoint, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    showMessage(form, FORM_CONFIG.messages.success, 'success');
                    resetForm(form);
                } else {
                    throw new Error('Erro no servidor');
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
            
            let formData = new FormData(b2bForm);
            
            // Se configurado para submissão nativa (sem AJAX), adiciona hidden fields e submete o form
            if (!FORM_CONFIG.useAjax) {
                addHiddenSettingsToForm(b2bForm, '🏢 Nova Solicitação B2B - Effore Recrutamento');
                b2bForm.action = FORM_CONFIG.endpoint;
                b2bForm.method = 'POST';
                if (b2bForm.querySelector('input[type="file"]')) b2bForm.enctype = 'multipart/form-data';
                b2bForm.submit();
                return;
            }

            // Envio via AJAX (fetch)
            formData = addEmailSettings(formData, '🏢 Nova Solicitação B2B - Effore Recrutamento');
            const response = await fetch(FORM_CONFIG.endpoint, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                showMessage(b2bForm, 'Solicitação enviada! Nossa equipe entrará em contato em breve.', 'success');
                resetForm(b2bForm);
            } else {
                throw new Error('Erro no servidor');
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
            
            // Se configurado para submissão nativa (sem AJAX), adiciona hidden fields e submete o form
            if (!FORM_CONFIG.useAjax) {
                addHiddenSettingsToForm(talentForm, '📄 Novo Currículo - Banco de Talentos Effore');
                talentForm.action = FORM_CONFIG.endpoint;
                talentForm.method = 'POST';
                if (fileInput && fileInput.files.length > 0) talentForm.enctype = 'multipart/form-data';
                talentForm.submit();
                return;
            }

            // Envio via AJAX (fetch)
            formData = addEmailSettings(formData, '📄 Novo Currículo - Banco de Talentos Effore');
            const response = await fetch(FORM_CONFIG.endpoint, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                showMessage(talentForm, 'Currículo enviado com sucesso! Guardaremos seus dados para futuras oportunidades.', 'success');
                resetForm(talentForm);
            } else {
                throw new Error('Erro no servidor');
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
