<script setup lang="ts">
/**
 * 📌 MembroCard
 *
 * Card individual de membro da equipe.
 * Exibe informações do membro e ações disponíveis baseadas em permissões.
 */

import type { Membro, CargoEquipe } from "../../types/equipe";
import type { Cargo } from "#shared/types/database";

import { useEquipe } from "../../composables/useEquipe";
import { formatarCargo, corBadgeCargo, iconeCargo } from "../../utils/cargo-helpers";
import StatusBadge from "../shared/StatusBadge.vue";

interface Props {
	membro: Membro;
}

interface Emits {
	editar: [membro: Membro];
	ativar: [membroId: string, cargoMembro: Cargo];
	desativar: [membroId: string, cargoMembro: Cargo];
	remover: [membroId: string, cargoMembro: Cargo];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Composable para verificar permissões
const { podeEditar, podeRemover, ehUsuarioLogado } = useEquipe();

// Computed properties
const nomeCompleto = computed(() => `${props.membro.nome} ${props.membro.sobrenome}`);

const podeEditarMembro = computed(() => podeEditar(props.membro.cargo, props.membro.id));

const podeRemoverMembro = computed(() => podeRemover(props.membro.cargo, props.membro.id));

const ehUsuarioAtual = computed(() => ehUsuarioLogado(props.membro.id));

// Ações disponíveis no dropdown
const acoes = computed(() => {
	const items = [];

	if (podeEditarMembro.value) {
		items.push({
			label: "Editar",
			icon: "edit",
			action: () => emit("editar", props.membro),
		});

		if (props.membro.ativo) {
			items.push({
				label: "Desativar",
				icon: "lucide:user-x",
				action: () => emit("desativar", props.membro.id, props.membro.cargo),
				color: "warning",
			});
		} else {
			items.push({
				label: "Ativar",
				icon: "lucide:user-check",
				action: () => emit("ativar", props.membro.id, props.membro.cargo),
				color: "success",
			});
		}
	}

	if (podeRemoverMembro.value) {
		items.push({
			label: "Remover",
			icon: "trash",
			action: () => emit("remover", props.membro.id, props.membro.cargo),
			color: "error",
		});
	}

	return items;
});

const temAcoes = computed(() => acoes.value.length > 0);
</script>

<template>
	<div
		class="relative group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
		:class="[
			ehUsuarioAtual
				? 'bg-gradient-to-br from-primary-500/5 via-primary-500/10 to-purple-500/5 dark:from-primary-500/10 dark:via-primary-500/15 dark:to-purple-500/10 shadow-lg shadow-primary-500/10'
				: 'bg-white/80 dark:bg-gray-800/90 shadow-lg shadow-gray-200/50 dark:shadow-black/20 hover:shadow-xl hover:shadow-gray-300/50 dark:hover:shadow-black/30',
		]"
	>
		<!-- Brilho sutil no hover -->
		<div
			class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none"
		></div>

		<!-- Indicador lateral para usuário atual -->
		<div
			v-if="ehUsuarioAtual"
			class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-400 via-primary-500 to-purple-500"
		></div>

		<!-- Conteúdo do card -->
		<div class="relative p-5">
			<div class="flex items-center gap-4">
				<!-- Avatar Container -->
				<div class="relative shrink-0">
					<!-- Gradiente de fundo do avatar -->
					<div
						class="absolute -inset-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
						:class="[
							ehUsuarioAtual
								? 'bg-gradient-to-br from-primary-400 to-purple-500'
								: 'bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700',
						]"
					></div>

					<UiAvatar
						:src="membro.avatar_url || undefined"
						:alt="`${nomeCompleto} avatar`"
						:name="nomeCompleto"
						size="xl"
						:color="ehUsuarioAtual ? 'primary' : 'neutral'"
						class="relative transition-transform duration-300 group-hover:scale-105"
					/>

					<!-- Status indicator -->
					<div
						v-if="membro.ativo"
						class="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"
					></div>
				</div>

				<!-- Informações do Membro -->
				<div class="flex-1 min-w-0">
					<!-- Nome e badge "Você" -->
					<div class="flex items-center gap-2 mb-1">
						<h3
							class="text-lg font-semibold text-gray-900 dark:text-white truncate transition-colors duration-200"
							:class="{ 'group-hover:text-primary-600 dark:group-hover:text-primary-400': true }"
						>
							{{ nomeCompleto }}
						</h3>
						<span
							v-if="ehUsuarioAtual"
							class="shrink-0 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-gradient-to-r from-primary-500 to-purple-500 text-white shadow-sm"
						>
							Você
						</span>
					</div>

					<!-- Email -->
					<p class="text-sm text-gray-500 dark:text-gray-400 truncate mb-3">
						{{ membro.email }}
					</p>

					<!-- Badges -->
					<div class="flex flex-wrap items-center gap-2">
						<!-- Badge do Cargo -->
						<span
							class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
							:class="corBadgeCargo(membro.cargo as CargoEquipe)"
						>
							<Icon :name="iconeCargo(membro.cargo as CargoEquipe)" class="w-3.5 h-3.5" />
							{{ formatarCargo(membro.cargo as CargoEquipe) }}
						</span>

						<!-- Badge do Status -->
						<StatusBadge :ativo="membro.ativo" />
					</div>
				</div>

				<!-- Menu de Ações -->
				<div class="shrink-0 self-start">
					<UiDropdown v-if="temAcoes" placement="bottom-end">
						<template #trigger>
							<button
								type="button"
								class="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200"
							>
								<Icon name="lucide:more-vertical" class="w-5 h-5" />
							</button>
						</template>

						<template #content>
							<div class="py-1 min-w-[140px]">
								<button
									v-for="acao in acoes"
									:key="acao.label"
									type="button"
									class="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-left transition-colors rounded-md mx-1"
									:class="[
										acao.color === 'error' &&
											'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10',
										acao.color === 'warning' &&
											'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10',
										acao.color === 'success' &&
											'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10',
										!acao.color &&
											'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
									]"
									@click="acao.action"
								>
									<Icon :name="acao.icon" class="w-4 h-4" />
									{{ acao.label }}
								</button>
							</div>
						</template>
					</UiDropdown>
				</div>
			</div>

			<!-- Footer com data -->
			<div
				class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between"
			>
				<p class="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
					<Icon name="lucide:calendar" class="w-3.5 h-3.5" />
					Membro desde {{ new Date(membro.created_at).toLocaleDateString("pt-BR") }}
				</p>
			</div>
		</div>
	</div>
</template>
