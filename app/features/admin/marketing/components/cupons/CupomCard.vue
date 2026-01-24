<script setup lang="ts">
/**
 * 📌 CupomCard
 *
 * Card de exibição de cupom com informações de uso e ações.
 * Suporta diferentes tipos de cupom e validação de status.
 */

import type { CupomCompleto } from "#shared/types/marketing";

interface Props {
	cupom: CupomCompleto;
}

interface Emits {
	edit: [id: string];
	delete: [id: string];
	duplicate: [id: string];
	"toggle-status": [id: string];
	reorder: [id: string, newOrder: number];
	validate: [codigo: string];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// ========================================
// COMPUTADAS
// ========================================

/**
 * Retorna o ícone baseado no tipo do cupom
 */
const cupomIcon = computed(() => {
	const icons = {
		percentual: "lucide:percent",
		valor_fixo: "lucide:banknote",
		frete_gratis: "lucide:truck",
	};
	return icons[props.cupom.tipo] || "lucide:ticket";
});

/**
 * Retorna a cor do badge baseado no tipo
 */
const tipoBadgeColor = computed(() => {
	const colors = {
		percentual: "blue",
		valor_fixo: "green",
		frete_gratis: "purple",
	};
	return colors[props.cupom.tipo] || "gray";
});

/**
 * Retorna o texto do tipo do cupom
 */
const tipoText = computed(() => {
	const texts = {
		percentual: "Percentual",
		valor_fixo: "Valor Fixo",
		frete_gratis: "Frete Grátis",
	};
	return texts[props.cupom.tipo] || "Desconhecido";
});

/**
 * Retorna o status do cupom com cor
 */
const cupomStatus = computed(() => {
	const statusConfig = {
		ativo: { text: "Ativo", color: "green" },
		inativo: { text: "Inativo", color: "gray" },
		expirado: { text: "Expirado", color: "red" },
		esgotado: { text: "Esgotado", color: "orange" },
	};
	return statusConfig[props.cupom.status_cupom] || { text: "Desconhecido", color: "gray" };
});

/**
 * Formata o valor do desconto baseado no tipo
 */
const descontoFormatado = computed(() => {
	const { valor_desconto, tipo } = props.cupom;

	switch (tipo) {
		case "percentual":
			return `${valor_desconto}%`;
		case "valor_fixo":
			return `R$ ${valor_desconto.toFixed(2)}`;
		case "frete_gratis":
			return "Grátis";
		default:
			return `${valor_desconto}%`;
	}
});

/**
 * Informações sobre limite de uso
 */
const limiteUsoInfo = computed(() => {
	const { limite_uso, usos_realizados, usos_restantes } = props.cupom;

	if (!limite_uso) {
		return { text: "Ilimitado", color: "blue" };
	}

	if (usos_restantes === 0) {
		return { text: "Esgotado", color: "red" };
	}

	if (usos_restantes && usos_restantes <= 5) {
		return { text: `${usos_restantes} restantes`, color: "orange" };
	}

	return { text: `${usos_realizados}/${limite_uso}`, color: "green" };
});

/**
 * Informações sobre data de expiração
 */
const expiracaoInfo = computed(() => {
	const { data_expiracao } = props.cupom;

	if (!data_expiracao) {
		return { text: "Sem prazo", color: "blue" };
	}

	const dataExp = new Date(data_expiracao);
	const hoje = new Date();
	const diffTime = dataExp.getTime() - hoje.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

	if (diffDays < 0) {
		return { text: "Expirado", color: "red" };
	}

	if (diffDays === 0) {
		return { text: "Expira hoje", color: "orange" };
	}

	if (diffDays <= 3) {
		return { text: `${diffDays} dias`, color: "orange" };
	}

	return { text: dataExp.toLocaleDateString("pt-BR"), color: "green" };
});

/**
 * Valor mínimo formatado
 */
const valorMinimoFormatado = computed(() => {
	return props.cupom.valor_minimo ? `R$ ${props.cupom.valor_minimo.toFixed(2)}` : "Sem mínimo";
});

// ========================================
// HANDLERS
// ========================================

const handleEdit = (): void => {
	emit("edit", props.cupom.id);
};

const handleDelete = (): void => {
	emit("delete", props.cupom.id);
};

const handleDuplicate = (): void => {
	emit("duplicate", props.cupom.id);
};

const handleToggleStatus = (): void => {
	emit("toggle-status", props.cupom.id);
};

const handleReorder = (direction: "up" | "down"): void => {
	const currentOrder = props.cupom.ordem;
	const newOrder = direction === "up" ? currentOrder - 1 : currentOrder + 1;

	// Validar se a nova ordem é válida (será validada também no backend)
	if (newOrder < 1) return;

	emit("reorder", props.cupom.id, newOrder);
};

const handleValidate = (): void => {
	emit("validate", props.cupom.codigo);
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
						<Icon :name="cupomIcon" class="w-5 h-5 text-[var(--primary)]" />
					</div>

					<!-- Informações principais -->
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2 mb-1">
							<h3 class="font-mono font-bold text-[var(--text-primary)] truncate">
								{{ cupom.codigo }}
							</h3>
							<UiBadge :color="tipoBadgeColor" size="sm">
								{{ tipoText }}
							</UiBadge>
						</div>

						<p v-if="cupom.descricao" class="text-sm text-[var(--text-muted)] line-clamp-2 mb-2">
							{{ cupom.descricao }}
						</p>

						<div class="flex items-center gap-4 text-xs text-[var(--text-muted)]">
							<span>Ordem: {{ cupom.ordem }}</span>
							<span>{{ valorMinimoFormatado }}</span>
						</div>
					</div>
				</div>

				<!-- Status Toggle -->
				<UiSwitch :model-value="cupom.ativo" size="sm" @update:model-value="handleToggleStatus" />
			</div>
		</div>

		<!-- Informações do Cupom -->
		<div class="p-4">
			<div class="grid grid-cols-2 gap-4 mb-4">
				<!-- Desconto -->
				<div class="text-center">
					<div class="text-2xl font-bold text-[var(--primary)]">
						{{ descontoFormatado }}
					</div>
					<div class="text-xs text-[var(--text-muted)]">Desconto</div>
				</div>

				<!-- Status -->
				<div class="text-center">
					<UiBadge :color="cupomStatus.color" size="sm">
						{{ cupomStatus.text }}
					</UiBadge>
					<div class="text-xs text-[var(--text-muted)] mt-1">Status</div>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<!-- Limite de Uso -->
				<div class="text-center">
					<UiBadge :color="limiteUsoInfo.color" size="sm">
						{{ limiteUsoInfo.text }}
					</UiBadge>
					<div class="text-xs text-[var(--text-muted)] mt-1">Uso</div>
				</div>

				<!-- Expiração -->
				<div class="text-center">
					<UiBadge :color="expiracaoInfo.color" size="sm">
						{{ expiracaoInfo.text }}
					</UiBadge>
					<div class="text-xs text-[var(--text-muted)] mt-1">Expira</div>
				</div>
			</div>

			<!-- Barra de progresso do uso (se tiver limite) -->
			<div v-if="cupom.limite_uso" class="mt-4">
				<div class="w-full bg-gray-200 rounded-full h-2">
					<div
						class="h-2 rounded-full transition-all duration-300"
						:class="{
							'bg-green-500': cupom.percentual_uso < 70,
							'bg-orange-500': cupom.percentual_uso >= 70 && cupom.percentual_uso < 90,
							'bg-red-500': cupom.percentual_uso >= 90,
						}"
						:style="{
							width: `${Math.min(100, cupom.percentual_uso)}%`,
						}"
					></div>
				</div>
				<div class="text-xs text-[var(--text-muted)] mt-1 text-center">
					{{ cupom.percentual_uso }}% usado
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
					<!-- Botão validar -->
					<UiButton
						variant="ghost"
						size="sm"
						class="!w-8 !h-8 !p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
						@click="handleValidate"
					>
						<Icon name="lucide:shield-check" class="w-4 h-4" />
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
			v-if="!cupom.ativo"
			class="absolute inset-0 bg-black/10 flex items-center justify-center rounded-lg"
		>
			<UiBadge color="gray">Inativo</UiBadge>
		</div>

		<!-- Indicador de expirado -->
		<div
			v-else-if="cupom.status_cupom === 'expirado'"
			class="absolute inset-0 bg-red-500/10 flex items-center justify-center rounded-lg"
		>
			<UiBadge color="red">Expirado</UiBadge>
		</div>

		<!-- Indicador de esgotado -->
		<div
			v-else-if="cupom.status_cupom === 'esgotado'"
			class="absolute inset-0 bg-orange-500/10 flex items-center justify-center rounded-lg"
		>
			<UiBadge color="orange">Esgotado</UiBadge>
		</div>
	</UiCard>
</template>
