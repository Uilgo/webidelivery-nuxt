<script setup lang="ts" generic="T extends Record<string, unknown>">
/**
 * 📌 CardapioList - Componente Card Horizontal para Listagem
 *
 * Componente reutilizável para exibir itens do cardápio em formato de lista horizontal.
 * Layout: [Imagem] [Infos] [Ações]
 * Usa a mesma interface de config do CardapioCard para consistência.
 */

interface ListConfig {
	// Campos de dados
	nameField: string;
	descriptionField?: string;
	imageField: string;
	statusField: string;
	// Informações adicionais
	primaryInfo?: {
		field: string;
		label: string;
		icon: string;
		format?: (value: unknown) => string;
	};
	secondaryInfo?: {
		field: string;
		label: string;
		icon: string;
		format?: (value: unknown) => string;
	};
	// Badge de status
	statusConfig: {
		activeValue: unknown;
		activeText: string;
		inactiveText: string;
		activeVariant: "success" | "warning" | "default";
		inactiveVariant: "success" | "warning" | "default";
	};
	// Configurações especiais
	priceField?: string;
	categoryField?: string;
}

interface Props {
	item: T;
	config: ListConfig;
	isSelected?: boolean;
}

interface Emits {
	click: [item: T];
	viewMore: [item: T];
	edit: [item: T];
	delete: [item: T];
	toggleStatus: [item: T];
}

const props = withDefaults(defineProps<Props>(), {
	isSelected: false,
});

const emit = defineEmits<Emits>();

/**
 * Obter valor de um campo do item
 */
const getFieldValue = (field: string): unknown => {
	return props.item[field];
};

/**
 * Obter valor string de um campo (com type guard)
 */
const getStringFieldValue = (field: string): string | undefined => {
	const value = props.item[field];
	return typeof value === "string" ? value : undefined;
};

/**
 * Classes computadas para o wrapper
 */
const wrapperClasses = computed(() => {
	const isActive =
		getFieldValue(props.config.statusField) === props.config.statusConfig.activeValue;

	return [
		"cardapio-list-item",
		"relative",
		"transition-all duration-200",
		{
			"ring-2 ring-[var(--primary)]": props.isSelected,
			"opacity-60": !isActive,
		},
	];
});

/**
 * Formatar valor usando função de formatação se disponível
 */
const formatValue = (value: unknown, formatter?: (value: unknown) => string): string => {
	if (formatter) return formatter(value);
	return String(value ?? "");
};

/**
 * Formatar preço
 */
const formatPrice = (value: unknown): string => {
	if (typeof value === "number") {
		return `R$ ${value.toFixed(2).replace(".", ",")}`;
	}
	return "R$ 0,00";
};

/**
 * Handlers de eventos
 */
const handleClick = (): void => {
	emit("click", props.item);
};

const handleEdit = (event: Event): void => {
	event.stopPropagation();
	emit("edit", props.item);
};

const handleDelete = (event: Event): void => {
	event.stopPropagation();
	emit("delete", props.item);
};

const handleToggleStatus = (event: Event): void => {
	event.stopPropagation();
	emit("toggleStatus", props.item);
};
</script>

<template>
	<div :class="wrapperClasses" class="px-1 hover:scale-[1.005] transition-transform duration-200">
		<div
			class="group relative flex items-center gap-4 p-3.5 rounded-xl bg-[var(--bg-surface)] hover:opacity-95 cursor-pointer transition-opacity duration-200"
			@click="handleClick"
		>
			<!-- Imagem (Esquerda) -->
			<div
				class="w-16 h-16 shrink-0 overflow-hidden rounded-lg bg-[var(--bg-muted)] border border-[var(--border-muted)]"
			>
				<img
					v-if="getStringFieldValue(config.imageField)"
					:src="getStringFieldValue(config.imageField)"
					:alt="`Imagem de ${getStringFieldValue(config.nameField)}`"
					class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
				/>
				<div v-else class="flex h-full w-full items-center justify-center text-[var(--text-muted)]">
					<Icon name="lucide:image" class="h-7 w-7" />
				</div>
			</div>

			<!-- Conteúdo (Centro) -->
			<div class="flex-1 min-w-0 flex flex-col gap-1">
				<!-- Nome -->
				<h3 class="font-semibold text-[var(--text-primary)] text-base truncate">
					{{ getStringFieldValue(config.nameField) }}
				</h3>

				<!-- Descrição (se houver) -->
				<p
					v-if="config.descriptionField && getStringFieldValue(config.descriptionField)"
					class="text-sm text-[var(--text-secondary)] line-clamp-1"
				>
					{{ getStringFieldValue(config.descriptionField) }}
				</p>

				<!-- Infos adicionais -->
				<div class="flex items-center gap-3 text-sm text-[var(--text-muted)]">
					<!-- Categoria Badge -->
					<span
						v-if="config.categoryField && getStringFieldValue(config.categoryField)"
						class="flex items-center gap-1"
					>
						<Icon name="lucide:folder" class="h-3.5 w-3.5" />
						<span class="truncate">{{ getStringFieldValue(config.categoryField) }}</span>
					</span>

					<!-- Primary Info -->
					<span v-if="config.primaryInfo" class="flex items-center gap-1">
						<Icon :name="config.primaryInfo.icon" class="h-3.5 w-3.5" />
						<span>
							{{ formatValue(getFieldValue(config.primaryInfo.field), config.primaryInfo.format) }}
							{{ config.primaryInfo.label }}
						</span>
					</span>

					<!-- Secondary Info -->
					<span v-if="config.secondaryInfo" class="flex items-center gap-1">
						<Icon :name="config.secondaryInfo.icon" class="h-3.5 w-3.5" />
						<span>
							{{
								formatValue(getFieldValue(config.secondaryInfo.field), config.secondaryInfo.format)
							}}
							{{ config.secondaryInfo.label }}
						</span>
					</span>
				</div>
			</div>

			<!-- Ações (Direita) -->
			<div class="flex items-center gap-4 shrink-0">
				<!-- Preço (se houver) -->
				<div
					v-if="config.priceField"
					class="text-sm font-semibold text-[var(--success)] min-w-[80px] text-right"
				>
					{{ formatPrice(getFieldValue(config.priceField)) }}
				</div>

				<!-- Toggle Status + Badge -->
				<div class="flex items-center gap-3">
					<button
						type="button"
						:class="[
							'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2',
							getFieldValue(config.statusField) === config.statusConfig.activeValue
								? 'bg-[var(--success)]'
								: 'bg-[var(--border-strong)]',
						]"
						role="switch"
						:aria-checked="getFieldValue(config.statusField) === config.statusConfig.activeValue"
						:title="
							getFieldValue(config.statusField) === config.statusConfig.activeValue
								? 'Desativar'
								: 'Ativar'
						"
						@click.stop="handleToggleStatus"
					>
						<span
							:class="[
								'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
								getFieldValue(config.statusField) === config.statusConfig.activeValue
									? 'translate-x-5'
									: 'translate-x-0',
							]"
						></span>
					</button>

					<!-- Badge de Status -->
					<span
						:class="[
							'inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-sm font-medium whitespace-nowrap min-w-[70px]',
							getFieldValue(config.statusField) === config.statusConfig.activeValue
								? 'bg-[var(--success-light)] text-[var(--success)]'
								: 'bg-[var(--error-light)] text-[var(--error)]',
						]"
					>
						{{
							getFieldValue(config.statusField) === config.statusConfig.activeValue
								? config.statusConfig.activeText
								: config.statusConfig.inactiveText
						}}
					</span>
				</div>

				<!-- Separador Vertical -->
				<div class="h-8 w-px bg-[var(--border-default)]"></div>

				<!-- Botões de Ação -->
				<div class="flex items-center gap-0.5">
					<!-- Editar -->
					<button
						type="button"
						class="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-active)] hover:text-[var(--text-primary)] transition-all duration-150 flex items-center justify-center"
						title="Editar"
						@click.stop="handleEdit"
					>
						<Icon name="lucide:pencil" class="h-4 w-4" />
					</button>

					<!-- Excluir -->
					<button
						type="button"
						class="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-active)] hover:text-[var(--text-primary)] transition-all duration-150 flex items-center justify-center"
						title="Excluir"
						@click.stop="handleDelete"
					>
						<Icon name="lucide:trash-2" class="h-4 w-4" />
					</button>
				</div>
			</div>
		</div>
	</div>
</template>
