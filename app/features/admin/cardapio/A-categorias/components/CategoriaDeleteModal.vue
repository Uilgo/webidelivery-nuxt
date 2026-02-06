<script setup lang="ts">
/**
 * 📌 CategoriaDeleteModal
 *
 * Modal de confirmação para exclusão de categorias.
 * Mostra informações da categoria e avisa sobre produtos vinculados.
 */

import type { CategoriaComputada } from "../../../types/categoria";
import { useCategoriasActions } from "../composables/useCategoriasActions";
import { useCategoriasFetch } from "../composables/useCategoriasFetch";
import { useToast } from "~/composables/ui/useToast";

interface Props {
	/** Controla a visibilidade do modal */
	modelValue: boolean;
	/** Categoria a ser excluída */
	categoria?: CategoriaComputada | null;
	/** Subcategorias da categoria (se for categoria pai) */
	subcategorias?: CategoriaComputada[];
}

interface Emits {
	"update:modelValue": [value: boolean];
	/** Evento disparado após sucesso na exclusão */
	success: [categoria: CategoriaComputada];
}

const props = withDefaults(defineProps<Props>(), {
	categoria: null,
	subcategorias: () => [],
});

const emit = defineEmits<Emits>();

// Composables
const { remove, deleting, actionError } = useCategoriasActions();
const { refresh } = useCategoriasFetch();
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

// Verifica se a categoria pode ser excluída (sempre true, mas com aviso se tiver produtos)
const canDelete = computed(() => {
	return true;
});

// Verifica se o nome de confirmação está correto
const isConfirmacaoValida = computed(() => {
	if (!props.categoria) return false;
	return confirmacaoNome.value.trim() === props.categoria.nome.trim();
});

// Detecta se é subcategoria
const isSubcategoria = computed(() => {
	return (
		props.categoria?.categoria_pai_id !== null && props.categoria?.categoria_pai_id !== undefined
	);
});

// Verifica se tem subcategorias
const temSubcategorias = computed(() => {
	return props.subcategorias && props.subcategorias.length > 0;
});

// Calcula total de produtos nas subcategorias
const totalProdutosSubcategorias = computed(() => {
	if (!props.subcategorias) return 0;
	return props.subcategorias.reduce((total, sub) => total + (sub.produtos_count || 0), 0);
});

// Mensagem de aviso inteligente
const warningMessage = computed(() => {
	if (!props.categoria) return "";

	const produtosCategoria = props.categoria.produtos_count ?? 0;

	// Caso 1: Categoria pai COM subcategorias
	if (!isSubcategoria.value && temSubcategorias.value) {
		const qtdSubcategorias = props.subcategorias?.length || 0;
		const totalProdutos = produtosCategoria + totalProdutosSubcategorias.value;

		let mensagem = `Esta categoria possui ${qtdSubcategorias} subcategoria(s) com um total de ${totalProdutos} produto(s) distribuídos entre elas.`;

		if (produtosCategoria > 0) {
			mensagem += ` A categoria principal tem ${produtosCategoria} produto(s) direto(s).`;
		}

		mensagem += ` Ao excluir esta categoria, TODAS as ${qtdSubcategorias} subcategoria(s) e TODOS os ${totalProdutos} produto(s) serão permanentemente excluídos do sistema.`;

		return mensagem;
	}

	// Caso 2: Categoria pai SEM subcategorias mas COM produtos
	if (!isSubcategoria.value && produtosCategoria > 0) {
		return `Esta categoria possui ${produtosCategoria} produto(s) vinculado(s). Ao excluir a categoria, TODOS os ${produtosCategoria} produto(s) serão permanentemente excluídos do sistema.`;
	}

	// Caso 3: Subcategoria COM produtos
	if (isSubcategoria.value && produtosCategoria > 0) {
		return `Esta subcategoria possui ${produtosCategoria} produto(s) vinculado(s). Ao excluir a subcategoria, TODOS os ${produtosCategoria} produto(s) serão permanentemente excluídos do sistema.`;
	}

	// Caso 4: Categoria/Subcategoria SEM produtos
	return "Esta ação não pode ser desfeita. A categoria será permanentemente removida do sistema.";
});

// Tipo de aviso (sempre warning, pois é possível excluir mas com consequências)
const warningType = computed(() => {
	return "warning";
});

// Título do modal
const modalTitle = computed(() => {
	return isSubcategoria.value ? "Excluir Subcategoria" : "Excluir Categoria";
});

// Texto do botão
const buttonText = computed(() => {
	return isSubcategoria.value ? "Excluir Subcategoria" : "Excluir Categoria";
});

/**
 * Handler para confirmar exclusão
 */
const handleConfirm = async (): Promise<void> => {
	if (!props.categoria || !canDelete.value) return;

	try {
		const success = await remove(props.categoria.id);

		if (success) {
			toast.add({
				title: "Categoria excluída",
				description: `A categoria "${props.categoria.nome}" foi excluída com sucesso`,
				color: "success",
				duration: 4000,
			});

			// Refresh dos dados
			await refresh();

			// Emite evento de sucesso e fecha modal
			emit("success", props.categoria);
			handleClose();
		} else {
			// Erro já tratado no composable
			toast.add({
				title: "Erro ao excluir categoria",
				description: actionError.value || "Ocorreu um erro inesperado",
				color: "error",
				duration: 5000,
			});
		}
	} catch (error) {
		console.error("Erro ao excluir categoria:", error);
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
 * Handler para copiar o nome da categoria
 */
const copiarNome = async (): Promise<void> => {
	if (!props.categoria) return;

	try {
		await navigator.clipboard.writeText(props.categoria.nome);
		copiado.value = true;

		// Reseta o estado após 2 segundos
		setTimeout(() => {
			copiado.value = false;
		}, 2000);

		toast.add({
			title: "Nome copiado",
			description: "O nome da categoria foi copiado para a área de transferência",
			color: "success",
			duration: 2000,
		});
	} catch (error) {
		console.error("Erro ao copiar:", error);
		toast.add({
			title: "Erro ao copiar",
			description: "Não foi possível copiar o nome da categoria",
			color: "error",
			duration: 3000,
		});
	}
};

// Limpa o input quando a categoria muda
watch(
	() => props.categoria,
	() => {
		confirmacaoNome.value = "";
	},
);
</script>

<template>
	<UiModal
		v-model="isOpen"
		:title="modalTitle"
		size="md"
		:close-on-overlay="!deleting"
		:close-on-escape="!deleting"
		@close="handleClose"
	>
		<div v-if="categoria" class="space-y-4">
			<!-- Informações da categoria -->
			<div class="flex items-start gap-3">
				<!-- Imagem da categoria (se houver) -->
				<div v-if="categoria.imagem_url" class="flex-shrink-0">
					<img
						:src="categoria.imagem_url"
						:alt="categoria.nome"
						class="w-16 h-16 object-cover rounded-lg border border-[var(--border-default)]"
					/>
				</div>

				<!-- Ícone padrão se não houver imagem -->
				<div
					v-else
					class="flex-shrink-0 w-16 h-16 bg-[var(--bg-muted)] rounded-lg border border-[var(--border-default)] flex items-center justify-center"
				>
					<Icon name="lucide:folder" class="w-8 h-8 text-[var(--text-muted)]" />
				</div>

				<!-- Detalhes da categoria -->
				<div class="flex-1 min-w-0">
					<h3 class="text-lg font-semibold text-[var(--text-primary)] truncate">
						{{ categoria.nome }}
					</h3>
					<p v-if="categoria.descricao" class="text-sm text-[var(--text-muted)] mt-1 line-clamp-2">
						{{ categoria.descricao }}
					</p>
					<div class="flex items-center gap-4 mt-2 text-xs text-[var(--text-muted)]">
						<span class="flex items-center">
							<Icon name="lucide:package" class="w-3 h-3 mr-1" />
							{{ categoria?.produtos_count ?? 0 }} produto(s)
						</span>
						<span class="flex items-center">
							<Icon
								:name="categoria.ativo ? 'lucide:check-circle' : 'lucide:x-circle'"
								class="w-3 h-3 mr-1"
							/>
							{{ categoria.status_display }}
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
					<p class="text-sm font-medium">Atenção</p>
					<p class="text-sm mt-1">
						{{ warningMessage }}
					</p>
				</div>
			</div>

			<!-- Campo de confirmação -->
			<div class="space-y-2">
				<label class="block text-sm font-medium text-[var(--text-primary)]">
					Para confirmar, digite o nome da categoria:
				</label>
				<div class="space-y-2">
					<div
						class="px-3 py-2.5 bg-[var(--bg-elevated)] rounded-md border-2 border-dashed border-[var(--border-strong)] flex items-center justify-between gap-2"
					>
						<code
							class="text-sm font-mono font-semibold text-[var(--text-primary)] flex-1 min-w-0 truncate"
							>{{ categoria?.nome }}</code
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
						placeholder="Digite o nome da categoria"
						:disabled="deleting"
						autocomplete="off"
					/>
					<p v-if="confirmacaoNome && !isConfirmacaoValida" class="text-xs text-[var(--error)]">
						O nome digitado não corresponde ao nome da categoria
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
					{{ buttonText }}
				</UiButton>
			</div>
		</template>
	</UiModal>
</template>
