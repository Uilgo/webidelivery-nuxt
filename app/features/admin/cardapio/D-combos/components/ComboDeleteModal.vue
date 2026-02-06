<script setup lang="ts">
/**
 * 📌 ComboDeleteModal
 *
 * Modal de confirmação para exclusão de combos.
 * Mostra informações do combo e requer confirmação por digitação do nome.
 */

import type { Combo } from "../../../types/combo";
import { useCombosActions } from "../composables/useCombosActions";
import { useToast } from "~/composables/ui/useToast";

interface Props {
	/** Controla a visibilidade do modal */
	modelValue: boolean;
	/** Combo a ser excluído */
	combo?: Combo | null;
}

interface Emits {
	"update:modelValue": [value: boolean];
	/** Evento disparado após sucesso na exclusão */
	success: [combo: Combo];
}

const props = withDefaults(defineProps<Props>(), {
	combo: null,
});

const emit = defineEmits<Emits>();

// Composables
const { deleteCombo } = useCombosActions();
const toast = useToast();

// Estado do input de confirmação
const confirmacaoNome = ref("");

// Estado do botão de copiar
const copiado = ref(false);

// Estado de loading
const deleting = ref(false);

// Estados computados
const isOpen = computed({
	get: () => props.modelValue,
	set: (value) => emit("update:modelValue", value),
});

// Verifica se o nome de confirmação está correto
const isConfirmacaoValida = computed(() => {
	if (!props.combo) return false;
	return confirmacaoNome.value.trim() === props.combo.nome.trim();
});

// Calcula a economia do combo
const economia = computed(() => {
	if (!props.combo) return 0;
	return props.combo.preco_original - props.combo.preco_combo;
});

// Calcula o percentual de desconto
const percentualDesconto = computed(() => {
	if (!props.combo) return 0;
	return Math.round((economia.value / props.combo.preco_original) * 100);
});

/**
 * Handler para confirmar exclusão
 */
const handleConfirm = async (): Promise<void> => {
	if (!props.combo) return;

	deleting.value = true;

	try {
		const success = await deleteCombo(props.combo.id);

		if (success) {
			emit("success", props.combo);
			handleClose();
		}
	} catch (error) {
		console.error("Erro ao excluir combo:", error);
		toast.add({
			title: "Erro inesperado",
			description: "Ocorreu um erro inesperado. Tente novamente.",
			color: "error",
			duration: 5000,
		});
	} finally {
		deleting.value = false;
	}
};

/**
 * Handler para cancelar exclusão
 */
const handleCancel = (): void => {
	handleClose();
};

/**
 * Handler para fechar modal
 */
const handleClose = (): void => {
	isOpen.value = false;
	// Limpa o input de confirmação ao fechar
	confirmacaoNome.value = "";
	copiado.value = false;
};

/**
 * Handler para copiar o nome do combo
 */
const copiarNome = async (): Promise<void> => {
	if (!props.combo) return;

	try {
		await navigator.clipboard.writeText(props.combo.nome);
		copiado.value = true;

		// Reseta o estado após 2 segundos
		setTimeout(() => {
			copiado.value = false;
		}, 2000);

		toast.add({
			title: "Nome copiado",
			description: "O nome do combo foi copiado para a área de transferência",
			color: "success",
			duration: 2000,
		});
	} catch (error) {
		console.error("Erro ao copiar:", error);
		toast.add({
			title: "Erro ao copiar",
			description: "Não foi possível copiar o nome do combo",
			color: "error",
			duration: 3000,
		});
	}
};

// Limpa o input quando o combo muda
watch(
	() => props.combo,
	() => {
		confirmacaoNome.value = "";
	},
);
</script>

<template>
	<UiModal
		v-model="isOpen"
		title="Excluir Combo"
		size="md"
		:close-on-overlay="!deleting"
		:close-on-escape="!deleting"
		@close="handleClose"
	>
		<div v-if="combo" class="space-y-4">
			<!-- Informações do combo -->
			<div class="flex items-start gap-3">
				<!-- Imagem do combo (se houver) -->
				<div v-if="combo.imagem_url" class="flex-shrink-0">
					<img
						:src="combo.imagem_url"
						:alt="combo.nome"
						class="w-16 h-16 object-cover rounded-lg border border-[var(--border-default)]"
					/>
				</div>

				<!-- Ícone padrão se não houver imagem -->
				<div
					v-else
					class="flex-shrink-0 w-16 h-16 bg-[var(--bg-muted)] rounded-lg border border-[var(--border-default)] flex items-center justify-center"
				>
					<Icon name="lucide:package-plus" class="w-8 h-8 text-[var(--text-muted)]" />
				</div>

				<!-- Detalhes do combo -->
				<div class="flex-1 min-w-0">
					<h3 class="text-lg font-semibold text-[var(--text-primary)] truncate">
						{{ combo.nome }}
					</h3>
					<p v-if="combo.descricao" class="text-sm text-[var(--text-muted)] mt-1 line-clamp-2">
						{{ combo.descricao }}
					</p>
					<div class="flex items-center gap-4 mt-2 text-xs text-[var(--text-muted)]">
						<span class="flex items-center">
							<Icon name="lucide:tag" class="w-3 h-3 mr-1" />
							R$ {{ combo.preco_combo.toFixed(2) }}
						</span>
						<span class="flex items-center text-[var(--success)]">
							<Icon name="lucide:trending-down" class="w-3 h-3 mr-1" />
							{{ percentualDesconto }}% OFF
						</span>
						<span class="flex items-center">
							<Icon
								:name="combo.ativo ? 'lucide:check-circle' : 'lucide:x-circle'"
								class="w-3 h-3 mr-1"
							/>
							{{ combo.ativo ? "Ativo" : "Inativo" }}
						</span>
					</div>
				</div>
			</div>

			<!-- Mensagem de aviso -->
			<div
				class="p-4 rounded-lg border flex items-start gap-3 bg-[var(--warning-light)] border-[var(--warning)] text-[var(--warning)]"
			>
				<Icon name="lucide:alert-triangle" class="w-5 h-5 flex-shrink-0 mt-0.5" />
				<div class="flex-1">
					<p class="text-sm font-medium">Atenção</p>
					<p class="text-sm mt-1">
						Esta ação não pode ser desfeita. O combo será permanentemente removido do sistema.
					</p>
				</div>
			</div>

			<!-- Campo de confirmação -->
			<div class="space-y-2">
				<label class="block text-sm font-medium text-[var(--text-primary)]">
					Para confirmar, digite o nome do combo:
				</label>
				<div class="space-y-2">
					<div
						class="px-3 py-2.5 bg-[var(--bg-elevated)] rounded-md border-2 border-dashed border-[var(--border-strong)] flex items-center justify-between gap-2"
					>
						<code
							class="text-sm font-mono font-semibold text-[var(--text-primary)] flex-1 min-w-0 truncate"
							>{{ combo?.nome }}</code
						>
						<button
							type="button"
							:disabled="deleting"
							class="flex-shrink-0 p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors duration-200 focus-ring disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
							:title="copiado ? 'Copiado!' : 'Copiar nome'"
							@click="copiarNome"
						>
							<Icon
								:name="copiado ? 'lucide:check' : 'lucide:copy'"
								class="w-4 h-4"
								:class="copiado ? 'text-[var(--success)]' : ''"
							/>
						</button>
					</div>
					<UiInput
						v-model="confirmacaoNome"
						placeholder="Digite o nome do combo"
						:disabled="deleting"
						autocomplete="off"
					/>
					<p v-if="confirmacaoNome && !isConfirmacaoValida" class="text-xs text-[var(--error)]">
						O nome digitado não corresponde ao nome do combo
					</p>
				</div>
			</div>
		</div>

		<!-- Footer com botões -->
		<template #footer>
			<div class="flex gap-3">
				<UiButton
					variant="ghost"
					color="neutral"
					:disabled="deleting"
					class="flex-1"
					@click="handleCancel"
				>
					Cancelar
				</UiButton>

				<UiButton
					variant="solid"
					color="error"
					:disabled="!isConfirmacaoValida"
					:loading="deleting"
					class="flex-1"
					@click="handleConfirm"
				>
					<template #iconLeft>
						<Icon name="lucide:trash-2" />
					</template>
					Excluir Combo
				</UiButton>
			</div>
		</template>
	</UiModal>
</template>
""
