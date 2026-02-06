<script setup lang="ts">
/**
 * 📌 CuponsView
 *
 * Componente de visualização da aba de cupons.
 * Exibe lista de cupons com opções de CRUD e validação.
 */

// Importações dos componentes específicos de cupons
import CupomCard from "./CupomCard.vue";
import CupomsList from "./CupomsList.vue";
import CupomDrawer from "./CupomDrawer.vue";

// Imports dos composables
import { useCupons } from "../../composables/useCupons";
import type { ValidacaoCupom, MarketingViewMode } from "../../types/marketing";

interface Props {
	showCreateDrawer?: boolean;
	viewMode?: MarketingViewMode;
}

interface Emits {
	"update:showCreateDrawer": [value: boolean];
}

const props = withDefaults(defineProps<Props>(), {
	showCreateDrawer: false,
	viewMode: "card",
});

const emit = defineEmits<Emits>();

// Composables
const {
	cupons,
	filteredCupons,
	loading,
	error,
	createCupom,
	updateCupom,
	deleteCupom,
	toggleCupomStatus,
	duplicateCupom,
	validateCupom,
	refreshCupons,
} = useCupons();

// Usar viewMode da prop em vez do composable
const currentViewMode = computed(() => props.viewMode);

// ========================================
// ESTADO LOCAL
// ========================================

const showCreateDrawerLocal = ref(false);
const showEditDrawer = ref(false);
const showDeleteModal = ref(false);
const showValidateModal = ref(false);
const selectedCupom = ref<string | null>(null);
const validationResult = ref<ValidacaoCupom | null>(null);
const validatingCupom = ref(false);
const valorSimulacao = ref(0); // Sem valor padrão

// ========================================
// COMPUTADAS
// ========================================

/**
 * Controla o drawer de criação via prop ou estado local
 */
const showCreateDrawerComputed = computed({
	get: () => props.showCreateDrawer || showCreateDrawerLocal.value,
	set: (value: boolean) => {
		showCreateDrawerLocal.value = value;
		emit("update:showCreateDrawer", value);
	},
});

/**
 * Cupom selecionado para exclusão
 */
const cupomParaExcluir = computed(() => {
	if (!selectedCupom.value) return null;
	return cupons.value.find((cupom) => cupom.id === selectedCupom.value);
});

// ========================================
// HANDLERS
// ========================================

/**
 * Handler para editar cupom
 */
const handleEdit = (cupomId: string): void => {
	selectedCupom.value = cupomId;
	showEditDrawer.value = true;
};

/**
 * Handler para excluir cupom
 */
const handleDelete = (cupomId: string): void => {
	selectedCupom.value = cupomId;
	showDeleteModal.value = true;
};

/**
 * Handler para confirmar exclusão
 */
const handleConfirmDelete = async (): Promise<void> => {
	if (!selectedCupom.value) return;

	try {
		await deleteCupom(selectedCupom.value);
		showDeleteModal.value = false;
		selectedCupom.value = null;
	} catch (error) {
		console.error("Erro ao excluir cupom:", error);
	}
};

/**
 * Handler para duplicar cupom
 */
const handleDuplicate = async (cupomId: string): Promise<void> => {
	try {
		await duplicateCupom(cupomId);
	} catch (error) {
		console.error("Erro ao duplicar cupom:", error);
	}
};

/**
 * Handler para alternar status
 */
const handleToggleStatus = async (cupomId: string): Promise<void> => {
	try {
		await toggleCupomStatus(cupomId);
	} catch (error) {
		console.error("Erro ao alterar status:", error);
	}
};

/**
 * Handler para validar cupom
 */
const handleValidate = async (codigo: string): Promise<void> => {
	// Apenas abrir o modal - não fazer validação ainda
	selectedCupom.value = cupons.value.find((c) => c.codigo === codigo)?.id || null;
	valorSimulacao.value = 0;
	validationResult.value = null;
	showValidateModal.value = true;
};

/**
 * Handler para executar a validação com o valor digitado
 */
const handleExecuteValidation = async (): Promise<void> => {
	const cupom = cupons.value.find((c) => c.id === selectedCupom.value);
	if (!cupom || valorSimulacao.value <= 0) return;

	try {
		validatingCupom.value = true;
		// Converter centavos para reais
		const valorEmReais = valorSimulacao.value;
		validationResult.value = await validateCupom(cupom.codigo, valorEmReais);
	} catch (error) {
		console.error("Erro ao validar cupom:", error);
	} finally {
		validatingCupom.value = false;
	}
};
</script>

<template>
	<div class="w-full space-y-6">
		<!-- Estado de loading -->
		<div v-if="loading" class="space-y-4">
			<UiSkeleton class="h-20 w-full" />
			<UiSkeleton class="h-20 w-full" />
			<UiSkeleton class="h-20 w-full" />
		</div>

		<!-- Estado de erro -->
		<UiCard v-else-if="error" class="p-6">
			<div class="text-center">
				<Icon name="lucide:alert-circle" class="w-12 h-12 mx-auto mb-4 text-red-500" />
				<h3 class="text-lg font-medium text-[var(--text-primary)] mb-2">Erro ao carregar cupons</h3>
				<p class="text-[var(--text-muted)] mb-4">{{ error }}</p>
				<UiButton @click="refreshCupons">
					<Icon name="lucide:refresh-cw" class="w-4 h-4 mr-2" />
					Tentar novamente
				</UiButton>
			</div>
		</UiCard>

		<!-- Estado vazio (sem nenhum cupom criado) -->
		<UiCard v-else-if="cupons.length === 0 && !loading" class="p-12">
			<div class="text-center">
				<Icon name="lucide:ticket" class="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)]" />
				<h3 class="text-lg font-medium text-[var(--text-primary)] mb-2">Nenhum cupom criado</h3>
				<p class="text-[var(--text-muted)] mb-6">
					Crie seu primeiro cupom de desconto para aumentar as vendas
				</p>
				<UiButton @click="showCreateDrawerComputed = true">
					<Icon name="lucide:plus" class="w-4 h-4 mr-2" />
					Criar primeiro cupom
				</UiButton>
			</div>
		</UiCard>

		<!-- Estado sem resultados (filtro retornou vazio) -->
		<UiCard v-else-if="filteredCupons.length === 0" class="p-12">
			<div class="text-center">
				<Icon name="lucide:search-x" class="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)]" />
				<h3 class="text-lg font-medium text-[var(--text-primary)] mb-2">Nenhum cupom encontrado</h3>
				<p class="text-[var(--text-muted)] mb-6">
					Tente ajustar seus filtros ou busca para encontrar o que procura
				</p>
			</div>
		</UiCard>

		<!-- Lista de cupons -->
		<div v-else>
			<!-- Visualização em cards -->
			<div
				v-if="currentViewMode === 'card'"
				class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
			>
				<CupomCard
					v-for="cupom in filteredCupons"
					:key="cupom.id"
					:cupom="cupom"
					@edit="handleEdit"
					@delete="handleDelete"
					@duplicate="handleDuplicate"
					@toggle-status="handleToggleStatus"
					@validate="handleValidate"
				/>
			</div>

			<!-- Visualização em lista -->
			<div v-else>
				<CupomsList
					:cupons="filteredCupons"
					@edit="handleEdit"
					@delete="handleDelete"
					@duplicate="handleDuplicate"
					@toggle-status="handleToggleStatus"
					@validate="handleValidate"
				/>
			</div>
		</div>

		<!-- Drawer de criação -->
		<CupomDrawer v-model="showCreateDrawerComputed" mode="create" @save-create="createCupom" />

		<!-- Drawer de edição -->
		<CupomDrawer
			v-model="showEditDrawer"
			mode="edit"
			:cupom-id="selectedCupom"
			@save-edit="updateCupom"
		/>

		<!-- Modal de confirmação de exclusão -->
		<UiModal v-model="showDeleteModal">
			<template #header>
				<h3 class="text-lg font-semibold text-[var(--error)]">Excluir Cupom</h3>
			</template>

			<div class="space-y-4">
				<div
					class="flex items-center gap-3 p-3 bg-[var(--error-light)] border border-[var(--error)] rounded-lg"
				>
					<Icon name="lucide:alert-triangle" class="h-5 w-5 text-[var(--error)] shrink-0" />
					<div>
						<p class="font-medium text-[var(--error)]">Atenção! Esta ação não pode ser desfeita.</p>
						<p class="text-sm text-[var(--error)]">
							O cupom será permanentemente removido do sistema.
						</p>
					</div>
				</div>

				<div
					v-if="cupomParaExcluir"
					class="p-3 bg-[var(--bg-muted)] border border-[var(--border-default)] rounded-lg"
				>
					<p class="text-sm text-[var(--text-muted)] mb-2">Cupom que será excluído:</p>
					<div class="space-y-1">
						<p class="font-mono font-bold text-[var(--text-primary)]">
							{{ cupomParaExcluir.codigo }}
						</p>
						<p v-if="cupomParaExcluir.descricao" class="text-sm text-[var(--text-secondary)]">
							{{ cupomParaExcluir.descricao }}
						</p>
						<div class="flex items-center gap-4 text-xs text-[var(--text-muted)]">
							<span>{{
								cupomParaExcluir.tipo === "percentual"
									? cupomParaExcluir.valor_desconto + "%"
									: cupomParaExcluir.tipo === "valor_fixo"
										? "R$ " + cupomParaExcluir.valor_desconto.toFixed(2).replace(".", ",")
										: "Frete Grátis"
							}}</span>
							<span>{{ cupomParaExcluir.usos_realizados }} usos realizados</span>
						</div>
					</div>
				</div>

				<p class="text-[var(--text-secondary)]">Tem certeza que deseja continuar com a exclusão?</p>
			</div>

			<template #footer>
				<div class="flex gap-3 justify-end">
					<UiButton variant="outline" @click="showDeleteModal = false"> Cancelar </UiButton>
					<UiButton variant="solid" color="error" @click="handleConfirmDelete">
						<Icon name="lucide:trash-2" class="h-4 w-4 mr-2" />
						Excluir Cupom
					</UiButton>
				</div>
			</template>
		</UiModal>

		<!-- Modal de validação de cupom -->
		<UiModal v-model="showValidateModal">
			<template #header>
				<h3 class="text-lg font-semibold text-[var(--text-primary)]">
					{{ validationResult ? "Resultado da Validação" : "Validar Cupom" }}
				</h3>
			</template>

			<!-- Formulário de simulação (antes da validação) -->
			<div v-if="!validationResult && !validatingCupom" class="space-y-4">
				<div class="p-4 bg-[var(--info-light)] border border-[var(--info)] rounded-lg">
					<div class="flex items-center gap-2 mb-2">
						<Icon name="lucide:calculator" class="w-5 h-5 text-[var(--info)]" />
						<span class="font-medium text-[var(--info)]">Simulação de Pedido</span>
					</div>
					<p class="text-sm text-[var(--info)]">
						Digite o valor do pedido para testar se o cupom será aceito e qual desconto será
						aplicado.
					</p>
				</div>

				<div class="space-y-2">
					<label class="block text-sm font-medium text-[var(--text-primary)]">
						Valor do pedido para simulação
					</label>
					<UiCurrencyInput
						v-model="valorSimulacao"
						placeholder="Digite o valor do pedido"
						class="w-full"
					/>
				</div>

				<div class="p-3 bg-[var(--bg-muted)] border border-[var(--border-default)] rounded-lg">
					<div class="space-y-2">
						<p class="text-sm text-[var(--text-muted)]">
							<strong>Cupom:</strong> {{ cupons.find((c) => c.id === selectedCupom)?.codigo }}
						</p>
						<div
							v-if="cupons.find((c) => c.id === selectedCupom)?.valor_minimo"
							class="flex items-center gap-2"
						>
							<Icon name="lucide:info" class="w-4 h-4 text-[var(--info)]" />
							<p class="text-sm text-[var(--info)]">
								<strong>Valor mínimo:</strong>
								R$
								{{
									cupons
										.find((c) => c.id === selectedCupom)
										?.valor_minimo?.toFixed(2)
										.replace(".", ",")
								}}
							</p>
						</div>
						<div class="flex items-center gap-2">
							<Icon
								:name="
									cupons.find((c) => c.id === selectedCupom)?.tipo === 'percentual'
										? 'lucide:percent'
										: cupons.find((c) => c.id === selectedCupom)?.tipo === 'valor_fixo'
											? 'lucide:banknote'
											: 'lucide:truck'
								"
								class="w-4 h-4 text-[var(--text-muted)]"
							/>
							<p class="text-sm text-[var(--text-secondary)]">
								<strong>Tipo:</strong>
								{{
									cupons.find((c) => c.id === selectedCupom)?.tipo === "percentual"
										? `${cupons.find((c) => c.id === selectedCupom)?.valor_desconto}% de desconto`
										: cupons.find((c) => c.id === selectedCupom)?.tipo === "valor_fixo"
											? `R$ ${cupons
													.find((c) => c.id === selectedCupom)
													?.valor_desconto?.toFixed(2)
													.replace(".", ",")} de desconto`
											: "Frete Grátis"
								}}
							</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Resultado da validação -->
			<div v-else-if="validationResult" class="space-y-4">
				<!-- Status da validação -->
				<div
					class="flex items-center gap-3 p-4 rounded-lg"
					:class="{
						'bg-[var(--success-light)] border border-[var(--success)]': validationResult.valido,
						'bg-[var(--error-light)] border border-[var(--error)]': !validationResult.valido,
					}"
				>
					<Icon
						:name="validationResult.valido ? 'lucide:check-circle' : 'lucide:x-circle'"
						class="w-6 h-6"
						:class="{
							'text-[var(--success)]': validationResult.valido,
							'text-[var(--error)]': !validationResult.valido,
						}"
					/>
					<div>
						<div
							class="font-medium"
							:class="{
								'text-[var(--success)]': validationResult.valido,
								'text-[var(--error)]': !validationResult.valido,
							}"
						>
							{{ validationResult.valido ? "Cupom Válido" : "Cupom Inválido" }}
						</div>
						<div
							class="text-sm"
							:class="{
								'text-[var(--success)]': validationResult.valido,
								'text-[var(--error)]': !validationResult.valido,
							}"
						>
							{{
								validationResult.valido
									? "Pode ser usado no checkout"
									: validationResult.motivo_invalido
							}}
						</div>
					</div>
				</div>

				<!-- Detalhes do cupom -->
				<div class="space-y-3">
					<div class="flex justify-between">
						<span class="text-sm text-[var(--text-muted)]">Código:</span>
						<span class="font-mono font-bold text-[var(--text-primary)]">{{
							validationResult.codigo
						}}</span>
					</div>

					<div class="flex justify-between">
						<span class="text-sm text-[var(--text-muted)]">Valor simulado:</span>
						<span class="font-medium text-[var(--text-primary)]">
							R$ {{ valorSimulacao.toFixed(2).replace(".", ",") }}
						</span>
					</div>

					<div v-if="validationResult.valido" class="flex justify-between">
						<span class="text-sm text-[var(--text-muted)]">
							{{
								cupons.find((c) => c.id === selectedCupom)?.tipo === "frete_gratis"
									? "Benefício:"
									: "Desconto aplicado:"
							}}
						</span>
						<span class="font-medium text-[var(--success)]">
							{{
								cupons.find((c) => c.id === selectedCupom)?.tipo === "frete_gratis"
									? "Frete Grátis"
									: `R$ ${validationResult.desconto_aplicado?.toFixed(2).replace(".", ",")}`
							}}
						</span>
					</div>

					<div v-if="validationResult.valor_minimo" class="flex justify-between">
						<span class="text-sm text-[var(--text-muted)]">Valor mínimo:</span>
						<span class="font-medium text-[var(--text-primary)]"
							>R$ {{ validationResult.valor_minimo.toFixed(2).replace(".", ",") }}</span
						>
					</div>

					<div
						v-if="validationResult.valido"
						class="flex justify-between border-t border-[var(--border-default)] pt-3"
					>
						<span class="text-sm font-medium text-[var(--text-primary)]">
							{{
								cupons.find((c) => c.id === selectedCupom)?.tipo === "frete_gratis"
									? "Valor do pedido:"
									: "Total final:"
							}}
						</span>
						<span class="font-bold text-[var(--primary)]">
							{{
								cupons.find((c) => c.id === selectedCupom)?.tipo === "frete_gratis"
									? `R$ ${valorSimulacao.toFixed(2).replace(".", ",")} + Frete Grátis`
									: `R$ ${(valorSimulacao - (validationResult.desconto_aplicado || 0)).toFixed(2).replace(".", ",")}`
							}}
						</span>
					</div>
				</div>
			</div>

			<!-- Loading -->
			<div v-else-if="validatingCupom" class="text-center py-8">
				<Icon
					name="lucide:loader"
					class="w-8 h-8 mx-auto mb-4 text-[var(--primary)] animate-spin"
				/>
				<p class="text-[var(--text-muted)]">Validando cupom...</p>
			</div>

			<template #footer>
				<div class="flex gap-3 justify-end">
					<UiButton
						v-if="!validationResult && !validatingCupom"
						variant="outline"
						@click="showValidateModal = false"
					>
						Cancelar
					</UiButton>
					<UiButton
						v-if="!validationResult && !validatingCupom"
						variant="solid"
						:disabled="valorSimulacao <= 0"
						@click="handleExecuteValidation"
					>
						<Icon name="lucide:shield-check" class="w-4 h-4 mr-2" />
						Validar Cupom
					</UiButton>
					<UiButton v-if="validationResult" variant="outline" @click="validationResult = null">
						Nova Simulação
					</UiButton>
					<UiButton
						v-if="validationResult"
						variant="solid"
						@click="
							showValidateModal = false;
							validationResult = null;
						"
					>
						Fechar
					</UiButton>
				</div>
			</template>
		</UiModal>
	</div>
</template>
