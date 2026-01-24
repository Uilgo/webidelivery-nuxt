<script setup lang="ts">
/**
 * 📌 CupomsList
 *
 * Lista de cupons em formato HORIZONTAL (cards em linha).
 * Mesmo padrão usado em PedidoListaItem - layout horizontal com ações.
 */

import { formatCurrency } from "../../../../../../lib/formatters/currency";
import type { CupomCompleto } from "#shared/types/marketing";

interface Props {
	cupons: CupomCompleto[];
}

interface Emits {
	edit: [id: string];
	delete: [id: string];
	duplicate: [id: string];
	"toggle-status": [id: string];
	validate: [codigo: string];
}

defineProps<Props>();
const emit = defineEmits<Emits>();

// ========================================
// COMPUTADAS
// ========================================

/**
 * Retorna o ícone baseado no tipo do cupom
 */
const getCupomIcon = (tipo: string): string => {
	const icons = {
		percentual: "lucide:zap",
		valor_fixo: "lucide:banknote",
		frete_gratis: "lucide:truck",
	};
	return icons[tipo as keyof typeof icons] || "lucide:ticket";
};

/**
 * Retorna o texto do tipo do cupom
 */
const getTipoText = (tipo: string): string => {
	const tipos = {
		percentual: "Percentual",
		valor_fixo: "Valor Fixo",
		frete_gratis: "Frete Grátis",
	};
	return tipos[tipo as keyof typeof tipos] || tipo;
};

/**
 * Retorna o desconto formatado
 */
const getDescontoFormatado = (cupom: CupomCompleto): string => {
	const { valor_desconto, tipo } = cupom;

	switch (tipo) {
		case "percentual":
			return `${valor_desconto}%`;
		case "valor_fixo":
			return formatCurrency(valor_desconto);
		case "frete_gratis":
			return "Grátis";
		default:
			return `${valor_desconto}%`;
	}
};

/**
 * Retorna configuração do status
 */
const getStatusConfig = (cupom: CupomCompleto) => {
	if (!cupom.ativo) {
		return { variant: "error" as const, text: "Inativo", icon: "lucide:x-circle" };
	}

	if (!cupom.periodo_valido) {
		return { variant: "error" as const, text: "Expirado", icon: "lucide:calendar-x" };
	}

	if (cupom.limite_uso && cupom.usos_realizados >= cupom.limite_uso) {
		return { variant: "warning" as const, text: "Esgotado", icon: "lucide:alert-triangle" };
	}

	return { variant: "success" as const, text: "Ativo", icon: "lucide:check-circle" };
};

/**
 * Retorna informações sobre uso
 */
const getUsoInfo = (cupom: CupomCompleto): string => {
	if (!cupom.limite_uso) {
		return `${cupom.usos_realizados} usos`;
	}
	return `${cupom.usos_realizados}/${cupom.limite_uso}`;
};

/**
 * Retorna informações sobre expiração
 */
const getExpiracaoInfo = (cupom: CupomCompleto): string => {
	if (!cupom.data_expiracao) {
		return "Sem prazo";
	}

	const dataExpiracao = new Date(cupom.data_expiracao);
	const hoje = new Date();
	const diffDias = Math.ceil((dataExpiracao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

	if (diffDias < 0) {
		return "Expirado";
	}

	if (diffDias <= 7) {
		return `${diffDias}d restantes`;
	}

	return dataExpiracao.toLocaleDateString("pt-BR");
};

// ========================================
// HANDLERS
// ========================================

const handleEdit = (cupomId: string): void => {
	emit("edit", cupomId);
};

const handleDelete = (cupomId: string): void => {
	emit("delete", cupomId);
};

const handleDuplicate = (cupomId: string): void => {
	emit("duplicate", cupomId);
};

const handleToggleStatus = (cupomId: string): void => {
	emit("toggle-status", cupomId);
};

const handleValidate = (codigo: string): void => {
	emit("validate", codigo);
};
</script>

<template>
	<div class="space-y-3">
		<!-- Lista de Cards Horizontais -->
		<div
			v-for="cupom in cupons"
			:key="cupom.id"
			class="group relative flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-surface)] hover:opacity-95 cursor-pointer transition-all duration-200 border border-[var(--border-muted)]"
			:class="{ 'opacity-60': !cupom.ativo }"
			@click="handleEdit(cupom.id)"
		>
			<!-- Ícone do Tipo (Esquerda) -->
			<div
				class="w-12 h-12 shrink-0 flex items-center justify-center rounded-lg bg-[var(--bg-muted)]"
			>
				<Icon :name="getCupomIcon(cupom.tipo)" class="h-6 w-6 text-[var(--text-muted)]" />
			</div>

			<!-- Conteúdo Principal (Centro) -->
			<div class="flex-1 min-w-0 flex flex-col gap-1">
				<!-- Código e Tipo -->
				<div class="flex items-center gap-3">
					<h3 class="font-mono font-bold text-[var(--text-primary)] text-lg">
						{{ cupom.codigo }}
					</h3>
					<UiBadge size="sm" variant="outline">
						{{ getTipoText(cupom.tipo) }}
					</UiBadge>
				</div>

				<!-- Descrição -->
				<p v-if="cupom.descricao" class="text-sm text-[var(--text-secondary)] line-clamp-1">
					{{ cupom.descricao }}
				</p>

				<!-- Informações adicionais -->
				<div class="flex items-center gap-4 text-sm text-[var(--text-muted)]">
					<!-- Valor Mínimo -->
					<span v-if="cupom.valor_minimo" class="flex items-center gap-1">
						<Icon name="lucide:shopping-cart" class="h-3.5 w-3.5" />
						<span>Min: {{ formatCurrency(cupom.valor_minimo) }}</span>
					</span>

					<!-- Uso -->
					<span class="flex items-center gap-1">
						<Icon name="lucide:users" class="h-3.5 w-3.5" />
						<span>{{ getUsoInfo(cupom) }}</span>
					</span>

					<!-- Expiração -->
					<span class="flex items-center gap-1">
						<Icon name="lucide:calendar" class="h-3.5 w-3.5" />
						<span>{{ getExpiracaoInfo(cupom) }}</span>
					</span>
				</div>
			</div>

			<!-- Desconto (Centro-Direita) -->
			<div class="flex-shrink-0 text-center">
				<div class="text-2xl font-bold text-[var(--primary)]">
					{{ getDescontoFormatado(cupom) }}
				</div>
				<div class="text-xs text-[var(--text-muted)]">desconto</div>
			</div>

			<!-- Status e Ações (Direita) -->
			<div class="flex items-center gap-4 shrink-0">
				<!-- Toggle Status + Badge -->
				<div class="flex items-center gap-3">
					<button
						type="button"
						:class="[
							'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2',
							cupom.ativo ? 'bg-[var(--success)]' : 'bg-[var(--border-strong)]',
						]"
						role="switch"
						:aria-checked="cupom.ativo"
						:title="cupom.ativo ? 'Desativar' : 'Ativar'"
						@click.stop="handleToggleStatus(cupom.id)"
					>
						<span
							:class="[
								'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
								cupom.ativo ? 'translate-x-5' : 'translate-x-0',
							]"
						></span>
					</button>

					<!-- Badge de Status -->
					<UiBadge :variant="getStatusConfig(cupom).variant" size="sm">
						<template #iconLeft>
							<Icon :name="getStatusConfig(cupom).icon" class="w-3 h-3" />
						</template>
						{{ getStatusConfig(cupom).text }}
					</UiBadge>
				</div>

				<!-- Separador Vertical -->
				<div class="h-8 w-px bg-[var(--border-default)]"></div>

				<!-- Botões de Ação -->
				<div class="flex items-center gap-0.5">
					<!-- Validar -->
					<button
						type="button"
						class="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-active)] hover:text-blue-600 transition-all duration-150 flex items-center justify-center"
						title="Validar cupom"
						@click.stop="handleValidate(cupom.codigo)"
					>
						<Icon name="lucide:shield-check" class="h-4 w-4" />
					</button>

					<!-- Duplicar -->
					<button
						type="button"
						class="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-active)] hover:text-[var(--text-primary)] transition-all duration-150 flex items-center justify-center"
						title="Duplicar"
						@click.stop="handleDuplicate(cupom.id)"
					>
						<Icon name="lucide:copy" class="h-4 w-4" />
					</button>

					<!-- Editar -->
					<button
						type="button"
						class="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-active)] hover:text-[var(--text-primary)] transition-all duration-150 flex items-center justify-center"
						title="Editar"
						@click.stop="handleEdit(cupom.id)"
					>
						<Icon name="lucide:pencil" class="h-4 w-4" />
					</button>

					<!-- Excluir -->
					<button
						type="button"
						class="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-active)] hover:text-red-600 transition-all duration-150 flex items-center justify-center"
						title="Excluir"
						@click.stop="handleDelete(cupom.id)"
					>
						<Icon name="lucide:trash-2" class="h-4 w-4" />
					</button>
				</div>
			</div>
		</div>

		<!-- Estado vazio -->
		<div v-if="cupons.length === 0" class="text-center py-12">
			<Icon name="lucide:ticket" class="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)]" />
			<p class="text-[var(--text-muted)]">Nenhum cupom encontrado</p>
		</div>
	</div>
</template>
