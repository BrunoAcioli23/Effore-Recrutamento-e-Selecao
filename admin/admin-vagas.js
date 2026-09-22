// Sistema de gerenciamento de vagas - Novo Design

class VagasManager {
    constructor() {
        this.vagas = [];
        this.vagaEditandoId = null;
        this.termoBusca = '';
        this.periodoDias = 7;
        this.vagasCollection = db.collection('vagas');
        this.inicializar();
    }

    async inicializar() {
        this.configurarEventos();

        // Listener em tempo real para mudanças no Firestore (tambem faz a carga inicial)
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

        // Abertura e fechamento do modal
        document.getElementById('btn-nova-vaga').addEventListener('click', () => {
            this.abrirModalNova();
        });

        document.getElementById('btn-cancelar').addEventListener('click', () => {
            if (confirm('Deseja realmente cancelar? Os dados preenchidos serão perdidos.')) {
                this.fecharModal();
            }
        });

        document.querySelector('.btn-close').addEventListener('click', () => {
            this.fecharModal();
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

        // Filtros de período do gráfico
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.periodoDias = Number(e.currentTarget.dataset.dias) || 7;
                this.renderizarGrafico();
            });
        });
    }

    async salvarNoFirestore(vaga, isUpdate = false) {
        try {
            if (isUpdate) {
                await this.vagasCollection.doc(vaga.id).update({
                    titulo: vaga.titulo,
                    empresa: vaga.empresa,
                    cidade: vaga.cidade,
                    salario: vaga.salario,
                    contrato: vaga.contrato,
                    horario: vaga.horario,
                    beneficios: vaga.beneficios,
                    descricao: vaga.descricao,
                    atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                await this.vagasCollection.add({
                    titulo: vaga.titulo,
                    empresa: vaga.empresa,
                    cidade: vaga.cidade,
                    salario: vaga.salario,
                    contrato: vaga.contrato,
                    horario: vaga.horario,
                    beneficios: vaga.beneficios,
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

    async alternarStatus(id, ativa) {
        try {
            await this.vagasCollection.doc(id).update({
                ativa: ativa,
                atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
            });
            this.mostrarNotificacao(
                ativa ? 'Vaga publicada no site!' : 'Vaga despublicada e removida do site.',
                'success'
            );
        } catch (error) {
            console.error('Erro ao alterar status da vaga:', error);
            this.mostrarNotificacao('Erro ao alterar status: ' + error.message, 'error');
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

        // Vagas publicadas (mesmo critério do site público)
        const vagasAtivas = this.vagas.filter(v => this.estaPublicada(v)).length;
        document.getElementById('vagas-ativas').textContent = vagasAtivas;

        // Vagas CLT
        const vagasCLT = this.vagas.filter(v => v.contrato === 'clt').length;
        document.getElementById('vagas-clt').textContent = vagasCLT;

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

        // Variação real contra o mês anterior
        const mesAnterior = new Date(anoAtual, mesAtual - 1, 1);
        const vagasMesAnterior = this.vagas.filter(v => {
            if (!v.criadoEm) return false;
            const dataCriacao = v.criadoEm.toDate();
            return dataCriacao.getMonth() === mesAnterior.getMonth() &&
                   dataCriacao.getFullYear() === mesAnterior.getFullYear();
        }).length;
        this.renderizarTrend(vagasEsteMes, vagasMesAnterior);

        // Atualizar badge no menu
        document.getElementById('vagas-count').textContent = totalVagas;
    }

    badgeStatus(vaga) {
        if (vaga.ativa === true) {
            return '<span class="status-badge active">Publicada</span>';
        }
        if (vaga.ativa === false) {
            return '<span class="status-badge inactive">Despublicada</span>';
        }
        // Campo ausente: o site publico ja nao mostra esta vaga
        return '<span class="status-badge pending" title="Sem o campo ativa; o site público não exibe esta vaga">Não publicada</span>';
    }

    renderizarTrend(atual, anterior) {
        const el = document.getElementById('trend-este-mes');
        if (!el) return;

        // Sem base de comparação, não há variação honesta a mostrar
        if (anterior === 0) {
            el.className = 'metric-trend';
            el.innerHTML = '';
            el.title = '';
            return;
        }

        const variacao = Math.round(((atual - anterior) / anterior) * 100);
        const subiu = variacao >= 0;
        el.className = 'metric-trend ' + (subiu ? 'up' : 'down');
        el.innerHTML = `<i class="fas fa-arrow-${subiu ? 'up' : 'down'}"></i> ${Math.abs(variacao)}%`;
        el.title = `${atual} este mês vs ${anterior} no mês anterior`;
    }

    renderizarGrafico() {
        const chartContainer = document.getElementById('vagas-periodo-chart');
        const dados = this.dadosDoPeriodo(this.periodoDias);
        const maxValue = Math.max(...dados.map(d => d.count), 1);

        chartContainer.innerHTML = dados.map(d => {
            const altura = (d.count / maxValue) * 100;
            return `
                <div class="bar-item" title="${d.count} vaga(s) em ${d.dia}">
                    <div class="bar-value">${d.count}</div>
                    <div class="bar" style="height: ${altura}%"></div>
                    <div class="bar-label">${d.dia}</div>
                </div>
            `;
        }).join('');
    }

    // Agrupa as vagas do período: por dia em 7 dias, por semana em 30, por mês em 90
    dadosDoPeriodo(dias) {
        const criadas = this.vagas
            .filter(v => v.criadoEm)
            .map(v => v.criadoEm.toDate());

        const contarEntre = (inicio, fim) =>
            criadas.filter(d => d >= inicio && d < fim).length;

        const inicioDoDia = (data) => {
            const d = new Date(data);
            d.setHours(0, 0, 0, 0);
            return d;
        };

        const hoje = new Date();
        const dados = [];

        if (dias <= 7) {
            const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            for (let i = dias - 1; i >= 0; i--) {
                const data = new Date(hoje);
                data.setDate(data.getDate() - i);
                const inicio = inicioDoDia(data);
                const fim = new Date(inicio);
                fim.setDate(fim.getDate() + 1);
                dados.push({ dia: diasSemana[inicio.getDay()], count: contarEntre(inicio, fim) });
            }
        } else if (dias <= 30) {
            const tamanhoBucket = 5;
            const buckets = Math.ceil(dias / tamanhoBucket);
            for (let i = buckets - 1; i >= 0; i--) {
                const fim = inicioDoDia(hoje);
                fim.setDate(fim.getDate() - (i * tamanhoBucket) + 1);
                const inicio = new Date(fim);
                inicio.setDate(inicio.getDate() - tamanhoBucket);
                const rotulo = `${String(inicio.getDate()).padStart(2, '0')}/${String(inicio.getMonth() + 1).padStart(2, '0')}`;
                dados.push({ dia: rotulo, count: contarEntre(inicio, fim) });
            }
        } else {
            const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            for (let i = 2; i >= 0; i--) {
                const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
                const fim = new Date(hoje.getFullYear(), hoje.getMonth() - i + 1, 1);
                dados.push({ dia: meses[inicio.getMonth()], count: contarEntre(inicio, fim) });
            }
        }

        return dados;
    }

    renderizarDistribuicao() {
        const contratos = {
            'CLT': 0,
            'PJ': 0,
            'Estágio': 0,
            'Temporário': 0,
            'Freelancer': 0
        };

        this.vagas.forEach(vaga => {
            const tipo = this.formatarContrato(vaga.contrato);
            if (contratos.hasOwnProperty(tipo)) {
                contratos[tipo]++;
            }
        });

        const total = this.vagas.length || 1;
        const container = document.getElementById('distribuicao-contrato');
        
        // Escala sequencial do dourado da marca (do bronze ao dourado claro)
        const cores = {
            'CLT': 'linear-gradient(135deg, #5F4A2A 0%, #7A5F37 100%)',
            'PJ': 'linear-gradient(135deg, #7A5F37 0%, #96784A 100%)',
            'Estágio': 'linear-gradient(135deg, #96784A 0%, #A78652 100%)',
            'Temporário': 'linear-gradient(135deg, #A78652 0%, #C29A5E 100%)',
            'Freelancer': 'linear-gradient(135deg, #C29A5E 0%, #D7B071 100%)'
        };
        
        container.innerHTML = Object.entries(contratos).map(([tipo, count]) => {
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

    renderizarTabela() {
        const vagas = this.vagasVisiveis();
        const container = document.getElementById('vagas-table-container');

        if (vagas.length === 0) {
            container.innerHTML = this.termoBusca
                ? `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-search"></i>
                    </div>
                    <h3 class="empty-title">Nenhum resultado para "${this.escapar(this.termoBusca)}"</h3>
                    <p class="empty-text">Tente outro termo ou limpe a busca</p>
                </div>
            `
                : `
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
                        <th>CIDADE</th>
                        <th>SALÁRIO</th>
                        <th>CONTRATO</th>
                        <th>STATUS</th>
                        <th>CRIADA EM</th>
                        <th>AÇÕES</th>
                    </tr>
                </thead>
                <tbody>
                    ${vagas.map(vaga => `
                        <tr>
                            <td><strong>${this.escapar(vaga.titulo)}</strong></td>
                            <td>${this.escapar(vaga.cidade || vaga.localizacao || 'N/A')}</td>
                            <td>${this.escapar(vaga.salario || 'A combinar')}</td>
                            <td>${this.escapar(this.formatarContrato(vaga.contrato))}</td>
                            <td>${this.badgeStatus(vaga)}</td>
                            <td>${this.formatarData(vaga.criadoEm)}</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-action btn-toggle" data-id="${vaga.id}" data-ativa="${this.estaPublicada(vaga)}" title="${this.estaPublicada(vaga) ? 'Despublicar vaga' : 'Publicar vaga no site'}" aria-label="${this.estaPublicada(vaga) ? 'Despublicar vaga' : 'Publicar vaga no site'}">
                                        <i class="fas fa-${this.estaPublicada(vaga) ? 'eye-slash' : 'eye'}"></i>
                                    </button>
                                    <button class="btn-action btn-edit" data-id="${vaga.id}" title="Editar" aria-label="Editar vaga">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-action btn-delete" data-id="${vaga.id}" title="Excluir" aria-label="Excluir vaga">
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

        container.querySelectorAll('.btn-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const estaAtiva = e.currentTarget.getAttribute('data-ativa') === 'true';
                this.alternarStatus(id, !estaAtiva);
            });
        });
    }

    filtrarVagas(termo) {
        this.termoBusca = termo.trim();
        this.renderizarTabela();
    }

    vagasVisiveis() {
        if (!this.termoBusca) return this.vagas;

        const termoLower = this.termoBusca.toLowerCase();
        const contem = (valor) =>
            typeof valor === 'string' && valor.toLowerCase().includes(termoLower);

        return this.vagas.filter(vaga =>
            contem(vaga.titulo) ||
            contem(vaga.empresa) ||
            contem(vaga.cidade) ||
            contem(vaga.localizacao) ||
            contem(vaga.salario) ||
            contem(vaga.contrato) ||
            contem(this.formatarContrato(vaga.contrato))
        );
    }

    // Espelha a consulta do site publico: where('ativa', '==', true).
    // Documento sem o campo nao esta publicado, logo nao pode aparecer como "Ativa".
    estaPublicada(vaga) {
        return vaga.ativa === true;
    }

    escapar(valor) {
        if (valor === null || valor === undefined) return '';
        return String(valor)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    formatarContrato(contrato) {
        const contratos = {
            'clt': 'CLT',
            'pj': 'PJ',
            'estagio': 'Estágio',
            'temporario': 'Temporário',
            'freelancer': 'Freelancer'
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
        const empresa = document.getElementById('vaga-empresa').value.trim();
        const cidade = document.getElementById('vaga-cidade').value.trim();
        const salario = document.getElementById('vaga-salario').value.trim();
        const contrato = document.getElementById('vaga-contrato').value;
        const horario = document.getElementById('vaga-horario').value.trim();
        const descricao = document.getElementById('vaga-descricao').value.trim();

        // Capturar benefícios selecionados
        const beneficios = [];
        document.querySelectorAll('.benefit-checkbox:checked').forEach(checkbox => {
            beneficios.push(checkbox.value);
        });

        if (!titulo || !cidade || !contrato) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        const vaga = {
            titulo,
            empresa,
            cidade,
            salario,
            contrato,
            horario,
            beneficios,
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

    abrirModalNova() {
        this.vagaEditandoId = null;
        document.getElementById('modal-titulo').textContent = 'Nova Vaga';
        this.limparFormulario();
        document.getElementById('modal-vaga').classList.add('show');
    }

    limparFormulario() {
        document.getElementById('form-vaga').reset();
        document.getElementById('vaga-id').value = '';
        document.querySelectorAll('.benefit-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
    }

    editarVaga(id) {
        const vaga = this.vagas.find(v => v.id === id);
        if (vaga) {
            document.getElementById('modal-titulo').textContent = 'Editar Vaga';
            this.limparFormulario();
            document.getElementById('vaga-id').value = vaga.id;
            document.getElementById('vaga-titulo').value = vaga.titulo;
            document.getElementById('vaga-empresa').value = vaga.empresa || '';
            document.getElementById('vaga-cidade').value = vaga.cidade || vaga.localizacao || '';
            document.getElementById('vaga-salario').value = vaga.salario || '';
            document.getElementById('vaga-contrato').value = vaga.contrato;
            document.getElementById('vaga-horario').value = vaga.horario || '';
            document.getElementById('vaga-descricao').value = vaga.descricao || '';

            // Marcar benefícios salvos
            if (vaga.beneficios && Array.isArray(vaga.beneficios)) {
                vaga.beneficios.forEach(beneficio => {
                    const checkbox = Array.from(document.querySelectorAll('.benefit-checkbox')).find(
                        cb => cb.value === beneficio
                    );
                    if (checkbox) {
                        checkbox.checked = true;
                    }
                });
            }
            
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
        this.limparFormulario();
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
