<script setup lang="ts">
/**
 * 📌 LoginForm
 *
 * Formulário de login para estabelecimentos.
 * Campos: E-mail, Senha
 * Links: "Esqueci minha senha", "Cadastre-se"
 */

interface Props {
	loading?: boolean;
}

withDefaults(defineProps<Props>(), {
	loading: false,
});

// Estado básico do formulário
const email = ref("");
const password = ref("");
const rememberMe = ref(false);

// IDs únicos para os campos
const emailId = useId();
const passwordId = useId();
</script>

<template>
	<div class="space-y-6">
		<!-- Formulário -->
		<form class="space-y-6" @submit.prevent>
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

			<!-- Campo Senha -->
			<UiFormField label="Senha" required>
				<UiInput
					:id="passwordId"
					v-model="password"
					type="password"
					placeholder="Digite sua senha"
					:disabled="loading"
					autocomplete="current-password"
					required
				/>
				<!-- Linha com checkbox e link "Esqueci minha senha" -->
				<div class="mt-3 flex items-center justify-between">
					<UiCheckbox v-model="rememberMe" label="Lembrar de mim" size="sm" :disabled="loading" />
					<NuxtLink
						to="/forgot-password"
						class="text-[var(--primary)] hover:text-[var(--primary-hover)] text-sm transition-colors duration-200"
					>
						Esqueci minha senha
					</NuxtLink>
				</div>
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
						<Icon name="lucide:log-in" class="w-5 h-5" />
					</template>
					{{ loading ? "Entrando..." : "Entrar" }}
				</UiButton>
			</div>
		</form>

		<!-- Links -->
		<div class="text-center">
			<div class="text-[var(--text-secondary)] text-sm">
				Não tem uma conta?
				<NuxtLink
					to="/signup"
					class="text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium ml-1 transition-colors duration-200"
				>
					Cadastre-se
				</NuxtLink>
			</div>
		</div>
	</div>
</template>
