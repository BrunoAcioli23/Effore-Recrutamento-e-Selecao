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
// FUNÇÃO AUXILIAR (mantida para referência)
// ===================================
function gerarEmailHTML(formData, tipo) {
    const nome = formData.get('name') || 'Não informado';
    const email = formData.get('email') || 'não informado';
    const dataHora = new Date().toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    let conteudoEspecifico = '';

    if (tipo === 'contato') {
        const mensagem = formData.get('message') || 'Sem mensagem';
        conteudoEspecifico = `
            <tr>
                <td style="padding: 20px 30px; background-color: #ffffff;">
                    <h2 style="color: #A78652; margin-bottom: 20px; font-size: 24px;">💬 Nova Mensagem de Contato</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong style="color: #1a1a1a;">Nome:</strong></td>
                            <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">${nome}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong style="color: #1a1a1a;">Email:</strong></td>
                            <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">${email}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong style="color: #1a1a1a;">Mensagem:</strong></td>
                            <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">${mensagem.replace(/\n/g, '<br>')}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        `;
    } else if (tipo === 'empresa') {
        const empresa = formData.get('company') || 'Não informado';
        const desafio = formData.get('message') || 'Não especificado';
        conteudoEspecifico = `
            <tr>
                <td style="padding: 20px 30px; background-color: #ffffff;">
                    <h2 style="color: #A78652; margin-bottom: 20px; font-size: 24px;">🏢 Nova Empresa Interessada</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong style="color: #1a1a1a;">Nome do Contato:</strong></td>
                            <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">${nome}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong style="color: #1a1a1a;">Empresa:</strong></td>
                            <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">${empresa}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong style="color: #1a1a1a;">Email Corporativo:</strong></td>
                            <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">${email}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong style="color: #1a1a1a;">Desafio/Necessidade:</strong></td>
                            <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">${desafio.replace(/\n/g, '<br>')}</td>
                        </tr>
                    </table>
                    <div style="margin-top: 20px; padding: 15px; background-color: #fff3e6; border-left: 4px solid #fd8625; border-radius: 4px;">
                        <p style="margin: 0; color: #1a1a1a; font-weight: 500;">⚡ Ação Recomendada: Entrar em contato em até 2 horas úteis</p>
                    </div>
                </td>
            </tr>
        `;
    } else if (tipo === 'candidatura') {
        const vaga = formData.get('vaga') || 'Candidatura Espontânea';
        const telefone = formData.get('phone') || 'Não informado';
        const linkedin = formData.get('linkedin') || 'Não informado';
        const curriculo = formData.get('curriculo') || 'Não enviado';
        conteudoEspecifico = `
            <tr>
                <td style="padding: 20px 30px; background-color: #ffffff;">
                    <h2 style="color: #A78652; margin-bottom: 20px; font-size: 24px;">🎯 Nova Candidatura</h2>
                    <div style="margin-bottom: 20px; padding: 15px; background-color: #f0f9ff; border-left: 4px solid #0ea5e9; border-radius: 4px;">
                        <p style="margin: 0; color: #1a1a1a; font-weight: 600; font-size: 16px;">Vaga: ${vaga}</p>
                    </div>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong style="color: #1a1a1a;">Nome:</strong></td>
                            <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">${nome}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong style="color: #1a1a1a;">Email:</strong></td>
                            <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">${email}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong style="color: #1a1a1a;">Telefone:</strong></td>
                            <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">${telefone}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong style="color: #1a1a1a;">LinkedIn:</strong></td>
                            <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">${linkedin !== 'Não informado' ? `<a href="${linkedin}" style="color: #A78652;">${linkedin}</a>` : linkedin}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong style="color: #1a1a1a;">Currículo:</strong></td>
                            <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">${curriculo}</td>
                        </tr>
                           © 2025 Imperio Recursos Humanos
                        </p>
                    </td>
                </tr>
            </table>
        </div>
    `;
}

// ===================================
// FUNÇÃO PARA ENVIAR VIA EMAILJS COM HTML
// ===================================
async function enviarViaEmailJS(formData, tipo) {
    if (!EMAILJS_CONFIG.enabled || typeof emailjs === 'undefined') {
        console.error('❌ EmailJS não está configurado ou carregado');
        return false;
    }

    try {
        // Gerar HTML personalizado
        const htmlContent = gerarEmailHTML(formData, tipo);
        
        // Determinar qual template usar
        const templateID = EMAILJS_CONFIG.templates[tipo] || EMAILJS_CONFIG.templates.contato;
        
        // Preparar parâmetros para o EmailJS
        const templateParams = {
            from_name: formData.get('name') || 'Não informado',
            from_email: formData.get('email') || 'não informado',
            reply_to: formData.get('email') || 'não informado',
            to_email: EMAIL_DESTINO,
            html_content: htmlContent,
            subject: tipo === 'empresa' ? '🏢 Nova Empresa Interessada' : 
                     tipo === 'candidatura' ? '🎯 Nova Candidatura' : 
                     '💬 Nova Mensagem de Contato'
        };

        // Enviar email
        await emailjs.send(
            EMAILJS_CONFIG.serviceID,
            templateID,
            templateParams,
            EMAILJS_CONFIG.publicKey
        );

        console.log('✅ Email HTML enviado via EmailJS');
        return true;
    } catch (error) {
        console.error('❌ Erro ao enviar via EmailJS:', error);
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
// INSTRUÇÕES DE USO
// ===================================
/*
PARA USAR EMAILJS (RECOMENDADO):

1. Crie conta em: https://www.emailjs.com/
2. Configure um serviço de email
3. Crie UM template universal (veja CONFIGURAR-EMAIL.md)
4. Copie suas credenciais
5. Atualize EMAILJS_CONFIG acima
*/

// ===================================
// BACKEND NODE.JS COM FIREBASE FUNCTIONS
// ===================================
/*
O sistema agora usa Firebase Functions com Node.js + Nodemailer

Vantagens:
- ✅ Sem limites do plano gratuito do EmailJS
- ✅ Total controle sobre o backend
- ✅ Backup automático no Firestore
- ✅ Emails profissionais via Gmail
- ✅ Escalável e confiável

Veja o arquivo CONFIGURAR-BACKEND.md para instruções completas.
HTML será gerado automaticamente pelo JavaScript com design profissional.
*/