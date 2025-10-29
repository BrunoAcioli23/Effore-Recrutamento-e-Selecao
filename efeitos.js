// Dentro do arquivo efeitos.js

document.addEventListener("DOMContentLoaded", function() {
            
    // 1. Seleciona todos os elementos que queremos animar
    const sectionsToAnimate = document.querySelectorAll('.fade-in-section');

    if (!sectionsToAnimate.length) return;

    // 2. Cria o "Observador"
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            // 3. Se o elemento está na tela (isIntersecting)
            if (entry.isIntersecting) {
                // 4. Adiciona a classe .is-visible
                entry.target.classList.add('is-visible');
                
                // 5. Para de observar este elemento (para a animação não repetir)
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1 // A animação começa quando 10% do elemento estiver visível
    });

    // 6. Diz ao observador para "observar" cada seção
    sectionsToAnimate.forEach(section => {
        observer.observe(section);
    });
});