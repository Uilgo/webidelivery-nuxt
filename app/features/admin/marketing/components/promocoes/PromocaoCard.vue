<script setup lang="ts">
/**
 * 📌 PromocaoCard
 *
 * Card de exibição de promoção com informações de período e ações.
 * Suporta diferentes tipos de promoção e validação de período.
 */

import type { PromocaoCompleta } from "#shared/types/marketing";

interface Props {
	promocao: PromocaoCompleta;
}

interface Emits {
	edit: [id: string];
	delete: [id: string];
	duplicate: [id: string];
	"toggle-status": [id: string];
	reorder: [id: string, newOrder: number];
	extend: [id: string];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// ========================================
// COMPUTADAS
// ========================================

/**
 * Retorna o ícone baseado no tipo da promoção
 */
const promocaoIcon = computed(() => {
	const icons = {
		desconto_produto: "lucide:tag",
		desconto_categoria: "lucide:layers",
		combo_promocional: "lucide:package",
		leve_pague: "lucide:gift",
	};
	return icons[props.promocao.tipo] || "lucide:percent";
});

/**
 * Retorna a cor do badge baseado no tipo
 */
const tipoBadgeColor = computed(() => {
	const colors = {
		desconto_produto: "blue",
		desconto_categoria: "green",
		combo_promocional: "purple",
		leve_pague: "orange",
	};
	return colors[props.promocao.tipo] || "gray";
});

/**
 * Retorna o texto do tipo da promoção
 */
const tipoText = computed(() => {
	const texts = {
		desconto_produto: "Produto",
		desconto_categoria: "Categoria",
		combo_promocional: "Combo",
		leve_pague: "Leve & Pague",
	};
	return texts[props.promocao.tipo] || "Desconhecido";
});

/**
 * Retorna o status da promoção baseado no período e ativo
 */
const promocaoStatus = computed(() => {
	if (!props.promocao.ativo) {
		return { text: "Inativa", color: "gray" };
	}

	if (!props.promocao.periodo_valido) {
		return { text: "Expirada", color: "red" };
	}

	return { text: "Ativa", color: "green" };
});

/**
 * Formata o valor do desconto baseado no tipo
 */
const descontoFormatado = computed(() => {
	const { desconto, tipo } = props.promocao;

	switch (tipo) {
		case "desconto_produto":
		case "desconto_categoria":
		case "leve_pague":
			return `${desconto}%`;
		case "combo_promocional":
			return `R$ ${desconto.toFixed(2)}`;
		default:
			return `${desconto}%`;
	}
});

/**
 * Formata as datas de início e fim
 */
const periodoFormatado = computed(() => {
	const inicio = new Date(props.promocao.data_inicio).toLocaleDateString("pt-BR");

	if (props.promocao.data_fim) {
		const fim = new Date(props.promocao.data_fim).toLocaleDateString("pt-BR");
		return `${inicio} - ${fim}`;
	}

	return `A partir de ${inicio}`;
});

/**
 * Retorna informações sobre dias restantes
 */
const diasRestantesInfo = computed(() => {
	const { dias_restantes } = props.promocao;

	if (dias_restantes === null) {
		return { text: "Sem prazo", color: "blue" };
	}

	if (dias_restantes < 0) {
		return { text: "Expirada", color: "red" };
	}

	if (dias_restantes === 0) {
		return { text: "Expira hoje", color: "orange" };
	}

	if (dias_restantes <= 3) {
		return { text: `${dias_restantes} dias`, color: "orange" };
	}

	return { text: `${dias_restantes} dias`, color: "green" };
});

// ========================================
// HANDLERS
// ========================================

const handleEdit = (): void => {
	emit("edit", props.promocao.id);
};

const handleDelete = (): void => {
	emit("delete", props.promocao.id);
};

const handleDuplicate = (): void => {
	emit("duplicate", props.promocao.id);
};

const handleToggleStatus = (): void => {
	emit("toggle-status", props.promocao.id);
};

const handleReorder = (direction: "up" | "down"): void => {
	const currentOrder = props.promocao.ordem;
	const newOrder = direction === "up" ? currentOrder - 1 : currentOrder + 1;

	// Validar se a nova ordem é válida (será validada também no backend)
	if (newOrder < 1) return;

	emit("reorder", props.promocao.id, newOrder);
};

const handleExtend = (): void => {
	emit("extend", props.promocao.id);
};
</script>

<template>
	<UiCard class="group hover:shadow-md transition-shadow duration-200">
		<!-- Header do Card -->
		<div class="p-4 border-b border-[var(--border-default)]">
			<div class="flex items-start justify-between">
				<div class="flex items-start gap-3 flex-1 min-w-0">
					<!-- Ícone do tipo -->
					<div
						class="flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--primary-light)] flex items-center justify-center"
					>
						<Icon :name="promocaoIcon" class="w-5 h-5 text-[var(--primary)]" />
					</div>

					<!-- Informações principais -->
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2 mb-1">
							<h3 class="font-medium text-[var(--text-primary)] truncate">
								{{ promocao.nome }}
							</h3>
							<UiBadge :color="tipoBadgeColor" size="sm">
								{{ tipoText }}
							</UiBadge>
						</div>

						<p v-if="promocao.descricao" class="text-sm text-[var(--text-muted)] line-clamp-2 mb-2">
							{{ promocao.descricao }}
						</p>

						<div class="flex items-center gap-4 text-xs text-[var(--text-muted)]">
							<span>Ordem: {{ promocao.ordem }}</span>
							<span>{{ periodoFormatado }}</span>
						</div>
					</div>
				</div>

				<!-- Status Toggle -->
				<UiSwitch
					:model-value="promocao.ativo"
					size="sm"
					@update:model-value="handleToggleStatus"
				/>
			</div>
		</div>

		<!-- Informações da Promoção -->
		<div class="p-4">
			<div class="flex items-center justify-between mb-3">
				<!-- Desconto -->
				<div class="text-center">
					<div class="text-2xl font-bold text-[var(--primary)]">
						{{ descontoFormatado }}
					</div>
					<div class="text-xs text-[var(--text-muted)]">Desconto</div>
				</div>

				<!-- Status -->
				<div class="text-center">
					<UiBadge :color="promocaoStatus.color" size="sm">
						{{ promocaoStatus.text }}
					</UiBadge>
					<div class="text-xs text-[var(--text-muted)] mt-1">Status</div>
				</div>

				<!-- Dias restantes -->
				<div class="text-center">
					<UiBadge :color="diasRestantesInfo.color" size="sm">
						{{ diasRestantesInfo.text }}
					</UiBadge>
					<div class="text-xs text-[var(--text-muted)] mt-1">Restante</div>
				</div>
			</div>

			<!-- Barra de progresso do período (se tiver data fim) -->
			<div v-if="promocao.data_fim && promocao.periodo_valido" class="mb-3">
				<div class="w-full bg-gray-200 rounded-full h-2">
					<div
						class="h-2 rounded-full transition-all duration-300"
						:class="{
							'bg-green-500': diasRestantesInfo.color === 'green',
							'bg-orange-500': diasRestantesInfo.color === 'orange',
							'bg-red-500': diasRestantesInfo.color === 'red',
						}"
						:style="{
							width: `${Math.max(0, Math.min(100, ((promocao.dias_restantes || 0) / 30) * 100))}%`,
						}"
					></div>
				</div>
			</div>
		</div>

		<!-- Footer com ações -->
		<div class="px-4 pb-4">
			<div class="flex items-center justify-between">
				<!-- Controles de ordem -->
				<div class="flex items-center gap-1">
					<UiButton variant="ghost" size="sm" class="!w-8 !h-8 !p-0" @click="handleReorder('up')">
						<Icon name="lucide:chevron-up" class="w-4 h-4" />
					</UiButton>
					<UiButton variant="ghost" size="sm" class="!w-8 !h-8 !p-0" @click="handleReorder('down')">
						<Icon name="lucide:chevron-down" class="w-4 h-4" />
					</UiButton>
				</div>

				<!-- Ações principais -->
				<div class="flex items-center gap-1">
					<!-- Botão estender (apenas se expirar em breve ou expirada) -->
					<UiButton
						v-if="
							promocao.data_fim &&
							(diasRestantesInfo.color === 'orange' || diasRestantesInfo.color === 'red')
						"
						variant="ghost"
						size="sm"
						class="!w-8 !h-8 !p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
						@click="handleExtend"
					>
						<Icon name="lucide:calendar-plus" class="w-4 h-4" />
					</UiButton>

					<UiButton variant="ghost" size="sm" class="!w-8 !h-8 !p-0" @click="handleDuplicate">
						<Icon name="lucide:copy" class="w-4 h-4" />
					</UiButton>
					<UiButton variant="ghost" size="sm" class="!w-8 !h-8 !p-0" @click="handleEdit">
						<Icon name="lucide:edit" class="w-4 h-4" />
					</UiButton>
					<UiButton
						variant="ghost"
						size="sm"
						class="!w-8 !h-8 !p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
						@click="handleDelete"
					>
						<Icon name="lucide:trash" class="w-4 h-4" />
					</UiButton>
				</div>
			</div>
		</div>

		<!-- Indicador de status inativo -->
		<div
			v-if="!promocao.ativo"
			class="absolute inset-0 bg-black/10 flex items-center justify-center rounded-lg"
		>
			<UiBadge color="gray">Inativa</UiBadge>
		</div>

		<!-- Indicador de expirada -->
		<div
			v-else-if="!promocao.periodo_valido"
			class="absolute inset-0 bg-red-500/10 flex items-center justify-center rounded-lg"
		>
			<UiBadge color="red">Expirada</UiBadge>
		</div>
	</UiCard>
</template>
