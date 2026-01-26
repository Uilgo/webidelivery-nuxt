<script setup lang="ts" generic="T extends Record<string, unknown>">
/**
 * 📊 TabelaRelatorio
 *
 * Wrapper moderno para tabelas de relatórios.
 * Funcionalidades:
 * - Paginação integrada com design moderno
 * - Busca rápida com input estilizado
 * - Seletor de itens por página discreto
 * - Ordenação visual
 * - Loading states otimizados
 * - Exportação (slot opcional)
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
	/** Itens por página inicial */
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
	const total = dadosOrdenados.value.length;
	if (total === 0) return { inicio: 0, fim: 0, total: 0 };

	const inicio = (paginaAtual.value - 1) * itensPorPaginaAtual.value + 1;
	const fim = Math.min(paginaAtual.value * itensPorPaginaAtual.value, total);
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
	<div
		class="tabela-relatorio bg-white dark:bg-gray-800 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-black/20 border border-gray-100 dark:border-gray-700/50 overflow-hidden"
	>
		<!-- Barra de Controles (Toolbar) -->
		<div
			class="p-4 border-b border-gray-100 dark:border-gray-700/50 flex flex-col sm:flex-row items-center gap-4 justify-between bg-gray-50/50 dark:bg-gray-800/50"
		>
			<!-- Busca -->
			<div v-if="busca" class="relative w-full sm:w-72 group">
				<div
					class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors"
				>
					<Icon name="lucide:search" class="h-4 w-4" />
				</div>
				<input
					v-model="termoBusca"
					type="text"
					:placeholder="buscaPlaceholder"
					class="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all sm:text-sm"
					@input="handleBusca"
				/>
			</div>

			<!-- Ações Extras (Exportar, Filtros) -->
			<div class="flex items-center gap-2 w-full sm:w-auto justify-end">
				<slot name="actions"></slot>

				<!-- Seletor de Itens por Página -->
				<div v-if="paginacao" class="flex items-center gap-2">
					<span
						class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
						>Mostrar:</span
					>
					<div class="relative">
						<select
							:value="itensPorPaginaAtual"
							class="appearance-none block w-full pl-3 pr-8 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 sm:text-sm transition-colors cursor-pointer"
							@change="(e) => mudarItensPorPagina(Number((e.target as HTMLSelectElement).value))"
						>
							<option v-for="opt in opcoesItensPorPagina" :key="opt" :value="opt">
								{{ opt }}
							</option>
						</select>
						<div
							class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500"
						>
							<Icon name="lucide:chevron-down" class="h-3 w-3" />
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Tabela -->
		<div class="overflow-x-auto custom-scrollbar">
			<UiTable
				:columns="colunasTable"
				:data="dadosPaginados"
				:loading="loading"
				:sort-by="colunaOrdenacao"
				:sort-direction="direcaoOrdenacao"
				:empty-text="emptyText"
				:empty-icon="emptyIcon"
				size="md"
				novariant
				class="w-full"
				@sort="handleSort"
			>
				<!-- Slots customizados para células -->
				<template v-for="coluna in colunas" :key="coluna.key" #[`cell-${coluna.key}`]="{ value }">
					<slot :name="`cell-${coluna.key}`" :value="value">
						<span class="text-sm text-gray-700 dark:text-gray-300">
							{{ formatarValor(value, coluna) }}
						</span>
					</slot>
				</template>
			</UiTable>
		</div>

		<!-- Footer / Paginação -->
		<div
			v-if="paginacao && totalPaginas > 0"
			class="px-4 py-3 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/30 dark:bg-gray-800/30 flex flex-col sm:flex-row items-center justify-between gap-4"
		>
			<!-- Info -->
			<div class="text-sm text-gray-500 dark:text-gray-400">
				Mostrando
				<span class="font-medium text-gray-900 dark:text-white">{{ infoPaginacao.inicio }}</span> a
				<span class="font-medium text-gray-900 dark:text-white">{{ infoPaginacao.fim }}</span> de
				<span class="font-medium text-gray-900 dark:text-white">{{ infoPaginacao.total }}</span>
				resultados
			</div>

			<!-- Controles -->
			<div class="flex items-center gap-1">
				<UiButton
					variant="ghost"
					size="sm"
					:disabled="paginaAtual === 1"
					icon="lucide:chevrons-left"
					title="Primeira página"
					@click="irParaPagina(1)"
				/>

				<UiButton
					variant="ghost"
					size="sm"
					:disabled="paginaAtual === 1"
					icon="lucide:chevron-left"
					title="Página anterior"
					@click="irParaPagina(paginaAtual - 1)"
				/>

				<!-- Indicador de Página -->
				<div
					class="flex items-center mx-2 px-3 py-1 bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm"
				>
					<span class="text-sm font-medium text-gray-700 dark:text-gray-300">
						{{ paginaAtual }}
					</span>
					<span class="text-gray-400 mx-1">/</span>
					<span class="text-sm text-gray-500 dark:text-gray-400">
						{{ totalPaginas }}
					</span>
				</div>

				<UiButton
					variant="ghost"
					size="sm"
					:disabled="paginaAtual === totalPaginas"
					icon="lucide:chevron-right"
					title="Próxima página"
					@click="irParaPagina(paginaAtual + 1)"
				/>

				<UiButton
					variant="ghost"
					size="sm"
					:disabled="paginaAtual === totalPaginas"
					icon="lucide:chevrons-right"
					title="Última página"
					@click="irParaPagina(totalPaginas)"
				/>
			</div>
		</div>
	</div>
</template>

<style scoped>
/* Custom Scrollbar for heavy tables */
.custom-scrollbar::-webkit-scrollbar {
	height: 8px;
	width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
	background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
	background-color: rgba(156, 163, 175, 0.3);
	border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
	background-color: rgba(156, 163, 175, 0.5);
}
</style>
