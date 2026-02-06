<script setup lang="ts">
/**
 * 📌 UiPagination - Componente de Paginação
 *
 * Componente reutilizável para controle de páginas.
 * Estilo premium com suporte a navegação por números e botões prev/next.
 */

interface Props {
	/** Página atual */
	modelValue: number;
	/** Total de itens */
	total: number;
	/** Itens por página */
	limit: number;
	/** Mostrar resumo (ex: "Mostrando 1-16 de 100") */
	showSummary?: boolean;
	/** Estado de carregamento */
	loading?: boolean;
}

interface Emits {
	"update:modelValue": [page: number];
	change: [page: number];
}

const props = withDefaults(defineProps<Props>(), {
	showSummary: true,
	loading: false,
});

const emit = defineEmits<Emits>();

/**
 * Cálculos de páginas
 */
const totalPages = computed(() => {
	const pages = Math.ceil(props.total / props.limit);
	return pages > 0 ? pages : 1;
});

const hasPrev = computed(() => props.modelValue > 1);
const hasNext = computed(() => props.modelValue < totalPages.value);

/**
 * Lógica para gerar os números das páginas (com ... quando necessário)
 */
const pages = computed(() => {
	const current = props.modelValue;
	const total = totalPages.value;
	const delta = 1; // Quantidade de páginas adjacentes à atual
	const range = [];
	const rangeWithDots: (number | string)[] = [];
	let lastValue: number | undefined;

	// Sempre inclui a primeira página
	range.push(1);

	// Páginas ao redor da atual
	for (let i = current - delta; i <= current + delta; i++) {
		if (i < total && i > 1) {
			range.push(i);
		}
	}

	// Sempre inclui a última página se houver mais de uma
	if (total > 1) {
		range.push(total);
	}

	// Adiciona as reticências
	for (const i of range) {
		if (lastValue !== undefined) {
			if (i - lastValue === 2) {
				rangeWithDots.push(lastValue + 1);
			} else if (i - lastValue !== 1) {
				rangeWithDots.push("...");
			}
		}
		rangeWithDots.push(i);
		lastValue = i;
	}

	return rangeWithDots;
});

/**
 * Handler para mudança de página
 */
const handlePageChange = (page: number | string): void => {
	if (props.loading) return;

	if (typeof page === "number" && page !== props.modelValue) {
		emit("update:modelValue", page);
		emit("change", page);
	}
};

const handlePrev = (): void => {
	if (hasPrev.value) handlePageChange(props.modelValue - 1);
};

const handleNext = (): void => {
	if (hasNext.value) handlePageChange(props.modelValue + 1);
};

/**
 * Texto de resumo
 */
const summaryText = computed(() => {
	const from = (props.modelValue - 1) * props.limit + 1;
	const to = Math.min(props.modelValue * props.limit, props.total);

	if (props.total === 0) return "Nenhum item encontrado";
	return `Mostrando ${from}-${to} de ${props.total}`;
});
</script>

<template>
	<div class="ui-pagination flex items-center justify-between py-3 px-4 select-none">
		<!-- Lado Esquerdo: Resumo -->
		<div v-if="showSummary" class="hidden sm:block text-sm text-[var(--text-muted)] font-medium">
			{{ summaryText }}
		</div>

		<!-- Lado Direito: Controles -->
		<div class="flex items-center gap-1">
			<!-- Botão Anterior -->
			<UiButton
				variant="ghost"
				size="sm"
				class="h-9 w-9 p-0"
				:disabled="!hasPrev || loading"
				@click="handlePrev"
			>
				<Icon name="lucide:chevron-left" class="w-4 h-4" />
			</UiButton>

			<!-- Lista de Páginas -->
			<div class="flex items-center gap-1">
				<template v-for="(page, index) in pages" :key="index">
					<!-- Reticências -->
					<div v-if="page === '...'" class="w-8 flex justify-center text-[var(--text-muted)]">
						<Icon name="lucide:more-horizontal" class="w-4 h-4" />
					</div>

					<!-- Botão de Página -->
					<UiButton
						v-else
						:variant="page === modelValue ? 'solid' : 'ghost'"
						size="sm"
						class="h-9 w-9 p-0 font-medium"
						:class="{ 'pointer-events-none': page === modelValue }"
						:disabled="loading"
						@click="handlePageChange(page as number)"
					>
						{{ page }}
					</UiButton>
				</template>
			</div>

			<!-- Botão Próximo -->
			<UiButton
				variant="ghost"
				size="sm"
				class="h-9 w-9 p-0"
				:disabled="!hasNext || loading"
				@click="handleNext"
			>
				<Icon name="lucide:chevron-right" class="w-4 h-4" />
			</UiButton>
		</div>
	</div>
</template>

<style scoped>
.ui-pagination {
	/* Garante que o container não encolha demais */
	min-width: min-content;
}
</style>
