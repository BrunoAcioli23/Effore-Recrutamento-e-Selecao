const {onRequest} = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const cors = require('cors')({origin: true});

admin.initializeApp();

// ===================================
// CONFIGURAÇÃO DO NODEMAILER (MailRelay)
// ===================================
// IMPORTANTE: Configure essas variáveis no Firebase com:
// firebase functions:config:set mailrelay.user="seu-usuario@mailrelay.com" mailrelay.password="sua-senha"
// Ou defina as variáveis de ambiente MAILRELAY_USER e MAILRELAY_PASSWORD

const mailrelayConfig = {
    host: process.env.MAILRELAY_HOST || 'smtp1.s.ipzmarketing.com',
    user: process.env.MAILRELAY_USER || '',
    pass: process.env.MAILRELAY_PASSWORD || ''
};

const transporter = nodemailer.createTransport({
    host: mailrelayConfig.host,
    port: 587,
    secure: false,
    auth: {
        user: mailrelayConfig.user,
        pass: mailrelayConfig.pass
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Email de destino
const EMAIL_DESTINO = 'contato@efforerecursoshumanos.com.br';

// ===================================
// FUNÇÃO PARA GERAR HTML DO EMAIL
// ===================================
function gerarEmailHTML(data, tipo) {
    const { nome, email, empresa, mensagem, vaga, telefone, linkedin, curriculo } = data;
    const dataHora = new Date().toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    let conteudoEspecifico = '';
    let assunto = '';

    if (tipo === 'contato') {
        assunto = '💬 Nova Mensagem de Contato - Effore';
        conteudoEspecifico = `
            <tr>
                <td style="padding: 20px 30px; background-color: #ffffff;">
                    <h2 style="color: #fd8625; margin-bottom: 20px; font-size: 24px;">💬 Nova Mensagem de Contato</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong style="color: #1a1a1a;">Nome:</strong></td>
                            <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">${nome || 'Não informado'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong style="color: #1a1a1a;">Email:</strong></td>
                            <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">${email || 'não informado'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong style="color: #1a1a1a;">Mensagem:</strong></td>
                            <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">${(mensagem || 'Sem mensagem').replace(/\n/g, '<br>')}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        `;
    } else if (tipo === 'empresa') {
        assunto = '🏢 Nova Empresa Interessada - Effore';
        conteudoEspecifico = `
            <tr>
                <td style="padding: 20px 30px; background-color: #ffffff;">
                    <h2 style="color: #fd8625; margin-bottom: 20px; font-size: 24px;">🏢 Nova Empresa Interessada</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong style="color: #1a1a1a;">Nome do Contato:</strong></td>
                            <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">${nome || 'Não informado'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong style="color: #1a1a1a;">Empresa:</strong></td>
                            <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">${empresa || 'Não informado'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong style="color: #1a1a1a;">Email Corporativo:</strong></td>
                            <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">${email || 'não informado'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong style="color: #1a1a1a;">Desafio/Necessidade:</strong></td>
                            <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">${(mensagem || 'Não especificado').replace(/\n/g, '<br>')}</td>
                        </tr>
                    </table>
                    <div style="margin-top: 20px; padding: 15px; background-color: #fff3e6; border-left: 4px solid #fd8625; border-radius: 4px;">
                        <p style="margin: 0; color: #1a1a1a; font-weight: 500;">⚡ Ação Recomendada: Entrar em contato em até 2 horas úteis</p>
                    </div>
                </td>
            </tr>
        `;
    } else if (tipo === 'candidatura') {
        assunto = `🎯 Nova Candidatura: ${vaga || 'Candidatura Espontânea'} - Effore`;
        conteudoEspecifico = `
            <tr>
                <td style="padding: 20px 30px; background-color: #ffffff;">
                    <h2 style="color: #fd8625; margin-bottom: 20px; font-size: 24px;">🎯 Nova Candidatura</h2>
                    <div style="margin-bottom: 20px; padding: 15px; background-color: #f0f9ff; border-left: 4px solid #0ea5e9; border-radius: 4px;">
                        <p style="margin: 0; color: #1a1a1a; font-weight: 600; font-size: 16px;">Vaga: ${vaga || 'Candidatura Espontânea'}</p>
                    </div>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong style="color: #1a1a1a;">Nome:</strong></td>
                            <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">${nome || 'Não informado'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong style="color: #1a1a1a;">Email:</strong></td>
                            <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">${email || 'não informado'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong style="color: #1a1a1a;">Telefone:</strong></td>
                            <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">${telefone || 'Não informado'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong style="color: #1a1a1a;">LinkedIn:</strong></td>
                            <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">${linkedin && linkedin !== 'Não informado' ? `<a href="${linkedin}" style="color: #fd8625;">${linkedin}</a>` : 'Não informado'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong style="color: #1a1a1a;">Currículo:</strong></td>
                            <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">${curriculo || 'Não enviado'}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        `;
    }

    // Template HTML completo
    const html = `
        <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9;">
            <table style="width: 100%; border-collapse: collapse; background-color: #f9f9f9;">
                <!-- Header -->
                <tr>
                    <td style="padding: 30px; background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Effore Recrutamento</h1>
                        <p style="color: #fd8625; margin: 10px 0 0 0; font-size: 14px; font-weight: 500;">Conectando Talentos às Oportunidades</p>
                    </td>
                </tr>

                <!-- Conteúdo Específico -->
                ${conteudoEspecifico}

                <!-- Informações Adicionais -->
                <tr>
                    <td style="padding: 20px 30px; background-color: #ffffff; border-top: 1px solid #eee;">
                        <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                            <strong style="color: #1a1a1a;">📅 Data/Hora:</strong> ${dataHora}
                        </p>
                        <p style="margin: 0; color: #666; font-size: 14px;">
                            <strong style="color: #1a1a1a;">🌐 Origem:</strong> ${data.origem || 'Website'}
                        </p>
                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td style="padding: 20px 30px; background-color: #1a1a1a; text-align: center;">
                        <p style="color: #ffffff; margin: 0 0 10px 0; font-size: 14px; font-weight: 500;">Entre em contato:</p>
                        <p style="color: #fd8625; margin: 0; font-size: 13px;">
                            📞 (11) 4029-0828 | 📱 (11) 98372-0548<br>
                            📧 efforerecrutamentoeselecao@gmail.com
                        </p>
                        <p style="color: #888; margin: 15px 0 0 0; font-size: 12px;">
                            © 2025 Effore Recrutamento e Seleção
                        </p>
                    </td>
                </tr>
            </table>
        </div>
    `;

    return { html, assunto };
}

// ===================================
// CLOUD FUNCTION - ENVIAR EMAIL
// ===================================
exports.enviarEmail = onRequest({cors: true}, async (req, res) => {
        // Aceitar apenas POST
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Método não permitido' });
        }

        try {
            const { tipo, ...data } = req.body;

            // Validação básica
            if (!tipo || !data.nome || !data.email) {
                return res.status(400).json({ 
                    error: 'Dados incompletos',
                    required: ['tipo', 'nome', 'email']
                });
            }

            // Gerar HTML do email
            const { html, assunto } = gerarEmailHTML(data, tipo);

            // Configurar email
            const mailOptions = {
                from: 'Effore Website <contato@efforerecursoshumanos.com.br>',
                to: EMAIL_DESTINO,
                replyTo: data.email,
                subject: assunto,
                html: html,
                text: `Nova mensagem de ${data.nome} (${data.email})`
            };

            // Enviar email
            await transporter.sendMail(mailOptions);

            // Salvar no Firestore para backup
            await admin.firestore().collection('emails').add({
                tipo,
                data,
                assunto,
                status: 'enviado',
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log('✅ Email enviado com sucesso:', assunto);

            return res.status(200).json({ 
                success: true,
                message: 'Email enviado com sucesso!'
            });

        } catch (error) {
            console.error('❌ Erro ao enviar email:', error);
            
            // Salvar erro no Firestore
            await admin.firestore().collection('emails').add({
                tipo: req.body.tipo,
                data: req.body,
                status: 'erro',
                error: error.message,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

            return res.status(500).json({ 
                error: 'Erro ao enviar email',
                message: error.message 
            });
        }
});

// ===================================
// CLOUD FUNCTION - HEALTH CHECK
// ===================================
exports.healthCheck = onRequest({cors: true}, (req, res) => {
    res.status(200).json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'Effore Email Backend'
    });
});
