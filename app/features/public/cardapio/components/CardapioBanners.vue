<script setup lang="ts">
/**
 * 📌 CardapioBanners
 *
 * Carrossel de banners promocionais do cardápio público.
 * Usa dados mockados até implementar no banco.
 */

// Banners mockados
const banners = [
	{
		id: "1",
		titulo: "Pizza Grande + Refrigerante",
		descricao: "Compre uma pizza grande e ganhe 1L de refrigerante",
		imagem_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=300&fit=crop",
		cor_fundo: "#FF6B6B",
	},
	{
		id: "2",
		titulo: "Combo Família",
		descricao: "2 Pizzas grandes + 2L de refrigerante por apenas R$ 89,90",
		imagem_url: "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=800&h=300&fit=crop",
		cor_fundo: "#4ECDC4",
	},
	{
		id: "3",
		titulo: "Terça-feira é dia de Promoção",
		descricao: "Todas as pizzas com 30% de desconto",
		imagem_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=300&fit=crop",
		cor_fundo: "#FFD93D",
	},
];

// Estado do carrossel
const bannerAtivo = ref(0);
const carrosselRef = ref<HTMLElement | null>(null);

/**
 * Vai para o próximo banner
 */
const proximoBanner = (): void => {
	bannerAtivo.value = (bannerAtivo.value + 1) % banners.length;
	rolarParaBanner(bannerAtivo.value);
};

/**
 * Vai para o banner anterior
 */
const bannerAnterior = (): void => {
	bannerAtivo.value = (bannerAtivo.value - 1 + banners.length) % banners.length;
	rolarParaBanner(bannerAtivo.value);
};

/**
 * Vai para um banner específico
 */
const irParaBanner = (index: number): void => {
	bannerAtivo.value = index;
	rolarParaBanner(index);
};

/**
 * Rola o carrossel para o banner especificado
 */
const rolarParaBanner = (index: number): void => {
	if (!carrosselRef.value) return;

	const larguraBanner = carrosselRef.value.clientWidth;
	carrosselRef.value.scrollTo({
		left: larguraBanner * index,
		behavior: "smooth",
	});
};

// Auto-play do carrossel (a cada 5 segundos)
let intervalo: NodeJS.Timeout | null = null;

onMounted(() => {
	intervalo = setInterval(() => {
		proximoBanner();
	}, 5000);
});

onUnmounted(() => {
	if (intervalo) {
		clearInterval(intervalo);
	}
});
</script>

<template>
	<div class="px-4 py-3 bg-[var(--bg-page)]">
		<div class="max-w-3xl mx-auto">
			<!-- Carrossel -->
			<div class="relative rounded-xl overflow-hidden shadow-md">
				<!-- Banners -->
				<div
					ref="carrosselRef"
					class="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
					style="scroll-behavior: smooth"
				>
					<div
						v-for="(banner, index) in banners"
						:key="banner.id"
						class="min-w-full snap-start relative h-28 flex items-center justify-center"
						:style="{ backgroundColor: banner.cor_fundo }"
					>
						<!-- Imagem de fundo com overlay -->
						<div
							class="absolute inset-0 bg-cover bg-center"
							:style="{ backgroundImage: `url(${banner.imagem_url})` }"
						>
							<div class="absolute inset-0 bg-black/40"></div>
						</div>

						<!-- Conteúdo -->
						<div class="relative z-10 text-center px-6">
							<h3 class="text-lg font-bold text-white mb-1">{{ banner.titulo }}</h3>
							<p class="text-xs text-white/90">{{ banner.descricao }}</p>
						</div>
					</div>
				</div>

				<!-- Botões de navegação -->
				<button
					type="button"
					class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-colors shadow-md"
					@click="bannerAnterior"
				>
					<Icon name="lucide:chevron-left" class="w-5 h-5 text-gray-800" />
				</button>

				<button
					type="button"
					class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-colors shadow-md"
					@click="proximoBanner"
				>
					<Icon name="lucide:chevron-right" class="w-5 h-5 text-gray-800" />
				</button>

				<!-- Indicadores -->
				<div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
					<button
						v-for="(banner, index) in banners"
						:key="banner.id"
						type="button"
						class="w-2 h-2 rounded-full transition-all"
						:class="index === bannerAtivo ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/75'"
						@click="irParaBanner(index)"
					></button>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
/* Esconde a scrollbar mas mantém a funcionalidade */
.scrollbar-hide {
	-ms-overflow-style: none;
	scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
	display: none;
}
</style>
