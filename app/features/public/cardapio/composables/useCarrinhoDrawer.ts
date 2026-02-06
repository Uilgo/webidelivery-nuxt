/**
 * 📌 useCarrinhoDrawer
 *
 * Composable para gerenciar o drawer/bottom sheet do carrinho no cardápio público.
 * Detecta o tamanho da tela e usa Bottom Sheet no mobile ou Drawer no tablet+.
 */

const drawerAberto = ref(false);
const bottomSheetAberto = ref(false);

export const useCarrinhoDrawer = () => {
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

	const abrir = () => {
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
	};

	return {
		drawerAberto,
		bottomSheetAberto,
		isMobile: readonly(isMobile),
		abrir,
		fechar,
	};
};
