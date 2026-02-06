<script setup lang="ts">
/**
 * 📌 GruposAdicionaisList - Item de Lista de Grupo de Adicionais com Expansão
 *
 * Lista expansível que mostra o grupo e seus adicionais quando expandido.
 */

import type { GrupoAdicionalComputado } from "../../../types/adicional";

interface Props {
	grupoAdicional: GrupoAdicionalComputado;
	isSelected?: boolean;
	isExpanded?: boolean;
}

interface Emits {
	click: [grupoAdicional: GrupoAdicionalComputado];
	viewMore: [grupoAdicional: GrupoAdicionalComputado];
	edit: [grupoAdicional: GrupoAdicionalComputado];
	delete: [grupoAdicional: GrupoAdicionalComputado];
	toggleStatus: [grupoAdicional: GrupoAdicionalComputado];
	// Eventos para adicionais
	createAdicional: [grupoId: string];
	editAdicional: [adicionalId: string, grupoId: string];
	deleteAdicional: [adicionalId: string, grupoId: string];
	toggleAdicionalStatus: [adicionalId: string, ativo: boolean, grupoId: string];
	// Evento para expansão
	toggleExpansion: [grupoId: string | null];
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
	const newExpandedId = props.isExpanded ? null : props.grupoAdicional.id;
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
 * Formatar preço
 */
const formatPrice = (value: number): string => {
	return `R$ ${value.toFixed(2).replace(".", ",")}`;
};

/**
 * Handlers
 */
const handleEdit = (event: Event): void => {
	event.stopPropagation();
	emit("edit", props.grupoAdicional);
};

const handleDelete = (event: Event): void => {
	event.stopPropagation();
	emit("delete", props.grupoAdicional);
};

const handleToggleStatus = (event: Event): void => {
	event.stopPropagation();
	emit("toggleStatus", props.grupoAdicional);
};
</script>

<template>
	<div
		ref="cardRef"
		class="grupo-adicional-list-wrapper px-1 hover:scale-[1.005] transition-transform duration-200"
	>
		<!-- Card do Grupo -->
		<div
			class="group relative flex flex-col gap-3 p-3.5 rounded-xl bg-[var(--bg-surface)] hover:opacity-95 cursor-pointer transition-all duration-200"
			:class="{ 'opacity-60': !grupoAdicional.ativo }"
			@click="toggleExpansion"
		>
			<!-- Linha Principal do Grupo -->
			<div class="flex items-center gap-4">
				<!-- Conteúdo -->
				<div class="flex-1 min-w-0 flex flex-col gap-1">
					<!-- Nome -->
					<h3 class="font-semibold text-[var(--text-primary)] text-base truncate">
						{{ grupoAdicional.nome }}
					</h3>

					<!-- Descrição -->
					<p
						v-if="grupoAdicional.descricao"
						class="text-sm text-[var(--text-secondary)] line-clamp-1"
					>
						{{ grupoAdicional.descricao }}
					</p>

					<!-- Infos -->
					<div class="flex items-center gap-3 text-sm text-[var(--text-muted)]">
						<span class="flex items-center gap-1">
							<Icon name="lucide:list" class="h-3.5 w-3.5" />
							<span>{{ grupoAdicional.adicionais_count }} itens</span>
						</span>
						<span class="flex items-center gap-1">
							<Icon name="lucide:check-square" class="h-3.5 w-3.5" />
							<span>{{ grupoAdicional.selecao_display }}</span>
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
								grupoAdicional.ativo ? 'bg-[var(--success)]' : 'bg-[var(--border-strong)]',
							]"
							role="switch"
							:aria-checked="grupoAdicional.ativo"
							:title="grupoAdicional.ativo ? 'Desativar' : 'Ativar'"
							@click.stop="handleToggleStatus"
						>
							<span
								:class="[
									'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
									grupoAdicional.ativo ? 'translate-x-5' : 'translate-x-0',
								]"
							></span>
						</button>

						<!-- Badge de Status -->
						<span
							:class="[
								'inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-sm font-medium whitespace-nowrap min-w-[70px]',
								grupoAdicional.ativo
									? 'bg-[var(--success-light)] text-[var(--success)]'
									: 'bg-[var(--error-light)] text-[var(--error)]',
							]"
						>
							{{ grupoAdicional.status_display }}
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

			<!-- Lista de Adicionais (Expandida) -->
			<Transition
				enter-active-class="transition-all duration-200 ease-out"
				enter-from-class="opacity-0 max-h-0"
				enter-to-class="opacity-100 max-h-[280px]"
				leave-active-class="transition-all duration-200 ease-in"
				leave-from-class="opacity-100 max-h-[280px]"
				leave-to-class="opacity-0 max-h-0"
			>
				<div v-if="isExpanded" class="ml-4 mt-3 space-y-3 overflow-hidden max-h-[280px]">
					<!-- Cabeçalho dos Adicionais -->
					<div class="flex items-center justify-between shrink-0">
						<h4 class="text-sm font-medium text-[var(--text-secondary)]">
							Adicionais ({{ grupoAdicional.adicionais_count }})
						</h4>
						<button
							type="button"
							class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--primary-foreground)] bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:scale-95 rounded-lg transition-all shadow-sm border border-[var(--primary)]"
							@click.stop="emit('createAdicional', grupoAdicional.id)"
						>
							<Icon name="lucide:plus" class="w-3.5 h-3.5" />
							Adicionar Item
						</button>
					</div>

					<!-- Lista de Adicionais com Scroll -->
					<div class="max-h-[200px] overflow-y-auto overflow-x-hidden pr-1">
						<div
							v-if="grupoAdicional.adicionais && grupoAdicional.adicionais.length > 0"
							class="space-y-2"
						>
							<div
								v-for="adicional in grupoAdicional.adicionais"
								:key="adicional.id"
								class="flex items-center gap-4 p-3 rounded-lg bg-[var(--bg-muted)] border border-[var(--border-default)] hover:opacity-95 transition-all duration-150"
								:class="{ 'opacity-60': !adicional.ativo }"
							>
								<!-- Conteúdo do Adicional -->
								<div class="flex-1 min-w-0 flex flex-col gap-1">
									<!-- Nome -->
									<h4 class="font-semibold text-[var(--text-primary)] text-sm truncate">
										{{ adicional.nome }}
									</h4>

									<!-- Descrição -->
									<p
										v-if="adicional.descricao"
										class="text-xs text-[var(--text-secondary)] line-clamp-1"
									>
										{{ adicional.descricao }}
									</p>

									<!-- Preço -->
									<div class="flex items-center gap-1 text-xs text-[var(--text-muted)]">
										<Icon name="lucide:tag" class="h-3 w-3" />
										<span class="font-semibold text-[var(--success)]">{{
											formatPrice(adicional.preco)
										}}</span>
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
												adicional.ativo ? 'bg-[var(--success)]' : 'bg-[var(--border-strong)]',
											]"
											role="switch"
											:aria-checked="adicional.ativo"
											:title="adicional.ativo ? 'Desativar' : 'Ativar'"
											@click.stop="
												emit(
													'toggleAdicionalStatus',
													adicional.id,
													!adicional.ativo,
													grupoAdicional.id,
												)
											"
										>
											<span
												:class="[
													'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
													adicional.ativo ? 'translate-x-5' : 'translate-x-0',
												]"
											></span>
										</button>

										<!-- Badge de Status -->
										<span
											:class="[
												'inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-sm font-medium whitespace-nowrap min-w-[70px]',
												adicional.ativo
													? 'bg-[var(--success-light)] text-[var(--success)]'
													: 'bg-[var(--error-light)] text-[var(--error)]',
											]"
										>
											{{ adicional.ativo ? "Ativo" : "Inativo" }}
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
											@click.stop="emit('editAdicional', adicional.id, grupoAdicional.id)"
										>
											<Icon name="lucide:pencil" class="h-4 w-4" />
										</button>

										<!-- Excluir -->
										<button
											type="button"
											class="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-active)] hover:text-[var(--text-primary)] transition-all duration-150 flex items-center justify-center"
											title="Excluir"
											@click.stop="emit('deleteAdicional', adicional.id, grupoAdicional.id)"
										>
											<Icon name="lucide:trash-2" class="h-4 w-4" />
										</button>
									</div>
								</div>
							</div>
						</div>

						<!-- Mensagem quando não há adicionais -->
						<div
							v-else
							class="flex flex-col items-center justify-center p-6 text-center bg-[var(--bg-muted)] rounded-lg border-2 border-dashed border-[var(--border-default)]"
						>
							<Icon name="lucide:package-open" class="w-8 h-8 text-[var(--text-muted)] mb-2" />
							<p class="text-sm text-[var(--text-muted)] mb-3">
								Nenhum adicional cadastrado neste grupo
							</p>
							<button
								type="button"
								class="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-[var(--primary-foreground)] bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:scale-95 rounded-lg transition-all shadow-sm border border-[var(--primary)]"
								@click.stop="emit('createAdicional', grupoAdicional.id)"
							>
								<Icon name="lucide:plus" class="w-4 h-4" />
								Adicionar Primeiro Item
							</button>
						</div>
					</div>
				</div>
			</Transition>
		</div>
	</div>
</template>
