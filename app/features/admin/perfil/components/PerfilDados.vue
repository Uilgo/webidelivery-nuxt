<script setup lang="ts">
/**
 * 📌 PerfilDados
 *
 * Formulário para edição de dados pessoais do perfil (nome e sobrenome).
 */

import { usePerfil } from "~/features/admin/perfil/composables/usePerfil";
import { usePerfilUpdate } from "~/features/admin/perfil/composables/usePerfilUpdate";
import { useToast } from "~/composables/ui/useToast";

// Composables
const { perfil } = usePerfil();

const {
	formState,
	loading: saving,
	inicializarFormulario,
	atualizarDadosPessoais,
	limparErro,
} = usePerfilUpdate();
const { error: showToastError } = useToast();

// Inicializa o formulário quando o perfil carregar
watch(
	perfil,
	(newPerfil) => {
		if (newPerfil) {
			inicializarFormulario(newPerfil);
		}
	},
	{ immediate: true },
);

// Campos do formulário
const nome = computed({
	get: () => formState.value.data.nome,
	set: (val) => {
		formState.value.data.nome = val;
		limparErro("nome");
	},
});

const sobrenome = computed({
	get: () => formState.value.data.sobrenome,
	set: (val) => {
		formState.value.data.sobrenome = val;
		limparErro("sobrenome");
	},
});

// Handler de submit
const handleSubmit = async () => {
	try {
		await atualizarDadosPessoais();
	} catch (err: unknown) {
		console.error("Erro ao salvar dados pessoais:", err);
		const message = err instanceof Error ? err.message : "Erro desconhecido";
		showToastError({ title: "Erro ao salvar", description: message });
	}
};
</script>

<template>
	<UiCard>
		<template #header>
			<div class="flex items-center gap-2">
				<Icon name="lucide:user" class="w-5 h-5 text-gray-500" />
				<h3 class="text-lg font-semibold">Dados Pessoais</h3>
			</div>
			<p class="text-sm text-gray-500 mt-1">
				Essas informações serão exibidas publicamente para outros membros da equipe.
			</p>
		</template>

		<!-- ClientOnly para evitar hydration mismatch -->
		<form class="space-y-4" @submit.prevent="handleSubmit">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- Nome -->
				<UiFormField label="Nome" :error="formState.errors.nome" required>
					<UiInput id="nome" v-model="nome" placeholder="Seu nome" :disabled="saving" />
				</UiFormField>

				<!-- Sobrenome -->
				<UiFormField label="Sobrenome" :error="formState.errors.sobrenome" required>
					<UiInput
						id="sobrenome"
						v-model="sobrenome"
						placeholder="Seu sobrenome"
						:disabled="saving"
					/>
				</UiFormField>
			</div>

			<!-- Actions -->
			<div class="flex justify-end pt-2">
				<UiButton type="submit" :loading="saving" :disabled="saving"> Salvar Alterações </UiButton>
			</div>
		</form>
	</UiCard>
</template>
