export async function carregarYjs() {
    if (!window.Y) {
        // Carregar Yjs e IndexedDB apenas uma vez, sem usar then()
        const yjsModule = await import('https://cdn.jsdelivr.net/npm/yjs@13.6.19/+esm');
        const indexeddbModule = await import('https://cdn.jsdelivr.net/npm/y-indexeddb@9.0.12/+esm');

        // Atribuir os módulos carregados diretamente
        window.Y = yjsModule;
        window.IndexeddbPersistence = indexeddbModule.IndexeddbPersistence;
    }
}


