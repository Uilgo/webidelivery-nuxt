<script setup lang="ts">
/**
 * 📌 CardapioProdutoModal
 *
 * Modal para visualização e personalização de produto.
 * Permite selecionar variação, adicionais e quantidade.
 */

import type {
	ProdutoPublico,
	VariacaoPublica,
	GrupoAdicionalPublico,
	AdicionalPublico,
} from "../types/cardapio-publico";
import { useCarrinhoStore } from "~/stores/carrinho";
import { formatCurrency } from "../../../../../lib/formatters/currency";

interface Props {
	modelValue: boolean;
	produto: ProdutoPublico | null;
	estabelecimentoId: string;
	estabelecimentoSlug: string;
}

interface Emits {
	(e: "update:modelValue", value: boolean): void;
	(e: "adicionado"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Store do carrinho
const carrinhoStore = useCarrinhoStore();

// Estado local
const variacaoSelecionada = ref<VariacaoPublica | null>(null);
const adicionaisSelecionados = ref<Map<string, number>>(new Map());
const observacao = ref("");
const quantidade = ref(1);

// Computed para controle do modal
const isOpen = computed({
	get: () => props.modelValue,
	set: (value: boolean) => emit("update:modelValue", value),
});

/**
 * Reseta o estado quando o modal abre
 */
watch(
	() => props.modelValue,
	(aberto) => {
		if (aberto && props.produto) {
			variacaoSelecionada.value = props.produto.variacoes[0] ?? null;
			adicionaisSelecionados.value = new Map();
			observacao.value = "";
			quantidade.value = 1;
		}
	},
);

/**
 * Preço da variação selecionada (considera promoção)
 */
const precoVariacao = computed(() => {
	if (!variacaoSelecionada.value) return 0;
	return variacaoSelecionada.value.preco_promocional ?? variacaoSelecionada.value.preco;
});

/**
 * Total dos adicionais selecionados
 */
const totalAdicionais = computed(() => {
	let total = 0;
	if (!props.produto) return total;

	for (const grupo of props.produto.grupos_adicionais) {
		for (const adicional of grupo.adicionais) {
			const qtd = adicionaisSelecionados.value.get(adicional.id) ?? 0;
			total += adicional.preco * qtd;
		}
	}
	return total;
});

/**
 * Preço unitário (variação + adicionais)
 */
const precoUnitario = computed(() => precoVariacao.value + totalAdicionais.value);

/**
 * Preço total (unitário * quantidade)
 */
const precoTotal = computed(() => precoUnitario.value * quantidade.value);

/**
 * Verifica se um grupo de adicionais está válido
 */
const grupoValido = (grupo: GrupoAdicionalPublico): boolean => {
	const totalSelecionado = grupo.adicionais.reduce((acc, a) => {
		return acc + (adicionaisSelecionados.value.get(a.id) ?? 0);
	}, 0);

	if (grupo.obrigatorio && totalSelecionado < grupo.min_selecao) {
		return false;
	}
	return true;
};

/**
 * Verifica se pode adicionar ao carrinho
 */
const podeAdicionar = computed(() => {
	if (!props.produto || !variacaoSelecionada.value) return false;

	for (const grupo of props.produto.grupos_adicionais) {
		if (!grupoValido(grupo)) return false;
	}
	return true;
});

/**
 * Quantidade selecionada de um adicional
 */
const getQuantidadeAdicional = (adicionalId: string): number => {
	return adicionaisSelecionados.value.get(adicionalId) ?? 0;
};

/**
 * Altera quantidade de um adicional
 */
const alterarAdicional = (
	grupo: GrupoAdicionalPublico,
	adicional: AdicionalPublico,
	delta: number,
): void => {
	const atual = getQuantidadeAdicional(adicional.id);
	const novo = Math.max(0, atual + delta);

	const totalGrupo = grupo.adicionais.reduce((acc, a) => {
		if (a.id === adicional.id) return acc + novo;
		return acc + (adicionaisSelecionados.value.get(a.id) ?? 0);
	}, 0);

	if (totalGrupo > grupo.max_selecao) return;

	if (novo === 0) {
		adicionaisSelecionados.value.delete(adicional.id);
	} else {
		adicionaisSelecionados.value.set(adicional.id, novo);
	}

	adicionaisSelecionados.value = new Map(adicionaisSelecionados.value);
};

/**
 * Adiciona produto ao carrinho
 */
const adicionarAoCarrinho = (): void => {
	if (!props.produto || !variacaoSelecionada.value || !podeAdicionar.value) return;

	carrinhoStore.setEstabelecimento(props.estabelecimentoId, props.estabelecimentoSlug);

	const adicionaisLista: { id: string; nome: string; preco: number; quantidade: number }[] = [];

	for (const grupo of props.produto.grupos_adicionais) {
		for (const adicional of grupo.adicionais) {
			const qtd = adicionaisSelecionados.value.get(adicional.id) ?? 0;
			if (qtd > 0) {
				adicionaisLista.push({
					id: adicional.id,
					nome: adicional.nome,
					preco: adicional.preco,
					quantidade: qtd,
				});
			}
		}
	}

	carrinhoStore.adicionarItem({
		tipo: "produto",
		produto_id: props.produto.id,
		nome: props.produto.nome,
		imagem_url: props.produto.imagem_url,
		variacao: {
			id: variacaoSelecionada.value.id,
			nome: variacaoSelecionada.value.nome,
			preco: precoVariacao.value,
		},
		adicionais: adicionaisLista,
		observacao: observacao.value,
		quantidade: quantidade.value,
		preco_unitario: precoUnitario.value,
		preco_total: precoTotal.value,
	});

	emit("adicionado");
	isOpen.value = false;
};
</script>

<template>
	<UiModal v-model="isOpen" :title="produto?.nome ?? 'Produto'" size="lg" :scrollable="true">
		<template v-if="produto">
			<div class="space-y-6">
				<!-- Imagem do produto -->
				<div
					v-if="produto.imagem_url"
					class="w-full h-48 rounded-lg overflow-hidden bg-[var(--bg-muted)]"
				>
					<img :src="produto.imagem_url" :alt="produto.nome" class="w-full h-full object-cover" />
				</div>

				<!-- Descrição -->
				<p v-if="produto.descricao" class="text-sm text-[var(--text-secondary)]">
					{{ produto.descricao }}
				</p>

				<!-- Variações -->
				<div v-if="produto.variacoes.length > 1" class="space-y-3">
					<h3 class="font-medium text-[var(--text-primary)]">Escolha uma opção</h3>

					<div class="space-y-2">
						<label
							v-for="variacao in produto.variacoes"
							:key="variacao.id"
							class="flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors"
							:class="
								variacaoSelecionada?.id === variacao.id
									? 'border-[var(--primary)] bg-[var(--primary-light)]'
									: 'border-[var(--border-default)] hover:border-[var(--border-hover)]'
							"
						>
							<div class="flex items-center gap-3">
								<input
									type="radio"
									:value="variacao"
									v-model="variacaoSelecionada"
									class="w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)]"
								/>
								<span class="text-[var(--text-primary)]">{{ variacao.nome }}</span>
							</div>

							<div class="flex items-center gap-2">
								<span
									v-if="variacao.preco_promocional"
									class="text-sm text-[var(--text-muted)] line-through"
								>
									{{ formatCurrency(variacao.preco) }}
								</span>
								<span class="font-medium text-[var(--text-primary)]">
									{{ formatCurrency(variacao.preco_promocional ?? variacao.preco) }}
								</span>
							</div>
						</label>
					</div>
				</div>

				<!-- Grupos de Adicionais -->
				<div v-for="grupo in produto.grupos_adicionais" :key="grupo.id" class="space-y-3">
					<div class="flex items-center justify-between">
						<div>
							<h3 class="font-medium text-[var(--text-primary)]">{{ grupo.nome }}</h3>
							<p v-if="grupo.descricao" class="text-sm text-[var(--text-muted)]">
								{{ grupo.descricao }}
							</p>
						</div>

						<UiBadge
							v-if="grupo.obrigatorio"
							:color="grupoValido(grupo) ? 'success' : 'error'"
							size="sm"
						>
							Obrigatório
						</UiBadge>
					</div>

					<p class="text-xs text-[var(--text-muted)]">
						Escolha
						<span v-if="grupo.min_selecao === grupo.max_selecao">
							{{ grupo.min_selecao }} {{ grupo.min_selecao === 1 ? "opção" : "opções" }}
						</span>
						<span v-else> de {{ grupo.min_selecao }} até {{ grupo.max_selecao }} opções </span>
					</p>

					<div class="space-y-2">
						<div
							v-for="adicional in grupo.adicionais"
							:key="adicional.id"
							class="flex items-center justify-between p-3 border border-[var(--border-default)] rounded-lg"
						>
							<div>
								<span class="text-[var(--text-primary)]">{{ adicional.nome }}</span>
								<span v-if="adicional.preco > 0" class="text-sm text-[var(--text-muted)] ml-2">
									+ {{ formatCurrency(adicional.preco) }}
								</span>
							</div>

							<!-- Controle de quantidade -->
							<div class="flex items-center gap-2">
								<UiButton
									variant="outline"
									color="neutral"
									size="sm"
									:disabled="getQuantidadeAdicional(adicional.id) === 0"
									@click="alterarAdicional(grupo, adicional, -1)"
								>
									<Icon name="lucide:minus" class="w-4 h-4" />
								</UiButton>

								<span class="w-6 text-center font-medium text-[var(--text-primary)]">
									{{ getQuantidadeAdicional(adicional.id) }}
								</span>

								<UiButton
									variant="outline"
									color="neutral"
									size="sm"
									@click="alterarAdicional(grupo, adicional, 1)"
								>
									<Icon name="lucide:plus" class="w-4 h-4" />
								</UiButton>
							</div>
						</div>
					</div>
				</div>

				<!-- Observação -->
				<div class="space-y-2">
					<label class="font-medium text-[var(--text-primary)]">Alguma observação?</label>
					<UiTextarea v-model="observacao" :rows="2" placeholder="Ex: Sem cebola, bem passado..." />
				</div>
			</div>
		</template>

		<!-- Footer com quantidade e botão adicionar -->
		<template #footer>
			<div class="flex items-center justify-between gap-4">
				<!-- Controle de quantidade -->
				<div class="flex items-center gap-3">
					<UiButton
						variant="outline"
						color="neutral"
						size="sm"
						:disabled="quantidade <= 1"
						@click="quantidade--"
					>
						<Icon name="lucide:minus" class="w-5 h-5" />
					</UiButton>

					<span class="w-8 text-center font-semibold text-lg text-[var(--text-primary)]">
						{{ quantidade }}
					</span>

					<UiButton variant="outline" color="neutral" size="sm" @click="quantidade++">
						<Icon name="lucide:plus" class="w-5 h-5" />
					</UiButton>
				</div>

				<!-- Botão adicionar -->
				<UiButton
					variant="solid"
					color="primary"
					size="lg"
					class="flex-1"
					:disabled="!podeAdicionar"
					@click="adicionarAoCarrinho"
				>
					Adicionar {{ formatCurrency(precoTotal) }}
				</UiButton>
			</div>
		</template>
	</UiModal>
</template>
