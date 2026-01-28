/**
 * 📌 useTemaPublico
 *
 * Composable para aplicar configurações de tema no cardápio público.
 * Aplica cores personalizadas via CSS custom properties.
 *
 * Modo Simples: Gera cor secundária automaticamente baseada no fundo
 * Modo Avançado: Usuário define cor secundária manualmente
 */

import type { Estabelecimento } from "../types/cardapio-publico";
import type { ConfigTema } from "#shared/types/estabelecimentos";
import {
	getCardColor,
	getBorderColor,
	getUIHoverColor,
	getMutedTextColor,
} from "~/lib/utils/color";

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
			cor_primaria: configTema?.cor_primaria,
			cor_secundaria: configTema?.cor_secundaria,
			cor_fundo: configTema?.cor_fundo,
			cor_texto: configTema?.cor_texto,
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

		// 🎨 Aplica cores base configuráveis pelo usuário
		if (tema.value.cor_primaria)
			root.style.setProperty("--cardapio-primary", tema.value.cor_primaria);

		if (tema.value.cor_fundo) root.style.setProperty("--cardapio-background", tema.value.cor_fundo);

		if (tema.value.cor_texto) root.style.setProperty("--cardapio-text", tema.value.cor_texto);

		// 🎨 Cor Secundária: Manual (Modo Avançado) ou Automática (Modo Simples)
		let corSecundaria: string;

		if (tema.value.cor_secundaria) {
			// Modo Avançado: Usuário definiu cor secundária manualmente
			corSecundaria = tema.value.cor_secundaria;
			root.style.setProperty("--cardapio-secondary", corSecundaria);
		} else if (tema.value.cor_fundo) {
			// Modo Simples: Gera cor secundária automaticamente baseada no fundo
			corSecundaria = getCardColor(tema.value.cor_fundo);
			root.style.setProperty("--cardapio-secondary", corSecundaria);
		} else {
			// Fallback: usa cor padrão
			corSecundaria = "";
		}

		// 🎨 Gera cores automáticas derivadas (apenas 3 variáveis)

		// 1. Bordas (3.5% de contraste da secundária)
		if (corSecundaria) {
			const corBorder = getBorderColor(corSecundaria);
			root.style.setProperty("--cardapio-border", corBorder);
		}

		// 2. Hover (8.5% de contraste da secundária)
		if (corSecundaria) {
			const corHover = getUIHoverColor(corSecundaria);
			root.style.setProperty("--cardapio-hover", corHover);
		}

		// 3. Texto muted (60% de opacidade visual)
		if (tema.value.cor_texto && tema.value.cor_fundo) {
			const corTextMuted = getMutedTextColor(tema.value.cor_texto, tema.value.cor_fundo);
			root.style.setProperty("--cardapio-text-muted", corTextMuted);
		}

		// Aplica cores semânticas (se definidas)
		if (tema.value.cor_sucesso)
			root.style.setProperty("--cardapio-success", tema.value.cor_sucesso);
		if (tema.value.cor_erro) root.style.setProperty("--cardapio-danger", tema.value.cor_erro);
		if (tema.value.cor_aviso) root.style.setProperty("--cardapio-warning", tema.value.cor_aviso);

		// Aplica gradientes (se definidos)
		if (tema.value.gradiente_promo_inicio)
			root.style.setProperty("--cardapio-promo-from", tema.value.gradiente_promo_inicio);
		if (tema.value.gradiente_promo_fim)
			root.style.setProperty("--cardapio-promo-to", tema.value.gradiente_promo_fim);

		if (tema.value.gradiente_destaque_inicio)
			root.style.setProperty("--cardapio-highlight-from", tema.value.gradiente_destaque_inicio);
		if (tema.value.gradiente_destaque_fim)
			root.style.setProperty("--cardapio-highlight-to", tema.value.gradiente_destaque_fim);

		// Aplica estilo de botões
		root.style.setProperty(
			"--cardapio-border-radius",
			tema.value.estilo_botoes === "rounded" ? "9999px" : "4px",
		);

		// Adiciona classe para identificar tema personalizado
		root.classList.add("cardapio-tema-personalizado");

		// Debug: mostra cores aplicadas no console
		console.log("🎨 Tema Aplicado:", {
			modo: tema.value.cor_secundaria ? "Avançado" : "Simples",
			primaria: tema.value.cor_primaria,
			secundaria: corSecundaria,
			secundariaManual: !!tema.value.cor_secundaria,
			fundo: tema.value.cor_fundo,
			texto: tema.value.cor_texto,
			derivadas: {
				border: corSecundaria ? getBorderColor(corSecundaria) : null,
				hover: corSecundaria ? getUIHoverColor(corSecundaria) : null,
				textMuted:
					tema.value.cor_texto && tema.value.cor_fundo
						? getMutedTextColor(tema.value.cor_texto, tema.value.cor_fundo)
						: null,
			},
		});
	};

	/**
	 * Remove o tema personalizado (volta ao padrão)
	 */
	const removerTema = (): void => {
		if (!import.meta.client) return;

		const root = document.documentElement;

		// Remove propriedades personalizadas
		root.style.removeProperty("--cardapio-primary");
		root.style.removeProperty("--cardapio-secondary");
		root.style.removeProperty("--cardapio-background");
		root.style.removeProperty("--cardapio-text");
		root.style.removeProperty("--cardapio-border");
		root.style.removeProperty("--cardapio-hover");
		root.style.removeProperty("--cardapio-text-muted");
		root.style.removeProperty("--cardapio-border-radius");

		// Remove propriedades opcionais
		root.style.removeProperty("--cardapio-success");
		root.style.removeProperty("--cardapio-danger");
		root.style.removeProperty("--cardapio-warning");
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
