/**
 * 📌 Plugin de Persistência do Carrinho
 *
 * Carrega automaticamente o carrinho do localStorage quando a aplicação inicia.
 * Executa apenas no client-side.
 */

export default defineNuxtPlugin(() => {
	const carrinhoStore = useCarrinhoStore();

	// Carrega o carrinho do localStorage ao iniciar
	carrinhoStore.carregarDoStorage();
});
