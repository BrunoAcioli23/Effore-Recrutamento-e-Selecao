// Sistema de gerenciamento de vagas usando Firebase Firestore

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
        
        // Listener em tempo real para mudanças no Firestore (sem orderBy)
        this.vagasCollection.onSnapshot((snapshot) => {
            this.vagas = [];
            snapshot.forEach((doc) => {
                this.vagas.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            // Ordenar no client-side por data de criação (mais recentes primeiro)
            this.vagas.sort((a, b) => {
                if (a.criadoEm && b.criadoEm) {
                    return b.criadoEm.toDate() - a.criadoEm.toDate();
                }
                return 0;
            });
            this.renderizarVagas();
        });
    }

    configurarEventos() {
        const btnNovaVaga = document.getElementById('btn-nova-vaga');
        const modal = document.getElementById('modal-vaga');
        const btnCancelar = document.getElementById('btn-cancelar');
        const modalClose = document.querySelector('.modal-close');
        const formVaga = document.getElementById('form-vaga');

        // Abrir modal para nova vaga
        btnNovaVaga.addEventListener('click', () => {
            this.abrirModal();
        });

        // Fechar modal
        btnCancelar.addEventListener('click', () => {
            this.fecharModal();
        });

        modalClose.addEventListener('click', () => {
            this.fecharModal();
        });

        // Fechar modal ao clicar fora
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.fecharModal();
            }
        });

        // Submit do formulário
        formVaga.addEventListener('submit', (e) => {
            e.preventDefault();
            this.salvarVaga();
        });
    }

    async carregarVagas() {
        try {
            // Buscar todas as vagas (sem orderBy)
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
            this.renderizarVagas();
        } catch (error) {
            console.error('Erro ao carregar vagas:', error);
            alert('Erro ao carregar vagas. Verifique sua conexão.');
        }
    }

    async salvarNoFirestore(vaga, isUpdate = false) {
        try {
            if (isUpdate) {
                // Atualizar vaga existente
                await this.vagasCollection.doc(vaga.id).update({
                    titulo: vaga.titulo,
                    localizacao: vaga.localizacao,
                    tipoLocal: vaga.tipoLocal,
                    contrato: vaga.contrato,
                    descricao: vaga.descricao,
                    atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                // Adicionar nova vaga
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

    adicionarVagasExemplo() {
        // Removido - agora as vagas só são adicionadas manualmente
    }

    renderizarVagas() {
        const listaElement = document.getElementById('vagas-lista');
        
        // Atualizar métricas do dashboard
        this.atualizarMetricas();
        
        if (this.vagas.length === 0) {
            listaElement.innerHTML = `
                <div class="empty-state">
                    <p>Nenhuma vaga cadastrada ainda.</p>
                    <button class="btn btn-primary" onclick="vagasManager.abrirModal()">Cadastrar Primeira Vaga</button>
                </div>
            `;
            return;
        }

        listaElement.innerHTML = this.vagas.map(vaga => `
            <div class="admin-vaga-card">
                <div class="admin-vaga-info">
                    <h3>${vaga.titulo}</h3>
                    <p>${vaga.localizacao} • ${vaga.contrato}</p>
                </div>
                <div class="admin-vaga-actions">
                    <button class="btn-editar" data-vaga-id="${vaga.id}">Editar</button>
                    <button class="btn-excluir" data-vaga-id="${vaga.id}">Excluir</button>
                </div>
            </div>
        `).join('');

        // Adicionar event listeners após renderizar
        this.adicionarEventListenersVagas();
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

        // Estatísticas por tipo de contrato
        this.renderizarEstatisticasContrato();

        // Estatísticas por localização
        this.renderizarEstatisticasLocalizacao();
    }

    renderizarEstatisticasContrato() {
        const contratos = {
            'CLT': 0,
            'PJ': 0,
            'Estágio': 0
        };

        this.vagas.forEach(vaga => {
            const contrato = vaga.contrato.toUpperCase();
            if (contratos.hasOwnProperty(contrato)) {
                contratos[contrato]++;
            } else if (contrato === 'ESTAGIO') {
                contratos['Estágio']++;
            }
        });

        const total = this.vagas.length || 1;
        const statsContratoElement = document.getElementById('stats-contrato');
        
        statsContratoElement.innerHTML = Object.entries(contratos).map(([tipo, count]) => {
            const porcentagem = Math.round((count / total) * 100);
            return `
                <div class="stats-item">
                    <span class="stats-label">${tipo}</span>
                    <div class="stats-bar">
                        <div class="stats-bar-fill" style="width: ${porcentagem}%; background: #667eea;"></div>
                    </div>
                    <span class="stats-value">${count}</span>
                </div>
            `;
        }).join('');
    }

    renderizarEstatisticasLocalizacao() {
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
        const cores = {
            'Remoto': '#4facfe',
            'Híbrido': '#f093fb',
            'Presencial': '#fa709a'
        };
        
        const statsLocalizacaoElement = document.getElementById('stats-localizacao');
        
        statsLocalizacaoElement.innerHTML = Object.entries(localizacoes).map(([tipo, count]) => {
            const porcentagem = Math.round((count / total) * 100);
            return `
                <div class="stats-item">
                    <span class="stats-label">${tipo}</span>
                    <div class="stats-bar">
                        <div class="stats-bar-fill" style="width: ${porcentagem}%; background: ${cores[tipo]};"></div>
                    </div>
                    <span class="stats-value">${count}</span>
                </div>
            `;
        }).join('');
    }

    adicionarEventListenersVagas() {
        // Event listeners para botões de editar
        document.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const vagaId = e.target.getAttribute('data-vaga-id');
                this.editarVaga(vagaId);
            });
        });

        // Event listeners para botões de excluir
        document.querySelectorAll('.btn-excluir').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const vagaId = e.target.getAttribute('data-vaga-id');
                this.excluirVaga(vagaId);
            });
        });
    }

    abrirModal(vaga = null) {
        const modal = document.getElementById('modal-vaga');
        const modalTitulo = document.getElementById('modal-titulo');
        
        if (vaga) {
            // Modo edição
            modalTitulo.textContent = 'Editar Vaga';
            document.getElementById('vaga-id').value = vaga.id;
            document.getElementById('vaga-titulo').value = vaga.titulo;
            document.getElementById('vaga-localizacao').value = vaga.localizacao;
            document.getElementById('vaga-tipo-local').value = vaga.tipoLocal;
            document.getElementById('vaga-contrato').value = vaga.contrato;
            document.getElementById('vaga-descricao').value = vaga.descricao || '';
            this.vagaEditandoId = vaga.id;
        } else {
            // Modo criação
            modalTitulo.textContent = 'Nova Vaga';
            document.getElementById('form-vaga').reset();
            document.getElementById('vaga-id').value = '';
            this.vagaEditandoId = null;
        }
        
        modal.style.display = 'block';
    }

    fecharModal() {
        const modal = document.getElementById('modal-vaga');
        modal.style.display = 'none';
        document.getElementById('form-vaga').reset();
        this.vagaEditandoId = null;
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

        // Mostrar loading
        const btnSalvar = document.querySelector('#form-vaga button[type="submit"]');
        const btnTextoOriginal = btnSalvar.textContent;
        btnSalvar.disabled = true;
        btnSalvar.textContent = 'Salvando...';

        if (this.vagaEditandoId) {
            // Atualizar vaga existente
            vaga.id = this.vagaEditandoId;
            this.salvarNoFirestore(vaga, true)
                .then(() => {
                    this.fecharModal();
                    alert('Vaga atualizada com sucesso!');
                })
                .catch((error) => {
                    alert('Erro ao atualizar vaga: ' + error.message);
                })
                .finally(() => {
                    btnSalvar.disabled = false;
                    btnSalvar.textContent = btnTextoOriginal;
                });
        } else {
            // Criar nova vaga
            this.salvarNoFirestore(vaga, false)
                .then(() => {
                    this.fecharModal();
                    alert('Vaga cadastrada com sucesso!');
                })
                .catch((error) => {
                    alert('Erro ao cadastrar vaga: ' + error.message);
                })
                .finally(() => {
                    btnSalvar.disabled = false;
                    btnSalvar.textContent = btnTextoOriginal;
                });
        }
    }

    editarVaga(id) {
        const vaga = this.vagas.find(v => v.id === id);
        if (vaga) {
            this.abrirModal(vaga);
        }
    }

    excluirVaga(id) {
        if (confirm('Tem certeza que deseja excluir esta vaga?')) {
            this.vagasCollection.doc(id).delete()
                .then(() => {
                    alert('Vaga excluída com sucesso!');
                })
                .catch((error) => {
                    console.error('Erro ao excluir vaga:', error);
                    alert('Erro ao excluir vaga: ' + error.message);
                });
        }
    }
}

// Inicializar o gerenciador quando o DOM estiver pronto
let vagasManager;
document.addEventListener('DOMContentLoaded', () => {
    vagasManager = new VagasManager();
});
