/**
 * 📌 useProdutoDrawer
 *
 * Composable para gerenciar o drawer/bottom sheet de produto no cardápio público.
 * Detecta o tamanho da tela e usa Bottom Sheet no mobile ou Drawer no tablet+.
 */

import type { ProdutoPublico } from "../types/cardapio-publico";

const drawerAberto = ref(false);
const bottomSheetAberto = ref(false);
const produtoSelecionado = ref<ProdutoPublico | null>(null);

export const useProdutoDrawer = () => {
	// Detecta se é mobile (< 640px)
	const isMobile = ref(false);

	// Atualiza isMobile baseado no tamanho da tela
	const updateIsMobile = () => {
		if (typeof window !== "undefined") {
			isMobile.value = window.innerWidth < 640;
		}
	};

	// Inicializa e adiciona listener
	onMounted(() => {
		updateIsMobile();
		window.addEventListener("resize", updateIsMobile);
	});

	// Remove listener ao desmontar
	onUnmounted(() => {
		if (typeof window !== "undefined") {
			window.removeEventListener("resize", updateIsMobile);
		}
	});

	const abrir = (produto: ProdutoPublico) => {
		produtoSelecionado.value = produto;

		// Abre Bottom Sheet no mobile, Drawer no tablet+
		if (isMobile.value) {
			bottomSheetAberto.value = true;
		} else {
			drawerAberto.value = true;
		}
	};

	const fechar = () => {
		drawerAberto.value = false;
		bottomSheetAberto.value = false;
		produtoSelecionado.value = null;
	};

	return {
		drawerAberto,
		bottomSheetAberto,
		produtoSelecionado: readonly(produtoSelecionado),
		isMobile: readonly(isMobile),
		abrir,
		fechar,
	};
};
