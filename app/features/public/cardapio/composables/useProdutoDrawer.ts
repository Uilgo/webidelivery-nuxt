/**
 * 📌 useProdutoDrawer
 *
 * Composable para gerenciar o drawer de produto no cardápio público.
 * Solução para problema de propagação de eventos entre componentes.
 */

import type { ProdutoPublico } from "../types/cardapio-publico";

const drawerAberto = ref(false);
const produtoSelecionado = ref<ProdutoPublico | null>(null);

export const useProdutoDrawer = () => {
	const abrir = (produto: ProdutoPublico) => {
		produtoSelecionado.value = produto;
		drawerAberto.value = true;
	};

	const fechar = () => {
		drawerAberto.value = false;
		produtoSelecionado.value = null;
	};

	return {
		drawerAberto, // Removido readonly para permitir v-model
		produtoSelecionado: readonly(produtoSelecionado),
		abrir,
		fechar,
	};
};
