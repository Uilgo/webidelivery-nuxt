<script setup lang="ts">
/**
 * 📌 SignupForm
 *
 * Formulário de cadastro para estabelecimentos.
 * Campos: Nome, Sobrenome, E-mail, Senha, Confirmar Senha
 * Cria estabelecimento em "rascunho" → Redireciona /onboarding
 */

interface Props {
	loading?: boolean;
}

withDefaults(defineProps<Props>(), {
	loading: false,
});

// Estado básico do formulário
const nome = ref("");
const sobrenome = ref("");
const email = ref("");
const senha = ref("");
const confirmarSenha = ref("");

// IDs únicos para os campos
const nomeId = useId();
const sobrenomeId = useId();
const emailId = useId();
const senhaId = useId();
const confirmarSenhaId = useId();
</script>

<template>
	<div class="space-y-6">
		<!-- Formulário -->
		<form class="space-y-5" @submit.prevent>
			<!-- Nome e Sobrenome -->
			<div class="grid grid-cols-2 gap-4">
				<UiFormField label="Nome" required>
					<UiInput
						:id="nomeId"
						v-model="nome"
						type="text"
						placeholder="Seu nome"
						:disabled="loading"
						autocomplete="given-name"
						required
					/>
				</UiFormField>
				<UiFormField label="Sobrenome" required>
					<UiInput
						:id="sobrenomeId"
						v-model="sobrenome"
						type="text"
						placeholder="Seu sobrenome"
						:disabled="loading"
						autocomplete="family-name"
						required
					/>
				</UiFormField>
			</div>

			<!-- Campo E-mail -->
			<UiFormField label="E-mail" required>
				<UiInput
					:id="emailId"
					v-model="email"
					type="email"
					placeholder="seu@email.com"
					:disabled="loading"
					autocomplete="email"
					required
				/>
			</UiFormField>

			<!-- Campos de Senha -->
			<UiFormField label="Senha" required>
				<UiInput
					:id="senhaId"
					v-model="senha"
					type="password"
					placeholder="Mínimo 8 caracteres"
					:disabled="loading"
					autocomplete="new-password"
					required
				/>
			</UiFormField>

			<UiFormField label="Confirmar Senha" required>
				<UiInput
					:id="confirmarSenhaId"
					v-model="confirmarSenha"
					type="password"
					placeholder="Confirme sua senha"
					:disabled="loading"
					autocomplete="new-password"
					required
				/>
			</UiFormField>

			<!-- Botão de submissão -->
			<div class="pt-2">
				<UiButton
					type="submit"
					variant="solid"
					color="primary"
					size="lg"
					:loading="loading"
					:disabled="loading"
					full-width
				>
					<template #iconLeft>
						<Icon name="lucide:user-plus" class="w-5 h-5" />
					</template>
					{{ loading ? "Criando conta..." : "Criar conta" }}
				</UiButton>
			</div>
		</form>

		<!-- Link para login -->
		<div class="text-center text-[var(--text-secondary)] text-sm">
			Já tem uma conta?
			<NuxtLink
				to="/login"
				class="text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium ml-1 transition-colors duration-200"
			>
				Entrar
			</NuxtLink>
		</div>
	</div>
</template>
