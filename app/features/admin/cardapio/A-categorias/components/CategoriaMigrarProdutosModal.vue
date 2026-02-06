<script setup lang="ts">
/**
 * 📌 CategoriaMigrarProdutosModal
 *
 * Modal para migrar produtos de uma categoria pai para uma subcategoria recém-criada.
 * Permite seleção individual ou migração em lote.
 */

import type { UUID } from "#shared/types/database";
import { useCategoriasMigracao } from "../composables/useCategoriasMigracao";

interface Props {
	/** Controla visibilidade do modal */
	modelValue: boolean;
	/** ID da categoria de origem (categoria pai) */
	categoriaOrigemId: UUID | null;
	/** Nome da categoria de origem */
	categoriaOrigemNome: string;
	/** ID da subcategoria de destino */
	subcategoriaDestinoId: UUID | null;
	/** Nome da subcategoria de destino */
	subcategoriaDestinoNome: string;
}

interface Emits {
	/** Atualiza visibilidade do modal */
	"update:modelValue": [value: boolean];
	/** Emitido quando migração é concluída com sucesso */
	success: [produtosMigrados: number];
	/** Emitido quando modal é cancelado */
	cancel: [];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Composable de migração
const {
	produtosParaMigracao,
	produtosSelecionados,
	isLoading,
	error,
	todosSelecionados,
	algunsSelecionados,
	totalSelecionados,
	buscarProdutos,
	migrarProdutos,
	migrarTodosProdutos,
	toggleProdutoSelecionado,
	selecionarTodos,
	desmarcarTodos,
	reset,
} = useCategoriasMigracao();

// Estado local do modal
const isOpen = computed({
	get: () => props.modelValue,
	set: (value: boolean) => emit("update:modelValue", value),
});

/**
 * Carrega produtos quando modal abre
 */
watch(
	() => props.modelValue,
	async (isOpen) => {
		if (isOpen && props.categoriaOrigemId) {
			await buscarProdutos(props.categoriaOrigemId);
		} else if (!isOpen) {
			reset();
		}
	},
	{ immediate: true },
);

/**
 * Handler para migrar produtos selecionados
 */
const handleMigrarSelecionados = async (): Promise<void> => {
	if (!props.subcategoriaDestinoId) return;

	const produtoIds = Array.from(produtosSelecionados.value);
	const success = await migrarProdutos(produtoIds, props.subcategoriaDestinoId);

	if (success) {
		emit("success", produtoIds.length);
		isOpen.value = false;
	}
};

/**
 * Handler para migrar todos os produtos
 */
const handleMigrarTodos = async (): Promise<void> => {
	if (!props.categoriaOrigemId || !props.subcategoriaDestinoId) return;

	const totalProdutos = produtosParaMigracao.value.length;
	const success = await migrarTodosProdutos(props.categoriaOrigemId, props.subcategoriaDestinoId);

	if (success) {
		emit("success", totalProdutos);
		isOpen.value = false;
	}
};

/**
 * Handler para cancelar
 */
const handleCancel = (): void => {
	emit("cancel");
	isOpen.value = false;
};

/**
 * Handler para toggle do checkbox principal
 */
const handleToggleTodos = (): void => {
	if (todosSelecionados.value) {
		desmarcarTodos();
	} else {
		selecionarTodos();
	}
};
</script>

<template>
	<UiModal v-model="isOpen" size="lg" :prevent-close="isLoading">
		<template #header>
			<div class="flex items-center gap-3">
				<div
					class="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center"
				>
					<Icon name="lucide:move" class="w-5 h-5 text-amber-600" />
				</div>
				<div>
					<h3 class="text-lg font-semibold text-gray-900">Migrar Produtos</h3>
					<p class="text-sm text-gray-500">
						Mover produtos de "{{ categoriaOrigemNome }}" para "{{ subcategoriaDestinoNome }}"
					</p>
				</div>
			</div>
		</template>

		<div class="space-y-6">
			<!-- Explicação -->
			<div
				class="border rounded-lg p-4"
				:style="{
					backgroundColor: 'var(--info-light)',
					borderColor: 'var(--info)',
					color: 'var(--info-foreground)',
				}"
			>
				<div class="flex items-start gap-3">
					<Icon
						name="lucide:info"
						class="w-5 h-5 flex-shrink-0 mt-0.5"
						:style="{ color: 'var(--info)' }"
					/>
					<div class="text-sm">
						<p class="font-medium mb-1">Por que migrar?</p>
						<p>
							Categorias com subcategorias não podem ter produtos diretos. Os produtos precisam ser
							movidos para uma das subcategorias.
						</p>
					</div>
				</div>
			</div>

			<!-- Loading -->
			<div v-if="isLoading && produtosParaMigracao.length === 0" class="py-8">
				<UiSkeleton class="h-4 w-48 mx-auto mb-4" />
				<div class="space-y-3">
					<UiSkeleton v-for="i in 3" :key="i" class="h-16 w-full" />
				</div>
			</div>

			<!-- Erro -->
			<UiAlert v-else-if="error" color="error" :title="error" />

			<!-- Lista de produtos -->
			<div v-else-if="produtosParaMigracao.length > 0" class="space-y-4">
				<!-- Header com checkbox geral -->
				<div
					class="flex items-center justify-between p-3 rounded-lg"
					:style="{ backgroundColor: 'var(--bg-muted)' }"
				>
					<div class="flex items-center gap-3">
						<UiCheckbox
							:model-value="todosSelecionados"
							:indeterminate="algunsSelecionados"
							@update:model-value="handleToggleTodos"
						/>
						<span class="text-sm font-medium" :style="{ color: 'var(--text-primary)' }">
							{{ totalSelecionados }} de {{ produtosParaMigracao.length }} selecionados
						</span>
					</div>
					<div class="flex gap-2">
						<UiButton variant="ghost" size="sm" @click="selecionarTodos">Selecionar todos</UiButton>
						<UiButton variant="ghost" size="sm" @click="desmarcarTodos">Desmarcar todos</UiButton>
					</div>
				</div>

				<!-- Lista de produtos -->
				<div class="max-h-80 overflow-y-auto space-y-2">
					<div
						v-for="produto in produtosParaMigracao"
						:key="produto.id"
						class="flex items-center gap-3 p-3 border rounded-lg transition-colors cursor-pointer"
						:style="{
							borderColor: 'var(--border-default)',
							backgroundColor: 'var(--bg-surface)',
						}"
						@mouseenter="($event.target as HTMLElement).style.backgroundColor = 'var(--bg-hover)'"
						@mouseleave="($event.target as HTMLElement).style.backgroundColor = 'var(--bg-surface)'"
					>
						<UiCheckbox
							:model-value="produtosSelecionados.has(produto.id)"
							@update:model-value="toggleProdutoSelecionado(produto.id)"
						/>
						<div
							class="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden"
							:style="{ backgroundColor: 'var(--bg-muted)' }"
						>
							<img
								v-if="produto.imagem_url"
								:src="produto.imagem_url"
								:alt="produto.nome"
								class="w-full h-full object-cover"
							/>
							<div v-else class="w-full h-full flex items-center justify-center">
								<Icon
									name="lucide:package"
									class="w-5 h-5"
									:style="{ color: 'var(--text-muted)' }"
								/>
							</div>
						</div>
						<div class="flex-1 min-w-0">
							<p class="font-medium truncate" :style="{ color: 'var(--text-primary)' }">
								{{ produto.nome }}
							</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Estado vazio -->
			<div v-else class="py-8 text-center">
				<Icon
					name="lucide:package-x"
					class="w-12 h-12 mx-auto mb-3"
					:style="{ color: 'var(--text-muted)' }"
				/>
				<p :style="{ color: 'var(--text-secondary)' }">Nenhum produto encontrado para migrar</p>
			</div>
		</div>

		<template #footer>
			<div class="flex items-center justify-between">
				<UiButton variant="ghost" :disabled="isLoading" @click="handleCancel">Cancelar</UiButton>
				<div class="flex gap-3">
					<UiButton
						v-if="produtosParaMigracao.length > 0"
						variant="outline"
						:loading="isLoading"
						@click="handleMigrarTodos"
					>
						Mover Todos ({{ produtosParaMigracao.length }})
					</UiButton>
					<UiButton
						color="primary"
						:disabled="totalSelecionados === 0"
						:loading="isLoading"
						@click="handleMigrarSelecionados"
					>
						Mover Selecionados ({{ totalSelecionados }})
					</UiButton>
				</div>
			</div>
		</template>
	</UiModal>
</template>
