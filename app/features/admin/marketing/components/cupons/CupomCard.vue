<script setup lang="ts">
/**
 * 📌 CupomCard
 *
 * Card compacto de cupom com desconto em destaque e ações rápidas.
 */

import { formatCurrency } from "../../../../../../lib/formatters/currency";
import type { CupomCompleto } from "#shared/types/marketing";

interface Props {
	cupom: CupomCompleto;
}

interface Emits {
	edit: [id: string];
	delete: [id: string];
	duplicate: [id: string];
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
		percentual: "lucide:zap",
		valor_fixo: "lucide:banknote",
		frete_gratis: "lucide:truck",
	};
	return icons[props.cupom.tipo] || "lucide:ticket";
});

/**
 * Retorna o texto do tipo do cupom
 */
const tipoText = computed(() => {
	const tipos = {
		percentual: "Percentual",
		valor_fixo: "Valor Fixo",
		frete_gratis: "Frete Grátis",
	};
	return tipos[props.cupom.tipo] || "Desconhecido";
});

/**
 * Status do cupom para badge
 */
const cupomStatus = computed(() => {
	if (!props.cupom.ativo) {
		return { text: "Inativo", variant: "default" as const };
	}

	if (!props.cupom.periodo_valido) {
		return { text: "Expirado", variant: "default" as const };
	}

	if (props.cupom.limite_uso && props.cupom.usos_realizados >= props.cupom.limite_uso) {
		return { variant: "warning" as const, text: "Esgotado" };
	}

	return { text: "Ativo", variant: "success" as const };
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
			return formatCurrency(valor_desconto);
		case "frete_gratis":
			return "Grátis";
		default:
			return `${valor_desconto}%`;
	}
});

/**
 * Texto do desconto
 */
const descontoTexto = computed(() => {
	const { tipo } = props.cupom;

	switch (tipo) {
		case "percentual":
			return "de desconto";
		case "valor_fixo":
			return "de desconto";
		case "frete_gratis":
			return "Frete grátis";
		default:
			return "de desconto";
	}
});

/**
 * Informações sobre uso
 */
const usoInfo = computed(() => {
	if (!props.cupom.limite_uso) {
		return `${props.cupom.usos_realizados} usos`;
	}
	return `${props.cupom.usos_realizados}/${props.cupom.limite_uso}`;
});

/**
 * Classes do wrapper
 */
const wrapperClasses = computed(() => {
	return [
		"cupom-card-wrapper",
		"relative",
		"transition-all duration-200",
		{
			"opacity-60": !props.cupom.ativo,
		},
	];
});

// ========================================
// HANDLERS
// ========================================

const handleEdit = (): void => {
	emit("edit", props.cupom.id);
};

const handleDelete = (event: Event): void => {
	event.stopPropagation();
	emit("delete", props.cupom.id);
};

const handleDuplicate = (event: Event): void => {
	event.stopPropagation();
	emit("duplicate", props.cupom.id);
};

const handleValidate = (event: Event): void => {
	event.stopPropagation();
	emit("validate", props.cupom.codigo);
};
</script>

<template>
	<div :class="wrapperClasses">
		<UiCard clickable fill-height size="md" class="cupom-card group" @click="handleEdit">
			<template #content>
				<div class="h-full flex flex-col">
					<!-- Área do Desconto em Destaque (substitui a imagem) -->
					<div
						class="aspect-[4/3] w-full overflow-hidden rounded-md bg-gradient-to-br from-orange-500 to-orange-600 mb-3 relative flex flex-col items-center justify-center text-white p-4"
					>
						<!-- Ícone pequeno no topo -->
						<Icon :name="cupomIcon" class="h-8 w-8 mb-2 opacity-90" />

						<!-- Desconto em destaque -->
						<div class="text-4xl font-black leading-none mb-1">
							{{ descontoFormatado }}
						</div>
						<div class="text-sm font-medium opacity-90">
							{{ descontoTexto }}
						</div>

						<!-- Badge do Tipo (Overlay) -->
						<div
							class="absolute bottom-1.5 left-1.5 px-3 py-2 rounded-md bg-black/60 backdrop-blur-[2px] border border-white/10 shadow-sm flex items-center justify-center"
						>
							<span class="text-[10px] font-bold text-white uppercase tracking-wider leading-none">
								{{ tipoText }}
							</span>
						</div>

						<!-- Ícones de ação (Overlay no canto superior direito) -->
						<div
							class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
						>
							<!-- Validar -->
							<button
								type="button"
								class="p-1.5 rounded-md bg-black/60 backdrop-blur-[2px] border border-white/10 hover:bg-black/80 transition-colors flex items-center justify-center"
								title="Validar cupom"
								@click="handleValidate"
							>
								<Icon name="lucide:shield-check" class="h-3.5 w-3.5 text-white" />
							</button>

							<!-- Duplicar -->
							<button
								type="button"
								class="p-1.5 rounded-md bg-black/60 backdrop-blur-[2px] border border-white/10 hover:bg-black/80 transition-colors flex items-center justify-center"
								title="Duplicar"
								@click="handleDuplicate"
							>
								<Icon name="lucide:copy" class="h-3.5 w-3.5 text-white" />
							</button>

							<!-- Excluir -->
							<button
								type="button"
								class="p-1.5 rounded-md bg-red-600/80 backdrop-blur-[2px] border border-white/10 hover:bg-red-700 transition-colors flex items-center justify-center"
								title="Excluir"
								@click="handleDelete"
							>
								<Icon name="lucide:trash-2" class="h-3.5 w-3.5 text-white" />
							</button>
						</div>
					</div>

					<!-- Conteúdo que cresce -->
					<div class="flex-1 flex flex-col justify-between">
						<!-- Informações do cupom -->
						<div class="space-y-2">
							<!-- Cabeçalho com código e status -->
							<div class="flex items-start justify-between gap-2">
								<h3
									class="truncate font-medium text-[var(--text-primary)] text-base flex-1 leading-tight"
								>
									{{ cupom.codigo }}
								</h3>
								<UiBadge :variant="cupomStatus.variant" class="text-xs px-2 py-1 scale-90 shrink-0">
									{{ cupomStatus.text }}
								</UiBadge>
							</div>

							<!-- Layout Flexível de Rodapé -->
							<div class="flex items-end justify-between gap-2 mt-1">
								<!-- Lado Esquerdo: Uso -->
								<div
									class="flex items-center gap-2 text-sm text-[var(--text-muted)] truncate min-w-0"
								>
									<span class="flex items-center gap-1 truncate">
										<Icon name="lucide:users" class="h-3.5 w-3.5 shrink-0" />
										<span class="truncate">{{ usoInfo }}</span>
									</span>
								</div>

								<!-- Lado Direito: Ícone de edição -->
								<div class="shrink-0 flex items-center justify-end leading-none">
									<Icon name="lucide:pencil" class="h-3.5 w-3.5 text-[var(--text-muted)]" />
								</div>
							</div>
						</div>
					</div>
				</div>
			</template>
		</UiCard>
	</div>
</template>

<style scoped>
.cupom-card-wrapper:hover .cupom-card {
	transform: translateY(-1px);
}
</style>
