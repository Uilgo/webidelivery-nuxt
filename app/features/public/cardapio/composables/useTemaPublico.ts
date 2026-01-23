/**
 * 📌 useTemaPublico
 *
 * Composable para aplicar configurações de tema no cardápio público.
 * Aplica cores personalizadas via CSS custom properties.
 */

import type { Estabelecimento } from "../types/cardapio-publico";
import type { ConfigTema } from "#shared/types/estabelecimentos";

export interface UseTemaPublicoReturn {
	// Dados
	tema: ComputedRef<ConfigTema>;

	// Métodos
	aplicarTema: () => void;
	removerTema: () => void;
}

export const useTemaPublico = (
	estabelecimento: Ref<Estabelecimento | null>,
): UseTemaPublicoReturn => {
	/**
	 * Configurações de tema com valores padrão
	 */
	const tema = computed<ConfigTema>(() => {
		const configTema = estabelecimento.value?.config_tema as ConfigTema | null;

		return {
			cor_primaria: configTema?.cor_primaria || "#3b82f6",
			cor_secundaria: configTema?.cor_secundaria || "#10b981",
			cor_fundo: configTema?.cor_fundo || "#ffffff",
			cor_texto: configTema?.cor_texto || "#1f2937",
			estilo_botoes: configTema?.estilo_botoes || "rounded",
			layout_cardapio: configTema?.layout_cardapio || "grid",
		};
	});

	/**
	 * Aplica o tema personalizado via CSS custom properties
	 */
	const aplicarTema = (): void => {
		if (!import.meta.client) return;

		const root = document.documentElement;

		// Aplica cores personalizadas
		root.style.setProperty("--cardapio-cor-primaria", tema.value.cor_primaria);
		root.style.setProperty("--cardapio-cor-secundaria", tema.value.cor_secundaria);
		root.style.setProperty("--cardapio-cor-fundo", tema.value.cor_fundo);
		root.style.setProperty("--cardapio-cor-texto", tema.value.cor_texto);

		// Aplica estilo de botões
		root.style.setProperty(
			"--cardapio-border-radius",
			tema.value.estilo_botoes === "rounded" ? "9999px" : "8px",
		);

		// Adiciona classe para identificar tema personalizado
		root.classList.add("cardapio-tema-personalizado");

		console.log("🎨 Tema aplicado:", tema.value);
	};

	/**
	 * Remove o tema personalizado (volta ao padrão)
	 */
	const removerTema = (): void => {
		if (!import.meta.client) return;

		const root = document.documentElement;

		// Remove propriedades personalizadas
		root.style.removeProperty("--cardapio-cor-primaria");
		root.style.removeProperty("--cardapio-cor-secundaria");
		root.style.removeProperty("--cardapio-cor-fundo");
		root.style.removeProperty("--cardapio-cor-texto");
		root.style.removeProperty("--cardapio-border-radius");

		// Remove classe
		root.classList.remove("cardapio-tema-personalizado");
	};

	// Aplica tema quando estabelecimento muda
	watch(
		estabelecimento,
		(novoEstabelecimento) => {
			if (novoEstabelecimento?.config_tema) {
				aplicarTema();
			} else {
				removerTema();
			}
		},
		{ immediate: true },
	);

	// Remove tema ao desmontar
	onUnmounted(() => {
		removerTema();
	});

	return {
		tema,
		aplicarTema,
		removerTema,
	};
};
