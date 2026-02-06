<script setup lang="ts">
/**
 * 📌 ProdutoDeleteModal
 *
 * Modal de confirmação para exclusão de produtos.
 * Mostra informações do produto e avisa sobre dados vinculados.
 */

import type { ProdutoComputado } from "../../../types/produto";
import { useProdutosActions } from "../composables/useProdutosActions";
import { useProdutosFetch } from "../composables/useProdutosFetch";
import { useToast } from "~/composables/ui/useToast";

interface Props {
	/** Controla a visibilidade do modal */
	modelValue: boolean;
	/** Produto a ser excluído */
	produto?: ProdutoComputado | null;
}

interface Emits {
	"update:modelValue": [value: boolean];
	/** Evento disparado após sucesso na exclusão */
	success: [produto: ProdutoComputado];
}

const props = withDefaults(defineProps<Props>(), {
	produto: null,
});

const emit = defineEmits<Emits>();

// Composables
const { remove, deleting, actionError } = useProdutosActions();
const { refresh } = useProdutosFetch();
const toast = useToast();

// Estado do input de confirmação
const confirmacaoNome = ref("");

// Estado do botão de copiar
const copiado = ref(false);

// Estados computados
const isOpen = computed({
	get: () => props.modelValue,
	set: (value) => emit("update:modelValue", value),
});

// Verifica se o produto pode ser excluído (sempre true, mas com aviso se tiver variações)
const canDelete = computed(() => {
	return true;
});

// Verifica se o nome de confirmação está correto
const isConfirmacaoValida = computed(() => {
	if (!props.produto) return false;
	return confirmacaoNome.value.trim() === props.produto.nome.trim();
});

// Mensagem de aviso baseada na situação
const warningMessage = computed(() => {
	if (!props.produto) return "";

	const variacoesCount = props.produto.variacoes_count ?? 0;

	if (variacoesCount > 0) {
		return `Este produto possui ${variacoesCount} variação(ões) cadastrada(s). Ao excluir o produto, todas as ${variacoesCount} variação(ões) e os vínculos com grupos de adicionais serão permanentemente removidos. Os grupos de adicionais não serão excluídos.`;
	}

	return "Esta ação não pode ser desfeita. O produto e seus vínculos serão permanentemente removidos do sistema.";
});

// Tipo de aviso (sempre warning, pois é possível excluir mas com consequências)
const warningType = computed(() => {
	return "warning";
});

/**
 * Handler para confirmar exclusão
 */
const handleConfirm = async (): Promise<void> => {
	if (!props.produto || !canDelete.value) return;

	try {
		const success = await remove(props.produto.id);

		if (success) {
			toast.add({
				title: "Produto excluído",
				description: `O produto "${props.produto.nome}" foi excluído com sucesso`,
				color: "success",
				duration: 4000,
			});

			// Refresh dos dados
			await refresh();

			// Emite evento de sucesso e fecha modal
			emit("success", props.produto);
			handleClose();
		} else {
			// Erro já tratado no composable
			toast.add({
				title: "Erro ao excluir produto",
				description: actionError.value || "Ocorreu um erro inesperado",
				color: "error",
				duration: 5000,
			});
		}
	} catch (error) {
		console.error("Erro ao excluir produto:", error);
		toast.add({
			title: "Erro inesperado",
			description: "Ocorreu um erro inesperado. Tente novamente.",
			color: "error",
			duration: 5000,
		});
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
 * Handler para copiar o nome do produto
 */
const copiarNome = async (): Promise<void> => {
	if (!props.produto) return;

	try {
		await navigator.clipboard.writeText(props.produto.nome);
		copiado.value = true;

		// Reseta o estado após 2 segundos
		setTimeout(() => {
			copiado.value = false;
		}, 2000);

		toast.add({
			title: "Nome copiado",
			description: "O nome do produto foi copiado para a área de transferência",
			color: "success",
			duration: 2000,
		});
	} catch (error) {
		console.error("Erro ao copiar:", error);
		toast.add({
			title: "Erro ao copiar",
			description: "Não foi possível copiar o nome do produto",
			color: "error",
			duration: 3000,
		});
	}
};

// Limpa o input quando o produto muda
watch(
	() => props.produto,
	() => {
		confirmacaoNome.value = "";
	},
);
</script>

<template>
	<UiModal
		v-model="isOpen"
		title="Excluir Produto"
		size="md"
		:close-on-overlay="!deleting"
		:close-on-escape="!deleting"
		@close="handleClose"
	>
		<div v-if="produto" class="space-y-4">
			<!-- Informações do produto -->
			<div class="flex items-start gap-3">
				<!-- Imagem do produto (se houver) -->
				<div v-if="produto.imagem_url" class="flex-shrink-0">
					<img
						:src="produto.imagem_url"
						:alt="produto.nome"
						class="w-16 h-16 object-cover rounded-lg border border-[var(--border-default)]"
					/>
				</div>

				<!-- Ícone padrão se não houver imagem -->
				<div
					v-else
					class="flex-shrink-0 w-16 h-16 bg-[var(--bg-muted)] rounded-lg border border-[var(--border-default)] flex items-center justify-center"
				>
					<Icon name="lucide:package" class="w-8 h-8 text-[var(--text-muted)]" />
				</div>

				<!-- Detalhes do produto -->
				<div class="flex-1 min-w-0">
					<h3 class="text-lg font-semibold text-[var(--text-primary)] truncate">
						{{ produto.nome }}
					</h3>
					<p v-if="produto.descricao" class="text-sm text-[var(--text-muted)] mt-1 line-clamp-2">
						{{ produto.descricao }}
					</p>
					<div class="flex items-center gap-4 mt-2 text-xs text-[var(--text-muted)]">
						<span class="flex items-center">
							<Icon name="lucide:folder" class="w-3 h-3 mr-1" />
							{{ produto.categoria_nome }}
						</span>
						<span class="flex items-center">
							<Icon name="lucide:layers" class="w-3 h-3 mr-1" />
							{{ produto?.variacoes_count ?? 0 }} variação(ões)
						</span>
						<span class="flex items-center">
							<Icon
								:name="produto.ativo ? 'lucide:check-circle' : 'lucide:x-circle'"
								class="w-3 h-3 mr-1"
							/>
							{{ produto.status_display }}
						</span>
					</div>
				</div>
			</div>

			<!-- Mensagem de aviso -->
			<div
				:class="[
					'p-4 rounded-lg border flex items-start gap-3',
					warningType === 'error'
						? 'bg-[var(--error-light)] border-[var(--error)] text-[var(--error)]'
						: 'bg-[var(--warning-light)] border-[var(--warning)] text-[var(--warning)]',
				]"
			>
				<Icon
					:name="warningType === 'error' ? 'lucide:alert-circle' : 'lucide:alert-triangle'"
					class="w-5 h-5 flex-shrink-0 mt-0.5"
				/>
				<div class="flex-1">
					<p class="text-sm font-medium">Atenção: Exclusão em cascata</p>
					<p class="text-sm mt-1">
						{{ warningMessage }}
					</p>
				</div>
			</div>

			<!-- Campo de confirmação -->
			<div class="space-y-2">
				<label class="block text-sm font-medium text-[var(--text-primary)]">
					Para confirmar, digite o nome do produto:
				</label>
				<div class="space-y-2">
					<div
						class="px-3 py-2.5 bg-[var(--bg-elevated)] rounded-md border-2 border-dashed border-[var(--border-strong)] flex items-center justify-between gap-2"
					>
						<code
							class="text-sm font-mono font-semibold text-[var(--text-primary)] flex-1 min-w-0 truncate"
							>{{ produto?.nome }}</code
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
						placeholder="Digite o nome do produto"
						:disabled="deleting"
						autocomplete="off"
					/>
					<p v-if="confirmacaoNome && !isConfirmacaoValida" class="text-xs text-[var(--error)]">
						O nome digitado não corresponde ao nome do produto
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
					v-if="canDelete"
					variant="solid"
					color="error"
					:disabled="!isConfirmacaoValida"
					:loading="deleting"
					@click="handleConfirm"
				>
					<template #iconLeft>
						<Icon name="lucide:trash-2" />
					</template>
					Excluir Produto
				</UiButton>
			</div>
		</template>
	</UiModal>
</template>
