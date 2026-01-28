/**
 * 📌 Plugin: Cardápio Tema SSR
 *
 * Injeta CSS inline DIRETAMENTE no HTML durante SSR.
 * Usa script inline que executa ANTES do CSS ser parseado.
 *
 * ESTRATÉGIA:
 * - Plugin SSR lê config_tema do useState
 * - Gera CSS inline como string
 * - Injeta via useHead() com tagPriority: -1 (máxima prioridade)
 * - HTML renderizado já vem com <style> no <head>
 */

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

export default defineNuxtPlugin({
	name: "cardapio-tema-server",
	enforce: "pre",
	dependsOn: ["cardapio-publico-cache"],
	async setup() {
		// Só executar no server-side
		if (!import.meta.server) return;

		const route = useRoute();
		const path = route.path;

		// Ignorar rotas que não são de cardápio público
		if (
			path === "/" ||
			path.startsWith("/admin") ||
			path.startsWith("/super-admin") ||
			path.startsWith("/login") ||
			path.startsWith("/signup") ||
			path.startsWith("/forgot-password") ||
			path.startsWith("/confirm")
		) {
			return;
		}

		// Ler estabelecimento do estado SSR
		const estabelecimento = useState<{ config_tema?: unknown } | null>("cardapio-estabelecimento");

		if (!estabelecimento.value?.config_tema) {
			return;
		}

		const configTema = estabelecimento.value.config_tema as ConfigTema;

		// 🎨 Gerar CSS inline
		const cssVariaveis = gerarCSSVariaveis(configTema);

		// 🔥 CRÍTICO: Injetar CSS com máxima prioridade
		useHead({
			style: [
				{
					innerHTML: cssVariaveis,
					tagPriority: -1, // Máxima prioridade - renderiza PRIMEIRO
					key: "cardapio-tema-ssr",
				},
			],
		});
	},
});

/**
 * Gera string CSS com todas as variáveis do tema
 */
function gerarCSSVariaveis(tema: ConfigTema): string {
	const vars: string[] = [];

	// 🎨 Cores base
	if (tema.cor_primaria) vars.push(`--cardapio-primary: ${tema.cor_primaria};`);
	if (tema.cor_fundo) vars.push(`--cardapio-background: ${tema.cor_fundo};`);
	if (tema.cor_texto) vars.push(`--cardapio-text: ${tema.cor_texto};`);

	// 🎨 Cor Secundária
	let corSecundaria = "";
	if (tema.cor_secundaria) {
		corSecundaria = tema.cor_secundaria;
		vars.push(`--cardapio-secondary: ${corSecundaria};`);
	} else if (tema.cor_fundo) {
		corSecundaria = getCardColor(tema.cor_fundo);
		vars.push(`--cardapio-secondary: ${corSecundaria};`);
	}

	// 🎨 Surface e Muted
	if (corSecundaria) {
		vars.push(`--cardapio-surface: ${corSecundaria};`);
		const corMuted = getUIHoverColor(corSecundaria);
		vars.push(`--cardapio-muted: ${corMuted};`);
	}

	// 🎨 Shadow e Ring adaptativos
	if (tema.cor_fundo) {
		const luminosidade = getLuminance(tema.cor_fundo);
		const isDark = luminosidade < 0.5;
		if (isDark) {
			vars.push(`--cardapio-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);`);
			vars.push(`--cardapio-ring: rgba(255, 255, 255, 0.15);`);
		} else {
			vars.push(`--cardapio-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);`);
			vars.push(`--cardapio-ring: rgba(0, 0, 0, 0.05);`);
		}
	}

	// 🎨 Texto adaptativo para badges
	if (tema.gradiente_promo_inicio) {
		vars.push(`--cardapio-promo-text: ${getContrastText(tema.gradiente_promo_inicio)};`);
	}
	if (tema.gradiente_destaque_inicio) {
		vars.push(`--cardapio-highlight-text: ${getContrastText(tema.gradiente_destaque_inicio)};`);
	}
	if (tema.cor_sucesso) {
		vars.push(`--cardapio-success-text: ${getContrastText(tema.cor_sucesso)};`);
	}
	if (tema.cor_erro) {
		vars.push(`--cardapio-danger-text: ${getContrastText(tema.cor_erro)};`);
	}
	if (tema.cor_aviso) {
		vars.push(`--cardapio-warning-text: ${getContrastText(tema.cor_aviso)};`);
	}

	// 🎨 Shadow adaptativa para cards
	if (tema.cor_fundo) {
		vars.push(`--cardapio-card-shadow: ${getAdaptiveShadow(tema.cor_fundo, "normal")};`);
		vars.push(`--cardapio-card-shadow-hover: ${getAdaptiveShadow(tema.cor_fundo, "strong")};`);
	}

	// 🎨 Border adaptativa
	if (tema.cor_primaria && tema.cor_fundo) {
		const luminosidade = getLuminance(tema.cor_fundo);
		vars.push(`--cardapio-card-hover-border-opacity: ${luminosidade < 0.5 ? "0.3" : "0.2"};`);
	}

	// 🎨 Shadow para botão
	if (tema.cor_primaria) {
		const primaryRgb = tema.cor_primaria
			.replace("#", "")
			.match(/.{2}/g)
			?.map((hex) => parseInt(hex, 16))
			.join(", ");
		if (primaryRgb) {
			vars.push(`--cardapio-button-shadow: 0 4px 12px rgba(${primaryRgb}, 0.2);`);
			vars.push(`--cardapio-button-shadow-hover: 0 6px 20px rgba(${primaryRgb}, 0.3);`);
		}
	}

	// 🎨 Glassmorphism
	if (tema.cor_fundo) {
		const luminosidade = getLuminance(tema.cor_fundo);
		vars.push(`--cardapio-glass-opacity: ${luminosidade < 0.5 ? "0.8" : "0.9"};`);
		vars.push(
			`--cardapio-glass-border: ${luminosidade < 0.5 ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"};`,
		);
	}

	// 🎨 Overlay
	if (tema.cor_fundo) {
		const luminosidade = getLuminance(tema.cor_fundo);
		vars.push(`--cardapio-overlay-opacity: ${luminosidade < 0.3 ? "0.5" : "0.8"};`);
	}

	// 🎨 Cores derivadas
	if (corSecundaria) {
		vars.push(`--cardapio-border: ${getBorderColor(corSecundaria)};`);
		vars.push(`--cardapio-hover: ${getUIHoverColor(corSecundaria)};`);
	}
	if (tema.cor_texto && tema.cor_fundo) {
		vars.push(`--cardapio-text-muted: ${getMutedTextColor(tema.cor_texto, tema.cor_fundo)};`);
	}

	// 🎨 Cores semânticas
	if (tema.cor_sucesso) vars.push(`--cardapio-success: ${tema.cor_sucesso};`);
	if (tema.cor_erro) vars.push(`--cardapio-danger: ${tema.cor_erro};`);
	if (tema.cor_aviso) vars.push(`--cardapio-warning: ${tema.cor_aviso};`);

	// 🎨 Gradientes
	if (tema.gradiente_promo_inicio)
		vars.push(`--cardapio-promo-from: ${tema.gradiente_promo_inicio};`);
	if (tema.gradiente_promo_fim) vars.push(`--cardapio-promo-to: ${tema.gradiente_promo_fim};`);
	if (tema.gradiente_destaque_inicio)
		vars.push(`--cardapio-highlight-from: ${tema.gradiente_destaque_inicio};`);
	if (tema.gradiente_destaque_fim)
		vars.push(`--cardapio-highlight-to: ${tema.gradiente_destaque_fim};`);

	// 🎨 Estilo de botões
	vars.push(`--cardapio-border-radius: ${tema.estilo_botoes === "rounded" ? "9999px" : "4px"};`);

	// Retorna CSS completo
	return `:root { ${vars.join(" ")} }`;
}
