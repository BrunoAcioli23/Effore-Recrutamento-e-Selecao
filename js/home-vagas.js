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

        homeVagasList.innerHTML = this.vagas.map(vaga => {
            const cidade = vaga.cidade || vaga.localizacao || 'N/A';
            
            // Formatar salário com R$
            let salario = 'A combinar';
            if (vaga.salario && vaga.salario.trim()) {
                salario = vaga.salario.includes('R$') ? vaga.salario : `R$ ${vaga.salario}`;
            }
            
            const contrato = vaga.contrato ? vaga.contrato.toUpperCase() : 'N/A';
            
            // Título com empresa (se houver)
            let tituloCompleto = vaga.titulo;
            if (vaga.empresa && vaga.empresa.trim()) {
                tituloCompleto = `${vaga.titulo} - ${vaga.empresa}`;
            }
            
            // Formatar benefícios para exibição (mostrar até 3)
            let beneficiosHTML = '';
            if (vaga.beneficios && vaga.beneficios.length > 0) {
                const beneficiosLista = vaga.beneficios.slice(0, 3).map(b => 
                    `<span style="display: inline-block; background: #fff4e6; color: #ff6b35; padding: 4px 10px; border-radius: 12px; font-size: 10px; margin-right: 5px; margin-bottom: 5px; font-weight: 500;">${b}</span>`
                ).join('');
                const maisInfo = vaga.beneficios.length > 3 ? `<span style="font-size: 10px; color: #999; font-weight: 600;">+${vaga.beneficios.length - 3} mais</span>` : '';
                beneficiosHTML = `<div style="margin-top: 10px;">
                    <div style="font-size: 10px; color: #999; margin-bottom: 5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Benefícios</div>
                    <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 3px;">${beneficiosLista}${maisInfo}</div>
                </div>`;
            }
            
            return `
                <div class="job-card">
                    <div class="job-info">
                        <h3 class="job-title" style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; line-height: 1.3;">${tituloCompleto}</h3>
                        
                        <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-money-bill-wave" style="color: #ff6b35; font-size: 12px; width: 16px;"></i>
                                <span style="font-size: 14px; color: #ff6b35; font-weight: 700;">${salario}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-briefcase" style="color: #ff6b35; font-size: 12px; width: 16px;"></i>
                                <span style="font-size: 14px; color: #333; font-weight: 600;">${contrato}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-map-marker-alt" style="color: #ff6b35; font-size: 12px; width: 16px;"></i>
                                <span style="font-size: 14px; color: #333; font-weight: 600;">${cidade}</span>
                            </div>
                        </div>
                        
                        ${beneficiosHTML}
                    </div>
                    <a href="vagas.html#vagas-abertas" class="btn btn-outline">Ver Detalhes</a>
                </div>
            `;
        }).join('');
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new HomeVagasDisplay();
});
