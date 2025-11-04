// Carrega as vagas recentes na página inicial com Firebase

class HomeVagasDisplay {
    constructor() {
        this.vagas = [];
        this.inicializar();
    }

    async inicializar() {
        await this.carregarVagas();
        
        // Listener em tempo real para mudanças (sem orderBy)
        db.collection('vagas').where('ativa', '==', true).onSnapshot((snapshot) => {
            this.vagas = [];
            snapshot.forEach((doc) => {
                this.vagas.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            // Ordenar no client-side e pegar as 3 mais recentes
            this.vagas.sort((a, b) => {
                if (a.criadoEm && b.criadoEm) {
                    return b.criadoEm.toDate() - a.criadoEm.toDate();
                }
                return 0;
            });
            this.vagas = this.vagas.slice(0, 3); // Apenas as 3 primeiras
            this.renderizarVagasRecentes();
        });
    }

    async carregarVagas() {
        try {
            // Buscar todas as vagas ativas (sem orderBy)
            const snapshot = await db.collection('vagas').where('ativa', '==', true).get();
            this.vagas = [];
            snapshot.forEach((doc) => {
                this.vagas.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            // Ordenar no client-side e pegar as 3 mais recentes
            this.vagas.sort((a, b) => {
                if (a.criadoEm && b.criadoEm) {
                    return b.criadoEm.toDate() - a.criadoEm.toDate();
                }
                return 0;
            });
            this.vagas = this.vagas.slice(0, 3); // Apenas as 3 primeiras
            this.renderizarVagasRecentes();
        } catch (error) {
            console.error('Erro ao carregar vagas:', error);
            // Mostra mensagem de erro se não conseguir carregar
            this.vagas = [];
            this.renderizarVagasRecentes();
        }
    }

    renderizarVagasRecentes() {
        const homeVagasList = document.getElementById('home-vagas-list');
        
        if (!homeVagasList) return;

        if (this.vagas.length === 0) {
            homeVagasList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <p>Nenhuma vaga disponível no momento.</p>
                    <p style="margin-top: 10px;">Cadastre-se em nosso banco de talentos para ser avisado quando novas oportunidades surgirem!</p>
                </div>
            `;
            return;
        }

        homeVagasList.innerHTML = this.vagas.map(vaga => `
            <div class="job-card">
                <div class="job-info">
                    <h3 class="job-title">${vaga.titulo}</h3>
                    <span class="job-location">${vaga.localizacao} • ${vaga.contrato}</span>
                </div>
                <a href="vagas.html#vagas-abertas" class="btn btn-outline">Ver Detalhes</a>
            </div>
        `).join('');
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new HomeVagasDisplay();
});
