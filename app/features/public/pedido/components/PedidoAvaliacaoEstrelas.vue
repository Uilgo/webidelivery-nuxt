<script setup lang="ts">
/**
 * ⭐ PedidoAvaliacaoEstrelas
 *
 * Componente de exibição de estrelas para avaliação.
 * Suporta modo interativo (para avaliar) e modo estático (para exibir).
 */

interface Props {
	/** Nota atual (1-5) */
	nota: number;
	/** Nota no hover (apenas modo interativo) */
	notaHover?: number;
	/** Tamanho das estrelas em pixels */
	tamanho?: number;
	/** Espaçamento entre estrelas (gap) */
	gap?: number;
	/** Modo interativo (clicável) ou estático (apenas exibição) */
	interativo?: boolean;
}

interface Emits {
	(e: "update:nota", value: number): void;
	(e: "update:nota-hover", value: number): void;
}

const props = withDefaults(defineProps<Props>(), {
	notaHover: 0,
	tamanho: 24,
	gap: 4,
	interativo: false,
});

const emit = defineEmits<Emits>();

/**
 * Verifica se a estrela deve estar preenchida
 */
const isPreenchida = (index: number): boolean => {
	if (props.interativo && props.notaHover > 0) {
		return index <= props.notaHover;
	}
	return index <= props.nota;
};

/**
 * Handlers para modo interativo
 */
const handleClick = (index: number) => {
	if (props.interativo) {
		emit("update:nota", index);
	}
};

const handleMouseEnter = (index: number) => {
	if (props.interativo) {
		emit("update:nota-hover", index);
	}
};

const handleMouseLeave = () => {
	if (props.interativo) {
		emit("update:nota-hover", 0);
	}
};
</script>

<template>
	<div class="flex items-center justify-center" :style="{ gap: `${gap}px` }">
		<button
			v-for="i in 5"
			:key="i"
			type="button"
			:disabled="!interativo"
			:class="[
				'transition-all duration-200 focus:outline-none',
				interativo ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default',
			]"
			@click="handleClick(i)"
			@mouseenter="handleMouseEnter(i)"
			@mouseleave="handleMouseLeave"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				:style="{
					width: `${tamanho}px`,
					height: `${tamanho}px`,
					fill: isPreenchida(i) ? '#FBBF24' : '#D1D5DB',
					stroke: isPreenchida(i) ? '#FBBF24' : '#D1D5DB',
					strokeWidth: '1',
				}"
				stroke-linejoin="round"
				stroke-linecap="round"
				class="transition-all duration-200 drop-shadow-lg"
			>
				<path
					d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
				/>
			</svg>
		</button>
	</div>
</template>
