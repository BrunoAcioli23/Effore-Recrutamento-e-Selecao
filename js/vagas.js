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

        jobList.innerHTML = this.vagasFiltradas.map(vaga => `
            <div class="job-card" data-tipo-local="${vaga.tipoLocal}" data-contrato="${vaga.contrato.toLowerCase()}">
                <div class="job-info">
                    <h3 class="job-title">${vaga.titulo}</h3>
                    <span class="job-location">${vaga.localizacao} • ${vaga.contrato}</span>
                </div>
                <a href="#" class="btn btn-outline" onclick="event.preventDefault(); alert('Para se candidatar, envie seu currículo através do formulário de Banco de Talentos abaixo ou entre em contato conosco.');">Ver Detalhes</a>
            </div>
        `).join('');
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
                // Filtro por texto
                const matchTexto = !textoBusca || 
                    vaga.titulo.toLowerCase().includes(textoBusca) ||
                    vaga.localizacao.toLowerCase().includes(textoBusca);

                // Filtro por localização
                const matchLocalizacao = !filtroLocalizacao || 
                    vaga.tipoLocal.toLowerCase() === filtroLocalizacao;

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
document.addEventListener('DOMContentLoaded', () => {
    new VagasDisplay();
});
