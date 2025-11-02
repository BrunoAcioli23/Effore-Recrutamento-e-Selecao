// Dentro do arquivo efeitos.js

document.addEventListener("DOMContentLoaded", function() {
            
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function() {
            // Alterna a classe 'is-active' no botão (para virar "X")
            menuToggle.classList.toggle('is-active');
            
            // Alterna a classe 'is-active' no menu (para aparecer)
            navMenu.classList.toggle('is-active');
        });
    }

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