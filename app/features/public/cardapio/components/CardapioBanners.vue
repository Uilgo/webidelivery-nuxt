<script setup lang="ts">
/**
 * 📌 CardapioBanners
 *
 * Carrossel de banners promocionais do cardápio público.
 *
 * FUNCIONALIDADES:
 * - Banners com link_url são clicáveis (cursor pointer + hover effects)
 * - Links externos (http/https) abrem em nova aba
 * - Banners sem link são apenas visuais
 * - Auto-play a cada 5 segundos
 * - Navegação por setas (desktop) e indicadores (todos os dispositivos)
 */

// Banners mockados
const banners = [
	{
		id: "1",
		titulo: "Pizza Grande + Refrigerante",
		descricao: "Compre uma pizza grande e ganhe 1L de refrigerante",
		imagem_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=300&fit=crop",
		cor_fundo: "#FF6B6B",
		tipo_conteudo: "imagem" as const, // apenas imagem
		link_url: "https://www.ifood.com.br/promocoes", // link externo
	},
	{
		id: "2",
		titulo: "Combo Família",
		descricao: "2 Pizzas grandes + 2L de refrigerante por apenas R$ 89,90",
		cor_fundo: "#4ECDC4",
		tipo_conteudo: "texto" as const, // apenas texto
		link_url: "https://wa.me/5511999999999?text=Quero%20saber%20mais%20sobre%20o%20combo", // link externo WhatsApp
	},
	{
		id: "3",
		titulo: "Terça-feira é dia de Promoção",
		descricao: "Todas as pizzas com 30% de desconto",
		imagem_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=300&fit=crop",
		cor_fundo: "#FFD93D",
		tipo_conteudo: "imagem" as const, // apenas imagem
		// sem link_url - banner apenas visual
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

/**
 * Verifica se um link é externo (http/https)
 */
const isExternalLink = (url: string): boolean => {
	return url.startsWith("http://") || url.startsWith("https://");
};

/**
 * Handler para clique no banner
 */
const handleBannerClick = (banner: (typeof banners)[0]): void => {
	// Se não tem link, não faz nada
	if (!banner.link_url) return;

	// Apenas links externos são suportados - abre em nova aba
	if (isExternalLink(banner.link_url)) {
		window.open(banner.link_url, "_blank", "noopener,noreferrer");
	}
};

/**
 * Verifica se o banner é clicável
 */
const isBannerClickable = (banner: (typeof banners)[0]): boolean => {
	return !!banner.link_url;
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
	<div class="bg-[var(--cardapio-background)]">
		<div class="w-full">
			<!-- Carrossel -->
			<div class="relative rounded-xl overflow-hidden shadow-md">
				<!-- Banners -->
				<div
					ref="carrosselRef"
					class="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
					style="scroll-behavior: smooth"
				>
					<!-- Banner Container (clicável se tiver link) -->
					<component
						:is="isBannerClickable(banner) ? 'button' : 'div'"
						v-for="(banner, index) in banners"
						:key="banner.id"
						class="min-w-full snap-start relative h-36 sm:h-40 md:h-44 lg:h-48 flex items-center justify-center overflow-hidden transition-all duration-200 group"
						:class="{
							'cursor-pointer hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50':
								isBannerClickable(banner),
							'cursor-default': !isBannerClickable(banner),
						}"
						:style="{ backgroundColor: banner.cor_fundo }"
						:type="isBannerClickable(banner) ? 'button' : undefined"
						@click="isBannerClickable(banner) ? handleBannerClick(banner) : undefined"
					>
						<!-- Overlay para banners clicáveis (melhora contraste no hover) -->
						<div
							v-if="isBannerClickable(banner)"
							class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 z-[1]"
						></div>

						<!-- Imagem de fundo -->
						<div
							v-if="banner.imagem_url && banner.tipo_conteudo === 'imagem'"
							class="absolute inset-0 bg-cover bg-center"
							:style="{ backgroundImage: `url(${banner.imagem_url})` }"
						></div>

						<!-- Conteúdo de texto (apenas para tipo "texto") -->
						<div
							v-if="banner.tipo_conteudo === 'texto'"
							class="relative z-10 text-center px-4 sm:px-6"
						>
							<h3 class="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white mb-1.5">
								{{ banner.titulo }}
							</h3>
							<p class="text-xs sm:text-sm md:text-base text-white/90">{{ banner.descricao }}</p>
						</div>

						<!-- Indicador de Link Externo (apenas se for clicável) -->
						<div
							v-if="isBannerClickable(banner)"
							class="absolute top-2 right-2 w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20"
						>
							<Icon name="lucide:external-link" class="w-3 h-3 text-white" />
						</div>
					</component>
				</div>

				<!-- Botões de navegação (apenas desktop) -->
				<button
					type="button"
					class="hidden lg:flex absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white items-center justify-center transition-colors shadow-md"
					@click="bannerAnterior"
				>
					<Icon name="lucide:chevron-left" class="w-5 h-5 text-gray-800" />
				</button>

				<button
					type="button"
					class="hidden lg:flex absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white items-center justify-center transition-colors shadow-md"
					@click="proximoBanner"
				>
					<Icon name="lucide:chevron-right" class="w-5 h-5 text-gray-800" />
				</button>

				<!-- Indicadores -->
				<div class="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2">
					<button
						v-for="(banner, index) in banners"
						:key="banner.id"
						type="button"
						class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all"
						:class="index === bannerAtivo ? 'bg-white w-4 sm:w-6' : 'bg-white/50 hover:bg-white/75'"
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
