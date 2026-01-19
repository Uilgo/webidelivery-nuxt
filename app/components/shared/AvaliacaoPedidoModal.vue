<script setup lang="ts">
/**
 * 📊 AvaliacaoPedidoModal - Modal para avaliar pedido concluído
 *
 * Permite cliente avaliar pedido com:
 * - 5 estrelas (rating)
 * - Comentário opcional
 * - Integração com RPC fn_pedidos_avaliar
 */

interface Props {
	pedidoId: string;
	pedidoNumero: number;
	modelValue: boolean;
}

interface Emits {
	(e: "update:modelValue", value: boolean): void;
	(e: "avaliado"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const supabase = useSupabaseClient();

/**
 * Estado do formulário
 */
const nota = ref<number>(0);
const comentario = ref<string>("");
const loading = ref<boolean>(false);
const erro = ref<string | undefined>();

/**
 * Hover state para preview de estrelas
 */
const notaHover = ref<number>(0);

/**
 * Computed para controlar modal
 */
const isOpen = computed({
	get: () => props.modelValue,
	set: (value) => emit("update:modelValue", value),
});

/**
 * Valida se pode enviar avaliação
 */
const podeEnviar = computed(() => nota.value > 0 && !loading.value);

/**
 * Define nota ao clicar em estrela
 */
const selecionarNota = (value: number): void => {
	nota.value = value;
};

/**
 * Envia avaliação via RPC
 */
const enviarAvaliacao = async (): Promise<void> => {
	if (!podeEnviar.value) return;

	loading.value = true;
	erro.value = undefined;

	try {
		const { data, error } = await supabase.rpc("fn_pedidos_avaliar", {
			p_pedido_id: props.pedidoId,
			p_nota: nota.value,
			p_comentario: comentario.value.trim() || null,
		});

		if (error) throw error;

		// Verifica resposta da RPC
		const resultado = data as { success: boolean; error?: string };

		if (!resultado.success) {
			throw new Error(resultado.error || "Erro ao enviar avaliação");
		}

		// Sucesso
		emit("avaliado");
		fecharModal();
	} catch (error) {
		console.error("Erro ao avaliar pedido:", error);
		erro.value = error instanceof Error ? error.message : "Erro ao enviar avaliação";
	} finally {
		loading.value = false;
	}
};

/**
 * Fecha modal e reseta formulário
 */
const fecharModal = (): void => {
	isOpen.value = false;
	setTimeout(() => {
		nota.value = 0;
		comentario.value = "";
		erro.value = undefined;
		notaHover.value = 0;
	}, 300);
};
</script>

<template>
	<UModal v-model="isOpen" :ui="{ width: 'sm:max-w-md' }">
		<UCard>
			<!-- Header -->
			<template #header>
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
						Avaliar Pedido #{{ pedidoNumero }}
					</h3>
					<UButton
						color="gray"
						variant="ghost"
						icon="i-heroicons-x-mark-20-solid"
						@click="fecharModal"
					/>
				</div>
			</template>

			<!-- Body -->
			<div class="space-y-6">
				<!-- Rating de Estrelas -->
				<div class="flex flex-col items-center space-y-3">
					<p class="text-sm text-gray-600 dark:text-gray-400">Como foi sua experiência?</p>

					<div class="flex gap-2">
						<button
							v-for="i in 5"
							:key="i"
							type="button"
							class="transition-transform hover:scale-110 focus:outline-none"
							@click="selecionarNota(i)"
							@mouseenter="notaHover = i"
							@mouseleave="notaHover = 0"
						>
							<Icon
								name="lucide:star"
								:class="[
									'w-10 h-10 transition-colors',
									i <= (notaHover || nota)
										? 'text-yellow-400 fill-yellow-400'
										: 'text-gray-300 dark:text-gray-600',
								]"
							/>
						</button>
					</div>

					<!-- Label da nota -->
					<p v-if="nota > 0" class="text-sm font-medium text-gray-700 dark:text-gray-300">
						{{
							nota === 5
								? "Excelente! 🎉"
								: nota === 4
									? "Muito bom! 😊"
									: nota === 3
										? "Bom 👍"
										: nota === 2
											? "Pode melhorar 😐"
											: "Ruim 😞"
						}}
					</p>
				</div>

				<!-- Comentário Opcional -->
				<div>
					<label
						for="comentario"
						class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
					>
						Comentário (opcional)
					</label>
					<UTextarea
						id="comentario"
						v-model="comentario"
						placeholder="Conte-nos mais sobre sua experiência..."
						:rows="4"
						:disabled="loading"
					/>
				</div>

				<!-- Mensagem de Erro -->
				<UAlert v-if="erro" color="red" variant="soft" :title="erro" />
			</div>

			<!-- Footer -->
			<template #footer>
				<div class="flex justify-end gap-3">
					<UButton color="gray" variant="ghost" :disabled="loading" @click="fecharModal">
						Cancelar
					</UButton>
					<UButton
						color="primary"
						:loading="loading"
						:disabled="!podeEnviar"
						@click="enviarAvaliacao"
					>
						Enviar Avaliação
					</UButton>
				</div>
			</template>
		</UCard>
	</UModal>
</template>
