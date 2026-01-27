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
			// Novos campos opcionais
			cor_sucesso: configTema?.cor_sucesso,
			cor_erro: configTema?.cor_erro,
			cor_aviso: configTema?.cor_aviso,
			cor_info: configTema?.cor_info,
			gradiente_promo_inicio: configTema?.gradiente_promo_inicio,
			gradiente_promo_fim: configTema?.gradiente_promo_fim,
			gradiente_destaque_inicio: configTema?.gradiente_destaque_inicio,
			gradiente_destaque_fim: configTema?.gradiente_destaque_fim,
		};
	});

	/**
	 * Aplica o tema personalizado via CSS custom properties
	 */
	const aplicarTema = (): void => {
		if (!import.meta.client) return;

		const root = document.documentElement;

		// Aplica cores personalizadas base
		root.style.setProperty("--cardapio-cor-primaria", tema.value.cor_primaria);
		root.style.setProperty("--cardapio-cor-secundaria", tema.value.cor_secundaria);
		root.style.setProperty("--cardapio-cor-fundo", tema.value.cor_fundo);
		root.style.setProperty("--cardapio-cor-texto", tema.value.cor_texto);

		// Aplica cores semânticas (se definidas)
		if (tema.value.cor_sucesso)
			root.style.setProperty("--cardapio-cor-success", tema.value.cor_sucesso);
		if (tema.value.cor_erro) root.style.setProperty("--cardapio-cor-danger", tema.value.cor_erro);
		if (tema.value.cor_aviso)
			root.style.setProperty("--cardapio-cor-warning", tema.value.cor_aviso);
		// if (tema.value.cor_info) root.style.setProperty("--cardapio-cor-info", tema.value.cor_info);

		// Aplica gradientes (se definidos)
		if (tema.value.gradiente_promo_inicio)
			root.style.setProperty("--cardapio-promo-from", tema.value.gradiente_promo_inicio);
		if (tema.value.gradiente_promo_fim)
			root.style.setProperty("--cardapio-promo-to", tema.value.gradiente_promo_fim);

		if (tema.value.gradiente_destaque_inicio)
			root.style.setProperty("--cardapio-highlight-from", tema.value.gradiente_destaque_inicio);
		if (tema.value.gradiente_destaque_fim)
			root.style.setProperty("--cardapio-highlight-to", tema.value.gradiente_destaque_fim);

		// Opcional: Se o backend enviar cores semânticas personalizadas no futuro,
		// podemos aplicá-las aqui. Por enquanto, usamos os defaults do CSS (Emerald/Red/Amber)
		// mas deixamos a estrutura pronta se quiser sobrescrever.
		/*
		if (tema.value.cor_success) root.style.setProperty("--cardapio-cor-success", tema.value.cor_success);
		if (tema.value.cor_danger) root.style.setProperty("--cardapio-cor-danger", tema.value.cor_danger);
		if (tema.value.cor_warning) root.style.setProperty("--cardapio-cor-warning", tema.value.cor_warning);
		*/

		// Aplica estilo de botões
		root.style.setProperty(
			"--cardapio-border-radius",
			tema.value.estilo_botoes === "rounded" ? "9999px" : "4px",
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

		// Remove propriedades personalizadas base
		root.style.removeProperty("--cardapio-cor-primaria");
		root.style.removeProperty("--cardapio-cor-secundaria");
		root.style.removeProperty("--cardapio-cor-fundo");
		root.style.removeProperty("--cardapio-cor-texto");
		root.style.removeProperty("--cardapio-border-radius");

		// Remove propriedades opcionais
		root.style.removeProperty("--cardapio-cor-success");
		root.style.removeProperty("--cardapio-cor-danger");
		root.style.removeProperty("--cardapio-cor-warning");
		root.style.removeProperty("--cardapio-promo-from");
		root.style.removeProperty("--cardapio-promo-to");
		root.style.removeProperty("--cardapio-highlight-from");
		root.style.removeProperty("--cardapio-highlight-to");

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
