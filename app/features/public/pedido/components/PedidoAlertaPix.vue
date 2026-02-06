<script setup lang="ts">
/**
 * 📌 PedidoAlertaPix
 *
 * Alerta para pagamento via PIX com upload de comprovante (Tailwind + Design System Adaptativo).
 */

import { useComprovantePixUpload } from "~/features/public/pedido/composables/useComprovantePixUpload";

interface Props {
	codigoRastreamento: string;
	comprovanteEnviado: boolean;
}

interface Emits {
	atualizar: [];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const {
	uploading,
	arquivoSelecionado,
	preview,
	selecionarArquivo,
	enviarComprovante,
	limparSelecao,
} = useComprovantePixUpload();

/**
 * Input file ref
 */
const fileInputRef = ref<HTMLInputElement | null>(null);

/**
 * Abrir seletor de arquivo
 */
const abrirSeletor = () => {
	fileInputRef.value?.click();
};

/**
 * Confirmar envio
 */
const confirmarEnvio = async () => {
	const sucesso = await enviarComprovante(props.codigoRastreamento);
	if (sucesso) {
		emit("atualizar");
	}
};

/**
 * Tipo do arquivo (imagem ou PDF)
 */
const tipoImagem = computed(() => {
	return arquivoSelecionado.value?.type.startsWith("image/");
});
</script>

<template>
	<div
		class="p-6 bg-gradient-to-br from-[#fef3c7] to-[#fde68a] rounded-2xl border-l-4 border-[#f59e0b] shadow-[var(--cardapio-card-shadow)]"
	>
		<!-- Header -->
		<div class="flex items-center gap-3 mb-3">
			<Icon name="lucide:alert-triangle" class="w-6 h-6 text-[#92400e] flex-shrink-0" />
			<h3 class="text-base font-bold text-[#92400e]">Atenção: Pagamento via PIX</h3>
		</div>

		<!-- Comprovante NÃO enviado -->
		<div v-if="!comprovanteEnviado" class="space-y-4">
			<p class="text-sm text-[#92400e] leading-relaxed">
				Envie o comprovante do pagamento PIX para confirmar seu pedido.
				<strong>Seu pedido só será processado após a validação do comprovante.</strong>
			</p>

			<!-- Input file (hidden) -->
			<input
				ref="fileInputRef"
				type="file"
				accept="image/jpeg,image/png,image/webp,application/pdf"
				class="hidden"
				@change="selecionarArquivo"
			/>

			<!-- Preview do arquivo -->
			<div v-if="arquivoSelecionado" class="space-y-3">
				<!-- Preview de imagem -->
				<div
					v-if="tipoImagem"
					class="relative rounded-xl overflow-hidden border-2 border-[#f59e0b] bg-white"
				>
					<img :src="preview || ''" alt="Preview" class="w-full h-auto max-h-64 object-contain" />
					<button
						type="button"
						@click="limparSelecao"
						class="absolute top-2 right-2 w-8 h-8 flex items-center justify-center p-0 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
					>
						<Icon name="lucide:x" class="w-4 h-4" />
					</button>
				</div>

				<!-- Preview de PDF -->
				<div
					v-else
					class="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-[#f59e0b]"
				>
					<Icon name="lucide:file-text" class="w-8 h-8 text-[#f59e0b]" />
					<div class="flex-1 min-w-0">
						<p class="text-sm font-semibold text-[#92400e] truncate">
							{{ arquivoSelecionado.name }}
						</p>
						<p class="text-xs text-[#92400e]/70">
							{{ (arquivoSelecionado.size / 1024).toFixed(0) }} KB
						</p>
					</div>
					<button
						type="button"
						@click="limparSelecao"
						class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
					>
						<Icon name="lucide:x" class="w-5 h-5" />
					</button>
				</div>

				<!-- Botão Confirmar -->
				<button
					type="button"
					@click="confirmarEnvio"
					:disabled="uploading"
					class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#f59e0b] text-white rounded-xl font-semibold text-sm transition-all duration-300 hover:bg-[#d97706] hover:-translate-y-0.5 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
				>
					<Icon
						:name="uploading ? 'lucide:loader-2' : 'lucide:check'"
						class="w-5 h-5"
						:class="{ 'animate-spin': uploading }"
					/>
					<span>{{ uploading ? "Enviando..." : "Confirmar Pagamento" }}</span>
				</button>
			</div>

			<!-- Botão Selecionar -->
			<button
				v-else
				type="button"
				@click="abrirSeletor"
				class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#f59e0b] text-white rounded-xl font-semibold text-sm transition-all duration-300 hover:bg-[#d97706] hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
			>
				<Icon name="lucide:upload" class="w-5 h-5" />
				<span>Selecionar Comprovante</span>
			</button>

			<p class="text-xs text-[#92400e]/70 text-center">
				Formatos aceitos: JPG, PNG, WEBP, PDF (máx. 5MB)
			</p>
		</div>

		<!-- Comprovante JÁ enviado -->
		<div v-else class="space-y-3">
			<div class="flex items-center gap-3 p-4 bg-white/50 rounded-xl">
				<Icon name="lucide:check-circle-2" class="w-6 h-6 text-green-600 flex-shrink-0" />
				<div>
					<p class="text-sm font-semibold text-[#92400e]">Comprovante enviado com sucesso!</p>
					<p class="text-xs text-[#92400e]/70">Aguarde a confirmação do estabelecimento</p>
				</div>
			</div>
		</div>
	</div>
</template>
