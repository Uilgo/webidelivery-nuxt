<script setup lang="ts">
/**
 * 📌 SuperAdminLoginForm
 *
 * Formulário de login para equipe da plataforma WebiDelivery.
 * Campos: E-mail, Senha
 * Diferenças: Título e textos específicos para plataforma
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
			<UiFormField label="E-mail Corporativo" required>
				<UiInput
					:id="emailId"
					v-model="email"
					type="email"
					placeholder="seu@webidelivery.com.br"
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
					<UiCheckbox
						v-model="rememberMe"
						label="Manter-me conectado"
						size="sm"
						:disabled="loading"
					/>
					<NuxtLink
						to="/super-admin/forgot-password"
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
						<Icon name="lucide:shield-check" class="w-5 h-5" />
					</template>
					{{ loading ? "Entrando..." : "Entrar na Plataforma" }}
				</UiButton>
			</div>
		</form>

		<!-- Links -->
		<div class="space-y-4 text-center">
			<div class="text-[var(--text-secondary)] text-sm">
				Não tem acesso à plataforma?
				<NuxtLink
					to="/super-admin/signup"
					class="text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium ml-1 transition-colors duration-200"
				>
					Solicitar cadastro
				</NuxtLink>
			</div>

			<div class="text-[var(--text-muted)] text-xs pt-2 border-t border-[var(--border-light)]">
				<NuxtLink
					to="/login"
					class="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors duration-200"
				>
					← Voltar para login de estabelecimentos
				</NuxtLink>
			</div>
		</div>
	</div>
</template>
