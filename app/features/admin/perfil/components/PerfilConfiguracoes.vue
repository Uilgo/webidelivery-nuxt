<script setup lang="ts">
/**
 * 📌 PerfilConfiguracoes
 *
 * Gerenciamento de segurança e configurações da conta (Email e Senha).
 */

import { usePerfilEmail } from "~/features/admin/perfil/composables/usePerfilEmail";
import { usePerfilSenha } from "~/features/admin/perfil/composables/usePerfilSenha";

// Composable de Email
const {
	formState: emailState,
	loading: emailLoading,
	alterarEmail,
	limparErro: limparErroEmail,
} = usePerfilEmail();

// Composable de Senha
const {
	formState: senhaState,
	loading: senhaLoading,
	alterarSenha,
	limparErro: limparErroSenha,
} = usePerfilSenha();

// --- Email Handlers ---

const novoEmail = computed({
	get: () => emailState.value.data.novoEmail,
	set: (val) => {
		emailState.value.data.novoEmail = val;
		limparErroEmail("novoEmail");
	},
});

const confirmEmail = computed({
	get: () => emailState.value.data.confirmarEmail,
	set: (val) => {
		emailState.value.data.confirmarEmail = val;
		limparErroEmail("confirmarEmail");
	},
});

const handleEmailSubmit = async () => {
	await alterarEmail();
};

// --- Senha Handlers ---

const senhaAtual = computed({
	get: () => senhaState.value.data.senhaAtual,
	set: (val) => {
		senhaState.value.data.senhaAtual = val;
		limparErroSenha("senhaAtual");
	},
});

const novaSenha = computed({
	get: () => senhaState.value.data.novaSenha,
	set: (val) => {
		senhaState.value.data.novaSenha = val;
		limparErroSenha("novaSenha");
	},
});

const confirmSenha = computed({
	get: () => senhaState.value.data.confirmarSenha,
	set: (val) => {
		senhaState.value.data.confirmarSenha = val;
		limparErroSenha("confirmarSenha");
	},
});

const handleSenhaSubmit = async () => {
	await alterarSenha();
};
</script>

<template>
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
		<!-- Alterar Email -->
		<UiCard class="h-full">
			<template #header>
				<div class="flex items-center gap-2">
					<Icon name="lucide:mail" class="w-5 h-5 text-gray-500" />
					<h3 class="text-lg font-semibold">Alterar Email</h3>
				</div>
				<p class="text-sm text-gray-500 mt-1">
					Você precisará confirmar o novo email antes da alteração ser efetivada.
				</p>
			</template>

			<form class="space-y-4" @submit.prevent="handleEmailSubmit">
				<UiFormField label="Novo Email" :error="emailState.errors.novoEmail" required>
					<UiInput
						v-model="novoEmail"
						type="email"
						placeholder="seu@novoemail.com"
						:disabled="emailLoading"
					/>
				</UiFormField>

				<UiFormField label="Confirmar Email" :error="emailState.errors.confirmarEmail" required>
					<UiInput
						v-model="confirmEmail"
						type="email"
						placeholder="Confirme o novo email"
						:disabled="emailLoading"
					/>
				</UiFormField>

				<div class="flex justify-end pt-2">
					<UiButton type="submit" :loading="emailLoading" :disabled="emailLoading">
						Atualizar Email
					</UiButton>
				</div>
			</form>
		</UiCard>

		<!-- Alterar Senha -->
		<UiCard class="h-full">
			<template #header>
				<div class="flex items-center gap-2">
					<Icon name="lucide:lock" class="w-5 h-5 text-gray-500" />
					<h3 class="text-lg font-semibold">Alterar Senha</h3>
				</div>
				<p class="text-sm text-gray-500 mt-1">
					Escolha uma senha forte com pelo menos 8 caracteres.
				</p>
			</template>

			<form class="space-y-4" @submit.prevent="handleSenhaSubmit">
				<UiFormField label="Senha Atual" :error="senhaState.errors.senhaAtual" required>
					<UiInput
						v-model="senhaAtual"
						type="password"
						placeholder="Sua senha atual"
						:disabled="senhaLoading"
					/>
				</UiFormField>

				<UiFormField
					label="Nova Senha"
					:error="senhaState.errors.novaSenha"
					required
					help="Min. 8 caracteres, letras, números e símbolos"
				>
					<UiInput
						v-model="novaSenha"
						type="password"
						placeholder="Nova senha forte"
						:disabled="senhaLoading"
					/>
				</UiFormField>

				<UiFormField
					label="Confirmar Nova Senha"
					:error="senhaState.errors.confirmarSenha"
					required
				>
					<UiInput
						v-model="confirmSenha"
						type="password"
						placeholder="Confirme a nova senha"
						:disabled="senhaLoading"
					/>
				</UiFormField>

				<div class="flex justify-end pt-2">
					<UiButton type="submit" :loading="senhaLoading" :disabled="senhaLoading">
						Atualizar Senha
					</UiButton>
				</div>
			</form>
		</UiCard>
	</div>
</template>
