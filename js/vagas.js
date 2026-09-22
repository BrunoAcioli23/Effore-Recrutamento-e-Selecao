// Sistema de exibição e filtro de vagas com Firebase

class VagasDisplay {
    constructor() {
        this.vagas = [];
        this.vagasFiltradas = [];
        this.inicializar();
    }

    async inicializar() {
        await this.carregarVagas();
        this.configurarFiltros();
        // Tambem apos a carga inicial: se o snapshot demorar (ou falhar),
        // quem veio pelo link da home ja ve o modal.
        this.abrirVagaDaURL();
        
        // Listener em tempo real para mudanças (sem orderBy para evitar erro de índice)
        db.collection('vagas').where('ativa', '==', true).onSnapshot((snapshot) => {
            this.vagas = [];
            snapshot.forEach((doc) => {
                this.vagas.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            // Ordenar no client-side
            this.vagas.sort((a, b) => {
                if (a.criadoEm && b.criadoEm) {
                    return b.criadoEm.toDate() - a.criadoEm.toDate();
                }
                return 0;
            });
            this.vagasFiltradas = [...this.vagas];
            this.renderizarVagas();
            this.abrirVagaDaURL();
        });
    }

    // Quem chega de /pages/vagas?vaga=<id> (link da home) ja ve o modal aberto
    abrirVagaDaURL() {
        if (this.vagaDaURLAberta) return;

        const id = new URLSearchParams(window.location.search).get('vaga');
        if (!id) return;

        const vaga = this.vagas.find((v) => v.id === id);
        if (!vaga) return;

        this.vagaDaURLAberta = true;
        abrirModalDetalhes(id);
    }

    async carregarVagas() {
        try {
            // Buscar vagas sem orderBy (para não precisar de índice)
            const snapshot = await db.collection('vagas').where('ativa', '==', true).get();
            this.vagas = [];
            snapshot.forEach((doc) => {
                this.vagas.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            // Ordenar no client-side por data de criação
            this.vagas.sort((a, b) => {
                if (a.criadoEm && b.criadoEm) {
                    return b.criadoEm.toDate() - a.criadoEm.toDate();
                }
                return 0;
            });
            this.vagasFiltradas = [...this.vagas];
            this.renderizarVagas();
        } catch (error) {
            console.error('Erro ao carregar vagas do Firebase:', error);
            // Mostra mensagem de erro em vez de vagas padrão
            this.vagas = [];
            this.vagasFiltradas = [];
            this.renderizarVagas();
        }
    }

    getVagasPadrao() {
        // Removido - apenas vagas do Firebase são exibidas
        return [];
    }

    renderizarVagas() {
        const jobList = document.getElementById('job-list');
        
        if (!jobList) return;

        if (this.vagasFiltradas.length === 0) {
            jobList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #5C6673;">
                    <p><strong>Nenhuma vaga disponível no momento.</strong></p>
                    <p style="margin-top: 15px;">Mas não se preocupe! Novas oportunidades surgem frequentemente.</p>
                    <p style="margin-top: 10px;">📋 Cadastre-se em nosso <strong>Banco de Talentos</strong> abaixo e seja o primeiro a saber quando uma vaga perfeita para você aparecer!</p>
                </div>
            `;
            return;
        }

        jobList.innerHTML = this.vagasFiltradas.map(vaga => {
            const cidade = vaga.cidade || vaga.localizacao || 'N/A';
            
            // Formatar salário com R$
            let salario = 'A combinar';
            if (vaga.salario && vaga.salario.trim()) {
                // Se já tem R$, usa direto, senão adiciona
                salario = vaga.salario.includes('R$') ? vaga.salario : `R$ ${vaga.salario}`;
            }
            
            const contrato = vaga.contrato ? vaga.contrato.toUpperCase() : 'N/A';
            
            // Título com empresa (se houver)
            let tituloCompleto = vaga.titulo;
            if (vaga.empresa && vaga.empresa.trim()) {
                tituloCompleto = `${vaga.titulo} - ${vaga.empresa}`;
            }
            
            // Formatar benefícios
            let beneficiosHTML = '';
            if (vaga.beneficios && vaga.beneficios.length > 0) {
                const beneficiosLista = vaga.beneficios.map(b => 
                    `<span style="display: inline-block; background: #F5EFE3; color: #7A5F37; padding: 5px 12px; border-radius: 15px; font-size: 11px; margin-right: 6px; margin-bottom: 6px; font-weight: 500;">${b}</span>`
                ).join('');
                beneficiosHTML = `<div style="margin-top: 12px;">
                    <div style="font-size: 12px; color: #5C6673; margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Benefícios</div>
                    <div style="display: flex; flex-wrap: wrap;">${beneficiosLista}</div>
                </div>`;
            }
            
            return `
                <div class="job-card" data-contrato="${vaga.contrato.toLowerCase()}" style="display: flex; align-items: stretch; gap: 20px; padding: 24px; border: 1px solid #E4E0D8; border-radius: 12px; background: white; transition: all 0.3s ease;">
                    <div class="job-info" style="flex: 1;">
                        <h3 class="job-title" style="margin: 0 0 16px 0; font-size: 22px; color: #2A323E; font-weight: 700; line-height: 1.3;">${tituloCompleto}</h3>
                        
                        <div style="display: flex; gap: 24px; align-items: center; flex-wrap: wrap; margin-bottom: 4px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-money-bill-wave" style="color: #A78652; font-size: 14px; width: 20px;"></i>
                                <div>
                                    <div style="font-size: 11px; color: #5C6673; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Salário</div>
                                    <div style="font-size: 15px; color: #7A5F37; font-weight: 700;">${salario}</div>
                                </div>
                            </div>
                            
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-briefcase" style="color: #A78652; font-size: 14px; width: 20px;"></i>
                                <div>
                                    <div style="font-size: 11px; color: #5C6673; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Contrato</div>
                                    <div style="font-size: 15px; color: #2A323E; font-weight: 600;">${contrato}</div>
                                </div>
                            </div>
                            
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-map-marker-alt" style="color: #A78652; font-size: 14px; width: 20px;"></i>
                                <div>
                                    <div style="font-size: 11px; color: #5C6673; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Localização</div>
                                    <div style="font-size: 15px; color: #2A323E; font-weight: 600;">${cidade}</div>
                                </div>
                            </div>
                        </div>
                        
                        ${beneficiosHTML}
                    </div>
                    <div style="display: flex; align-items: center;">
                        <a href="#" class="btn btn-outline" style="white-space: nowrap; padding: 12px 24px;" onclick="event.preventDefault(); abrirModalDetalhes('${vaga.id}');">Ver Detalhes</a>
                    </div>
                </div>
            `;
        }).join('');
    }

    configurarFiltros() {
        const inputBusca = document.querySelector('.filter-input');
        const selectLocalizacao = document.querySelectorAll('.filter-select')[0];
        const selectContrato = document.querySelectorAll('.filter-select')[1];
        const btnBuscar = document.querySelector('.job-filters .btn-primary');

        if (!btnBuscar) return;

        // Função para aplicar filtros
        const aplicarFiltros = () => {
            const textoBusca = inputBusca.value.toLowerCase().trim();
            const filtroLocalizacao = selectLocalizacao.value.toLowerCase();
            const filtroContrato = selectContrato.value.toLowerCase();

            this.vagasFiltradas = this.vagas.filter(vaga => {
                const localizacao = vaga.cidade || vaga.localizacao || '';
                
                // Filtro por texto
                const matchTexto = !textoBusca || 
                    vaga.titulo.toLowerCase().includes(textoBusca) ||
                    localizacao.toLowerCase().includes(textoBusca) ||
                    (vaga.salario && vaga.salario.toLowerCase().includes(textoBusca));

                // Filtro por localização (agora por cidade)
                const matchLocalizacao = !filtroLocalizacao || 
                    localizacao.toLowerCase().includes(filtroLocalizacao);

                // Filtro por contrato
                const matchContrato = !filtroContrato || 
                    vaga.contrato.toLowerCase() === filtroContrato;

                return matchTexto && matchLocalizacao && matchContrato;
            });

            this.renderizarVagas();
        };

        // Evento do botão buscar
        btnBuscar.addEventListener('click', (e) => {
            e.preventDefault();
            aplicarFiltros();
        });

        // Buscar ao pressionar Enter no campo de texto
        inputBusca.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                aplicarFiltros();
            }
        });

        // Aplicar filtros ao mudar os selects
        selectLocalizacao.addEventListener('change', aplicarFiltros);
        selectContrato.addEventListener('change', aplicarFiltros);
    }
}

// Inicializar quando o DOM estiver pronto
let vagasDisplayInstance;
document.addEventListener('DOMContentLoaded', () => {
    vagasDisplayInstance = new VagasDisplay();
});

// Função global para abrir o modal com detalhes da vaga
function abrirModalDetalhes(vagaId) {
    const vaga = vagasDisplayInstance.vagas.find(v => v.id === vagaId);
    if (!vaga) return;

    const modal = document.getElementById('modal-detalhes-vaga');
    
    // Formatar salário
    let salario = 'A combinar';
    if (vaga.salario && vaga.salario.trim()) {
        salario = vaga.salario.includes('R$') ? vaga.salario : `R$ ${vaga.salario}`;
    }

    // Preencher informações
    document.getElementById('modal-titulo-vaga').textContent = vaga.titulo;
    
    // Empresa
    const empresaNome = document.getElementById('modal-empresa-nome');
    if (vaga.empresa && vaga.empresa.trim()) {
        empresaNome.textContent = vaga.empresa;
    } else {
        empresaNome.textContent = 'Imperio Recursos Humanos';
    }
    
    document.getElementById('modal-salario').textContent = salario;
    document.getElementById('modal-contrato').textContent = vaga.contrato ? vaga.contrato.toUpperCase() : 'N/A';
    document.getElementById('modal-cidade').textContent = vaga.cidade || vaga.localizacao || 'N/A';

    // Horário
    const horarioContainer = document.getElementById('modal-horario-container');
    if (vaga.horario && vaga.horario.trim()) {
        horarioContainer.style.display = 'block';
        document.getElementById('modal-horario').textContent = vaga.horario;
    } else {
        horarioContainer.style.display = 'none';
    }

    // Descrição
    const descricaoContainer = document.getElementById('modal-descricao-container');
    if (vaga.descricao && vaga.descricao.trim()) {
        descricaoContainer.style.display = 'block';
        document.getElementById('modal-descricao').textContent = vaga.descricao;
    } else {
        descricaoContainer.style.display = 'none';
    }

    // Benefícios
    const beneficiosContainer = document.getElementById('modal-beneficios-container');
    const beneficiosDiv = document.getElementById('modal-beneficios');
    if (vaga.beneficios && vaga.beneficios.length > 0) {
        beneficiosContainer.style.display = 'block';
        beneficiosDiv.innerHTML = vaga.beneficios.map(b => 
            `<span style="display: inline-flex; align-items: center; background: linear-gradient(135deg, #F5EFE3 0%, #EDE2CC 100%); color: #7A5F37; padding: 10px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; border: 2px solid #A7865240;">
                <i class="fas fa-check-circle" style="margin-right: 8px;"></i> ${b}
            </span>`
        ).join('');
    } else {
        beneficiosContainer.style.display = 'none';
    }

    // Data de criação
    const dataCriacao = vaga.criadoEm ? vaga.criadoEm.toDate().toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
    }) : 'Data não disponível';
    document.getElementById('modal-data-criacao').textContent = dataCriacao;

    // Mostrar modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Função para fechar o modal
function fecharModalDetalhes() {
    const modal = document.getElementById('modal-detalhes-vaga');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// ===================================
// CANDIDATURA
// ===================================

const CANDIDATURA_URL = 'https://us-central1-effore-recursos-humanos.cloudfunctions.net/enviarEmail';
const TAMANHO_MAXIMO_CV = 5 * 1024 * 1024; // 5 MB

let vagaEmCandidatura = null;

// Vem do botao "Candidatar-se Agora" dentro do modal de detalhes
function abrirModalCandidatura() {
    const titulo = document.getElementById('modal-titulo-vaga').textContent;
    vagaEmCandidatura = {
        id: (vagasDisplayInstance.vagas.find((v) => v.titulo === titulo) || {}).id || '',
        titulo
    };

    document.getElementById('candidatura-vaga-titulo').textContent = titulo;
    document.getElementById('cand-vaga-id').value = vagaEmCandidatura.id;
    document.getElementById('cand-vaga-titulo').value = titulo;

    // O modal de detalhes fecha, mas sem liberar o scroll do body:
    // o de candidatura assume no lugar dele.
    document.getElementById('modal-detalhes-vaga').style.display = 'none';
    document.getElementById('modal-candidatura').style.display = 'block';
    document.body.style.overflow = 'hidden';
    document.getElementById('cand-nome').focus();
}

function fecharModalCandidatura() {
    document.getElementById('modal-candidatura').style.display = 'none';
    document.body.style.overflow = 'auto';
    mostrarErroCandidatura('');
}

function fecharModalCandidaturaOk() {
    document.getElementById('modal-candidatura-ok').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function mostrarErroCandidatura(mensagem) {
    const caixa = document.getElementById('cand-erro');
    caixa.textContent = mensagem;
    caixa.style.display = mensagem ? 'block' : 'none';
}

// O arquivo viaja em base64 dentro do JSON da Cloud Function, que o anexa
// ao e-mail. E o caminho possivel sem o Firebase Storage habilitado.
function lerArquivoBase64(arquivo) {
    return new Promise((resolve, reject) => {
        const leitor = new FileReader();
        leitor.onload = () => resolve(String(leitor.result).split(',')[1]);
        leitor.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
        leitor.readAsDataURL(arquivo);
    });
}

function formatarTamanho(bytes) {
    return bytes < 1024 * 1024
        ? `${Math.round(bytes / 1024)} KB`
        : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function enviarCandidatura(evento) {
    evento.preventDefault();
    mostrarErroCandidatura('');

    const arquivo = document.getElementById('cand-curriculo').files[0];

    if (!arquivo) {
        mostrarErroCandidatura('Anexe seu currículo para continuar.');
        return;
    }

    if (arquivo.size > TAMANHO_MAXIMO_CV) {
        mostrarErroCandidatura(
            `O currículo tem ${formatarTamanho(arquivo.size)}. O limite é 5 MB.`);
        return;
    }

    const extensoes = ['pdf', 'doc', 'docx'];
    const extensao = arquivo.name.split('.').pop().toLowerCase();
    if (!extensoes.includes(extensao)) {
        mostrarErroCandidatura('Envie o currículo em PDF, DOC ou DOCX.');
        return;
    }

    const botao = document.getElementById('btn-enviar-candidatura');
    const original = botao.innerHTML;
    botao.disabled = true;
    botao.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i> Enviando...';

    try {
        const base64 = await lerArquivoBase64(arquivo);

        const resposta = await fetch(CANDIDATURA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tipo: 'candidatura',
                nome: document.getElementById('cand-nome').value.trim(),
                email: document.getElementById('cand-email').value.trim(),
                telefone: document.getElementById('cand-telefone').value.trim(),
                linkedin: document.getElementById('cand-linkedin').value.trim(),
                vaga: document.getElementById('cand-vaga-titulo').value,
                vagaId: document.getElementById('cand-vaga-id').value,
                anexo: {
                    nome: arquivo.name,
                    tipo: arquivo.type || 'application/octet-stream',
                    conteudo: base64
                },
                origem: window.location.pathname
            })
        });

        if (!resposta.ok) {
            const erro = await resposta.json().catch(() => ({}));
            throw new Error(erro.message || 'O servidor recusou o envio.');
        }

        document.getElementById('ok-vaga-titulo').textContent =
            document.getElementById('cand-vaga-titulo').value;
        document.getElementById('form-candidatura').reset();
        document.getElementById('cand-arquivo-info').textContent = '';
        document.getElementById('modal-candidatura').style.display = 'none';
        document.getElementById('modal-candidatura-ok').style.display = 'block';

    } catch (erro) {
        console.error('Erro ao enviar candidatura:', erro);
        mostrarErroCandidatura(
            'Não conseguimos enviar sua candidatura. Tente novamente em instantes.');
    } finally {
        botao.disabled = false;
        botao.innerHTML = original;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-candidatura');
    if (form) form.addEventListener('submit', enviarCandidatura);

    const campoArquivo = document.getElementById('cand-curriculo');
    if (campoArquivo) {
        campoArquivo.addEventListener('change', () => {
            const arquivo = campoArquivo.files[0];
            document.getElementById('cand-arquivo-info').textContent =
                arquivo ? `${arquivo.name} — ${formatarTamanho(arquivo.size)}` : '';
        });
    }
});

// Fechar ao clicar no fundo escuro
document.addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-detalhes-vaga')) {
        fecharModalDetalhes();
    }
    // O de candidatura tem formulario preenchido: so fecha pelo X ou Cancelar,
    // para nao perder o que a pessoa digitou com um clique fora.
    if (e.target === document.getElementById('modal-candidatura-ok')) {
        fecharModalCandidaturaOk();
    }
});

// Fechar com ESC o modal que estiver por cima
document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;

    const visivel = (id) => document.getElementById(id).style.display === 'block';

    if (visivel('modal-candidatura-ok')) {
        fecharModalCandidaturaOk();
    } else if (visivel('modal-candidatura')) {
        fecharModalCandidatura();
    } else {
        fecharModalDetalhes();
    }
});
