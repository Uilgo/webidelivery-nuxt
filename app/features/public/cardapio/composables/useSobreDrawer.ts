/**
 * 📌 useSobreDrawer
 *
 * Composable para gerenciar modal/bottom sheet do "Sobre" do estabelecimento.
 * Detecta o tamanho da tela e usa Bottom Sheet no mobile ou Modal no tablet+.
 */

const modalAberto = ref(false);
const bottomSheetAberto = ref(false);

export const useSobreDrawer = () => {
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
		// Abre Bottom Sheet no mobile, Modal no tablet+
		if (isMobile.value) {
			bottomSheetAberto.value = true;
		} else {
			modalAberto.value = true;
		}
	};

	const fechar = () => {
		modalAberto.value = false;
		bottomSheetAberto.value = false;
	};

	return {
		modalAberto,
		bottomSheetAberto,
		isMobile: readonly(isMobile),
		abrir,
		fechar,
	};
};
