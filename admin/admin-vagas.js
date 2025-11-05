// Sistema de gerenciamento de vagas - Novo Design

class VagasManager {
    constructor() {
        this.vagas = [];
        this.vagaEditandoId = null;
        this.vagasCollection = db.collection('vagas');
        this.inicializar();
    }

    async inicializar() {
        this.configurarEventos();
        await this.carregarVagas();
        
        // Listener em tempo real para mudanças no Firestore
        this.vagasCollection.onSnapshot((snapshot) => {
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
            this.renderizarTudo();
        });
    }

    configurarEventos() {
        const btnSalvar = document.getElementById('btn-salvar');
        const searchInput = document.getElementById('search-input');

        // Evento de salvar vaga
        btnSalvar.addEventListener('click', () => {
            this.salvarVaga();
        });

        // Prevenir submit do form
        document.getElementById('form-vaga').addEventListener('submit', (e) => {
            e.preventDefault();
            this.salvarVaga();
        });

        // Busca em tempo real
        searchInput.addEventListener('input', (e) => {
            this.filtrarVagas(e.target.value);
        });
    }

    async carregarVagas() {
        try {
            const snapshot = await this.vagasCollection.get();
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
            this.renderizarTudo();
        } catch (error) {
            console.error('Erro ao carregar vagas:', error);
        }
    }

    async salvarNoFirestore(vaga, isUpdate = false) {
        try {
            if (isUpdate) {
                await this.vagasCollection.doc(vaga.id).update({
                    titulo: vaga.titulo,
                    localizacao: vaga.localizacao,
                    tipoLocal: vaga.tipoLocal,
                    contrato: vaga.contrato,
                    descricao: vaga.descricao,
                    atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                await this.vagasCollection.add({
                    titulo: vaga.titulo,
                    localizacao: vaga.localizacao,
                    tipoLocal: vaga.tipoLocal,
                    contrato: vaga.contrato,
                    descricao: vaga.descricao,
                    ativa: true,
                    criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
                    atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } catch (error) {
            console.error('Erro ao salvar vaga:', error);
            throw error;
        }
    }

    renderizarTudo() {
        this.atualizarMetricas();
        this.renderizarGrafico();
        this.renderizarDistribuicao();
        this.renderizarTabela();
    }

    atualizarMetricas() {
        // Total de vagas
        const totalVagas = this.vagas.length;
        document.getElementById('total-vagas').textContent = totalVagas;

        // Vagas ativas
        const vagasAtivas = this.vagas.filter(v => v.ativa !== false).length;
        document.getElementById('vagas-ativas').textContent = vagasAtivas;

        // Vagas remotas
        const vagasRemotas = this.vagas.filter(v => v.tipoLocal === 'remoto').length;
        document.getElementById('vagas-remotas').textContent = vagasRemotas;

        // Vagas criadas este mês
        const dataAtual = new Date();
        const mesAtual = dataAtual.getMonth();
        const anoAtual = dataAtual.getFullYear();
        
        const vagasEsteMes = this.vagas.filter(v => {
            if (!v.criadoEm) return false;
            const dataCriacao = v.criadoEm.toDate();
            return dataCriacao.getMonth() === mesAtual && dataCriacao.getFullYear() === anoAtual;
        }).length;
        document.getElementById('vagas-este-mes').textContent = vagasEsteMes;

        // Atualizar badge no menu
        document.getElementById('vagas-count').textContent = totalVagas;
    }

    renderizarGrafico() {
        const chartContainer = document.getElementById('vagas-periodo-chart');
        
        // Últimos 7 dias
        const hoje = new Date();
        const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const dados = [];

        for (let i = 6; i >= 0; i--) {
            const data = new Date(hoje);
            data.setDate(data.getDate() - i);
            const dia = diasSemana[data.getDay()];
            
            const vagasNoDia = this.vagas.filter(v => {
                if (!v.criadoEm) return false;
                const dataCriacao = v.criadoEm.toDate();
                return dataCriacao.toDateString() === data.toDateString();
            }).length;

            dados.push({ dia, count: vagasNoDia });
        }

        const maxValue = Math.max(...dados.map(d => d.count), 1);

        chartContainer.innerHTML = dados.map(d => {
            const altura = (d.count / maxValue) * 100;
            return `
                <div class="bar-item">
                    <div class="bar-value">${d.count}</div>
                    <div class="bar" style="height: ${altura}%"></div>
                    <div class="bar-label">${d.dia}</div>
                </div>
            `;
        }).join('');
    }

    renderizarDistribuicao() {
        const localizacoes = {
            'Remoto': 0,
            'Híbrido': 0,
            'Presencial': 0
        };

        this.vagas.forEach(vaga => {
            const tipo = vaga.tipoLocal.charAt(0).toUpperCase() + vaga.tipoLocal.slice(1);
            if (localizacoes.hasOwnProperty(tipo)) {
                localizacoes[tipo]++;
            }
        });

        const total = this.vagas.length || 1;
        const container = document.getElementById('distribuicao-localizacao');
        
        // Cores laranja para cada tipo
        const cores = {
            'Remoto': 'linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)',
            'Híbrido': 'linear-gradient(135deg, #ff8c42 0%, #ffb347 100%)',
            'Presencial': 'linear-gradient(135deg, #ffb347 0%, #ffd166 100%)'
        };
        
        container.innerHTML = Object.entries(localizacoes).map(([tipo, count]) => {
            const porcentagem = Math.round((count / total) * 100);
            return `
                <div class="distribution-item">
                    <div class="distribution-header">
                        <span class="distribution-label">${tipo}</span>
                        <span class="distribution-value">${count} (${porcentagem}%)</span>
                    </div>
                    <div class="distribution-bar">
                        <div class="distribution-fill" style="width: ${porcentagem}%; background: ${cores[tipo]}"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderizarTabela(vagasFiltradas = null) {
        const vagas = vagasFiltradas || this.vagas;
        const container = document.getElementById('vagas-table-container');
        
        if (vagas.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-briefcase"></i>
                    </div>
                    <h3 class="empty-title">Nenhuma vaga encontrada</h3>
                    <p class="empty-text">Comece criando sua primeira vaga de emprego</p>
                    <button class="btn-primary" onclick="document.getElementById('btn-nova-vaga').click()">
                        <i class="fas fa-plus"></i>
                        Nova Vaga
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>TÍTULO</th>
                        <th>LOCALIZAÇÃO</th>
                        <th>TIPO</th>
                        <th>CONTRATO</th>
                        <th>STATUS</th>
                        <th>CRIADA EM</th>
                        <th>AÇÕES</th>
                    </tr>
                </thead>
                <tbody>
                    ${vagas.map(vaga => `
                        <tr>
                            <td><strong>${vaga.titulo}</strong></td>
                            <td>${vaga.localizacao}</td>
                            <td><span class="type-badge ${vaga.tipoLocal}">${this.formatarTipo(vaga.tipoLocal)}</span></td>
                            <td>${this.formatarContrato(vaga.contrato)}</td>
                            <td><span class="status-badge ${vaga.ativa !== false ? 'active' : 'inactive'}">${vaga.ativa !== false ? 'Ativa' : 'Inativa'}</span></td>
                            <td>${this.formatarData(vaga.criadoEm)}</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-action btn-edit" data-id="${vaga.id}" title="Editar">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-action btn-delete" data-id="${vaga.id}" title="Excluir">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        // Adicionar event listeners
        container.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                this.editarVaga(id);
            });
        });

        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                this.excluirVaga(id);
            });
        });
    }

    filtrarVagas(termo) {
        if (!termo.trim()) {
            this.renderizarTabela();
            return;
        }

        const termoLower = termo.toLowerCase();
        const vagasFiltradas = this.vagas.filter(vaga => 
            vaga.titulo.toLowerCase().includes(termoLower) ||
            vaga.localizacao.toLowerCase().includes(termoLower) ||
            vaga.contrato.toLowerCase().includes(termoLower) ||
            vaga.tipoLocal.toLowerCase().includes(termoLower)
        );

        this.renderizarTabela(vagasFiltradas);
    }

    formatarTipo(tipo) {
        const tipos = {
            'remoto': 'Remoto',
            'hibrido': 'Híbrido',
            'presencial': 'Presencial'
        };
        return tipos[tipo] || tipo;
    }

    formatarContrato(contrato) {
        const contratos = {
            'clt': 'CLT',
            'pj': 'PJ',
            'estagio': 'Estágio'
        };
        return contratos[contrato] || contrato;
    }

    formatarData(timestamp) {
        if (!timestamp) return 'N/A';
        const data = timestamp.toDate();
        return data.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });
    }

    salvarVaga() {
        const titulo = document.getElementById('vaga-titulo').value.trim();
        const localizacao = document.getElementById('vaga-localizacao').value.trim();
        const tipoLocal = document.getElementById('vaga-tipo-local').value;
        const contrato = document.getElementById('vaga-contrato').value;
        const descricao = document.getElementById('vaga-descricao').value.trim();

        if (!titulo || !localizacao || !tipoLocal || !contrato) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        const vaga = {
            titulo,
            localizacao,
            tipoLocal,
            contrato,
            descricao
        };

        const btnSalvar = document.getElementById('btn-salvar');
        const iconOriginal = btnSalvar.innerHTML;
        btnSalvar.disabled = true;
        btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

        if (this.vagaEditandoId) {
            vaga.id = this.vagaEditandoId;
            this.salvarNoFirestore(vaga, true)
                .then(() => {
                    this.fecharModal();
                    this.mostrarNotificacao('Vaga atualizada com sucesso!', 'success');
                })
                .catch((error) => {
                    this.mostrarNotificacao('Erro ao atualizar vaga: ' + error.message, 'error');
                })
                .finally(() => {
                    btnSalvar.disabled = false;
                    btnSalvar.innerHTML = iconOriginal;
                });
        } else {
            this.salvarNoFirestore(vaga, false)
                .then(() => {
                    this.fecharModal();
                    this.mostrarNotificacao('Vaga cadastrada com sucesso!', 'success');
                })
                .catch((error) => {
                    this.mostrarNotificacao('Erro ao cadastrar vaga: ' + error.message, 'error');
                })
                .finally(() => {
                    btnSalvar.disabled = false;
                    btnSalvar.innerHTML = iconOriginal;
                });
        }
    }

    editarVaga(id) {
        const vaga = this.vagas.find(v => v.id === id);
        if (vaga) {
            document.getElementById('modal-titulo').textContent = 'Editar Vaga';
            document.getElementById('vaga-id').value = vaga.id;
            document.getElementById('vaga-titulo').value = vaga.titulo;
            document.getElementById('vaga-localizacao').value = vaga.localizacao;
            document.getElementById('vaga-tipo-local').value = vaga.tipoLocal;
            document.getElementById('vaga-contrato').value = vaga.contrato;
            document.getElementById('vaga-descricao').value = vaga.descricao || '';
            this.vagaEditandoId = vaga.id;
            
            document.getElementById('modal-vaga').classList.add('show');
        }
    }

    excluirVaga(id) {
        if (confirm('Tem certeza que deseja excluir esta vaga? Esta ação não pode ser desfeita.')) {
            this.vagasCollection.doc(id).delete()
                .then(() => {
                    this.mostrarNotificacao('Vaga excluída com sucesso!', 'success');
                })
                .catch((error) => {
                    console.error('Erro ao excluir vaga:', error);
                    this.mostrarNotificacao('Erro ao excluir vaga: ' + error.message, 'error');
                });
        }
    }

    fecharModal() {
        document.getElementById('modal-vaga').classList.remove('show');
        document.getElementById('form-vaga').reset();
        this.vagaEditandoId = null;
    }

    mostrarNotificacao(mensagem, tipo) {
        // Você pode implementar um sistema de notificações toast aqui
        alert(mensagem);
    }
}

// Inicializar o gerenciador
let vagasManager;
document.addEventListener('DOMContentLoaded', () => {
    vagasManager = new VagasManager();
});
