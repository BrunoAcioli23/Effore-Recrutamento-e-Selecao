// CONFIGURAÇÃO DE FORMULÁRIOS - EFFORE
const FORMSUBMIT_ENDPOINT = 'https://formsubmit.co/brunoeffore@outlook.com';

// Handler de envio
async function enviarFormulario(form, assunto) {
    const btn = form.querySelector('button[type=submit]');
    const textoOriginal = btn.textContent;
    
    try {
        btn.disabled = true;
        btn.textContent = ' Enviando...';
        
        const formData = new FormData(form);
        formData.append('_subject', assunto);
        formData.append('_template', 'table');
        formData.append('_captcha', 'false');
        
        const nome = formData.get('name') || 'Cliente';
        const autoResponse = `
Olá ! 

 Recebemos sua mensagem!

Nossa equipe entrará em contato em até 24 horas úteis.

NOSSOS CANAIS:
 WhatsApp: (11) 98372-0548
 Telefone: (11) 4029-0828
 Email: brunoeffore@outlook.com

Atenciosamente,
Equipe Effore Recrutamento e Seleção
`;
        
        formData.append('_autoresponse', autoResponse);
        
        const response = await fetch(FORMSUBMIT_ENDPOINT, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
        });
        
        if (response.ok) {
            alert(' Mensagem enviada com sucesso!');
            form.reset();
        } else {
            throw new Error('Erro no envio');
        }
    } catch (error) {
        alert(' Erro ao enviar. Tente pelo WhatsApp: (11) 98372-0548');
    } finally {
        btn.disabled = false;
        btn.textContent = textoOriginal;
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    const forms = document.querySelectorAll('.contact-form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            enviarFormulario(form, ' Nova Mensagem - Effore');
        });
    });
});
