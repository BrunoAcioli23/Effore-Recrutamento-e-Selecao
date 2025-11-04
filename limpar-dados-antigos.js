// Script para limpar vagas antigas do localStorage
// Execute este arquivo UMA VEZ para limpar dados antigos

(function() {
    console.log('🧹 Limpando dados antigos do localStorage...');
    
    // Remove vagas antigas do localStorage
    if (localStorage.getItem('effore_vagas')) {
        localStorage.removeItem('effore_vagas');
        console.log('✅ Vagas antigas removidas do localStorage');
    } else {
        console.log('ℹ️ Nenhuma vaga antiga encontrada no localStorage');
    }
    
    // Limpa autenticação antiga (se houver)
    if (sessionStorage.getItem('isAdminAuth')) {
        sessionStorage.removeItem('isAdminAuth');
        console.log('✅ Autenticação antiga removida');
    }
    
    console.log('✨ Limpeza concluída! Agora o sistema usa 100% Firebase.');
    console.log('📝 Você pode remover este arquivo (limpar-dados-antigos.js) após executá-lo.');
    
    alert('✅ Dados antigos limpos com sucesso!\n\nAgora o sistema carrega apenas vagas do Firebase.\n\nRecarregue a página para ver as mudanças.');
})();
