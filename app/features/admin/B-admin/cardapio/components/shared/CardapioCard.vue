<script setup lang="ts" generic="T extends Record<string, unknown>">
/**
 * 📌 CardapioCard - Componente Card Genérico para Cardápio
 *
 * Componente reutilizável para exibir itens do cardápio (categorias, produtos, adicionais, combos).
 * Configurável através de props para adaptar-se a diferentes tipos de dados.
 * Estrutura consistente com botão "Ver Mais" sempre na parte inferior.
 * Baseado no componente UiCard para consistência visual.
 */

interface CardConfig {
	// Campos de dados
	nameField: string;
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
	config: CardConfig;
	isSelected?: boolean;
}

interface Emits {
	click: [item: T];
	viewMore: [item: T];
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
 * Classes computadas para o wrapper do card
 */
const wrapperClasses = computed(() => {
	const isActive =
		getFieldValue(props.config.statusField) === props.config.statusConfig.activeValue;

	return [
		"cardapio-card-wrapper",
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
 * Formatar preço específico para produtos
 */
const formatPrice = (value: unknown): string => {
	if (typeof value === "number") {
		return `R$ ${value.toFixed(2).replace(".", ",")}`;
	}
	return "R$ 0,00";
};

/**
 * Status do item para badge
 */
const itemStatus = computed(() => {
	const isActive =
		getFieldValue(props.config.statusField) === props.config.statusConfig.activeValue;
	return {
		text: isActive ? props.config.statusConfig.activeText : props.config.statusConfig.inactiveText,
		variant: isActive
			? props.config.statusConfig.activeVariant
			: props.config.statusConfig.inactiveVariant,
	};
});

/**
 * Handlers de eventos
 */
const handleClick = (): void => {
	emit("click", props.item);
};

const handleViewMore = (event: Event): void => {
	event.stopPropagation();
	emit("viewMore", props.item);
};
</script>

<template>
	<div :class="wrapperClasses">
		<UiCard clickable fill-height size="md" class="cardapio-card group" @click="handleClick">
			<template #content>
				<div class="h-full flex flex-col">
					<!-- Imagem -->
					<div
						class="aspect-[4/3] w-full overflow-hidden rounded-md bg-[var(--bg-muted)] mb-3 relative"
					>
						<img
							v-if="getStringFieldValue(config.imageField)"
							:src="getStringFieldValue(config.imageField)"
							:alt="`Imagem de ${getStringFieldValue(config.nameField)}`"
							class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
						/>
						<div
							v-else
							class="flex h-full w-full items-center justify-center text-[var(--text-muted)]"
						>
							<Icon name="lucide:image" class="h-5 w-5" />
						</div>

						<!-- Categoria Badge (Overlay) -->
						<div
							v-if="config.categoryField && getStringFieldValue(config.categoryField)"
							class="absolute bottom-1.5 left-1.5 px-3 py-2 rounded-md bg-black/60 backdrop-blur-[2px] border border-white/10 shadow-sm flex items-center justify-center"
						>
							<span class="text-[10px] font-bold text-white uppercase tracking-wider leading-none">
								{{ getStringFieldValue(config.categoryField) }}
							</span>
						</div>
					</div>

					<!-- Conteúdo que cresce -->
					<div class="flex-1 flex flex-col justify-between">
						<!-- Informações do item -->
						<div class="space-y-2">
							<!-- Cabeçalho com nome e status -->
							<div class="flex items-start justify-between gap-2">
								<h3
									class="truncate font-medium text-[var(--text-primary)] text-base flex-1 leading-tight"
								>
									{{ getStringFieldValue(config.nameField) }}
								</h3>
								<UiBadge :variant="itemStatus.variant" class="text-xs px-2 py-1 scale-90 shrink-0">
									{{ itemStatus.text }}
								</UiBadge>
							</div>

							<!-- Layout Flexível de Rodapé -->
							<div class="flex items-end justify-between gap-2 mt-1">
								<!-- Lado Esquerdo: Infos -->
								<div
									class="flex items-center gap-2 text-sm text-[var(--text-muted)] truncate min-w-0"
								>
									<!-- Primary Info -->
									<span v-if="config.primaryInfo" class="flex items-center gap-1 truncate">
										<Icon :name="config.primaryInfo.icon" class="h-3.5 w-3.5 shrink-0" />
										<span class="truncate">
											{{
												formatValue(
													getFieldValue(config.primaryInfo.field),
													config.primaryInfo.format,
												)
											}}
											{{ config.primaryInfo.label }}
										</span>
									</span>

									<!-- Secondary Info (Aparece AQUI se tiver PriceField - ex: Combo) -->
									<span
										v-if="config.secondaryInfo && config.priceField"
										class="flex items-center gap-1 shrink-0 border-l pl-2 border-neutral-200 dark:border-neutral-700"
									>
										<Icon :name="config.secondaryInfo.icon" class="h-3.5 w-3.5" />
										<span>
											{{
												formatValue(
													getFieldValue(config.secondaryInfo.field),
													config.secondaryInfo.format,
												)
											}}
										</span>
									</span>
								</div>

								<!-- Lado Direito: Preço ou Secondary Info -->
								<div class="shrink-0 flex items-center justify-end leading-none">
									<!-- Opção A: Preço (Prioridade) -->
									<div
										v-if="config.priceField"
										class="text-base font-semibold text-[var(--success)]"
									>
										{{ formatPrice(getFieldValue(config.priceField)) }}
									</div>

									<!-- Opção B: Secondary Info (Aparece AQUI se NÃO tiver preço - ex: Categoria) -->
									<span
										v-else-if="config.secondaryInfo"
										class="flex items-center gap-1 text-sm text-[var(--text-muted)]"
									>
										<Icon :name="config.secondaryInfo.icon" class="h-3.5 w-3.5" />
										<span>
											{{
												formatValue(
													getFieldValue(config.secondaryInfo.field),
													config.secondaryInfo.format,
												)
											}}
										</span>
									</span>
								</div>
							</div>
						</div>

						<!-- Botão sempre na parte inferior -->
						<div class="mt-3">
							<UiButton variant="solid" size="sm" class="w-full" @click="handleViewMore">
								Ver Mais
							</UiButton>
						</div>
					</div>
				</div>
			</template>
		</UiCard>
	</div>
</template>

<style scoped>
.cardapio-card-wrapper:hover .cardapio-card {
	transform: translateY(-1px);
}
</style>
