<script setup lang="ts">
/**
 * 📌 PromocoesList
 *
 * Lista de promoções em formato tabela.
 * Suporte a ações individuais e ordenação por botões.
 */

import type { PromocaoCompleta } from "#shared/types/marketing";

interface Props {
	promocoes: PromocaoCompleta[];
}

interface Emits {
	edit: [id: string];
	delete: [id: string];
	duplicate: [id: string];
	"toggle-status": [id: string];
	reorder: [id: string, newOrder: number];
	extend: [id: string];
}

const _props = defineProps<Props>();
const emit = defineEmits<Emits>();

// ========================================
// COMPUTADAS
// ========================================

/**
 * Retorna o texto do tipo da promoção
 */
const getTipoText = (tipo: string): string => {
	const texts = {
		desconto_produto: "Produto",
		desconto_categoria: "Categoria",
		combo_promocional: "Combo",
		leve_pague: "Leve & Pague",
	};
	return texts[tipo as keyof typeof texts] || "Desconhecido";
};

/**
 * Retorna o desconto formatado
 */
const getDescontoFormatado = (promocao: PromocaoCompleta): string => {
	const { desconto, tipo } = promocao;

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
};

/**
 * Retorna o status da promoção
 */
const _getPromocaoStatus = (promocao: PromocaoCompleta) => {
	if (!promocao.ativo) {
		return { text: "Inativa", color: "gray" };
	}

	if (!promocao.periodo_valido) {
		return { text: "Expirada", color: "red" };
	}

	return { text: "Ativa", color: "green" };
};

/**
 * Retorna informações sobre dias restantes
 */
const getDiasRestantesInfo = (promocao: PromocaoCompleta) => {
	const { dias_restantes } = promocao;

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
		return { text: `${dias_restantes}d`, color: "orange" };
	}

	return { text: `${dias_restantes}d`, color: "green" };
};

/**
 * Formata o período da promoção
 */
const getPeriodoFormatado = (promocao: PromocaoCompleta): string => {
	const inicio = new Date(promocao.data_inicio).toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
	});

	if (promocao.data_fim) {
		const fim = new Date(promocao.data_fim).toLocaleDateString("pt-BR", {
			day: "2-digit",
			month: "2-digit",
		});
		return `${inicio} - ${fim}`;
	}

	return `A partir de ${inicio}`;
};

// ========================================
// HANDLERS
// ========================================

/**
 * Handler para editar promoção
 */
const handleEdit = (promocaoId: string): void => {
	emit("edit", promocaoId);
};

/**
 * Handler para excluir promoção
 */
const handleDelete = (promocaoId: string): void => {
	emit("delete", promocaoId);
};

/**
 * Handler para duplicar promoção
 */
const handleDuplicate = (promocaoId: string): void => {
	emit("duplicate", promocaoId);
};

/**
 * Handler para alternar status
 */
const handleToggleStatus = (promocaoId: string): void => {
	emit("toggle-status", promocaoId);
};

/**
 * Handler para reordenar promoção
 */
const handleReorder = (promocaoId: string, direction: "up" | "down"): void => {
	const currentPromocao = _props.promocoes.find((p) => p.id === promocaoId);
	if (!currentPromocao) return;

	const currentOrder = currentPromocao.ordem;
	const newOrder = direction === "up" ? currentOrder - 1 : currentOrder + 1;

	// Validar se a nova ordem é válida
	if (newOrder < 1 || newOrder > _props.promocoes.length) return;

	emit("reorder", promocaoId, newOrder);
};

/**
 * Handler para estender promoção
 */
const handleExtend = (promocaoId: string): void => {
	emit("extend", promocaoId);
};
</script>

<template>
	<div class="space-y-4">
		<!-- Tabela -->
		<div class="overflow-hidden border border-[var(--border-default)] rounded-lg">
			<table class="w-full">
				<thead class="bg-[var(--bg-muted)]">
					<tr>
						<th class="px-4 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">
							Promoção
						</th>
						<th class="px-4 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">
							Tipo
						</th>
						<th class="px-4 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">
							Desconto
						</th>
						<th class="px-4 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">
							Período
						</th>
						<th class="px-4 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">
							Restante
						</th>
						<th class="px-4 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">
							Ordem
						</th>
						<th class="px-4 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">
							Status
						</th>
						<th class="px-4 py-3 text-left text-sm font-medium text-[var(--text-secondary)] w-40">
							Ações
						</th>
					</tr>
				</thead>

				<tbody class="divide-y divide-[var(--border-muted)]">
					<tr
						v-for="promocao in promocoes"
						:key="promocao.id"
						class="group hover:bg-[var(--bg-hover)] transition-colors"
						:class="{ 'opacity-50': !promocao.ativo }"
					>
						<!-- Promoção Info -->
						<td class="px-4 py-3">
							<div class="min-w-0">
								<div class="font-medium text-[var(--text-primary)] truncate">
									{{ promocao.nome }}
								</div>
								<div v-if="promocao.descricao" class="text-sm text-[var(--text-muted)] truncate">
									{{ promocao.descricao }}
								</div>
							</div>
						</td>

						<!-- Tipo -->
						<td class="px-4 py-3">
							<UiBadge size="sm">
								{{ getTipoText(promocao.tipo) }}
							</UiBadge>
						</td>

						<!-- Desconto -->
						<td class="px-4 py-3">
							<span class="font-medium text-[var(--primary)]">
								{{ getDescontoFormatado(promocao) }}
							</span>
						</td>

						<!-- Período -->
						<td class="px-4 py-3">
							<span class="text-sm text-[var(--text-muted)]">
								{{ getPeriodoFormatado(promocao) }}
							</span>
						</td>

						<!-- Dias Restantes -->
						<td class="px-4 py-3">
							<UiBadge :color="getDiasRestantesInfo(promocao).color" size="sm">
								{{ getDiasRestantesInfo(promocao).text }}
							</UiBadge>
						</td>

						<!-- Ordem -->
						<td class="px-4 py-3">
							<div class="flex items-center gap-1">
								<span class="text-sm text-[var(--text-muted)]">{{ promocao.ordem }}</span>
								<div class="flex flex-col gap-0.5 ml-2">
									<UiButton
										variant="ghost"
										size="sm"
										class="!w-5 !h-5 !p-0"
										@click="handleReorder(promocao.id, 'up')"
									>
										<Icon name="lucide:chevron-up" class="w-3 h-3" />
									</UiButton>
									<UiButton
										variant="ghost"
										size="sm"
										class="!w-5 !h-5 !p-0"
										@click="handleReorder(promocao.id, 'down')"
									>
										<Icon name="lucide:chevron-down" class="w-3 h-3" />
									</UiButton>
								</div>
							</div>
						</td>

						<!-- Status -->
						<td class="px-4 py-3">
							<UiSwitch
								:model-value="promocao.ativo"
								size="sm"
								@update:model-value="handleToggleStatus(promocao.id)"
							/>
						</td>

						<!-- Ações -->
						<td class="px-4 py-3">
							<div class="flex items-center gap-1">
								<!-- Botão estender (apenas se expirar em breve ou expirada) -->
								<UiButton
									v-if="
										promocao.data_fim &&
										(getDiasRestantesInfo(promocao).color === 'orange' ||
											getDiasRestantesInfo(promocao).color === 'red')
									"
									variant="ghost"
									size="sm"
									class="!w-8 !h-8 !p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
									@click="handleExtend(promocao.id)"
								>
									<Icon name="lucide:calendar-plus" class="w-4 h-4" />
								</UiButton>

								<UiButton
									variant="ghost"
									size="sm"
									class="!w-8 !h-8 !p-0"
									@click="handleDuplicate(promocao.id)"
								>
									<Icon name="lucide:copy" class="w-4 h-4" />
								</UiButton>
								<UiButton
									variant="ghost"
									size="sm"
									class="!w-8 !h-8 !p-0"
									@click="handleEdit(promocao.id)"
								>
									<Icon name="lucide:edit" class="w-4 h-4" />
								</UiButton>
								<UiButton
									variant="ghost"
									size="sm"
									class="!w-8 !h-8 !p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
									@click="handleDelete(promocao.id)"
								>
									<Icon name="lucide:trash" class="w-4 h-4" />
								</UiButton>
							</div>
						</td>
					</tr>
				</tbody>
			</table>
		</div>

		<!-- Estado vazio -->
		<div v-if="promocoes.length === 0" class="text-center py-12">
			<Icon name="lucide:percent" class="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)]" />
			<p class="text-[var(--text-muted)]">Nenhuma promoção encontrada</p>
		</div>
	</div>
</template>
