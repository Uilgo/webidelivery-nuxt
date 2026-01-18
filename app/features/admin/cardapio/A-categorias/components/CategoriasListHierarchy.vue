<script setup lang="ts">
/**
 * 📌 CategoriasListHierarchy - Item de Lista de Categoria com Expansão
 *
 * Lista expansível que mostra a categoria e suas subcategorias quando expandido.
 * Estrutura idêntica ao GruposAdicionaisList.
 */

import type { CategoriaComputada } from "../../../types/categoria";

interface Props {
	categoria: CategoriaComputada;
	isSelected?: boolean;
	isExpanded?: boolean;
}

interface Emits {
	click: [categoria: CategoriaComputada];
	viewMore: [categoria: CategoriaComputada];
	edit: [categoria: CategoriaComputada];
	delete: [categoria: CategoriaComputada];
	toggleStatus: [categoria: CategoriaComputada];
	// Eventos para subcategorias
	createSubcategoria: [categoriaPaiId: string];
	editSubcategoria: [subcategoriaId: string, categoriaPaiId: string];
	deleteSubcategoria: [subcategoriaId: string, categoriaPaiId: string];
	toggleSubcategoriaStatus: [subcategoriaId: string, ativo: boolean, categoriaPaiId: string];
	// Evento para expansão
	toggleExpansion: [categoriaId: string | null];
}

const props = withDefaults(defineProps<Props>(), {
	isSelected: false,
	isExpanded: false,
});

const emit = defineEmits<Emits>();

// Ref para o elemento do card
const cardRef = ref<HTMLElement | null>(null);

/**
 * Toggle expansão
 */
const toggleExpansion = (): void => {
	// Se já está expandido, fecha. Se não, abre.
	const newExpandedId = props.isExpanded ? null : props.categoria.id;
	emit("toggleExpansion", newExpandedId);
};

/**
 * Watch para rolar quando expandir
 */
watch(
	() => props.isExpanded,
	(newValue) => {
		if (newValue && cardRef.value) {
			// Aguarda a transição completar antes de rolar
			setTimeout(() => {
				cardRef.value?.scrollIntoView({
					behavior: "smooth",
					block: "nearest",
				});
			}, 250);
		}
	},
);

/**
 * Handlers
 */
const handleEdit = (event: Event): void => {
	event.stopPropagation();
	emit("edit", props.categoria);
};

const handleDelete = (event: Event): void => {
	event.stopPropagation();
	emit("delete", props.categoria);
};

const handleToggleStatus = (event: Event): void => {
	event.stopPropagation();
	emit("toggleStatus", props.categoria);
};

/**
 * Calcula o total de produtos (categoria + subcategorias)
 */
const totalProdutos = computed(() => {
	let total = props.categoria.produtos_count || 0;

	if (props.categoria.subcategorias && props.categoria.subcategorias.length > 0) {
		total += props.categoria.subcategorias.reduce((sum, sub) => sum + (sub.produtos_count || 0), 0);
	}

	return total;
});

/**
 * Quantidade de subcategorias
 */
const totalSubcategorias = computed(() => {
	return props.categoria.subcategorias?.length || 0;
});
</script>

<template>
	<div
		ref="cardRef"
		class="categoria-list-wrapper px-1 hover:scale-[1.005] transition-transform duration-200"
	>
		<!-- Card da Categoria -->
		<div
			class="group relative flex flex-col gap-3 p-3.5 rounded-xl bg-[var(--bg-surface)] hover:opacity-95 cursor-pointer transition-all duration-200"
			:class="{ 'opacity-60': !categoria.ativo }"
			@click="toggleExpansion"
		>
			<!-- Linha Principal da Categoria -->
			<div class="flex items-center gap-4">
				<!-- Imagem (Esquerda) -->
				<div
					class="w-16 h-16 shrink-0 overflow-hidden rounded-lg bg-[var(--bg-muted)] border border-[var(--border-muted)]"
				>
					<img
						v-if="categoria.imagem_url"
						:src="categoria.imagem_url"
						:alt="`Imagem de ${categoria.nome}`"
						class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
					/>
					<div
						v-else
						class="flex h-full w-full items-center justify-center text-[var(--text-muted)]"
					>
						<Icon name="lucide:folder" class="h-7 w-7" />
					</div>
				</div>

				<!-- Conteúdo -->
				<div class="flex-1 min-w-0 flex flex-col gap-1">
					<!-- Nome + Badge de Subcategorias -->
					<div class="flex items-center gap-2">
						<h3 class="font-semibold text-[var(--text-primary)] text-base truncate">
							{{ categoria.nome }}
						</h3>
						<!-- Badge de subcategorias -->
						<span
							v-if="totalSubcategorias > 0"
							class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-400 border border-blue-500/20"
						>
							<Icon name="lucide:folder-tree" class="w-3 h-3" />
							<span
								>{{ totalSubcategorias }}
								{{ totalSubcategorias === 1 ? "subcategoria" : "subcategorias" }}</span
							>
						</span>
					</div>

					<!-- Descrição -->
					<p v-if="categoria.descricao" class="text-sm text-[var(--text-secondary)] line-clamp-1">
						{{ categoria.descricao }}
					</p>

					<!-- Infos -->
					<div class="flex items-center gap-3 text-sm text-[var(--text-muted)]">
						<span class="flex items-center gap-1">
							<Icon name="lucide:package" class="h-3.5 w-3.5" />
							<span>{{ totalProdutos }} produtos</span>
						</span>
						<span class="flex items-center gap-1">
							<Icon name="lucide:arrow-up-down" class="h-3.5 w-3.5" />
							<span>{{ categoria.ordem }}</span>
						</span>
					</div>
				</div>

				<!-- Ações -->
				<div class="flex items-center gap-4 shrink-0">
					<!-- Toggle Status + Badge -->
					<div class="flex items-center gap-3">
						<button
							type="button"
							:class="[
								'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2',
								categoria.ativo ? 'bg-[var(--success)]' : 'bg-[var(--border-strong)]',
							]"
							role="switch"
							:aria-checked="categoria.ativo"
							:title="categoria.ativo ? 'Desativar' : 'Ativar'"
							@click.stop="handleToggleStatus"
						>
							<span
								:class="[
									'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
									categoria.ativo ? 'translate-x-5' : 'translate-x-0',
								]"
							></span>
						</button>

						<!-- Badge de Status -->
						<span
							:class="[
								'inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-sm font-medium whitespace-nowrap min-w-[70px]',
								categoria.ativo
									? 'bg-[var(--success-light)] text-[var(--success)]'
									: 'bg-[var(--error-light)] text-[var(--error)]',
							]"
						>
							{{ categoria.status_display }}
						</span>
					</div>

					<!-- Separador Vertical -->
					<div class="h-8 w-px bg-[var(--border-default)]"></div>

					<!-- Botões de Ação -->
					<div class="flex items-center gap-0.5">
						<!-- Editar -->
						<button
							type="button"
							class="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-active)] hover:text-[var(--text-primary)] transition-all duration-150 flex items-center justify-center"
							title="Editar"
							@click.stop="handleEdit"
						>
							<Icon name="lucide:pencil" class="h-4 w-4" />
						</button>

						<!-- Excluir -->
						<button
							type="button"
							class="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-active)] hover:text-[var(--text-primary)] transition-all duration-150 flex items-center justify-center"
							title="Excluir"
							@click.stop="handleDelete"
						>
							<Icon name="lucide:trash-2" class="h-4 w-4" />
						</button>

						<!-- Ícone de Expansão -->
						<button
							type="button"
							class="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-active)] hover:text-[var(--text-primary)] transition-all duration-150 flex items-center justify-center"
							title="Expandir/Colapsar"
						>
							<Icon
								:name="isExpanded ? 'lucide:chevron-down' : 'lucide:chevron-right'"
								class="w-4 h-4 transition-transform duration-200"
							/>
						</button>
					</div>
				</div>
			</div>

			<!-- Lista de Subcategorias (Expandida) -->
			<Transition
				enter-active-class="transition-all duration-200 ease-out"
				enter-from-class="opacity-0 max-h-0"
				enter-to-class="opacity-100 max-h-[280px]"
				leave-active-class="transition-all duration-200 ease-in"
				leave-from-class="opacity-100 max-h-[280px]"
				leave-to-class="opacity-0 max-h-0"
			>
				<div v-if="isExpanded" class="ml-4 mt-3 space-y-3 overflow-hidden max-h-[280px]">
					<!-- Cabeçalho das Subcategorias -->
					<div class="flex items-center justify-between shrink-0">
						<h4 class="text-sm font-medium text-[var(--text-secondary)]">
							Subcategorias ({{ categoria.subcategorias?.length || 0 }})
						</h4>
						<button
							type="button"
							class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--primary-foreground)] bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:scale-95 rounded-lg transition-all shadow-sm border border-[var(--primary)]"
							@click.stop="emit('createSubcategoria', categoria.id)"
						>
							<Icon name="lucide:plus" class="w-3.5 h-3.5" />
							Adicionar Item
						</button>
					</div>

					<!-- Lista de Subcategorias com Scroll -->
					<div class="max-h-[200px] overflow-y-auto overflow-x-hidden pr-1">
						<div
							v-if="categoria.subcategorias && categoria.subcategorias.length > 0"
							class="space-y-2"
						>
							<div
								v-for="subcategoria in categoria.subcategorias"
								:key="subcategoria.id"
								class="flex items-center gap-4 p-3 rounded-lg bg-[var(--bg-muted)] border border-[var(--border-default)] hover:opacity-95 transition-all duration-150"
								:class="{ 'opacity-60': !subcategoria.ativo }"
							>
								<!-- Imagem da Subcategoria -->
								<div
									class="w-14 h-14 shrink-0 overflow-hidden rounded-lg bg-[var(--bg-surface)] border border-[var(--border-muted)] shadow-sm"
								>
									<img
										v-if="subcategoria.imagem_url"
										:src="subcategoria.imagem_url"
										:alt="`Imagem de ${subcategoria.nome}`"
										class="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
									/>
									<div
										v-else
										class="flex h-full w-full items-center justify-center text-[var(--text-muted)] bg-gradient-to-br from-[var(--bg-muted)] to-[var(--bg-surface)]"
									>
										<Icon name="lucide:image" class="h-6 w-6" />
									</div>
								</div>

								<!-- Conteúdo da Subcategoria -->
								<div class="flex-1 min-w-0 flex flex-col gap-1">
									<!-- Nome -->
									<h4 class="font-semibold text-[var(--text-primary)] text-sm truncate">
										{{ subcategoria.nome }}
									</h4>

									<!-- Descrição -->
									<p
										v-if="subcategoria.descricao"
										class="text-xs text-[var(--text-secondary)] line-clamp-1"
									>
										{{ subcategoria.descricao }}
									</p>

									<!-- Info -->
									<div class="flex items-center gap-1 text-xs text-[var(--text-muted)]">
										<Icon name="lucide:package" class="h-3 w-3" />
										<span>{{ subcategoria.produtos_count }} produtos</span>
									</div>
								</div>

								<!-- Ações -->
								<div class="flex items-center gap-4 shrink-0">
									<!-- Toggle Status + Badge -->
									<div class="flex items-center gap-3">
										<button
											type="button"
											:class="[
												'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2',
												subcategoria.ativo ? 'bg-[var(--success)]' : 'bg-[var(--border-strong)]',
											]"
											role="switch"
											:aria-checked="subcategoria.ativo"
											:title="subcategoria.ativo ? 'Desativar' : 'Ativar'"
											@click.stop="
												emit(
													'toggleSubcategoriaStatus',
													subcategoria.id,
													!subcategoria.ativo,
													categoria.id,
												)
											"
										>
											<span
												:class="[
													'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
													subcategoria.ativo ? 'translate-x-5' : 'translate-x-0',
												]"
											></span>
										</button>

										<!-- Badge de Status -->
										<span
											:class="[
												'inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-sm font-medium whitespace-nowrap min-w-[70px]',
												subcategoria.ativo
													? 'bg-[var(--success-light)] text-[var(--success)]'
													: 'bg-[var(--error-light)] text-[var(--error)]',
											]"
										>
											{{ subcategoria.ativo ? "Ativa" : "Inativa" }}
										</span>
									</div>

									<!-- Separador Vertical -->
									<div class="h-8 w-px bg-[var(--border-default)]"></div>

									<!-- Botões de Ação -->
									<div class="flex items-center gap-0.5">
										<!-- Editar -->
										<button
											type="button"
											class="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-active)] hover:text-[var(--text-primary)] transition-all duration-150 flex items-center justify-center"
											title="Editar"
											@click.stop="emit('editSubcategoria', subcategoria.id, categoria.id)"
										>
											<Icon name="lucide:pencil" class="h-4 w-4" />
										</button>

										<!-- Excluir -->
										<button
											type="button"
											class="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-active)] hover:text-[var(--text-primary)] transition-all duration-150 flex items-center justify-center"
											title="Excluir"
											@click.stop="emit('deleteSubcategoria', subcategoria.id, categoria.id)"
										>
											<Icon name="lucide:trash-2" class="h-4 w-4" />
										</button>
									</div>
								</div>
							</div>
						</div>

						<!-- Mensagem quando não há subcategorias -->
						<div
							v-else
							class="flex flex-col items-center justify-center p-6 text-center bg-[var(--bg-muted)] rounded-lg border-2 border-dashed border-[var(--border-default)]"
						>
							<Icon name="lucide:folder-plus" class="w-8 h-8 text-[var(--text-muted)] mb-2" />
							<p class="text-sm text-[var(--text-muted)] mb-3">
								Nenhuma subcategoria cadastrada nesta categoria
							</p>
							<button
								type="button"
								class="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-[var(--primary-foreground)] bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:scale-95 rounded-lg transition-all shadow-sm border border-[var(--primary)]"
								@click.stop="emit('createSubcategoria', categoria.id)"
							>
								<Icon name="lucide:plus" class="w-4 h-4" />
								Adicionar Primeira Subcategoria
							</button>
						</div>
					</div>
				</div>
			</Transition>
		</div>
	</div>
</template>
