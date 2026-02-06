<script setup lang="ts">
/**
 * 📌 Table Component
 *
 * Componente de tabela reutilizável com suporte a:
 * - Cabeçalhos customizáveis
 * - Ordenação por colunas
 * - Estados de loading e vazio
 * - Seleção de linhas
 * - Ações por linha
 * - Responsividade
 */

interface Column {
	key: string;
	label: string;
	sortable?: boolean;
	width?: string;
	align?: "left" | "center" | "right";
	class?: string;
}

interface Props {
	/** Colunas da tabela */
	columns: Column[];
	/** Dados da tabela */
	data: Record<string, unknown>[];
	/** Estado de loading */
	loading?: boolean;
	/** Coluna atualmente ordenada */
	sortBy?: string;
	/** Direção da ordenação */
	sortDirection?: "asc" | "desc";
	/** Permitir seleção de linhas */
	selectable?: boolean;
	/** Linhas selecionadas */
	selectedRows?: string[];
	/** Chave única para identificar linhas */
	rowKey?: string;
	/** Mostrar cabeçalho */
	showHeader?: boolean;
	/** Tamanho da tabela */
	size?: "sm" | "md" | "lg";
	/** Variante visual */
	variant?: "default" | "striped" | "bordered";
	/** Texto quando não há dados */
	emptyText?: string;
	/** Ícone quando não há dados */
	emptyIcon?: string;
}

interface Emits {
	sort: [column: string, direction: "asc" | "desc"];
	rowClick: [row: Record<string, unknown>, index: number];
	rowSelect: [selectedRows: string[]];
}

const props = withDefaults(defineProps<Props>(), {
	loading: false,
	sortBy: "",
	sortDirection: "asc",
	selectable: false,
	selectedRows: () => [],
	rowKey: "id",
	showHeader: true,
	size: "md",
	variant: "default",
	emptyText: "Nenhum dado encontrado",
	emptyIcon: "lucide:inbox",
});

const emit = defineEmits<Emits>();

/**
 * Classes computadas para a tabela
 */
const tableClasses = computed(() => {
	const baseClasses = [
		"w-full",
		"border-collapse",
		"bg-[var(--bg-surface)]",
		"text-[var(--text-primary)]",
	];

	const variantClasses = {
		default: [],
		striped: ["table-striped"],
		bordered: ["border", "border-[var(--border-default)]"],
	};

	const sizeClasses = {
		sm: ["text-sm"],
		md: ["text-base"],
		lg: ["text-lg"],
	};

	return [...baseClasses, ...variantClasses[props.variant], ...sizeClasses[props.size]].join(" ");
});

/**
 * Classes computadas para células do cabeçalho
 */
const getHeaderCellClasses = (column: Column): string => {
	const baseClasses = [
		"px-4 py-3",
		"text-left",
		"font-medium",
		"text-[var(--text-secondary)]",
		"bg-[var(--bg-muted)]",
		"border-b border-[var(--border-default)]",
		"whitespace-nowrap",
	];

	const alignClasses = {
		left: "text-left",
		center: "text-center",
		right: "text-right",
	};

	const sortableClasses = column.sortable
		? ["cursor-pointer", "hover:bg-[var(--bg-hover)]", "transition-colors"]
		: [];

	return [
		...baseClasses,
		alignClasses[column.align || "left"],
		...sortableClasses,
		column.class || "",
	].join(" ");
};

/**
 * Classes computadas para células do corpo
 */
const getBodyCellClasses = (column: Column): string => {
	const baseClasses = ["px-4 py-3", "border-b border-[var(--border-muted)]", "whitespace-nowrap"];

	const alignClasses = {
		left: "text-left",
		center: "text-center",
		right: "text-right",
	};

	const sizeClasses = {
		sm: ["py-2"],
		md: ["py-3"],
		lg: ["py-4"],
	};

	return [
		...baseClasses,
		alignClasses[column.align || "left"],
		...sizeClasses[props.size],
		column.class || "",
	].join(" ");
};

/**
 * Classes computadas para linhas
 */
const getRowClasses = (row: Record<string, unknown>, index: number): string => {
	const baseClasses = ["transition-colors", "hover:bg-[var(--bg-hover)]", "cursor-pointer"];

	const stripeClasses =
		props.variant === "striped" && index % 2 === 1 ? ["bg-[var(--bg-muted)]"] : [];

	const selectedClasses =
		props.selectable && props.selectedRows.includes(row[props.rowKey] as string)
			? ["bg-[var(--primary-light)]", "border-[var(--primary)]"]
			: [];

	return [...baseClasses, ...stripeClasses, ...selectedClasses].join(" ");
};

/**
 * Handler para ordenação
 */
const handleSort = (column: Column): void => {
	if (!column.sortable) return;

	const newDirection =
		props.sortBy === column.key && props.sortDirection === "asc" ? "desc" : "asc";
	emit("sort", column.key, newDirection);
};

/**
 * Handler para clique na linha
 */
const handleRowClick = (row: Record<string, unknown>, index: number): void => {
	emit("rowClick", row, index);
};

/**
 * Handler para seleção de linha
 */
const handleRowSelect = (row: Record<string, unknown>): void => {
	if (!props.selectable) return;

	const rowId = row[props.rowKey] as string;
	const currentSelection = [...props.selectedRows];
	const index = currentSelection.indexOf(rowId);

	if (index > -1) {
		currentSelection.splice(index, 1);
	} else {
		currentSelection.push(rowId);
	}

	emit("rowSelect", currentSelection);
};

/**
 * Ícone de ordenação
 */
const getSortIcon = (column: Column): string => {
	if (!column.sortable) return "";
	if (props.sortBy !== column.key) return "lucide:chevrons-up-down";
	return props.sortDirection === "asc" ? "lucide:chevron-up" : "lucide:chevron-down";
};
</script>

<template>
	<div class="ui-table-container h-full flex flex-col">
		<!-- Loading State -->
		<div v-if="loading" class="flex-1 flex items-center justify-center">
			<div class="flex flex-col items-center gap-3">
				<Icon name="lucide:loader-2" class="h-8 w-8 animate-spin text-[var(--primary)]" />
				<p class="text-sm text-[var(--text-muted)]">Carregando...</p>
			</div>
		</div>

		<!-- Empty State -->
		<div v-else-if="!data.length" class="flex-1 flex items-center justify-center py-16">
			<div class="flex flex-col items-center gap-4">
				<Icon :name="emptyIcon" class="h-12 w-12 text-[var(--text-muted)]" />
				<p class="text-sm text-[var(--text-muted)]">{{ emptyText }}</p>
			</div>
		</div>

		<!-- Table -->
		<div v-else class="overflow-auto flex-1 min-h-0 relative">
			<table :class="tableClasses">
				<!-- Header -->
				<thead v-if="showHeader" class="sticky top-0 z-10">
					<tr>
						<!-- Checkbox para seleção -->
						<th
							v-if="selectable"
							class="w-12 px-4 py-3 bg-[var(--bg-muted)] border-b border-[var(--border-default)]"
						>
							<UiCheckbox
								:model-value="selectedRows.length === data.length && data.length > 0"
								:indeterminate="selectedRows.length > 0 && selectedRows.length < data.length"
								@update:model-value="
									emit('rowSelect', $event ? data.map((row) => row[rowKey] as string) : [])
								"
							/>
						</th>

						<!-- Colunas -->
						<th
							v-for="column in columns"
							:key="column.key"
							:class="getHeaderCellClasses(column)"
							:style="{ width: column.width }"
							@click="handleSort(column)"
						>
							<div class="flex items-center gap-2">
								<span>{{ column.label }}</span>
								<Icon
									v-if="column.sortable"
									:name="getSortIcon(column)"
									class="h-4 w-4 text-[var(--text-muted)]"
								/>
							</div>
						</th>
					</tr>
				</thead>

				<!-- Body -->
				<tbody>
					<tr
						v-for="(row, index) in data"
						:key="(row[rowKey] as string) || index"
						:class="getRowClasses(row, index)"
						@click="handleRowClick(row, index)"
					>
						<!-- Checkbox para seleção -->
						<td v-if="selectable" class="w-12 px-4 py-3 border-b border-[var(--border-muted)]">
							<UiCheckbox
								:model-value="selectedRows.includes(row[rowKey] as string)"
								@update:model-value="handleRowSelect(row)"
								@click.stop
							/>
						</td>

						<!-- Células de dados -->
						<td v-for="column in columns" :key="column.key" :class="getBodyCellClasses(column)">
							<slot
								:name="`cell-${column.key}`"
								:row="row"
								:column="column"
								:index="index"
								:value="row[column.key]"
							>
								{{ row[column.key] }}
							</slot>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</template>

<style scoped>
/* Striped table */
.table-striped tbody tr:nth-child(even) {
	background-color: var(--bg-muted);
}

/* Responsive table */
.ui-table-container {
	overflow-x: auto;
}

@media (max-width: 768px) {
	.ui-table-container table {
		min-width: 600px;
	}
}
</style>
