<script setup lang="ts">
/**
 * 📌 CardapioProdutoCard
 *
 * Card de produto premium com visual moderno.
 * Inclui: hover effects, zoom na imagem, shadow elevation,
 * badges estilizados e micro-animações.
 */

import { useProdutoDrawer } from "../composables/useProdutoDrawer";
import type { ProdutoPublico } from "../types/cardapio-publico";
import { formatCurrency } from "~/lib/formatters/currency";

interface Props {
	produto: ProdutoPublico;
}

interface Emits {
	"produto-click": [produto: ProdutoPublico];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Usar composable global para abrir drawer
const { abrir: abrirDrawer } = useProdutoDrawer();

// Estado para controlar erro de carregamento de imagem
const imagemErro = ref(false);
const imgRef = ref<HTMLImageElement | null>(null);

// Computed para verificar se a URL da imagem é válida
const imagemValida = computed(() => {
	if (!props.produto.imagem_url) {
		return false;
	}

	const url = props.produto.imagem_url.trim();

	if (!url) {
		return false;
	}

	try {
		if (url.startsWith("/")) {
			return true;
		}

		const urlObj = new URL(url);
		return urlObj.protocol === "http:" || urlObj.protocol === "https:";
	} catch {
		return false;
	}
});

// Computed para decidir se deve tentar renderizar a imagem
const tentarCarregarImagem = computed(() => {
	return imagemValida.value && !imagemErro.value;
});

// Reseta o estado quando o produto mudar
watch(
	() => props.produto.id,
	() => {
		imagemErro.value = false;
	},
);

// Verifica se a imagem já está com erro quando monta ou quando a ref muda
const verificarImagemQuebrada = (img: HTMLImageElement | null) => {
	if (!img) return;

	// Aguarda um tick para garantir que a imagem foi processada
	nextTick(() => {
		// Verifica se a imagem está completa mas não carregou (erro em cache)
		if (img.complete && img.naturalHeight === 0) {
			console.log(`[${props.produto.nome}] Imagem com erro detectada (cache)`);
			imagemErro.value = true;
		}
	});
};

// Verifica quando monta
onMounted(() => {
	verificarImagemQuebrada(imgRef.value);

	// Verificação adicional após um pequeno delay para pegar casos de cache lento
	setTimeout(() => {
		verificarImagemQuebrada(imgRef.value);
	}, 100);
});

// Verifica quando a ref é atribuída/alterada
watch(
	imgRef,
	(img) => {
		verificarImagemQuebrada(img);
	},
	{ immediate: true },
);

/**
 * Handler para erro de carregamento de imagem
 */
const handleImageError = () => {
	console.error(`[${props.produto.nome}] Erro ao carregar imagem:`, props.produto.imagem_url);
	console.log(`[${props.produto.nome}] Setando imagemErro = true`);
	imagemErro.value = true;
	console.log(`[${props.produto.nome}] imagemErro agora é:`, imagemErro.value);
	console.log(`[${props.produto.nome}] tentarCarregarImagem agora é:`, tentarCarregarImagem.value);
};

/**
 * Handler para sucesso no carregamento de imagem
 * Verifica se realmente carregou (às vezes o evento load dispara mesmo com erro em cache)
 */
const handleImageLoad = (event: Event) => {
	const img = event.target as HTMLImageElement;

	// Verifica se a imagem realmente carregou
	if (img.naturalHeight === 0) {
		console.log(`[${props.produto.nome}] Evento load disparou mas imagem está quebrada`);
		imagemErro.value = true;
		return;
	}

	console.log(`[${props.produto.nome}] Imagem carregada com sucesso`);
};

/**
 * Retorna o menor preço entre as variações
 */
const menorPreco = computed(() => {
	if (!props.produto.variacoes.length) return 0;

	return props.produto.variacoes.reduce((menor, v) => {
		const preco = v.preco_promocional ?? v.preco;
		return preco < menor ? preco : menor;
	}, props.produto.variacoes[0]?.preco ?? 0);
});

/**
 * Verifica se tem preço promocional
 */
const temPromocao = computed(() => {
	return props.produto.variacoes.some((v) => v.preco_promocional !== null);
});

/**
 * Preço original (se tiver promoção)
 */
const precoOriginal = computed(() => {
	if (!temPromocao.value) return null;

	const variacaoComPromocao = props.produto.variacoes.find((v) => v.preco_promocional !== null);
	return variacaoComPromocao?.preco ?? null;
});

/**
 * Calcula percentual de desconto
 */
const percentualDesconto = computed(() => {
	if (!precoOriginal.value || menorPreco.value >= precoOriginal.value) return null;
	const desconto = ((precoOriginal.value - menorPreco.value) / precoOriginal.value) * 100;
	return Math.round(desconto);
});

/**
 * Verifica se tem múltiplas variações
 */
const temMultiplasVariacoes = computed(() => {
	return props.produto.variacoes.length > 1;
});
</script>

<template>
	<button
		type="button"
		class="group w-full flex gap-3 sm:gap-4 p-3 sm:p-4 h-[155px] sm:h-[165px] md:h-[175px] bg-[var(--cardapio-secondary)] rounded-xl sm:rounded-2xl shadow-[var(--cardapio-card-shadow)] hover:shadow-[var(--cardapio-card-shadow-hover)] transition-all duration-300 text-left border border-transparent"
		:style="{
			'--tw-border-opacity': 'var(--cardapio-card-hover-border-opacity)',
		}"
		:class="{
			'hover:!border-[var(--cardapio-primary)]': true,
		}"
		@click="abrirDrawer(produto)"
	>
		<!-- Imagem com Zoom Effect -->
		<div
			class="relative shrink-0 self-stretch overflow-hidden rounded-lg sm:rounded-xl aspect-square"
		>
			<!-- Container da imagem com fundo de fallback -->
			<div
				:key="`img-container-${produto.id}-${imagemErro}`"
				class="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 overflow-hidden rounded-lg sm:rounded-xl relative"
			>
				<!-- Imagem real (sempre renderizada se URL válida e sem erro) -->
				<img
					v-if="tentarCarregarImagem && !imagemErro"
					ref="imgRef"
					:key="`img-${produto.id}`"
					:src="produto.imagem_url || ''"
					:alt="produto.nome"
					class="w-full h-full object-cover transition-all duration-300 group-hover:scale-110 absolute inset-0"
					loading="lazy"
					@load="handleImageLoad"
					@error="handleImageError"
				/>
				<!-- Placeholder (aparece se URL inválida OU erro ao carregar) -->
				<div
					v-if="!tentarCarregarImagem || imagemErro"
					:key="`placeholder-${produto.id}`"
					class="w-full h-full flex items-center justify-center absolute inset-0 z-10"
				>
					<Icon
						name="lucide:image"
						class="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 dark:text-gray-500"
					/>
				</div>
			</div>

			<!-- Badge de Desconto (se houver) -->
			<div
				v-if="percentualDesconto"
				class="absolute top-1.5 left-1.5 px-1.5 py-0.5 cardapio-rounded bg-gradient-to-r from-[var(--cardapio-promo-from)] to-[var(--cardapio-promo-to)] text-[var(--cardapio-promo-text)] text-[10px] sm:text-xs font-bold shadow-lg z-20"
			>
				-{{ percentualDesconto }}%
			</div>
		</div>

		<!-- Conteúdo -->
		<div class="flex-1 min-w-0 flex flex-col justify-between gap-2 py-0.5">
			<!-- Grupo Superior: Nome + Descrição + Badges -->
			<div>
				<!-- Nome + Descrição + Badges -->
				<div>
					<!-- Nome -->
					<h3
						class="text-sm sm:text-base font-semibold text-[var(--cardapio-text)] line-clamp-2 leading-snug group-hover:text-[var(--cardapio-primary)] transition-colors"
					>
						{{ produto.nome }}
					</h3>

					<!-- Descrição -->
					<p
						v-if="produto.descricao"
						class="mt-1 text-xs sm:text-sm text-[var(--cardapio-text-muted)] line-clamp-2 leading-relaxed"
					>
						{{ produto.descricao }}
					</p>

					<!-- Badges (abaixo da descrição em todos os tamanhos) -->
					<div class="flex flex-wrap gap-1 mt-1.5">
						<!-- Badge de Promoção -->
						<span
							v-if="temPromocao"
							class="inline-flex items-center gap-1 px-1.5 py-0.5 cardapio-rounded bg-gradient-to-r from-[var(--cardapio-promo-from)] to-[var(--cardapio-promo-to)] text-[var(--cardapio-promo-text)] text-[10px] font-medium shadow-sm"
						>
							<Icon name="lucide:flame" class="w-3 h-3" />
							Promoção
						</span>

						<!-- Badge de Destaque -->
						<span
							v-if="produto.destaque"
							class="inline-flex items-center gap-1 px-1.5 py-0.5 cardapio-rounded bg-gradient-to-r from-[var(--cardapio-highlight-from)] to-[var(--cardapio-highlight-to)] text-[var(--cardapio-highlight-text)] text-[10px] font-medium shadow-sm"
						>
							<Icon name="lucide:star" class="w-3 h-3 fill-current" />
							Destaque
						</span>
					</div>
				</div>
			</div>

			<!-- Grupo Inferior: Preços + Botão Add -->
			<div>
				<!-- Preço + Botão Add -->
				<div class="flex items-end justify-between gap-2">
					<div class="flex flex-col gap-0.5 justify-end">
						<!-- Preço Original Riscado (linha separada, compacta) -->
						<span
							v-if="precoOriginal"
							class="text-[9px] sm:text-[10px] text-[var(--cardapio-text-muted)] line-through leading-tight"
						>
							{{ formatCurrency(precoOriginal) }}
						</span>

						<!-- Preço Atual (principal, destacado) -->
						<div class="flex items-baseline gap-1.5">
							<span
								v-if="temMultiplasVariacoes"
								class="text-[10px] sm:text-xs text-[var(--cardapio-text-muted)]"
							>
								A partir de
							</span>
							<span
								class="text-base sm:text-lg font-bold leading-tight"
								:class="
									temPromocao
										? 'text-[var(--cardapio-success)] dark:text-[var(--cardapio-success)]'
										: 'text-[var(--cardapio-primary)]'
								"
							>
								{{ formatCurrency(menorPreco) }}
							</span>
						</div>
					</div>

					<!-- Botão Adicionar -->
					<div
						class="size-8 sm:size-9 cardapio-rounded bg-[var(--cardapio-primary)] text-white flex items-center justify-center shadow-[var(--cardapio-button-shadow)] group-hover:scale-110 group-hover:shadow-[var(--cardapio-button-shadow-hover)] transition-all duration-300"
					>
						<Icon name="lucide:plus" class="w-4 h-4 sm:w-5 sm:h-5" />
					</div>
				</div>
			</div>
		</div>
	</button>
</template>
