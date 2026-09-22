// Painel administrativo - visão geral e gerenciamento de vagas.

// Unico e-mail que pode gerenciar quem tem acesso ao painel.
// Isto aqui so controla o que aparece na tela; quem impede de verdade e o
// firestore.rules, que repete este e-mail. Trocar o dono = mudar nos dois.
const EMAIL_DONO = 'brunoeffore@outlook.com';

// O Firebase Auth exige um e-mail para criar a conta, mesmo quando a pessoa
// nao tem um. Quem for cadastrado sem e-mail ganha um endereco interno
// (maria.silvaimperiorecursoshumanos.com.br) que existe so para o
// login funcionar — ninguem escreve nem recebe nada nele.
const DOMINIO_INTERNO = 'imperiorecursoshumanos.com.br';

// Telas que o dono pode liberar por pessoa, agrupadas como no menu.
// A aba Usuários não entra aqui de propósito: ela é sempre só do dono.
const SECOES_TELAS = [
    {
        secao: 'Principal',
        telas: [
            { chave: 'visao-geral', rotulo: 'Visão Geral' },
            { chave: 'vagas', rotulo: 'Vagas' },
            { chave: 'candidatos', rotulo: 'Candidatos' },
            { chave: 'empresas', rotulo: 'Empresas' }
        ]
    },
    {
        secao: 'Conteúdo',
        telas: [
            { chave: 'blog', rotulo: 'Blog' },
            { chave: 'marketing', rotulo: 'Marketing' },
            { chave: 'contatos', rotulo: 'Contatos' }
        ]
    },
    {
        secao: 'Configurações',
        telas: [
            { chave: 'configuracoes', rotulo: 'Configurações' }
        ]
    }
];

const TODAS_AS_TELAS = SECOES_TELAS.reduce(
    (lista, s) => lista.concat(s.telas.map((t) => t.chave)), []);

const PAGINAS = {
    'visao-geral': {
        titulo: 'Visão Geral',
        subtitulo: 'Resumo do que está acontecendo nas suas vagas'
    },
    'vagas': {
        titulo: 'Gerenciamento de Vagas',
        subtitulo: 'Métricas, faixas salariais e a lista completa'
    },
    'usuarios': {
        titulo: 'Usuários',
        subtitulo: 'Quem entra no painel e o que cada um enxerga',
        apenasDono: true
    }
};

// Nome de usuário para login: "Maria Silva" -> "maria.silva".
// Sem acento nem espaço, porque vira o id de um documento no Firestore.
function gerarUsuario(nome) {
    return String(nome || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/^\.+|\.+$/g, '');
}

const FILTROS_VAGA = [
    { valor: 'todos', rotulo: 'Todas as vagas' },
    { valor: 'publicadas', rotulo: 'Publicadas no site' },
    { valor: 'despublicadas', rotulo: 'Despublicadas' },
    { valor: 'nao-publicadas', rotulo: 'Nunca publicadas' },
    { valor: 'sem-salario', rotulo: 'Sem salário informado' },
    { valor: 'sem-descricao', rotulo: 'Sem descrição' },
    { valor: 'antigas', rotulo: 'No ar há mais de 60 dias' }
];

const ORDENACOES = [
    { valor: 'recentes', rotulo: 'Mais recentes' },
    { valor: 'antigas', rotulo: 'Mais antigas' },
    { valor: 'maior-salario', rotulo: 'Maior salário' },
    { valor: 'menor-salario', rotulo: 'Menor salário' },
    { valor: 'titulo', rotulo: 'Título (A-Z)' }
];

const DIAS_VAGA_ANTIGA = 60;

const moedaBRL = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
});

class VagasManager {
    constructor(user, ehDono, permissoes) {
        this.user = user;
        this.ehDono = ehDono;
        // O dono enxerga tudo; os demais, só o que foi marcado para eles.
        this.permissoes = ehDono ? TODAS_AS_TELAS.slice() : (permissoes || []);
        this.admins = [];
        this.vagas = [];
        this.carregado = false;
        this.erroCarga = null;
        this.vagaEditandoId = null;
        this.termoBusca = '';
        this.periodoDias = 7;
        this.telaAtual = this.primeiraTelaPermitida();
        this.paginaAtual = this.telaAtual;
        this.filtro = 'todos';
        this.ordenacao = 'recentes';
        this.vagasCollection = db.collection('vagas');
        this.inicializar();
    }

    inicializar() {
        this.configurarEventos();
        this.aplicarPermissoes();
        this.mostrarPagina(this.paginaAtual);
        this.renderizarTudo();

        if (this.ehDono) {
            const caixa = document.getElementById('telas-novo-usuario');
            if (caixa) caixa.innerHTML = this.htmlTelas('novo', ['visao-geral', 'vagas']);
            this.escutarAdmins();
        }

        // Listener em tempo real (também faz a carga inicial)
        this.vagasCollection.onSnapshot(
            (snapshot) => {
                this.vagas = [];
                snapshot.forEach((doc) => {
                    this.vagas.push({ id: doc.id, ...doc.data() });
                });
                this.vagas.sort((a, b) => {
                    if (a.criadoEm && b.criadoEm) {
                        return b.criadoEm.toDate() - a.criadoEm.toDate();
                    }
                    return 0;
                });
                this.carregado = true;
                this.erroCarga = null;
                this.renderizarTudo();
            },
            (erro) => {
                console.error('Erro ao carregar vagas:', erro);
                this.carregado = true;
                this.erroCarga = erro.message || 'Não foi possível carregar as vagas.';
                this.renderizarTudo();
            }
        );
    }

    // ===================== EVENTOS =====================

    configurarEventos() {
        document.getElementById('btn-salvar').addEventListener('click', () => this.salvarVaga());

        document.getElementById('form-vaga').addEventListener('submit', (e) => {
            e.preventDefault();
            this.salvarVaga();
        });

        // Modal — dois botoes abrem o mesmo formulario
        document.getElementById('btn-nova-vaga').addEventListener('click', () => this.abrirModalNova());
        document.getElementById('btn-nova-vaga-topo').addEventListener('click', () => this.abrirModalNova());

        // Criacao de acesso (so usada pelo dono)
        const formUsuario = document.getElementById('form-usuario');
        if (formUsuario) {
            formUsuario.addEventListener('submit', (e) => {
                e.preventDefault();
                this.criarUsuario();
            });

            // Mostra o login que sera gerado enquanto o nome e digitado,
            // sem sobrescrever se o dono preferir escolher a mao.
            const campoNome = document.getElementById('usuario-nome');
            const campoLogin = document.getElementById('usuario-login');
            campoNome.addEventListener('input', () => {
                if (!campoLogin.dataset.editado) {
                    campoLogin.value = gerarUsuario(campoNome.value);
                }
            });
            campoLogin.addEventListener('input', () => {
                campoLogin.dataset.editado = campoLogin.value ? '1' : '';
            });
        }

        document.getElementById('btn-cancelar').addEventListener('click', () => {
            if (confirm('Deseja realmente cancelar? Os dados preenchidos serão perdidos.')) {
                this.fecharModal();
            }
        });

        document.querySelector('.btn-close').addEventListener('click', () => this.fecharModal());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.fecharModal();
        });

        // Navegação da sidebar
        document.querySelectorAll('.nav-item').forEach((item) => {
            item.addEventListener('click', () => {
                this.mostrarPagina(item.dataset.page);
                document.querySelector('.sidebar').classList.remove('show');
            });
        });

        // Menu no mobile
        const btnMenu = document.getElementById('btn-menu');
        if (btnMenu) {
            btnMenu.addEventListener('click', () => {
                document.querySelector('.sidebar').classList.toggle('show');
            });
        }

        // Busca, filtro e ordenação da lista de vagas
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.termoBusca = e.target.value.trim();
            this.renderizarTabela();
        });

        document.getElementById('filtro-status').addEventListener('change', (e) => {
            this.filtro = e.target.value;
            this.renderizarPaginaVagas();
        });

        document.getElementById('filtro-ordem').addEventListener('change', (e) => {
            this.ordenacao = e.target.value;
            this.renderizarTabela();
        });

        // Filtros de período do gráfico
        document.querySelectorAll('.filter-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.periodoDias = Number(e.currentTarget.dataset.dias) || 7;
                this.renderizarGrafico();
            });
        });
    }

    // ===================== PERMISSOES =====================

    podeVer(tela) {
        if (tela === 'usuarios') return this.ehDono;
        return this.ehDono || this.permissoes.includes(tela);
    }

    primeiraTelaPermitida() {
        return TODAS_AS_TELAS.find((t) => this.podeVer(t)) || 'sem-acesso';
    }

    // Esconder do menu e conveniencia, nao seguranca: o firestore.rules e que
    // recusa a leitura e a escrita de quem nao tem a tela liberada.
    aplicarPermissoes() {
        document.querySelectorAll('.nav-item').forEach((item) => {
            item.classList.toggle('oculto', !this.podeVer(item.dataset.page));
        });

        // Secao inteira sem nenhuma tela liberada some junto com o titulo
        document.querySelectorAll('.nav-section').forEach((secao) => {
            const visiveis = secao.querySelectorAll('.nav-item:not(.oculto)').length;
            secao.classList.toggle('oculto', visiveis === 0);
        });

        const email = this.user.email || 'sem e-mail';
        const inicial = email.charAt(0).toUpperCase();
        const definir = (id, valor) => {
            const el = document.getElementById(id);
            if (el) el.textContent = valor;
        };

        definir('user-email', email);
        definir('user-avatar', inicial);
        definir('topbar-email', email);
        definir('topbar-avatar', inicial);
    }

    // ===================== ROTEAMENTO =====================

    mostrarPagina(pagina) {
        // Digitar a pagina no console nao deve abrir o que a pessoa nao pode ver
        if (!this.podeVer(pagina)) {
            pagina = this.primeiraTelaPermitida();
        }

        const conhecida = Object.prototype.hasOwnProperty.call(PAGINAS, pagina);
        this.telaAtual = pagina;
        this.paginaAtual = conhecida ? pagina : 'em-breve';

        document.querySelectorAll('.nav-item').forEach((item) => {
            item.classList.toggle('active', item.dataset.page === pagina);
        });

        document.querySelectorAll('.page').forEach((secao) => {
            secao.classList.toggle('show', secao.dataset.page === this.paginaAtual);
        });

        if (conhecida) {
            document.getElementById('topbar-titulo').textContent = PAGINAS[pagina].titulo;
            document.getElementById('topbar-subtitulo').textContent = PAGINAS[pagina].subtitulo;
        } else {
            const nome = document.querySelector(`.nav-item[data-page="${pagina}"] span`);
            document.getElementById('topbar-titulo').textContent = nome ? nome.textContent : 'Em breve';
            document.getElementById('topbar-subtitulo').textContent = 'Esta seção ainda não foi construída';
        }

        this.renderizarTudo();
    }

    // ===================== SALÁRIO =====================

    // Os valores foram digitados a mão e misturam convenções: além do padrão
    // brasileiro "3.647,60", o banco tem "2,500" (vírgula como milhar),
    // "4,000,00" e "2.198.00". A regra que cobre todos: olhar quantos dígitos
    // sobram depois do ÚLTIMO separador — 1 ou 2 significam decimal, 3 significam
    // separador de milhar.
    static numeroSolto(bruto) {
        if (!/[.,]/.test(bruto)) {
            const simples = Number(bruto);
            return Number.isFinite(simples) ? simples : null;
        }

        const ultimo = Math.max(bruto.lastIndexOf('.'), bruto.lastIndexOf(','));
        const decimais = bruto.length - ultimo - 1;
        const semSeparadores = (t) => t.replace(/[.,]/g, '');

        const normalizado = (decimais === 1 || decimais === 2)
            ? semSeparadores(bruto.slice(0, ultimo)) + '.' + bruto.slice(ultimo + 1)
            : semSeparadores(bruto);

        const n = Number(normalizado);
        return Number.isFinite(n) ? n : null;
    }

    // O campo salário é texto livre ("R$ 3.000,00 - R$ 4.500,00", "5 mil",
    // "A combinar"). Extrai os valores que der; devolve null quando não há número.
    static parseSalario(texto) {
        if (typeof texto !== 'string' || !texto.trim()) return null;

        const valores = [];
        const re = /(\d[\d.,]*\d|\d)\s*(mil\b)?/gi;
        let m;

        while ((m = re.exec(texto)) !== null) {
            const n = VagasManager.numeroSolto(m[1]);
            if (n === null) continue;

            const valor = m[2] ? n * 1000 : n;
            // Descarta ruído do tipo "40h", "12x36", "00000", "13o salário"
            if (valor < 100) continue;
            valores.push(valor);
        }

        if (!valores.length) return null;
        return { min: Math.min(...valores), max: Math.max(...valores) };
    }

    static formatarMoeda(valor) {
        return moedaBRL.format(valor);
    }

    // Estatísticas calculadas só sobre as vagas com salário numérico.
    // O ponto médio da faixa é o que representa melhor uma vaga "R$ 3k - R$ 5k".
    estatisticasSalario() {
        const comSalario = [];

        this.vagas.forEach((vaga) => {
            const faixa = VagasManager.parseSalario(vaga.salario);
            if (faixa) {
                comSalario.push({ vaga, faixa, medio: (faixa.min + faixa.max) / 2 });
            }
        });

        const total = this.vagas.length;
        const base = {
            total,
            quantidade: comSalario.length,
            semSalario: total - comSalario.length,
            cobertura: total ? Math.round((comSalario.length / total) * 100) : 0,
            menor: null,
            maior: null,
            media: null,
            mediana: null,
            ranking: []
        };

        if (!comSalario.length) return base;

        const medios = comSalario.map((c) => c.medio).sort((a, b) => a - b);
        const meio = Math.floor(medios.length / 2);

        base.menor = Math.min(...comSalario.map((c) => c.faixa.min));
        base.maior = Math.max(...comSalario.map((c) => c.faixa.max));
        base.media = medios.reduce((t, v) => t + v, 0) / medios.length;
        base.mediana = medios.length % 2
            ? medios[meio]
            : (medios[meio - 1] + medios[meio]) / 2;
        base.ranking = comSalario
            .slice()
            .sort((a, b) => b.faixa.max - a.faixa.max)
            .slice(0, 5);

        return base;
    }

    // ===================== AGREGAÇÕES =====================

    // Agrupa cidades ignorando acento, caixa e pontuação, para que
    // "São Paulo, SP" e "Sao Paulo/SP" não virem duas linhas.
    static chaveCidade(texto) {
        return texto
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    distribuicaoContratos() {
        const rotulos = ['CLT', 'PJ', 'Estágio', 'Temporário', 'Freelancer'];
        const contagem = new Map(rotulos.map((r) => [r, 0]));
        let outros = 0;

        this.vagas.forEach((vaga) => {
            const tipo = this.formatarContrato(vaga.contrato);
            if (contagem.has(tipo)) {
                contagem.set(tipo, contagem.get(tipo) + 1);
            } else {
                outros++;
            }
        });

        const linhas = rotulos.map((rotulo) => ({ rotulo, count: contagem.get(rotulo) }));
        if (outros) linhas.push({ rotulo: 'Sem tipo definido', count: outros });
        return linhas;
    }

    distribuicaoCidades(limite = 6) {
        const mapa = new Map();

        this.vagas.forEach((vaga) => {
            const original = String(vaga.cidade || vaga.localizacao || '').trim();
            if (!original) return;
            const chave = VagasManager.chaveCidade(original);
            if (!chave) return;
            if (!mapa.has(chave)) mapa.set(chave, { rotulo: original, count: 0 });
            mapa.get(chave).count++;
        });

        return [...mapa.values()].sort((a, b) => b.count - a.count).slice(0, limite);
    }

    topBeneficios(limite = 6) {
        const mapa = new Map();

        this.vagas.forEach((vaga) => {
            if (!Array.isArray(vaga.beneficios)) return;
            vaga.beneficios.forEach((b) => mapa.set(b, (mapa.get(b) || 0) + 1));
        });

        return [...mapa.entries()]
            .map(([rotulo, count]) => ({ rotulo, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limite);
    }

    diasNoAr(vaga) {
        if (!vaga.criadoEm) return null;
        const ms = Date.now() - vaga.criadoEm.toDate().getTime();
        return Math.floor(ms / (1000 * 60 * 60 * 24));
    }

    // Pendências acionáveis: cada uma leva para a lista já filtrada.
    alertas() {
        const semSalario = this.vagas.filter((v) => !VagasManager.parseSalario(v.salario));
        const semDescricao = this.vagas.filter((v) => !String(v.descricao || '').trim());
        const naoPublicadas = this.vagas.filter((v) => v.ativa !== true && v.ativa !== false);
        const despublicadas = this.vagas.filter((v) => v.ativa === false);
        const antigas = this.vagas.filter((v) => {
            const dias = this.diasNoAr(v);
            return this.estaPublicada(v) && dias !== null && dias > DIAS_VAGA_ANTIGA;
        });

        return [
            {
                filtro: 'nao-publicadas',
                nivel: 'critico',
                icone: 'eye-slash',
                count: naoPublicadas.length,
                titulo: 'Nunca publicadas',
                texto: 'Sem o campo de status; o site não exibe essas vagas'
            },
            {
                filtro: 'antigas',
                nivel: 'atencao',
                icone: 'hourglass-half',
                count: antigas.length,
                titulo: `No ar há +${DIAS_VAGA_ANTIGA} dias`,
                texto: 'Vale revisar se ainda estão abertas'
            },
            {
                filtro: 'sem-salario',
                nivel: 'atencao',
                icone: 'money-bill-wave',
                count: semSalario.length,
                titulo: 'Sem salário informado',
                texto: 'Anúncios com faixa salarial recebem mais candidaturas'
            },
            {
                filtro: 'sem-descricao',
                nivel: 'info',
                icone: 'align-left',
                count: semDescricao.length,
                titulo: 'Sem descrição',
                texto: 'O candidato não sabe o que a vaga exige'
            },
            {
                filtro: 'despublicadas',
                nivel: 'info',
                icone: 'archive',
                count: despublicadas.length,
                titulo: 'Despublicadas',
                texto: 'Fora do site, mas ainda guardadas aqui'
            }
        ].filter((a) => a.count > 0);
    }

    // ===================== RENDER: ORQUESTRAÇÃO =====================

    renderizarTudo() {
        document.getElementById('vagas-count').textContent = this.vagas.length;

        if (this.paginaAtual === 'visao-geral') {
            this.renderizarVisaoGeral();
        } else if (this.paginaAtual === 'vagas') {
            this.renderizarPaginaVagas();
        } else if (this.paginaAtual === 'usuarios') {
            this.renderizarUsuarios();
        }
    }

    estadoDeCarga() {
        if (this.erroCarga) {
            return `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fas fa-triangle-exclamation"></i></div>
                    <h3 class="empty-title">Não foi possível carregar as vagas</h3>
                    <p class="empty-text">${this.escapar(this.erroCarga)}</p>
                </div>
            `;
        }
        if (!this.carregado) {
            return `
                <div class="loading">
                    <div class="spinner"></div>
                    Carregando vagas...
                </div>
            `;
        }
        return null;
    }

    cardKpi({ icone, cor, valor, rotulo, hint, trend }) {
        return `
            <div class="metric-card">
                <div class="metric-header">
                    <div class="metric-icon ${cor}"><i class="fas fa-${icone}"></i></div>
                    ${trend || ''}
                </div>
                <div class="metric-value">${valor}</div>
                <div class="metric-label">${rotulo}</div>
                ${hint ? `<div class="metric-hint">${hint}</div>` : ''}
            </div>
        `;
    }

    // ===================== RENDER: VISÃO GERAL =====================

    renderizarVisaoGeral() {
        const carga = this.estadoDeCarga();
        const kpis = document.getElementById('vg-kpis');

        if (carga) {
            kpis.innerHTML = '';
            document.getElementById('vg-alertas').innerHTML = carga;
            document.getElementById('vg-contratos').innerHTML = '';
            document.getElementById('vg-cidades').innerHTML = '';
            document.getElementById('vg-beneficios').innerHTML = '';
            document.getElementById('vg-recentes').innerHTML = '';
            document.getElementById('vagas-periodo-chart').innerHTML = '';
            return;
        }

        const publicadas = this.vagas.filter((v) => this.estaPublicada(v)).length;
        const salarios = this.estatisticasSalario();
        const esteMes = this.criadasNoMes(0);
        const mesPassado = this.criadasNoMes(-1);

        kpis.innerHTML = [
            this.cardKpi({
                icone: 'briefcase',
                cor: 'purple',
                valor: this.vagas.length,
                rotulo: 'Total de Vagas',
                hint: `${this.vagas.length - publicadas} fora do site`
            }),
            this.cardKpi({
                icone: 'globe',
                cor: 'pink',
                valor: publicadas,
                rotulo: 'Publicadas no Site',
                hint: this.vagas.length
                    ? `${Math.round((publicadas / this.vagas.length) * 100)}% do total`
                    : ''
            }),
            this.cardKpi({
                icone: 'calendar-alt',
                cor: 'yellow',
                valor: esteMes,
                rotulo: 'Criadas Este Mês',
                trend: this.htmlTrend(esteMes, mesPassado),
                hint: `${mesPassado} no mês anterior`
            }),
            this.cardKpi({
                icone: 'money-bill-wave',
                cor: 'blue',
                valor: salarios.media ? VagasManager.formatarMoeda(salarios.media) : '—',
                rotulo: 'Salário Médio',
                hint: salarios.quantidade
                    ? `Base: ${salarios.quantidade} de ${salarios.total} vagas`
                    : 'Nenhuma vaga com valor informado'
            })
        ].join('');

        this.renderizarAlertas();
        this.renderizarGrafico();
        this.renderizarDistribuicao('vg-contratos', this.distribuicaoContratos(), this.vagas.length);
        this.renderizarCidades();
        this.renderizarBeneficios();
        this.renderizarRecentes();
    }

    criadasNoMes(offset) {
        const ref = new Date();
        const alvo = new Date(ref.getFullYear(), ref.getMonth() + offset, 1);

        return this.vagas.filter((v) => {
            if (!v.criadoEm) return false;
            const d = v.criadoEm.toDate();
            return d.getMonth() === alvo.getMonth() && d.getFullYear() === alvo.getFullYear();
        }).length;
    }

    // Sem base de comparação não há variação honesta a mostrar.
    htmlTrend(atual, anterior) {
        if (!anterior) return '';
        const variacao = Math.round(((atual - anterior) / anterior) * 100);
        const subiu = variacao >= 0;
        return `
            <div class="metric-trend ${subiu ? 'up' : 'down'}" title="${atual} este mês vs ${anterior} no mês anterior">
                <i class="fas fa-arrow-${subiu ? 'up' : 'down'}"></i> ${Math.abs(variacao)}%
            </div>
        `;
    }

    renderizarAlertas() {
        const container = document.getElementById('vg-alertas');
        const alertas = this.alertas();

        if (!alertas.length) {
            container.innerHTML = `
                <div class="alert-card ok">
                    <div class="alert-icon"><i class="fas fa-circle-check"></i></div>
                    <div class="alert-body">
                        <strong>Tudo em ordem</strong>
                        <span>Nenhuma pendência nas vagas cadastradas</span>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = alertas.map((a) => `
            <button class="alert-card ${a.nivel}" data-filtro="${a.filtro}">
                <div class="alert-icon"><i class="fas fa-${a.icone}"></i></div>
                <div class="alert-body">
                    <strong>${a.count} ${this.escapar(a.titulo)}</strong>
                    <span>${this.escapar(a.texto)}</span>
                </div>
                <i class="fas fa-chevron-right alert-seta"></i>
            </button>
        `).join('');

        container.querySelectorAll('.alert-card[data-filtro]').forEach((card) => {
            card.addEventListener('click', () => {
                this.filtro = card.dataset.filtro;
                this.termoBusca = '';
                document.getElementById('search-input').value = '';
                document.getElementById('filtro-status').value = this.filtro;
                this.mostrarPagina('vagas');
            });
        });
    }

    renderizarCidades() {
        const container = document.getElementById('vg-cidades');
        const cidades = this.distribuicaoCidades();

        if (!cidades.length) {
            container.innerHTML = '<p class="card-vazio">Nenhuma cidade informada nas vagas.</p>';
            return;
        }

        const maior = cidades[0].count;
        container.innerHTML = cidades.map((c) => `
            <div class="distribution-item">
                <div class="distribution-header">
                    <span class="distribution-label">${this.escapar(c.rotulo)}</span>
                    <span class="distribution-value">${c.count}</span>
                </div>
                <div class="distribution-bar">
                    <div class="distribution-fill" style="width: ${(c.count / maior) * 100}%"></div>
                </div>
            </div>
        `).join('');
    }

    renderizarBeneficios() {
        const container = document.getElementById('vg-beneficios');
        const beneficios = this.topBeneficios();

        if (!beneficios.length) {
            container.innerHTML = '<p class="card-vazio">Nenhum benefício marcado nas vagas.</p>';
            return;
        }

        const total = this.vagas.length || 1;
        container.innerHTML = beneficios.map((b) => `
            <div class="beneficio-linha">
                <span class="beneficio-nome">${this.escapar(b.rotulo)}</span>
                <span class="beneficio-barra">
                    <span style="width: ${(b.count / total) * 100}%"></span>
                </span>
                <span class="beneficio-count">${b.count}</span>
            </div>
        `).join('');
    }

    renderizarRecentes() {
        const container = document.getElementById('vg-recentes');
        const recentes = this.vagas.slice(0, 5);

        if (!recentes.length) {
            container.innerHTML = '<p class="card-vazio">Nenhuma vaga cadastrada ainda.</p>';
            return;
        }

        container.innerHTML = recentes.map((v) => {
            const dias = this.diasNoAr(v);
            return `
                <div class="recente-item">
                    <div class="recente-info">
                        <strong>${this.escapar(v.titulo || 'Sem título')}</strong>
                        <span>${this.escapar(v.cidade || v.localizacao || 'Cidade não informada')} &middot; ${this.escapar(this.formatarContrato(v.contrato) || 'Sem tipo')}</span>
                    </div>
                    <div class="recente-meta">
                        ${this.badgeStatus(v)}
                        <span class="recente-data">${dias === null ? 'sem data' : dias === 0 ? 'hoje' : `há ${dias}d`}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ===================== RENDER: PÁGINA DE VAGAS =====================

    renderizarPaginaVagas() {
        const carga = this.estadoDeCarga();
        const kpis = document.getElementById('vagas-kpis');

        if (carga) {
            kpis.innerHTML = '';
            document.getElementById('vagas-table-container').innerHTML = carga;
            document.getElementById('vagas-ranking').innerHTML = '';
            document.getElementById('vagas-contratos').innerHTML = '';
            return;
        }

        const publicadas = this.vagas.filter((v) => this.estaPublicada(v)).length;
        const s = this.estatisticasSalario();

        kpis.innerHTML = [
            this.cardKpi({
                icone: 'briefcase',
                cor: 'purple',
                valor: this.vagas.length,
                rotulo: 'Total de Vagas',
                hint: `${publicadas} no ar &middot; ${this.vagas.length - publicadas} fora`
            }),
            this.cardKpi({
                icone: 'arrow-trend-up',
                cor: 'pink',
                valor: s.maior ? VagasManager.formatarMoeda(s.maior) : '—',
                rotulo: 'Maior Salário',
                hint: s.ranking.length ? this.escapar(s.ranking[0].vaga.titulo || '') : ''
            }),
            this.cardKpi({
                icone: 'scale-balanced',
                cor: 'blue',
                valor: s.mediana ? VagasManager.formatarMoeda(s.mediana) : '—',
                rotulo: 'Salário Mediano',
                hint: s.menor ? `Menor: ${VagasManager.formatarMoeda(s.menor)}` : ''
            }),
            this.cardKpi({
                icone: 'circle-info',
                cor: 'yellow',
                valor: `${s.cobertura}%`,
                rotulo: 'Com Salário Informado',
                hint: `${s.semSalario} vaga(s) sem valor`
            })
        ].join('');

        this.renderizarRanking(s);
        this.renderizarDistribuicao('vagas-contratos', this.distribuicaoContratos(), this.vagas.length);
        this.renderizarTabela();
    }

    renderizarRanking(stats) {
        const container = document.getElementById('vagas-ranking');

        if (!stats.ranking.length) {
            container.innerHTML = '<p class="card-vazio">Nenhuma vaga com salário numérico informado.</p>';
            return;
        }

        const teto = stats.ranking[0].faixa.max;
        container.innerHTML = stats.ranking.map((item, i) => {
            const faixa = item.faixa;
            const valor = faixa.min === faixa.max
                ? VagasManager.formatarMoeda(faixa.max)
                : `${VagasManager.formatarMoeda(faixa.min)} – ${VagasManager.formatarMoeda(faixa.max)}`;
            return `
                <div class="ranking-item">
                    <span class="ranking-pos">${i + 1}</span>
                    <div class="ranking-corpo">
                        <div class="ranking-topo">
                            <span class="ranking-titulo">${this.escapar(item.vaga.titulo || 'Sem título')}</span>
                            <span class="ranking-valor">${valor}</span>
                        </div>
                        <div class="distribution-bar">
                            <div class="distribution-fill" style="width: ${(faixa.max / teto) * 100}%"></div>
                        </div>
                        <span class="ranking-sub">${this.escapar(item.vaga.cidade || item.vaga.localizacao || 'Cidade não informada')} &middot; ${this.escapar(this.formatarContrato(item.vaga.contrato) || 'Sem tipo')}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderizarDistribuicao(containerId, linhas, total) {
        const container = document.getElementById(containerId);
        const base = total || 1;

        // Escala sequencial do dourado da marca (do bronze ao dourado claro)
        const cores = [
            'linear-gradient(135deg, #5F4A2A 0%, #7A5F37 100%)',
            'linear-gradient(135deg, #7A5F37 0%, #96784A 100%)',
            'linear-gradient(135deg, #96784A 0%, #A78652 100%)',
            'linear-gradient(135deg, #A78652 0%, #C29A5E 100%)',
            'linear-gradient(135deg, #C29A5E 0%, #D7B071 100%)',
            'linear-gradient(135deg, #D7B071 0%, #E3C48F 100%)'
        ];

        container.innerHTML = linhas.map((linha, i) => {
            const pct = Math.round((linha.count / base) * 100);
            return `
                <div class="distribution-item">
                    <div class="distribution-header">
                        <span class="distribution-label">${this.escapar(linha.rotulo)}</span>
                        <span class="distribution-value">${linha.count} (${pct}%)</span>
                    </div>
                    <div class="distribution-bar">
                        <div class="distribution-fill" style="width: ${pct}%; background: ${cores[i % cores.length]}"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ===================== GRÁFICO =====================

    renderizarGrafico() {
        const chartContainer = document.getElementById('vagas-periodo-chart');
        if (!chartContainer) return;

        const dados = this.dadosDoPeriodo(this.periodoDias);
        const maxValue = Math.max(...dados.map((d) => d.count), 1);

        chartContainer.innerHTML = dados.map((d) => {
            const altura = (d.count / maxValue) * 100;
            return `
                <div class="bar-item" title="${d.count} vaga(s) em ${d.dia}">
                    <div class="bar-value">${d.count}</div>
                    <div class="bar-track">
                        <div class="bar${d.count ? '' : ' vazia'}" style="height: ${altura}%"></div>
                    </div>
                    <div class="bar-label">${d.dia}</div>
                </div>
            `;
        }).join('');
    }

    // Agrupa as vagas do período: por dia em 7 dias, por blocos de 5 em 30, por mês em 90
    dadosDoPeriodo(dias) {
        const criadas = this.vagas.filter((v) => v.criadoEm).map((v) => v.criadoEm.toDate());
        const contarEntre = (inicio, fim) => criadas.filter((d) => d >= inicio && d < fim).length;

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
                fim.setDate(fim.getDate() - i * tamanhoBucket + 1);
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

    // ===================== TABELA =====================

    // Espelha a consulta do site público: where('ativa', '==', true).
    // Documento sem o campo não está publicado, logo não pode aparecer como "Ativa".
    estaPublicada(vaga) {
        return vaga.ativa === true;
    }

    vagasVisiveis() {
        let lista = this.vagas.slice();

        switch (this.filtro) {
            case 'publicadas':
                lista = lista.filter((v) => this.estaPublicada(v));
                break;
            case 'despublicadas':
                lista = lista.filter((v) => v.ativa === false);
                break;
            case 'nao-publicadas':
                lista = lista.filter((v) => v.ativa !== true && v.ativa !== false);
                break;
            case 'sem-salario':
                lista = lista.filter((v) => !VagasManager.parseSalario(v.salario));
                break;
            case 'sem-descricao':
                lista = lista.filter((v) => !String(v.descricao || '').trim());
                break;
            case 'antigas':
                lista = lista.filter((v) => {
                    const dias = this.diasNoAr(v);
                    return this.estaPublicada(v) && dias !== null && dias > DIAS_VAGA_ANTIGA;
                });
                break;
        }

        if (this.termoBusca) {
            const termo = this.termoBusca.toLowerCase();
            const contem = (valor) =>
                typeof valor === 'string' && valor.toLowerCase().includes(termo);

            lista = lista.filter((vaga) =>
                contem(vaga.titulo) ||
                contem(vaga.empresa) ||
                contem(vaga.cidade) ||
                contem(vaga.localizacao) ||
                contem(vaga.salario) ||
                contem(vaga.contrato) ||
                contem(this.formatarContrato(vaga.contrato))
            );
        }

        const salarioDe = (v) => {
            const faixa = VagasManager.parseSalario(v.salario);
            return faixa ? faixa.max : null;
        };
        const data = (v) => (v.criadoEm ? v.criadoEm.toDate().getTime() : 0);

        switch (this.ordenacao) {
            case 'antigas':
                lista.sort((a, b) => data(a) - data(b));
                break;
            case 'maior-salario':
                // Vagas sem valor vão para o fim, nas duas direções
                lista.sort((a, b) => (salarioDe(b) ?? -Infinity) - (salarioDe(a) ?? -Infinity));
                break;
            case 'menor-salario':
                lista.sort((a, b) => (salarioDe(a) ?? Infinity) - (salarioDe(b) ?? Infinity));
                break;
            case 'titulo':
                lista.sort((a, b) =>
                    String(a.titulo || '').localeCompare(String(b.titulo || ''), 'pt-BR'));
                break;
            default:
                lista.sort((a, b) => data(b) - data(a));
        }

        return lista;
    }

    badgeStatus(vaga) {
        if (vaga.ativa === true) {
            return '<span class="status-badge active">Publicada</span>';
        }
        if (vaga.ativa === false) {
            return '<span class="status-badge inactive">Despublicada</span>';
        }
        // Campo ausente: o site público já não mostra esta vaga
        return '<span class="status-badge pending" title="Sem o campo ativa; o site público não exibe esta vaga">Nunca publicada</span>';
    }

    renderizarTabela() {
        const container = document.getElementById('vagas-table-container');
        const vagas = this.vagasVisiveis();

        document.getElementById('vagas-resultado').textContent =
            `${vagas.length} de ${this.vagas.length} vaga(s)`;

        if (vagas.length === 0) {
            const filtrando = this.termoBusca || this.filtro !== 'todos';
            container.innerHTML = filtrando
                ? `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fas fa-filter"></i></div>
                    <h3 class="empty-title">Nenhuma vaga com esses filtros</h3>
                    <p class="empty-text">Ajuste a busca ou volte para "Todas as vagas"</p>
                    <button class="btn-secondary" id="btn-limpar-filtros">Limpar filtros</button>
                </div>
            `
                : `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fas fa-briefcase"></i></div>
                    <h3 class="empty-title">Nenhuma vaga encontrada</h3>
                    <p class="empty-text">Comece criando sua primeira vaga de emprego</p>
                    <button class="btn-primary" onclick="document.getElementById('btn-nova-vaga').click()">
                        <i class="fas fa-plus"></i>
                        Nova Vaga
                    </button>
                </div>
            `;

            const btnLimpar = document.getElementById('btn-limpar-filtros');
            if (btnLimpar) {
                btnLimpar.addEventListener('click', () => {
                    this.filtro = 'todos';
                    this.termoBusca = '';
                    document.getElementById('filtro-status').value = 'todos';
                    document.getElementById('search-input').value = '';
                    this.renderizarPaginaVagas();
                });
            }
            return;
        }

        container.innerHTML = `
            <div class="table-scroll">
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
                    ${vagas.map((vaga) => this.linhaTabela(vaga)).join('')}
                </tbody>
            </table>
            </div>
        `;

        container.querySelectorAll('.btn-edit').forEach((btn) => {
            btn.addEventListener('click', (e) => this.editarVaga(e.currentTarget.dataset.id));
        });

        container.querySelectorAll('.btn-delete').forEach((btn) => {
            btn.addEventListener('click', (e) => this.excluirVaga(e.currentTarget.dataset.id));
        });

        container.querySelectorAll('.btn-toggle').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const publicada = e.currentTarget.dataset.ativa === 'true';
                this.alternarStatus(e.currentTarget.dataset.id, !publicada);
            });
        });
    }

    linhaTabela(vaga) {
        const publicada = this.estaPublicada(vaga);
        const acao = publicada ? 'Despublicar vaga' : 'Publicar vaga no site';
        const faixa = VagasManager.parseSalario(vaga.salario);
        const salario = vaga.salario
            ? this.escapar(vaga.salario)
            : '<span class="celula-vazia">A combinar</span>';

        return `
            <tr>
                <td><strong>${this.escapar(vaga.titulo || 'Sem título')}</strong></td>
                <td>${this.escapar(vaga.cidade || vaga.localizacao || '—')}</td>
                <td${faixa ? ` data-valor="${faixa.max}"` : ''}>${salario}</td>
                <td>${this.escapar(this.formatarContrato(vaga.contrato) || '—')}</td>
                <td>${this.badgeStatus(vaga)}</td>
                <td>${this.formatarData(vaga.criadoEm)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-toggle" data-id="${vaga.id}" data-ativa="${publicada}" title="${acao}" aria-label="${acao}">
                            <i class="fas fa-${publicada ? 'eye-slash' : 'eye'}"></i>
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
        `;
    }

    // ===================== USUÁRIOS =====================

    escutarAdmins() {
        db.collection('admins').onSnapshot(
            (snapshot) => {
                this.admins = [];
                snapshot.forEach((doc) => this.admins.push({ uid: doc.id, ...doc.data() }));
                this.admins.sort((a, b) =>
                    String(a.nome || a.email || '').localeCompare(String(b.nome || b.email || ''), 'pt-BR'));
                if (this.paginaAtual === 'usuarios') this.renderizarUsuarios();
            },
            (erro) => {
                console.error('Erro ao carregar administradores:', erro);
                this.erroAdmins = erro.message;
                if (this.paginaAtual === 'usuarios') this.renderizarUsuarios();
            }
        );
    }

    renderizarUsuarios() {
        const container = document.getElementById('lista-usuarios');
        if (!container) return;

        if (this.erroAdmins) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fas fa-triangle-exclamation"></i></div>
                    <h3 class="empty-title">Não foi possível carregar a lista</h3>
                    <p class="empty-text">${this.escapar(this.erroAdmins)}</p>
                </div>
            `;
            return;
        }

        // O dono nao vive na colecao /admins — o acesso dele vem do e-mail,
        // entao ele aparece como uma linha fixa que nao pode ser removida.
        const linhaDono = `
            <div class="usuario-item">
                <div class="user-avatar">${this.escapar((this.user.email || '?').charAt(0).toUpperCase())}</div>
                <div class="usuario-info">
                    <strong>${this.escapar(this.user.email)}</strong>
                    <span>Dono do painel &middot; acesso permanente</span>
                </div>
                <span class="status-badge active">Você</span>
            </div>
        `;

        const linhas = this.admins.map((a) => {
            const telas = Array.isArray(a.permissoes) ? a.permissoes : [];
            const nomes = telas.length
                ? telas.map((t) => this.rotuloTela(t)).join(', ')
                : 'nenhuma tela liberada';
            return `
            <div class="usuario-bloco">
                <div class="usuario-item">
                    <div class="user-avatar">${this.escapar(String(a.nome || a.usuario || '?').charAt(0).toUpperCase())}</div>
                    <div class="usuario-info">
                        <strong>${this.escapar(a.nome || a.usuario)}</strong>
                        <span>entra como <code>${this.escapar(a.usuario || a.email)}</code>${a.email ? ' &middot; ' + this.escapar(a.email) : ' &middot; sem e-mail'}${a.criadoEm ? ' &middot; desde ' + this.formatarData(a.criadoEm) : ''}</span>
                        <span class="usuario-telas">${this.escapar(nomes)}</span>
                    </div>
                    <button class="btn-action btn-edit btn-telas" data-uid="${this.escapar(a.uid)}" title="Alterar telas" aria-label="Alterar telas">
                        <i class="fas fa-sliders"></i>
                    </button>
                    <button class="btn-action btn-delete" data-uid="${this.escapar(a.uid)}" data-nome="${this.escapar(a.nome || a.usuario)}" title="Remover acesso" aria-label="Remover acesso">
                        <i class="fas fa-user-minus"></i>
                    </button>
                </div>
                <div class="usuario-editor" id="editor-${this.escapar(a.uid)}" hidden>
                    ${this.htmlTelas('edit-' + a.uid, telas)}
                    <button class="btn-primary btn-salvar-telas" data-uid="${this.escapar(a.uid)}">
                        <i class="fas fa-save"></i> Salvar telas
                    </button>
                </div>
            </div>
            `;
        }).join('');

        container.innerHTML = linhaDono + linhas;

        container.querySelectorAll('.btn-delete').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const { uid, nome } = e.currentTarget.dataset;
                this.removerUsuario(uid, nome);
            });
        });

        container.querySelectorAll('.btn-telas').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const editor = document.getElementById('editor-' + e.currentTarget.dataset.uid);
                if (editor) editor.hidden = !editor.hidden;
            });
        });

        container.querySelectorAll('.btn-salvar-telas').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                this.salvarTelas(e.currentTarget.dataset.uid);
            });
        });
    }

    rotuloTela(chave) {
        for (const secao of SECOES_TELAS) {
            const tela = secao.telas.find((t) => t.chave === chave);
            if (tela) return tela.rotulo;
        }
        return chave;
    }

    // Checkboxes de telas, agrupados como no menu lateral
    htmlTelas(prefixo, marcadas) {
        return `
            <div class="telas-grid">
                ${SECOES_TELAS.map((secao) => `
                    <div class="telas-secao">
                        <div class="telas-secao-titulo">${this.escapar(secao.secao)}</div>
                        ${secao.telas.map((t) => `
                            <div class="benefit-item">
                                <input type="checkbox" class="benefit-checkbox tela-checkbox"
                                       id="${prefixo}-${t.chave}" value="${t.chave}"
                                       ${marcadas.includes(t.chave) ? 'checked' : ''}>
                                <label class="benefit-label" for="${prefixo}-${t.chave}">${this.escapar(t.rotulo)}</label>
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
        `;
    }

    telasMarcadas(escopo) {
        return [...escopo.querySelectorAll('.tela-checkbox:checked')].map((cb) => cb.value);
    }

    async salvarTelas(uid) {
        const editor = document.getElementById('editor-' + uid);
        if (!editor) return;

        const permissoes = this.telasMarcadas(editor);

        try {
            await db.collection('admins').doc(uid).update({ permissoes });
            editor.hidden = true;
            this.mostrarNotificacao('Telas atualizadas.', 'success');
        } catch (error) {
            console.error('Erro ao salvar telas:', error);
            this.mostrarNotificacao('Erro ao salvar telas: ' + error.message, 'error');
        }
    }

    async criarUsuario() {
        const nome = document.getElementById('usuario-nome').value.trim();
        const usuario = gerarUsuario(document.getElementById('usuario-login').value || nome);
        const email = document.getElementById('usuario-email').value.trim().toLowerCase();
        const senha = document.getElementById('usuario-senha').value;
        const permissoes = this.telasMarcadas(document.getElementById('form-usuario'));

        if (!nome || senha.length < 6) {
            this.mostrarNotificacao('Preencha o nome e uma senha de pelo menos 6 caracteres.', 'error');
            return;
        }

        if (!usuario) {
            this.mostrarNotificacao('O nome precisa ter ao menos uma letra ou número para virar um login.', 'error');
            return;
        }

        if (email === EMAIL_DONO) {
            this.mostrarNotificacao('Este e-mail já é o dono do painel.', 'error');
            return;
        }

        // Sem e-mail informado, a conta do Auth usa um endereco interno.
        const emailLogin = email || `${usuario}@${DOMINIO_INTERNO}`;

        if (!permissoes.length) {
            this.mostrarNotificacao('Marque pelo menos uma tela, senão a pessoa entra e não vê nada.', 'error');
            return;
        }

        const btn = document.getElementById('btn-criar-usuario');
        const original = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando...';

        // createUserWithEmailAndPassword troca a sessao para o usuario recem-criado.
        // Criar em uma instancia secundaria do Firebase evita derrubar o login do dono.
        const appSecundario = firebase.initializeApp(firebaseConfig, 'criar-usuario-' + Date.now());

        try {
            const jaExiste = await db.collection('logins').doc(usuario).get();
            if (jaExiste.exists) {
                throw { code: 'login-em-uso' };
            }

            const cred = await appSecundario.auth().createUserWithEmailAndPassword(emailLogin, senha);

            await db.collection('admins').doc(cred.user.uid).set({
                nome,
                usuario,
                email,            // e-mail de contato; vazio quando nao informado
                emailLogin,       // o que o Firebase Auth realmente usa
                permissoes,
                criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
                criadoPor: this.user.email
            });

            // Mapa nome -> e-mail do Auth, lido pela tela de login antes de autenticar
            await db.collection('logins').doc(usuario).set({
                email: emailLogin,
                uid: cred.user.uid
            });

            await appSecundario.auth().signOut();
            document.getElementById('form-usuario').reset();
            this.mostrarNotificacao(`Acesso criado. ${nome} entra com o usuário "${usuario}".`, 'success');
        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            this.mostrarNotificacao(this.mensagemErroAuth(error), 'error');
        } finally {
            await appSecundario.delete().catch(() => {});
            btn.disabled = false;
            btn.innerHTML = original;
        }
    }

    mensagemErroAuth(error) {
        switch (error.code) {
            case 'login-em-uso':
                return 'Já existe alguém com esse nome de usuário. Ajuste o campo "Usuário".';
            case 'auth/email-already-in-use':
                return 'Já existe uma conta com esse e-mail. Se a pessoa deveria ter acesso, peça o UID dela no Console do Firebase.';
            case 'auth/invalid-email':
                return 'E-mail inválido.';
            case 'auth/weak-password':
                return 'Senha fraca: use pelo menos 6 caracteres.';
            case 'auth/operation-not-allowed':
                return 'Login por e-mail/senha está desativado no Console do Firebase.';
            case 'permission-denied':
                return 'Sem permissão para gerenciar usuários. Confira as regras do Firestore.';
            default:
                return 'Erro ao criar acesso: ' + (error.message || error.code);
        }
    }

    async removerUsuario(uid, nome) {
        if (!confirm(`Remover o acesso de ${nome}?\n\nA pessoa perde o painel imediatamente. A conta de login continua existindo no Firebase Authentication.`)) {
            return;
        }

        try {
            const admin = this.admins.find((a) => a.uid === uid);
            await db.collection('admins').doc(uid).delete();
            if (admin && admin.usuario) {
                await db.collection('logins').doc(admin.usuario).delete();
            }
            this.mostrarNotificacao(`${nome} não tem mais acesso ao painel.`, 'success');
        } catch (error) {
            console.error('Erro ao remover usuário:', error);
            this.mostrarNotificacao('Erro ao remover acesso: ' + error.message, 'error');
        }
    }

    // ===================== UTILITÁRIOS =====================

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
            clt: 'CLT',
            pj: 'PJ',
            estagio: 'Estágio',
            temporario: 'Temporário',
            freelancer: 'Freelancer'
        };
        return contratos[contrato] || contrato || '';
    }

    formatarData(timestamp) {
        if (!timestamp) return '<span class="celula-vazia">—</span>';
        return timestamp.toDate().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    // ===================== FIRESTORE =====================

    async salvarNoFirestore(vaga, isUpdate = false) {
        const campos = {
            titulo: vaga.titulo,
            empresa: vaga.empresa,
            cidade: vaga.cidade,
            salario: vaga.salario,
            contrato: vaga.contrato,
            horario: vaga.horario,
            beneficios: vaga.beneficios,
            descricao: vaga.descricao,
            atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (isUpdate) {
            // 'ativa' fica de fora de propósito: editar uma vaga não deve
            // republicá-la. O status só muda pelo botão de publicar.
            await this.vagasCollection.doc(vaga.id).update(campos);
        } else {
            await this.vagasCollection.add({
                ...campos,
                ativa: true,
                criadoEm: firebase.firestore.FieldValue.serverTimestamp()
            });
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

    salvarVaga() {
        const valor = (id) => document.getElementById(id).value.trim();

        const titulo = valor('vaga-titulo');
        const cidade = valor('vaga-cidade');
        const contrato = document.getElementById('vaga-contrato').value;

        if (!titulo || !cidade || !contrato) {
            this.mostrarNotificacao('Preencha os campos obrigatórios: título, cidade e tipo de contrato.', 'error');
            return;
        }

        const beneficios = [];
        document.querySelectorAll('#form-vaga .benefit-checkbox:checked').forEach((cb) => beneficios.push(cb.value));

        const vaga = {
            titulo,
            empresa: valor('vaga-empresa'),
            cidade,
            salario: valor('vaga-salario'),
            contrato,
            horario: valor('vaga-horario'),
            beneficios,
            descricao: valor('vaga-descricao')
        };

        const btnSalvar = document.getElementById('btn-salvar');
        const conteudoOriginal = btnSalvar.innerHTML;
        const editando = Boolean(this.vagaEditandoId);

        btnSalvar.disabled = true;
        btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

        if (editando) vaga.id = this.vagaEditandoId;

        this.salvarNoFirestore(vaga, editando)
            .then(() => {
                this.fecharModal();
                this.mostrarNotificacao(
                    editando ? 'Vaga atualizada com sucesso!' : 'Vaga cadastrada e publicada no site!',
                    'success'
                );
            })
            .catch((error) => {
                console.error('Erro ao salvar vaga:', error);
                this.mostrarNotificacao('Erro ao salvar vaga: ' + error.message, 'error');
            })
            .finally(() => {
                btnSalvar.disabled = false;
                btnSalvar.innerHTML = conteudoOriginal;
            });
    }

    excluirVaga(id) {
        const vaga = this.vagas.find((v) => v.id === id);
        const nome = vaga && vaga.titulo ? `"${vaga.titulo}"` : 'esta vaga';

        if (!confirm(`Tem certeza que deseja excluir ${nome}? Esta ação não pode ser desfeita.\n\nSe a intenção é só tirar do site, use o botão de despublicar.`)) {
            return;
        }

        this.vagasCollection.doc(id).delete()
            .then(() => this.mostrarNotificacao('Vaga excluída com sucesso!', 'success'))
            .catch((error) => {
                console.error('Erro ao excluir vaga:', error);
                this.mostrarNotificacao('Erro ao excluir vaga: ' + error.message, 'error');
            });
    }

    // ===================== MODAL =====================

    abrirModalNova() {
        this.vagaEditandoId = null;
        document.getElementById('modal-titulo').textContent = 'Nova Vaga';
        this.limparFormulario();
        document.getElementById('modal-vaga').classList.add('show');
        document.getElementById('vaga-titulo').focus();
    }

    limparFormulario() {
        document.getElementById('form-vaga').reset();
        document.getElementById('vaga-id').value = '';
        document.querySelectorAll('#form-vaga .benefit-checkbox').forEach((cb) => {
            cb.checked = false;
        });
    }

    editarVaga(id) {
        const vaga = this.vagas.find((v) => v.id === id);
        if (!vaga) return;

        document.getElementById('modal-titulo').textContent = 'Editar Vaga';
        this.limparFormulario();

        document.getElementById('vaga-id').value = vaga.id;
        document.getElementById('vaga-titulo').value = vaga.titulo || '';
        document.getElementById('vaga-empresa').value = vaga.empresa || '';
        document.getElementById('vaga-cidade').value = vaga.cidade || vaga.localizacao || '';
        document.getElementById('vaga-salario').value = vaga.salario || '';
        document.getElementById('vaga-contrato').value = vaga.contrato || '';
        document.getElementById('vaga-horario').value = vaga.horario || '';
        document.getElementById('vaga-descricao').value = vaga.descricao || '';

        if (Array.isArray(vaga.beneficios)) {
            document.querySelectorAll('#form-vaga .benefit-checkbox').forEach((cb) => {
                cb.checked = vaga.beneficios.includes(cb.value);
            });
        }

        this.vagaEditandoId = vaga.id;
        document.getElementById('modal-vaga').classList.add('show');
    }

    fecharModal() {
        document.getElementById('modal-vaga').classList.remove('show');
        this.limparFormulario();
        this.vagaEditandoId = null;
    }

    // ===================== NOTIFICAÇÕES =====================

    mostrarNotificacao(mensagem, tipo = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) {
            console.log(mensagem);
            return;
        }

        const toast = document.createElement('div');
        toast.className = `toast ${tipo}`;
        toast.innerHTML = `
            <i class="fas fa-${tipo === 'success' ? 'circle-check' : 'circle-exclamation'}"></i>
            <span>${this.escapar(mensagem)}</span>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('saindo');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
}

// ===================== BOOTSTRAP =====================

let vagasManager;

// O painel so sobe depois de saber QUEM entrou. Antes disso nao se consulta o
// Firestore: com as regras publicadas, uma leitura anonima seria recusada.
async function iniciarPainel(user) {
    const email = (user.email || '').toLowerCase();
    const ehDono = email === EMAIL_DONO;
    let autorizado = ehDono;
    let permissoes = [];

    if (!autorizado) {
        try {
            const doc = await db.collection('admins').doc(user.uid).get();
            if (doc.exists) {
                autorizado = true;
                permissoes = doc.data().permissoes || [];
            }
        } catch (erro) {
            console.error('Erro ao verificar permissão:', erro);
            autorizado = false;
        }
    }

    // Conta cadastrada mas sem nenhuma tela liberada nao tem o que fazer aqui
    if (!autorizado || (!ehDono && permissoes.length === 0)) {
        await auth.signOut().catch(() => {});
        window.location.href = './?erro=sem-acesso';
        return;
    }

    vagasManager = new VagasManager(user, ehDono, permissoes);
}

document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = './';
            return;
        }
        if (!vagasManager) iniciarPainel(user);
    });
});
