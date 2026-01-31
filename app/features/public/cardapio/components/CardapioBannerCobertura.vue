<script setup lang="ts">
/**
 * 📌 CardapioBannerCobertura
 *
 * Banner informativo mostrando a área de cobertura do estabelecimento.
 * Exibe cidades atendidas e bairros (se configurado).
 */

import type { Estabelecimento } from "#shared/types/estabelecimentos";

interface Props {
	estabelecimento: Estabelecimento;
}

const props = defineProps<Props>();

/**
 * Extrair configurações de cobertura
 */
const configCobertura = computed(() => {
	const configGeral = props.estabelecimento.config_geral as Record<string, unknown>;

	const cidades = (configGeral.cidades_atendidas as string[]) || [];
	const tipoTaxa = (configGeral.tipo_taxa_entrega as string) || "taxa_unica";
	const taxasPorLocalizacao =
		(configGeral.taxas_por_localizacao as Array<{
			id: string;
			nome: string;
			cidade: string;
			status: "ativado" | "desativado";
		}>) || [];

	return {
		cidades,
		tipoTaxa,
		bairros: taxasPorLocalizacao.filter((t) => t.status === "ativado"),
	};
});

/**
 * Mensagem dinâmica baseada na configuração
 */
const mensagemCobertura = computed(() => {
	const { cidades, bairros, tipoTaxa } = configCobertura.value;

	if (!cidades.length) return null;

	// 1 Cidade sem bairros específicos
	if (cidades.length === 1 && (tipoTaxa !== "taxa_localizacao" || !bairros.length)) {
		return {
			principal: `📍 Entregamos em toda ${cidades[0]}`,
			detalhes: null,
		};
	}

	// 1 Cidade com bairros específicos
	if (cidades.length === 1 && tipoTaxa === "taxa_localizacao" && bairros.length > 0) {
		const bairrosDaCidade = bairros
			.filter((b) => b.cidade === cidades[0])
			.map((b) => b.nome)
			.slice(0, 5);

		return {
			principal: `📍 Entregamos em ${cidades[0]}`,
			detalhes: `Bairros: ${bairrosDaCidade.join(", ")}${bairros.length > 5 ? ` e mais ${bairros.length - 5}` : ""}`,
		};
	}

	// Múltiplas cidades sem bairros específicos
	if (cidades.length > 1 && (tipoTaxa !== "taxa_localizacao" || !bairros.length)) {
		const cidadesFormatadas =
			cidades.length === 2
				? cidades.join(" e ")
				: `${cidades.slice(0, -1).join(", ")} e ${cidades[cidades.length - 1]}`;

		return {
			principal: `📍 Entregamos em ${cidadesFormatadas}`,
			detalhes: null,
		};
	}

	// Múltiplas cidades com bairros específicos
	if (cidades.length > 1 && tipoTaxa === "taxa_localizacao" && bairros.length > 0) {
		// Agrupar bairros por cidade
		const bairrosPorCidade = cidades
			.map((cidade) => {
				const bairrosDaCidade = bairros
					.filter((b) => b.cidade === cidade)
					.map((b) => b.nome)
					.slice(0, 3);

				if (bairrosDaCidade.length === 0) return null;

				const totalBairros = bairros.filter((b) => b.cidade === cidade).length;
				const maisInfo = totalBairros > 3 ? ` e mais ${totalBairros - 3}` : "";

				return `• ${cidade}: ${bairrosDaCidade.join(", ")}${maisInfo}`;
			})
			.filter(Boolean);

		return {
			principal: "📍 Entregamos em:",
			detalhes: bairrosPorCidade.join("\n"),
		};
	}

	return null;
});
</script>

<template>
	<div
		v-if="mensagemCobertura"
		class="mb-3 sm:mb-4 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl"
	>
		<div class="text-center">
			<p class="text-sm sm:text-base font-bold text-blue-700 dark:text-blue-300">
				{{ mensagemCobertura.principal }}
			</p>
			<p
				v-if="mensagemCobertura.detalhes"
				class="text-xs sm:text-sm text-blue-600 dark:text-blue-400 mt-1 whitespace-pre-line"
			>
				{{ mensagemCobertura.detalhes }}
			</p>
		</div>
	</div>
</template>
