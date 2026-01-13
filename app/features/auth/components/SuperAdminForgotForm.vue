<script setup lang="ts">
/**
 * 📌 SuperAdminForgotForm
 *
 * Formulário de recuperação de senha para equipe da plataforma WebiDelivery.
 * Campo: E-mail corporativo
 * Envia instruções para redefinir senha da equipe interna
 */

interface Props {
	loading?: boolean;
	success?: boolean;
}

withDefaults(defineProps<Props>(), {
	loading: false,
	success: false,
});

// Estado básico do formulário
const email = ref("");
</script>

<template>
	<div class="space-y-6">
		<!-- Estado de sucesso -->
		<div
			v-if="success"
			class="bg-[var(--success-light)] border border-[var(--success)] rounded-lg p-4"
		>
			<div class="flex items-center">
				<Icon name="lucide:check-circle" class="w-5 h-5 text-[var(--success)] mr-3" />
				<div>
					<h3 class="text-[var(--success)] font-medium">E-mail enviado!</h3>
					<p class="text-[var(--success)] text-sm mt-1">
						Enviamos instruções para redefinir sua senha corporativa.
					</p>
				</div>
			</div>
		</div>

		<!-- Formulário -->
		<form v-if="!success" class="space-y-4">
			<!-- Campo E-mail -->
			<UiFormField label="E-mail Corporativo" required>
				<UiInput
					v-model="email"
					type="email"
					placeholder="seu@webidelivery.com.br"
					:disabled="loading"
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
					full-width
				>
					<template #iconLeft>
						<Icon name="lucide:shield" class="w-5 h-5" />
					</template>
					Enviar instruções
				</UiButton>
			</div>
		</form>

		<!-- Links -->
		<div class="space-y-3 text-center">
			<NuxtLink
				to="/super-admin/login"
				class="text-[var(--primary)] hover:text-[var(--primary-hover)] text-sm font-medium block"
			>
				Voltar para login da plataforma
			</NuxtLink>

			<div class="text-[var(--text-muted)] text-xs">
				<NuxtLink
					to="/forgot-password"
					class="text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
				>
					← Recuperar senha de estabelecimento
				</NuxtLink>
			</div>
		</div>
	</div>
</template>
