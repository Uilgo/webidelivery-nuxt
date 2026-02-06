/**
 * 📌 Declarações de Tipos do Nuxt
 *
 * Extensões de tipos para plugins e helpers globais.
 */

declare module "#app" {
	interface NuxtApp {
		$formatCurrency: (value: number) => string;
		$formatNumber: (value: number) => string;
		$formatPercent: (value: number) => string;
	}
}

declare module "vue" {
	interface ComponentCustomProperties {
		$formatCurrency: (value: number) => string;
		$formatNumber: (value: number) => string;
		$formatPercent: (value: number) => string;
	}
}

export {};
