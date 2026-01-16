<script setup lang="ts">
/**
 * 📌 CardapioBusca
 *
 * Campo de busca para filtrar produtos no cardápio.
 * Inclui botões de ordenação e filtro com dropdowns.
 */

interface Props {
	modelValue: string;
}

interface Emits {
	(e: "update:modelValue", value: string): void;
	(e: "ordenar", tipo: string): void;
	(e: "filtrar", filtros: { destaque: boolean; promocao: boolean }): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// v-model local
const termoBusca = computed({
	get: () => props.modelValue,
	set: (value: string) => emit("update:modelValue", value),
});

// Estado dos filtros
const filtroDestaque = ref(false);
const filtroPromocao = ref(false);
const ordenacaoAtual = ref("padrao");

/**
 * Limpa o campo de busca
 */
const limparBusca = () => {
	termoBusca.value = "";
};

/**
 * Opções de ordenação
 */
const opcoesOrdenacao = [
	{ label: "Menor preço", value: "menor-preco", icon: "lucide:arrow-down-narrow-wide" },
	{ label: "Maior preço", value: "maior-preco", icon: "lucide:arrow-up-wide-narrow" },
	{ label: "A-Z", value: "a-z", icon: "lucide:arrow-down-a-z" },
	{ label: "Z-A", value: "z-a", icon: "lucide:arrow-up-z-a" },
];

/**
 * Seleciona ordenação
 */
const selecionarOrdenacao = (valor: string) => {
	ordenacaoAtual.value = valor;
	emit("ordenar", valor);
};

/**
 * Aplica filtros
 */
const aplicarFiltros = () => {
	emit("filtrar", {
		destaque: filtroDestaque.value,
		promocao: filtroPromocao.value,
	});
};

/**
 * Limpa todos os filtros
 */
const limparFiltros = () => {
	filtroDestaque.value = false;
	filtroPromocao.value = false;
	aplicarFiltros();
};

/**
 * Verifica se há filtros ativos
 */
const temFiltrosAtivos = computed(() => {
	return filtroDestaque.value || filtroPromocao.value;
});
</script>

<template>
	<div class="px-4 py-3 bg-[var(--bg-page)]">
		<div class="max-w-3xl mx-auto flex gap-2">
			<!-- Campo de busca -->
			<div class="flex-1">
				<UiInput
					v-model="termoBusca"
					type="text"
					placeholder="Buscar no cardápio..."
					icon="lucide:search"
				>
					<template v-if="termoBusca" #trailing>
						<button
							type="button"
							class="p-1 rounded-full hover:bg-[var(--bg-hover)] transition-colors"
							@click="limparBusca"
						>
							<Icon name="lucide:x" class="w-4 h-4 text-[var(--text-muted)]" />
						</button>
					</template>
				</UiInput>
			</div>

			<!-- Dropdown de Ordenação -->
			<UiDropdown placement="bottom-end">
				<template #trigger="{ toggle }">
					<UiButton
						v-if="ordenacaoAtual === 'padrao'"
						variant="ghost"
						size="md"
						icon="lucide:arrow-up-down"
						class="!min-h-[40px] !w-[40px] flex-shrink-0"
						aria-label="Ordenar produtos"
						@click="toggle"
					/>
					<UiButton
						v-else
						variant="ghost"
						size="md"
						class="!min-h-[40px] !px-3 flex-shrink-0"
						aria-label="Ordenar produtos"
						@click="toggle"
					>
						<template #iconLeft>
							<Icon name="lucide:arrow-up-down" class="w-4 h-4" />
						</template>
						{{ opcoesOrdenacao.find((o) => o.value === ordenacaoAtual)?.label }}
					</UiButton>
				</template>

				<template #default="{ close }">
					<div class="py-1 w-max min-w-[140px]">
						<button
							v-for="opcao in opcoesOrdenacao"
							:key="opcao.value"
							type="button"
							class="w-full flex items-center px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors whitespace-nowrap rounded-lg"
							:class="{
								'bg-[var(--primary-light)] text-[var(--primary)]': ordenacaoAtual === opcao.value,
							}"
							@click="
								selecionarOrdenacao(opcao.value);
								close();
							"
						>
							<span>{{ opcao.label }}</span>
							<Icon
								v-if="ordenacaoAtual === opcao.value"
								name="lucide:check"
								class="w-4 h-4 ml-auto text-[var(--primary)]"
							/>
						</button>

						<!-- Botão Limpar -->
						<template v-if="ordenacaoAtual !== 'padrao'">
							<div class="h-px bg-[var(--border-default)] my-1"></div>
							<button
								type="button"
								class="w-full flex items-center justify-between px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors rounded-lg"
								@click="
									selecionarOrdenacao('padrao');
									close();
								"
							>
								<span>Limpar</span>
								<Icon name="lucide:x" class="w-3.5 h-3.5" />
							</button>
						</template>
					</div>
				</template>
			</UiDropdown>

			<!-- Dropdown de Filtros -->
			<UiDropdown placement="bottom-end">
				<template #trigger="{ toggle }">
					<UiButton
						v-if="!temFiltrosAtivos"
						variant="ghost"
						size="md"
						icon="lucide:filter"
						class="!min-h-[40px] !w-[40px] flex-shrink-0"
						aria-label="Filtrar produtos"
						@click="toggle"
					/>
					<UiButton
						v-else
						variant="ghost"
						size="md"
						class="!min-h-[40px] !px-3 flex-shrink-0"
						aria-label="Filtrar produtos"
						@click="toggle"
					>
						<template #iconLeft>
							<Icon name="lucide:filter" class="w-4 h-4" />
						</template>
						Filtros ({{ (filtroDestaque ? 1 : 0) + (filtroPromocao ? 1 : 0) }})
					</UiButton>
				</template>

				<template #default="{ close }">
					<div class="py-1 w-max min-w-[180px]">
						<div class="px-3 py-2 space-y-3">
							<!-- Filtro: Destaques -->
							<div class="flex items-center gap-2">
								<Icon name="lucide:star" class="w-4 h-4 text-[var(--text-muted)]" />
								<UiCheckbox
									v-model="filtroDestaque"
									label="Destaques"
									size="sm"
									@change="aplicarFiltros"
								/>
							</div>

							<!-- Filtro: Promoções -->
							<div class="flex items-center gap-2">
								<Icon name="lucide:tag" class="w-4 h-4 text-[var(--text-muted)]" />
								<UiCheckbox
									v-model="filtroPromocao"
									label="Em promoção"
									size="sm"
									@change="aplicarFiltros"
								/>
							</div>
						</div>

						<!-- Botão Limpar Filtros -->
						<template v-if="temFiltrosAtivos">
							<div class="h-px bg-[var(--border-default)] my-1"></div>
							<button
								type="button"
								class="w-full flex items-center justify-between px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors rounded-lg"
								@click="
									limparFiltros();
									close();
								"
							>
								<span>Limpar filtros</span>
								<Icon name="lucide:x" class="w-3.5 h-3.5" />
							</button>
						</template>
					</div>
				</template>
			</UiDropdown>
		</div>
	</div>
</template>
