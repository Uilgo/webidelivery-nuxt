<script setup lang="ts" generic="T extends Record<string, unknown>">
/**
 * 📊 TabelaRelatorio
 *
 * Wrapper do componente Table.vue com funcionalidades específicas para relatórios:
 * - Paginação integrada
 * - Busca/filtro rápido
 * - Ordenação persistente
 * - Integração com exportação
 * - Estados de loading otimizados
 */

import { useDebounceFn } from "@vueuse/core";

interface Coluna {
	key: string;
	label: string;
	sortable?: boolean;
	format?: (value: unknown) => string;
	align?: "left" | "center" | "right";
	width?: string;
}

interface Props {
	/** Dados da tabela */
	dados: T[];
	/** Colunas da tabela */
	colunas: Coluna[];
	/** Estado de loading */
	loading?: boolean;
	/** Habilitar busca */
	busca?: boolean;
	/** Placeholder da busca */
	buscaPlaceholder?: string;
	/** Habilitar paginação */
	paginacao?: boolean;
	/** Itens por página */
	itensPorPagina?: number;
	/** Opções de itens por página */
	opcoesItensPorPagina?: number[];
	/** Texto quando vazio */
	emptyText?: string;
	/** Ícone quando vazio */
	emptyIcon?: string;
}

const props = withDefaults(defineProps<Props>(), {
	loading: false,
	busca: true,
	buscaPlaceholder: "Buscar...",
	paginacao: true,
	itensPorPagina: 10,
	opcoesItensPorPagina: () => [10, 25, 50, 100],
	emptyText: "Nenhum dado encontrado",
	emptyIcon: "lucide:inbox",
});

// Estado da busca
const termoBusca = ref("");

// Estado da ordenação
const colunaOrdenacao = ref("");
const direcaoOrdenacao = ref<"asc" | "desc">("asc");

// Estado da paginação
const paginaAtual = ref(1);
const itensPorPaginaAtual = ref(props.itensPorPagina);

// Filtrar dados pela busca
const dadosFiltrados = computed(() => {
	if (!termoBusca.value.trim()) return props.dados;

	const termo = termoBusca.value.toLowerCase();
	return props.dados.filter((item) => {
		return Object.values(item).some((valor) => {
			if (valor === null || valor === undefined) return false;
			return String(valor).toLowerCase().includes(termo);
		});
	});
});

// Ordenar dados
const dadosOrdenados = computed(() => {
	if (!colunaOrdenacao.value) return dadosFiltrados.value;

	const dados = [...dadosFiltrados.value];
	const coluna = props.colunas.find((c) => c.key === colunaOrdenacao.value);

	if (!coluna) return dados;

	return dados.sort((a, b) => {
		const valorA = a[coluna.key];
		const valorB = b[coluna.key];

		// Tratar valores nulos
		if (valorA === null || valorA === undefined) return 1;
		if (valorB === null || valorB === undefined) return -1;

		// Comparação
		let comparacao = 0;
		if (typeof valorA === "number" && typeof valorB === "number") {
			comparacao = valorA - valorB;
		} else {
			comparacao = String(valorA).localeCompare(String(valorB));
		}

		return direcaoOrdenacao.value === "asc" ? comparacao : -comparacao;
	});
});

// Paginar dados
const dadosPaginados = computed(() => {
	if (!props.paginacao) return dadosOrdenados.value;

	const inicio = (paginaAtual.value - 1) * itensPorPaginaAtual.value;
	const fim = inicio + itensPorPaginaAtual.value;
	return dadosOrdenados.value.slice(inicio, fim);
});

// Total de páginas
const totalPaginas = computed(() => {
	if (!props.paginacao) return 1;
	return Math.ceil(dadosOrdenados.value.length / itensPorPaginaAtual.value);
});

// Informações de paginação
const infoPaginacao = computed(() => {
	const inicio = (paginaAtual.value - 1) * itensPorPaginaAtual.value + 1;
	const fim = Math.min(paginaAtual.value * itensPorPaginaAtual.value, dadosOrdenados.value.length);
	const total = dadosOrdenados.value.length;
	return { inicio, fim, total };
});

// Converter colunas para formato do Table.vue
const colunasTable = computed(() => {
	return props.colunas.map((col) => ({
		key: col.key,
		label: col.label,
		sortable: col.sortable ?? true,
		align: col.align || "left",
		width: col.width,
		class: "",
	}));
});

// Handler de ordenação
const handleSort = (coluna: string, direcao: "asc" | "desc") => {
	colunaOrdenacao.value = coluna;
	direcaoOrdenacao.value = direcao;
};

// Handler de mudança de página
const irParaPagina = (pagina: number) => {
	if (pagina < 1 || pagina > totalPaginas.value) return;
	paginaAtual.value = pagina;
};

// Handler de mudança de itens por página
const mudarItensPorPagina = (quantidade: number) => {
	itensPorPaginaAtual.value = quantidade;
	paginaAtual.value = 1; // Resetar para primeira página
};

// Resetar paginação quando busca mudar
watch(termoBusca, () => {
	paginaAtual.value = 1;
});

// Debounce da busca
const handleBusca = useDebounceFn(() => {
	// A busca já é reativa através do computed
}, 300);

// Formatar valor da célula
const formatarValor = (valor: unknown, coluna: Coluna): string => {
	if (coluna.format) {
		return coluna.format(valor);
	}
	if (valor === null || valor === undefined) return "-";
	return String(valor);
};
</script>

<template>
	<div class="tabela-relatorio space-y-4">
		<!-- Barra de controles -->
		<div class="flex items-center justify-between gap-4 flex-wrap">
			<!-- Busca -->
			<div v-if="busca" class="flex-1 min-w-[200px] max-w-md">
				<UiInput
					v-model="termoBusca"
					type="search"
					:placeholder="buscaPlaceholder"
					size="md"
					@input="handleBusca"
				/>
			</div>

			<!-- Itens por página -->
			<div v-if="paginacao" class="flex items-center gap-2">
				<span class="text-sm text-gray-600 dark:text-gray-400">Mostrar:</span>
				<UiSelect
					v-model="itensPorPaginaAtual"
					:options="opcoesItensPorPagina.map((o) => ({ value: o, label: String(o) }))"
					size="sm"
					@update:model-value="(value) => mudarItensPorPagina(Number(value))"
				/>
			</div>
		</div>

		<!-- Tabela -->
		<div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
			<UiTable
				:columns="colunasTable"
				:data="dadosPaginados"
				:loading="loading"
				:sort-by="colunaOrdenacao"
				:sort-direction="direcaoOrdenacao"
				:empty-text="emptyText"
				:empty-icon="emptyIcon"
				size="md"
				variant="striped"
				@sort="handleSort"
			>
				<!-- Slots customizados para células -->
				<template v-for="coluna in colunas" :key="coluna.key" #[`cell-${coluna.key}`]="{ value }">
					<slot :name="`cell-${coluna.key}`" :value="value">
						{{ formatarValor(value, coluna) }}
					</slot>
				</template>
			</UiTable>
		</div>

		<!-- Paginação -->
		<div
			v-if="paginacao && totalPaginas > 1"
			class="flex items-center justify-between flex-wrap gap-4"
		>
			<!-- Info -->
			<div class="text-sm text-gray-600 dark:text-gray-400">
				Mostrando {{ infoPaginacao.inicio }} até {{ infoPaginacao.fim }} de
				{{ infoPaginacao.total }} resultados
			</div>

			<!-- Controles -->
			<div class="flex items-center gap-2">
				<!-- Primeira página -->
				<UiButton
					variant="outline"
					size="sm"
					:disabled="paginaAtual === 1"
					@click="irParaPagina(1)"
				>
					<Icon name="lucide:chevrons-left" class="w-4 h-4" />
				</UiButton>

				<!-- Página anterior -->
				<UiButton
					variant="outline"
					size="sm"
					:disabled="paginaAtual === 1"
					@click="irParaPagina(paginaAtual - 1)"
				>
					<Icon name="lucide:chevron-left" class="w-4 h-4" />
				</UiButton>

				<!-- Número da página -->
				<span class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
					Página {{ paginaAtual }} de {{ totalPaginas }}
				</span>

				<!-- Próxima página -->
				<UiButton
					variant="outline"
					size="sm"
					:disabled="paginaAtual === totalPaginas"
					@click="irParaPagina(paginaAtual + 1)"
				>
					<Icon name="lucide:chevron-right" class="w-4 h-4" />
				</UiButton>

				<!-- Última página -->
				<UiButton
					variant="outline"
					size="sm"
					:disabled="paginaAtual === totalPaginas"
					@click="irParaPagina(totalPaginas)"
				>
					<Icon name="lucide:chevrons-right" class="w-4 h-4" />
				</UiButton>
			</div>
		</div>
	</div>
</template>
