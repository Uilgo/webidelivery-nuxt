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
	getLuminance,
	getContrastText,
	getAdaptiveShadow,
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

		// 🎨 Define --cardapio-surface (usado para modais/drawers)
		// Surface é a mesma cor que secondary (cards/superfícies elevadas)
		if (corSecundaria) {
			root.style.setProperty("--cardapio-surface", corSecundaria);
		}

		// 🎨 Define --cardapio-muted (usado para fundos sutis)
		// Muted é a mesma cor que hover (fundos desabilitados/sutis)
		if (corSecundaria) {
			const corMuted = getUIHoverColor(corSecundaria);
			root.style.setProperty("--cardapio-muted", corMuted);
		}

		// 🎨 Calcula e aplica shadow adaptativa baseada na luminosidade do fundo
		if (tema.value.cor_fundo) {
			const luminosidade = getLuminance(tema.value.cor_fundo);
			const isDark = luminosidade < 0.5;

			// Shadow adaptativa: mais forte em fundos escuros, mais suave em fundos claros
			if (isDark) {
				// Fundo escuro: shadow forte + ring branco visível
				root.style.setProperty("--cardapio-shadow", "0 8px 32px rgba(0, 0, 0, 0.6)");
				root.style.setProperty("--cardapio-ring", "rgba(255, 255, 255, 0.15)");
			} else {
				// Fundo claro: shadow suave + ring sutil
				root.style.setProperty("--cardapio-shadow", "0 4px 16px rgba(0, 0, 0, 0.1)");
				root.style.setProperty("--cardapio-ring", "rgba(0, 0, 0, 0.05)");
			}
		}

		// 🎨 Texto adaptativo para badges de promoção
		if (tema.value.gradiente_promo_inicio) {
			const textoPromo = getContrastText(tema.value.gradiente_promo_inicio);
			root.style.setProperty("--cardapio-promo-text", textoPromo);
		}

		// 🎨 Texto adaptativo para badges de destaque
		if (tema.value.gradiente_destaque_inicio) {
			const textoDestaque = getContrastText(tema.value.gradiente_destaque_inicio);
			root.style.setProperty("--cardapio-highlight-text", textoDestaque);
		}

		// 🎨 Texto adaptativo para badge de status (Aberto/Fechado)
		if (tema.value.cor_sucesso) {
			const textoSucesso = getContrastText(tema.value.cor_sucesso);
			root.style.setProperty("--cardapio-success-text", textoSucesso);
		}

		if (tema.value.cor_erro) {
			const textoErro = getContrastText(tema.value.cor_erro);
			root.style.setProperty("--cardapio-danger-text", textoErro);
		}

		if (tema.value.cor_aviso) {
			const textoAviso = getContrastText(tema.value.cor_aviso);
			root.style.setProperty("--cardapio-warning-text", textoAviso);
		}

		// 🎨 Shadow adaptativa para cards
		if (tema.value.cor_fundo) {
			const cardShadow = getAdaptiveShadow(tema.value.cor_fundo, "normal");
			root.style.setProperty("--cardapio-card-shadow", cardShadow);

			const cardShadowHover = getAdaptiveShadow(tema.value.cor_fundo, "strong");
			root.style.setProperty("--cardapio-card-shadow-hover", cardShadowHover);
		}

		// 🎨 Border adaptativa para cards no hover
		if (tema.value.cor_primaria && tema.value.cor_fundo) {
			const luminosidade = getLuminance(tema.value.cor_fundo);
			const borderOpacity = luminosidade < 0.5 ? "0.3" : "0.2";
			root.style.setProperty("--cardapio-card-hover-border-opacity", borderOpacity);
		}

		// 🎨 Shadow adaptativa para botão "Adicionar"
		if (tema.value.cor_primaria) {
			// Extrai valores RGB da cor primária para criar shadow com opacidade
			const primaryRgb = tema.value.cor_primaria
				.replace("#", "")
				.match(/.{2}/g)
				?.map((hex) => parseInt(hex, 16))
				.join(", ");

			if (primaryRgb) {
				root.style.setProperty("--cardapio-button-shadow", `0 4px 12px rgba(${primaryRgb}, 0.2)`);
				root.style.setProperty(
					"--cardapio-button-shadow-hover",
					`0 6px 20px rgba(${primaryRgb}, 0.3)`,
				);
			}
		}

		// 🎨 Glassmorphism adaptativo (menu de categorias)
		if (tema.value.cor_fundo) {
			const luminosidade = getLuminance(tema.value.cor_fundo);
			const glassOpacity = luminosidade < 0.5 ? "0.8" : "0.9";
			const glassBorder = luminosidade < 0.5 ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)";

			root.style.setProperty("--cardapio-glass-opacity", glassOpacity);
			root.style.setProperty("--cardapio-glass-border", glassBorder);
		}

		// 🎨 Overlay adaptativo do header
		if (tema.value.cor_fundo) {
			const luminosidade = getLuminance(tema.value.cor_fundo);
			// Se o fundo já é escuro, overlay mais suave
			const overlayOpacity = luminosidade < 0.3 ? "0.5" : "0.8";
			root.style.setProperty("--cardapio-overlay-opacity", overlayOpacity);
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

		// 🔥 CRÍTICO: Remove classe 'dark' do sistema para evitar conflito
		// A classe 'dark' sobrescreve as variáveis do cardápio
		if (root.classList.contains("dark")) {
			root.classList.remove("dark");
		}

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
		root.style.removeProperty("--cardapio-surface");
		root.style.removeProperty("--cardapio-muted");
		root.style.removeProperty("--cardapio-background");
		root.style.removeProperty("--cardapio-text");
		root.style.removeProperty("--cardapio-border");
		root.style.removeProperty("--cardapio-hover");
		root.style.removeProperty("--cardapio-text-muted");
		root.style.removeProperty("--cardapio-border-radius");
		root.style.removeProperty("--cardapio-shadow");
		root.style.removeProperty("--cardapio-ring");

		// Remove propriedades adaptativas
		root.style.removeProperty("--cardapio-promo-text");
		root.style.removeProperty("--cardapio-highlight-text");
		root.style.removeProperty("--cardapio-success-text");
		root.style.removeProperty("--cardapio-danger-text");
		root.style.removeProperty("--cardapio-warning-text");
		root.style.removeProperty("--cardapio-card-shadow");
		root.style.removeProperty("--cardapio-card-shadow-hover");
		root.style.removeProperty("--cardapio-card-hover-border-opacity");
		root.style.removeProperty("--cardapio-button-shadow");
		root.style.removeProperty("--cardapio-button-shadow-hover");
		root.style.removeProperty("--cardapio-glass-opacity");
		root.style.removeProperty("--cardapio-glass-border");
		root.style.removeProperty("--cardapio-overlay-opacity");

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

	// 🎨 Aplica tema quando estabelecimento muda (navegação SPA)
	// Plugin SSR já injeta CSS no HTML inicial, então não precisa de immediate
	watch(
		estabelecimento,
		(novoEstabelecimento) => {
			if (novoEstabelecimento?.config_tema) {
				aplicarTema();
			} else {
				removerTema();
			}
		},
		{ immediate: false }, // Plugin SSR já aplicou no primeiro render
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
