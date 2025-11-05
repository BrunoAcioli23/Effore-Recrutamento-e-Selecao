// Dentro do arquivo blog.js

document.addEventListener("DOMContentLoaded", function() {
    
    const API_ENDPOINT = "https://api.rss2json.com/v1/api.json";
    const container = document.getElementById("news-container");
    
    // -------------------------------------------------------------------
    // MUDANÇA PRINCIPAL: Lista de Feeds Focados em temas Corporativos
    // -------------------------------------------------------------------
    const FEED_URLS = [
        "http://g1.globo.com/dynamo/concursos-e-emprego/rss2.xml", // G1 Carreira (Foco em RH/Emprego)
        "http://g1.globo.com/dynamo/economia/rss2.xml", // G1 Economia (Mundo Corporativo)
        "https://rss.estadao.com.br/feed/geral,economia.xml", // Estadão Economia (Mercado)
        "https://www.cnnbrasil.com.br/economia/feed/" // CNN Brasil Economia
    ];
    
    // Placeholder de carregamento atualizado
    container.innerHTML = "<p class='loading-news'>Buscando notícias do mundo corporativo...</p>";

    // Para evitar cache do rss2json
    const cacheBuster = `&_=${new Date().getTime()}`;

    // 2. Busca notícias de TODOS os feeds em paralelo
    const fetchPromises = FEED_URLS.map(feedUrl => {
        const fetchUrl = `${API_ENDPOINT}?rss_url=${encodeURIComponent(feedUrl)}${cacheBuster}`;
        return fetch(fetchUrl)
            .then(res => res.json())
            .catch(err => {
                console.warn("Feed falhou:", feedUrl, err);
                return null; 
            });
    });

    // 3. Quando TODAS as buscas terminarem...
    Promise.all(fetchPromises)
        .then(results => {
            let allItems = [];

            // 4. Junta todos os artigos de todos os feeds
            results.forEach(result => {
                if (result && result.status === 'ok') {
                    const sourceTitle = result.feed.title;
                    result.items.forEach(item => {
                        item.sourceTitle = sourceTitle; 
                    });
                    allItems = allItems.concat(result.items);
                }
            });

            // -------------------------------------------------------------------
            // MUDANÇA: Removemos o filtro de palavras-chave
            // -------------------------------------------------------------------
            
            // 5. Classifica TODOS os itens por data (os mais recentes primeiro)
            allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

            // 6. Pega os 6 mais recentes da lista combinada
            const recentItems = allItems.slice(0, 20);

            // 7. Limpa o "Carregando..." e renderiza os cards
            container.innerHTML = "";

            if (recentItems.length === 0) {
                container.innerHTML = "<p>Nenhuma notícia recente encontrada.</p>";
                return;
            }
            
            recentItems.forEach(item => {
                const newsCard = document.createElement("div");
                newsCard.className = "news-card";

                const pubDate = new Date(item.pubDate);
                const formattedDate = pubDate.toLocaleDateString('pt-BR');
                
                // Lógica para encontrar a imagem (mesma de antes)
                const fallbackImage = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1470&auto=format=fit=crop';
                let imageUrl = item.thumbnail; 

                if (!imageUrl || imageUrl === "") {
                    const descMatch = item.description.match(/<img[^>]+src="([^">]+)"/);
                    if (descMatch && descMatch[1]) {
                        imageUrl = descMatch[1];
                    }
                }
                
                if (!imageUrl) {
                    imageUrl = fallbackImage;
                }

                newsCard.innerHTML = `
                    <img src="${imageUrl}" alt="${item.title}" class="news-image" onerror="this.src='${fallbackImage}'">
                    <div class="news-content">
                        <div class="news-meta">
                            <span class="news-source">${item.sourceTitle}</span>
                            <span class="news-date">${formattedDate}</span>
                        </div>
                        <h3 class="news-title">${item.title}</h3>
                        <a href="${item.link}" class="btn-outline" target="_blank">Ver notícia completa</a>
                    </div>
                `;
                container.appendChild(newsCard);
            });
        })
        .catch(error => {
            console.error("Erro ao processar feeds:", error);
            container.innerHTML = "<p>Ocorreu um erro ao carregar o feed de notícias.</p>";
        });
});