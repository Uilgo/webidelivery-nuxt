<script setup lang="ts">
/**
 * 📊 PedidoAvaliacaoBottomSheet - BottomSheet para avaliar pedido (Mobile)
 */

interface Props {
	pedidoNumero: number;
	modelValue: boolean;
	nota: number;
	notaHover: number;
	comentario: string;
	loading: boolean;
	erro?: string;
	podeEnviar: boolean;
}

interface Emits {
	(e: "update:modelValue", value: boolean): void;
	(e: "update:nota", value: number): void;
	(e: "update:notaHover", value: number): void;
	(e: "update:comentario", value: string): void;
	(e: "enviar"): void;
	(e: "fechar"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isOpen = computed({
	get: () => props.modelValue,
	set: (value) => emit("update:modelValue", value),
});

const notaLocal = computed({
	get: () => props.nota,
	set: (value) => emit("update:nota", value),
});

const notaHoverLocal = computed({
	get: () => props.notaHover,
	set: (value) => emit("update:notaHover", value),
});

const comentarioLocal = computed({
	get: () => props.comentario,
	set: (value) => emit("update:comentario", value),
});
</script>

<template>
	<UiBottomSheet
		v-model="isOpen"
		:snap-points="[85]"
		:show-handle="true"
		:close-on-click-outside="true"
	>
		<template #header>
			<div class="flex items-center justify-between px-4 py-3">
				<h3 class="text-lg font-semibold text-[var(--cardapio-text)]">
					Avaliar Pedido #{{ pedidoNumero }}
				</h3>
				<button
					type="button"
					class="p-2 rounded-full hover:bg-[var(--cardapio-muted)] transition-colors"
					@click="emit('fechar')"
				>
					<Icon name="lucide:x" class="w-5 h-5 text-[var(--cardapio-text-muted)]" />
				</button>
			</div>
		</template>

		<div class="px-4 py-6 space-y-6">
			<!-- Rating de Estrelas -->
			<div class="flex flex-col items-center space-y-4">
				<p class="text-base font-medium text-[var(--cardapio-text)]">Como foi sua experiência?</p>

				<div class="flex gap-3">
					<button
						v-for="i in 5"
						:key="i"
						type="button"
						class="transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none"
						@click="notaLocal = i"
						@mouseenter="notaHoverLocal = i"
						@mouseleave="notaHoverLocal = 0"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							:style="{
								width: '44px',
								height: '44px',
								fill: i <= (notaHoverLocal || notaLocal) ? '#FBBF24' : '#D1D5DB',
								stroke: i <= (notaHoverLocal || notaLocal) ? '#FBBF24' : '#D1D5DB',
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

				<!-- Label da nota -->
				<Transition
					enter-active-class="transition-all duration-300"
					enter-from-class="opacity-0 scale-90"
					enter-to-class="opacity-100 scale-100"
					leave-active-class="transition-all duration-200"
					leave-from-class="opacity-100 scale-100"
					leave-to-class="opacity-0 scale-90"
				>
					<div v-if="notaLocal > 0" class="px-6 py-3 bg-[var(--cardapio-primary)]/10 rounded-full">
						<p class="text-lg font-semibold text-[var(--cardapio-primary)]">
							{{
								notaLocal === 5
									? "Excelente! 🎉"
									: notaLocal === 4
										? "Muito bom! 😊"
										: notaLocal === 3
											? "Bom 👍"
											: notaLocal === 2
												? "Pode melhorar 😐"
												: "Ruim 😞"
							}}
						</p>
					</div>
				</Transition>
			</div>

			<!-- Comentário -->
			<div>
				<label
					for="comentario-mobile"
					class="block text-sm font-medium text-[var(--cardapio-text)] mb-2"
				>
					Comentário (opcional)
				</label>
				<UiTextarea
					id="comentario-mobile"
					v-model="comentarioLocal"
					placeholder="Conte-nos mais sobre sua experiência..."
					:rows="4"
					:disabled="loading"
					class="resize-none"
				/>
			</div>

			<!-- Erro -->
			<div v-if="erro" class="p-4 bg-red-50 border border-red-200 rounded-xl">
				<p class="text-sm text-red-800">{{ erro }}</p>
			</div>
		</div>

		<template #footer>
			<div class="flex gap-3 p-4 border-t border-[var(--cardapio-border)]">
				<UiButton
					color="neutral"
					variant="outline"
					class="flex-1"
					:disabled="loading"
					@click="emit('fechar')"
				>
					Cancelar
				</UiButton>
				<UiButton
					color="primary"
					class="flex-1"
					:loading="loading"
					:disabled="!podeEnviar"
					@click="emit('enviar')"
				>
					Enviar Avaliação
				</UiButton>
			</div>
		</template>
	</UiBottomSheet>
</template>
