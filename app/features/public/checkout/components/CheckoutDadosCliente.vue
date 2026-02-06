<script setup lang="ts">
/**
 * 📌 CheckoutDadosCliente
 *
 * Formulário de dados do cliente (Etapa 1).
 */

import type { DadosCliente } from "~/features/public/checkout/types/checkout";
import { formatPhone, parsePhone, isValidPhone } from "~/lib/formatters/phone";
import { formatCPF, parseCPF } from "~/lib/formatters/document";
import { isValidCPF } from "~/lib/validators/document";

interface Props {
	dadosIniciais?: DadosCliente;
}

const props = defineProps<Props>();

interface Emits {
	submit: [dados: DadosCliente];
}

const emit = defineEmits<Emits>();

/**
 * Formulário reativo
 */
const form = reactive<DadosCliente>({
	nome: props.dadosIniciais?.nome || "",
	telefone: props.dadosIniciais?.telefone || "",
	email: props.dadosIniciais?.email || "",
	cpf: props.dadosIniciais?.cpf || "",
});

/**
 * Validação do formulário
 */
const telefoneValido = computed(() => {
	if (!form.telefone || form.telefone.trim().length === 0) return false;
	return isValidPhone(form.telefone);
});

const cpfValido = computed(() => {
	if (!form.cpf || form.cpf.trim().length === 0) return true; // CPF é opcional
	return isValidCPF(form.cpf);
});

const formValido = computed(() => {
	return form.nome.trim().length >= 3 && telefoneValido.value && cpfValido.value;
});

/**
 * Submete o formulário
 */
const handleSubmit = () => {
	if (!formValido.value) return;

	emit("submit", {
		nome: form.nome.trim(),
		telefone: form.telefone.trim(),
		email: form.email?.trim() || undefined,
		cpf: form.cpf?.trim() || undefined,
	});
};

/**
 * Formata telefone enquanto digita usando formatter centralizado
 */
const formatarTelefone = (event: Event) => {
	const input = event.target as HTMLInputElement;
	const apenasNumeros = parsePhone(input.value);
	form.telefone = formatPhone(apenasNumeros);
};

/**
 * Formata CPF enquanto digita usando formatter centralizado
 */
const formatarCPF = (event: Event) => {
	const input = event.target as HTMLInputElement;
	const apenasNumeros = parseCPF(input.value);
	form.cpf = formatCPF(apenasNumeros);
};
</script>

<template>
	<div class="space-y-6">
		<form @submit.prevent="handleSubmit" class="space-y-4">
			<!-- Nome -->
			<div>
				<label for="nome" class="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
					Nome completo <span class="text-error">*</span>
				</label>
				<UiInput id="nome" v-model="form.nome" type="text" required placeholder="Ex: João Silva" />
			</div>

			<!-- Telefone -->
			<div>
				<label for="telefone" class="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
					Telefone/WhatsApp <span class="text-error">*</span>
				</label>
				<UiInput
					id="telefone"
					v-model="form.telefone"
					type="tel"
					required
					placeholder="(00) 00000-0000"
					maxlength="15"
					@input="formatarTelefone"
					:class="{ 'border-error': form.telefone && !telefoneValido }"
				/>
				<p v-if="form.telefone && !telefoneValido" class="text-xs text-error mt-1">
					Telefone inválido. Digite um número com DDD.
				</p>
			</div>

			<!-- Email -->
			<div>
				<label for="email" class="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
					E-mail <span class="text-xs text-[var(--text-muted)]">(opcional)</span>
				</label>
				<UiInput id="email" v-model="form.email" type="email" placeholder="seu@email.com" />
			</div>

			<!-- CPF -->
			<div>
				<label for="cpf" class="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
					CPF na nota? <span class="text-xs text-[var(--text-muted)]">(opcional)</span>
				</label>
				<UiInput
					id="cpf"
					v-model="form.cpf"
					type="text"
					placeholder="000.000.000-00"
					maxlength="14"
					@input="formatarCPF"
					:class="{ 'border-error': form.cpf && !cpfValido }"
				/>
				<p v-if="form.cpf && !cpfValido" class="text-xs text-error mt-1">
					CPF inválido. Verifique os dígitos.
				</p>
			</div>

			<!-- Botão -->
			<UiButton
				type="submit"
				:disabled="!formValido"
				variant="solid"
				size="lg"
				class="w-full font-bold bg-[var(--cardapio-primary)] text-white shadow-[var(--cardapio-button-shadow)] hover:shadow-[var(--cardapio-button-shadow-hover)] hover:bg-[var(--cardapio-primary)]"
			>
				Continuar
				<Icon name="lucide:arrow-right" class="w-5 h-5 ml-2" />
			</UiButton>
		</form>
	</div>
</template>
