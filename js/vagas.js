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
        });
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
                <div style="text-align: center; padding: 40px; color: #666;">
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
                    `<span style="display: inline-block; background: #fff4e6; color: #ff6b35; padding: 5px 12px; border-radius: 15px; font-size: 11px; margin-right: 6px; margin-bottom: 6px; font-weight: 500;">${b}</span>`
                ).join('');
                beneficiosHTML = `<div style="margin-top: 12px;">
                    <div style="font-size: 12px; color: #999; margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Benefícios</div>
                    <div style="display: flex; flex-wrap: wrap;">${beneficiosLista}</div>
                </div>`;
            }
            
            return `
                <div class="job-card" data-contrato="${vaga.contrato.toLowerCase()}" style="display: flex; align-items: stretch; gap: 20px; padding: 24px; border: 1px solid #e5e5e5; border-radius: 12px; background: white; transition: all 0.3s ease;">
                    <div class="job-info" style="flex: 1;">
                        <h3 class="job-title" style="margin: 0 0 16px 0; font-size: 22px; color: #1a1a1a; font-weight: 700; line-height: 1.3;">${tituloCompleto}</h3>
                        
                        <div style="display: flex; gap: 24px; align-items: center; flex-wrap: wrap; margin-bottom: 4px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-money-bill-wave" style="color: #ff6b35; font-size: 14px; width: 20px;"></i>
                                <div>
                                    <div style="font-size: 11px; color: #999; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Salário</div>
                                    <div style="font-size: 15px; color: #ff6b35; font-weight: 700;">${salario}</div>
                                </div>
                            </div>
                            
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-briefcase" style="color: #ff6b35; font-size: 14px; width: 20px;"></i>
                                <div>
                                    <div style="font-size: 11px; color: #999; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Contrato</div>
                                    <div style="font-size: 15px; color: #333; font-weight: 600;">${contrato}</div>
                                </div>
                            </div>
                            
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-map-marker-alt" style="color: #ff6b35; font-size: 14px; width: 20px;"></i>
                                <div>
                                    <div style="font-size: 11px; color: #999; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Localização</div>
                                    <div style="font-size: 15px; color: #333; font-weight: 600;">${cidade}</div>
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
        empresaNome.textContent = 'Effore Recrutamento e Seleção';
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
            `<span style="display: inline-flex; align-items: center; background: linear-gradient(135deg, #fff4e6 0%, #ffe8d1 100%); color: #ff6b35; padding: 10px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; border: 2px solid #ffd9b8;">
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

// Função para rolar até o formulário
function scrollToFormulario() {
    fecharModalDetalhes();
    const formulario = document.getElementById('banco-talentos');
    if (formulario) {
        formulario.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Fechar modal ao clicar fora dele
document.addEventListener('click', (e) => {
    const modal = document.getElementById('modal-detalhes-vaga');
    if (e.target === modal) {
        fecharModalDetalhes();
    }
});

// Fechar modal com ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        fecharModalDetalhes();
    }
});
