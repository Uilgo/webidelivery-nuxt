<script setup lang="ts">
/**
 * 📊 PedidoAvaliacao - Wrapper responsivo para avaliação de pedido
 *
 * Renderiza PedidoAvaliacaoMobile (BottomSheet) em mobile
 * Renderiza PedidoAvaliacaoDesktop (Modal) em desktop
 */

import PedidoAvaliacaoMobile from "./PedidoAvaliacaoMobile.vue";
import PedidoAvaliacaoDesktop from "./PedidoAvaliacaoDesktop.vue";

interface Props {
	pedidoId: string;
	pedidoNumero: number;
	modelValue: boolean;
	avaliacaoExistente?: {
		nota: number;
		comentario: string | null;
	} | null;
}

interface Emits {
	(e: "update:modelValue", value: boolean): void;
	(e: "avaliado"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const supabase = useSupabaseClient();

/**
 * Estado da avaliação
 */
const nota = ref(0);
const notaHover = ref(0);
const comentario = ref("");
const loading = ref(false);
const erro = ref("");

/**
 * Pré-preencher com avaliação existente quando modal abrir
 */
watch(
	() => props.modelValue,
	(isOpen) => {
		if (isOpen && props.avaliacaoExistente) {
			nota.value = props.avaliacaoExistente.nota;
			comentario.value = props.avaliacaoExistente.comentario || "";
		}
	},
	{ immediate: true },
);

/**
 * Detectar se é mobile
 */
const isMobile = ref(false);

onMounted(() => {
	isMobile.value = window.innerWidth < 768;

	const handleResize = () => {
		isMobile.value = window.innerWidth < 768;
	};

	window.addEventListener("resize", handleResize);

	onUnmounted(() => {
		window.removeEventListener("resize", handleResize);
	});
});

/**
 * Validação
 */
const podeEnviar = computed(() => nota.value > 0 && !loading.value);

/**
 * Enviar avaliação
 */
const enviarAvaliacao = async () => {
	if (!podeEnviar.value) return;

	loading.value = true;
	erro.value = "";

	try {
		const { data, error: rpcError } = await supabase.rpc("fn_pedidos_avaliar", {
			p_pedido_id: props.pedidoId,
			p_nota: nota.value,
			p_comentario: comentario.value || null,
		});

		if (rpcError) throw rpcError;

		// Verificar resposta da função
		if (!data?.success) {
			throw new Error(data?.error || "Erro ao enviar avaliação");
		}

		// Sucesso
		emit("avaliado");
		fechar();
	} catch (err: any) {
		erro.value = err.message || "Não foi possível enviar sua avaliação. Tente novamente.";
	} finally {
		loading.value = false;
	}
};

/**
 * Fechar modal/bottomsheet
 */
const fechar = () => {
	emit("update:modelValue", false);

	// Reset após animação
	setTimeout(() => {
		nota.value = 0;
		notaHover.value = 0;
		comentario.value = "";
		erro.value = "";
	}, 300);
};
</script>

<template>
	<!-- Mobile: BottomSheet -->
	<PedidoAvaliacaoMobile
		v-if="isMobile"
		:model-value="modelValue"
		:pedido-numero="pedidoNumero"
		:nota="nota"
		:nota-hover="notaHover"
		:comentario="comentario"
		:loading="loading"
		:erro="erro"
		:pode-enviar="podeEnviar"
		@update:model-value="emit('update:modelValue', $event)"
		@update:nota="nota = $event"
		@update:nota-hover="notaHover = $event"
		@update:comentario="comentario = $event"
		@enviar="enviarAvaliacao"
		@fechar="fechar"
	/>

	<!-- Desktop: Modal -->
	<PedidoAvaliacaoDesktop
		v-else
		:model-value="modelValue"
		:pedido-numero="pedidoNumero"
		:nota="nota"
		:nota-hover="notaHover"
		:comentario="comentario"
		:loading="loading"
		:erro="erro"
		:pode-enviar="podeEnviar"
		@update:model-value="emit('update:modelValue', $event)"
		@update:nota="nota = $event"
		@update:nota-hover="notaHover = $event"
		@update:comentario="comentario = $event"
		@enviar="enviarAvaliacao"
		@fechar="fechar"
	/>
</template>
