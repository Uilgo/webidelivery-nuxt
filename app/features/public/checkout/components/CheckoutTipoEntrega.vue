<script setup lang="ts">
/**
 * 📌 CheckoutTipoEntrega
 *
 * Formulário de tipo de entrega (Etapa 2).
 * Permite escolher entre Delivery ou Retirada.
 */

import type { TipoEntrega, EnderecoEntrega } from "~/features/public/checkout/types/checkout";
import { formatCEP, parseCEP } from "../../../../../lib/formatters/address";
import { useCEP } from "../../../../composables/useCEP";

interface Props {
	tipoInicial?: TipoEntrega;
	enderecoInicial?: EnderecoEntrega;
	enderecoEstabelecimento?: string;
}

const props = defineProps<Props>();

interface Emits {
	submit: [tipo: TipoEntrega, endereco?: EnderecoEntrega];
	voltar: [];
}

const emit = defineEmits<Emits>();

/**
 * Tipo de entrega selecionado
 */
const tipoSelecionado = ref<TipoEntrega>(props.tipoInicial || "delivery");

/**
 * Formulário de endereço
 */
const endereco = reactive<EnderecoEntrega>({
	cep: props.enderecoInicial?.cep || "",
	rua: props.enderecoInicial?.rua || "",
	numero: props.enderecoInicial?.numero || "",
	complemento: props.enderecoInicial?.complemento || "",
	bairro: props.enderecoInicial?.bairro || "",
	cidade: props.enderecoInicial?.cidade || "",
	estado: props.enderecoInicial?.estado || "",
	referencia: props.enderecoInicial?.referencia || "",
});

/**
 * Validação do formulário
 */
const formValido = computed(() => {
	if (tipoSelecionado.value === "retirada") return true;

	return !!(
		endereco.cep.trim() &&
		endereco.rua.trim() &&
		endereco.numero.trim() &&
		endereco.bairro.trim() &&
		endereco.cidade.trim() &&
		endereco.estado.trim()
	);
});

/**
 * Submete o formulário
 */
const handleSubmit = () => {
	if (!formValido.value) return;

	if (tipoSelecionado.value === "delivery") {
		emit("submit", "delivery", {
			cep: endereco.cep.trim(),
			rua: endereco.rua.trim(),
			numero: endereco.numero.trim(),
			complemento: endereco.complemento?.trim() || undefined,
			bairro: endereco.bairro.trim(),
			cidade: endereco.cidade.trim(),
			estado: endereco.estado.trim(),
			referencia: endereco.referencia?.trim() || undefined,
		});
	} else {
		emit("submit", "retirada");
	}
};

/**
 * CEP Lookup usando composable global
 */
const cepRef = ref(endereco.cep);
const { data: dadosCEP, error: erroCEP, loading: buscandoCEP } = useCEP(cepRef);

// Watch para preencher campos automaticamente quando CEP for encontrado
watch(dadosCEP, (novosDados) => {
	if (novosDados) {
		endereco.rua = novosDados.logradouro;
		endereco.bairro = novosDados.bairro;
		endereco.cidade = novosDados.localidade;
		endereco.estado = novosDados.uf;
	}
});

// Computed para verificar se CEP foi encontrado com sucesso
const cepEncontrado = computed(() => !!dadosCEP.value && !erroCEP.value);

/**
 * Formata CEP enquanto digita e atualiza ref para busca automática
 */
const formatarCEP = (event: Event) => {
	const input = event.target as HTMLInputElement;
	const apenasNumeros = parseCEP(input.value);
	endereco.cep = formatCEP(apenasNumeros);

	// Atualizar ref para trigger automático do useCEP
	cepRef.value = endereco.cep;
};
</script>

<template>
	<div class="space-y-6">
		<div>
			<h3 class="text-lg font-bold text-[var(--text-primary)] mb-2">🚚 Como você quer receber?</h3>
		</div>

		<form @submit.prevent="handleSubmit" class="space-y-6">
			<!-- Seleção de tipo -->
			<div class="grid grid-cols-2 gap-4">
				<!-- Delivery -->
				<button
					type="button"
					@click="tipoSelecionado = 'delivery'"
					class="p-4 rounded-lg border-2 transition-all text-center"
					:class="{
						'border-primary bg-primary/5': tipoSelecionado === 'delivery',
						'border-[var(--border-color)] hover:border-primary/50': tipoSelecionado !== 'delivery',
					}"
				>
					<Icon name="lucide:truck" class="w-8 h-8 mx-auto mb-2 text-primary" />
					<p class="font-bold text-[var(--text-primary)]">Delivery</p>
					<p class="text-xs text-[var(--text-muted)] mt-1">Entrega no endereço</p>
				</button>

				<!-- Retirada -->
				<button
					type="button"
					@click="tipoSelecionado = 'retirada'"
					class="p-4 rounded-lg border-2 transition-all text-center"
					:class="{
						'border-primary bg-primary/5': tipoSelecionado === 'retirada',
						'border-[var(--border-color)] hover:border-primary/50': tipoSelecionado !== 'retirada',
					}"
				>
					<Icon name="lucide:store" class="w-8 h-8 mx-auto mb-2 text-primary" />
					<p class="font-bold text-[var(--text-primary)]">Retirada</p>
					<p class="text-xs text-[var(--text-muted)] mt-1">Buscar no local</p>
				</button>
			</div>

			<!-- Formulário de endereço (apenas para delivery) -->
			<div v-if="tipoSelecionado === 'delivery'" class="space-y-4">
				<!-- CEP -->
				<div>
					<label for="cep" class="block text-sm font-medium text-[var(--text-primary)] mb-1">
						CEP <span class="text-red-500">*</span>
					</label>
					<div class="relative">
						<input
							id="cep"
							v-model="endereco.cep"
							type="text"
							required
							placeholder="00000-000"
							maxlength="9"
							@input="formatarCEP"
							:disabled="buscandoCEP"
							class="w-full px-4 py-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
							:class="{
								'border-red-500': erroCEP,
								'border-green-500': endereco.rua && !erroCEP,
							}"
						/>
						<!-- Loading indicator -->
						<div v-if="buscandoCEP" class="absolute right-3 top-1/2 transform -translate-y-1/2">
							<Icon name="lucide:loader-2" class="w-5 h-5 animate-spin text-primary" />
						</div>
						<!-- Success indicator -->
						<div
							v-else-if="cepEncontrado && !erroCEP"
							class="absolute right-3 top-1/2 transform -translate-y-1/2"
						>
							<Icon name="lucide:check" class="w-5 h-5 text-green-500" />
						</div>
					</div>
					<!-- Mensagem de erro -->
					<p v-if="erroCEP" class="text-sm text-red-500 mt-1">{{ erroCEP }}</p>
					<!-- Mensagem de sucesso -->
					<p v-else-if="cepEncontrado && !buscandoCEP" class="text-sm text-green-600 mt-1">
						✅ Endereço encontrado automaticamente
					</p>
				</div>

				<!-- Rua -->
				<div>
					<label for="rua" class="block text-sm font-medium text-[var(--text-primary)] mb-1">
						Rua <span class="text-red-500">*</span>
					</label>
					<input
						id="rua"
						v-model="endereco.rua"
						type="text"
						required
						placeholder="Nome da rua"
						class="w-full px-4 py-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary"
					/>
				</div>

				<!-- Número e Complemento -->
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="numero" class="block text-sm font-medium text-[var(--text-primary)] mb-1">
							Número <span class="text-red-500">*</span>
						</label>
						<input
							id="numero"
							v-model="endereco.numero"
							type="text"
							required
							placeholder="123"
							class="w-full px-4 py-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary"
						/>
					</div>
					<div>
						<label
							for="complemento"
							class="block text-sm font-medium text-[var(--text-primary)] mb-1"
						>
							Complemento
						</label>
						<input
							id="complemento"
							v-model="endereco.complemento"
							type="text"
							placeholder="Apto 101"
							class="w-full px-4 py-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary"
						/>
					</div>
				</div>

				<!-- Bairro -->
				<div>
					<label for="bairro" class="block text-sm font-medium text-[var(--text-primary)] mb-1">
						Bairro <span class="text-red-500">*</span>
					</label>
					<input
						id="bairro"
						v-model="endereco.bairro"
						type="text"
						required
						placeholder="Nome do bairro"
						class="w-full px-4 py-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary"
					/>
				</div>

				<!-- Cidade e Estado -->
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="cidade" class="block text-sm font-medium text-[var(--text-primary)] mb-1">
							Cidade <span class="text-red-500">*</span>
						</label>
						<input
							id="cidade"
							v-model="endereco.cidade"
							type="text"
							required
							placeholder="Sua cidade"
							class="w-full px-4 py-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary"
						/>
					</div>
					<div>
						<label for="estado" class="block text-sm font-medium text-[var(--text-primary)] mb-1">
							Estado <span class="text-red-500">*</span>
						</label>
						<input
							id="estado"
							v-model="endereco.estado"
							type="text"
							required
							placeholder="UF"
							maxlength="2"
							class="w-full px-4 py-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary uppercase"
						/>
					</div>
				</div>

				<!-- Ponto de referência -->
				<div>
					<label for="referencia" class="block text-sm font-medium text-[var(--text-primary)] mb-1">
						Ponto de referência
					</label>
					<input
						id="referencia"
						v-model="endereco.referencia"
						type="text"
						placeholder="Ex: Próximo ao mercado"
						class="w-full px-4 py-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary"
					/>
				</div>

				<!-- TODO: Placeholder para taxa de entrega -->
				<div
					class="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-400"
				>
					<p class="text-sm font-medium">
						⚠️ Taxa de entrega: A calcular (implementar no painel admin)
					</p>
				</div>
			</div>

			<!-- Endereço do estabelecimento (apenas para retirada) -->
			<div v-else class="p-4 rounded-lg bg-[var(--bg-muted)] border border-[var(--border-color)]">
				<p class="text-sm font-medium text-[var(--text-primary)] mb-2">
					📍 Endereço para retirada:
				</p>
				<p class="text-sm text-[var(--text-muted)]">
					{{ enderecoEstabelecimento || "Endereço não disponível" }}
				</p>
			</div>

			<!-- Botões -->
			<div class="flex gap-4">
				<button
					type="button"
					@click="emit('voltar')"
					class="flex-1 py-3 px-6 rounded-lg font-bold text-[var(--text-primary)] bg-[var(--bg-muted)] hover:bg-[var(--bg-muted)]/80 transition-colors"
				>
					Voltar
				</button>
				<button
					type="submit"
					:disabled="!formValido"
					class="flex-1 py-3 px-6 rounded-lg font-bold text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					Continuar
				</button>
			</div>
		</form>
	</div>
</template>
