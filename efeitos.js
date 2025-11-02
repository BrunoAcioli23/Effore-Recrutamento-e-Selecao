// Dentro do arquivo efeitos.js

document.addEventListener("DOMContentLoaded", function() {
    // Ativa o fade global do body
    requestAnimationFrame(() => document.body.classList.add('is-loaded'));
    
    // Menu Mobile Toggle
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

    // Animação fade-in de seções ao rolar
    const sectionsToAnimate = document.querySelectorAll('.fade-in-section');

    if (sectionsToAnimate.length === 0) return;

    // Cria o "Observador"
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            // Se o elemento está na tela (isIntersecting)
            if (entry.isIntersecting) {
                // Adiciona a classe .is-visible
                entry.target.classList.add('is-visible');
                
                // Para de observar este elemento (para a animação não repetir)
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1 // A animação começa quando 10% do elemento estiver visível
    });

    // Diz ao observador para "observar" cada seção
    sectionsToAnimate.forEach(section => {
        observer.observe(section);
    });
});