<script setup lang="ts">
/**
 * 📌 CardapioBannerCobertura
 *
 * Banner informativo mostrando a área de cobertura do estabelecimento.
 * Exibe cidades atendidas e bairros (se configurado).
 */

/**
 * Props aceita qualquer objeto com as propriedades necessárias
 * Usa unknown para aceitar tanto tipos readonly quanto mutable
 */
interface Props {
	estabelecimento: unknown;
}

const props = defineProps<Props>();

/**
 * Type assertion necessária pois o composable retorna tipos readonly profundos
 */
const est = computed(() => props.estabelecimento as Estabelecimento);

/**
 * Extrair configurações de cobertura
 * ✅ CORRIGIDO: Validar se config_geral existe antes de acessar
 */
const configCobertura = computed(() => {
	// Validar se estabelecimento e config_geral existem
	if (!est.value?.config_geral) {
		return {
			cidades: [],
			tipoTaxa: "taxa_unica",
			taxasPorLocalizacao: [],
		};
	}

	const configGeral = est.value.config_geral as Record<string, unknown>;

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

	// Validar se bairros existe (TypeScript safety)
	const bairrosAtivos = bairros || [];

	if (!cidades.length) return null;

	// 1 Cidade sem bairros específicos
	if (cidades.length === 1 && (tipoTaxa !== "taxa_localizacao" || !bairrosAtivos.length)) {
		return {
			principal: `📍 Entregamos em toda ${cidades[0]}`,
			detalhes: null,
		};
	}

	// 1 Cidade com bairros específicos
	if (cidades.length === 1 && tipoTaxa === "taxa_localizacao" && bairrosAtivos.length > 0) {
		const bairrosDaCidade = bairrosAtivos
			.filter((b) => b.cidade === cidades[0])
			.map((b) => b.nome)
			.slice(0, 5);

		return {
			principal: `📍 Entregamos em ${cidades[0]}`,
			detalhes: `Bairros: ${bairrosDaCidade.join(", ")}${bairrosAtivos.length > 5 ? ` e mais ${bairrosAtivos.length - 5}` : ""}`,
		};
	}

	// Múltiplas cidades sem bairros específicos
	if (cidades.length > 1 && (tipoTaxa !== "taxa_localizacao" || !bairrosAtivos.length)) {
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
	if (cidades.length > 1 && tipoTaxa === "taxa_localizacao" && bairrosAtivos.length > 0) {
		// Agrupar bairros por cidade
		const bairrosPorCidade = cidades
			.map((cidade) => {
				const bairrosDaCidade = bairrosAtivos
					.filter((b) => b.cidade === cidade)
					.map((b) => b.nome)
					.slice(0, 3);

				if (bairrosDaCidade.length === 0) return null;

				const totalBairros = bairrosAtivos.filter((b) => b.cidade === cidade).length;
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
		class="mb-2 sm:mb-3 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg border"
		:style="{
			backgroundColor: 'var(--cardapio-secondary)',
			borderColor: 'var(--cardapio-border)',
		}"
	>
		<div class="flex items-center justify-center gap-2 text-center">
			<p class="text-xs sm:text-sm font-semibold" :style="{ color: 'var(--cardapio-primary)' }">
				{{ mensagemCobertura.principal }}
			</p>
			<span
				v-if="mensagemCobertura.detalhes"
				class="text-xs opacity-90"
				:style="{ color: 'var(--cardapio-text-muted)' }"
			>
				• {{ mensagemCobertura.detalhes }}
			</span>
		</div>
	</div>
</template>
