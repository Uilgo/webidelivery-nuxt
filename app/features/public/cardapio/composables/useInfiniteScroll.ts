/**
 * 📌 useInfiniteScroll
 *
 * Composable para implementar infinite scroll.
 * Detecta quando o usuário está próximo do fim da página e carrega mais itens.
 */

import { useScroll } from "@vueuse/core";

interface UseInfiniteScrollOptions {
	/**
	 * Distância em pixels do fim da página para começar a carregar
	 * @default 300
	 */
	offset?: number;

	/**
	 * Callback chamado quando precisa carregar mais itens
	 */
	onLoadMore: () => void | Promise<void>;

	/**
	 * Se ainda há mais itens para carregar
	 */
	hasMore: Ref<boolean>;

	/**
	 * Se está carregando atualmente
	 */
	loading: Ref<boolean>;
}

export const useInfiniteScroll = (options: UseInfiniteScrollOptions) => {
	const { offset = 300, onLoadMore, hasMore, loading } = options;

	// Detecta scroll da janela
	const { arrivedState } = useScroll(window, {
		offset: { bottom: offset },
	});

	// Watch para detectar quando chega perto do fim
	watch(
		() => arrivedState.bottom,
		async (isBottom) => {
			if (isBottom && hasMore.value && !loading.value) {
				await onLoadMore();
			}
		},
	);

	return {
		arrivedState,
	};
};
