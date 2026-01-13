<script setup lang="ts">
/**
 * 📌 ForgotForm
 *
 * Formulário de recuperação de senha.
 * Campo: E-mail
 * Envia instruções para redefinir senha
 */

import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "#shared/schemas/auth";

interface Props {
	loading?: boolean;
	success?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	loading: false,
	success: false,
});

interface Emits {
	submit: [data: ForgotPasswordFormData];
}

const emit = defineEmits<Emits>();

// Configuração do VeeValidate com Zod
const { handleSubmit, defineField, errors } = useForm({
	validationSchema: toTypedSchema(forgotPasswordSchema),
	initialValues: {
		email: "",
	},
});

// Definição dos campos com VeeValidate
const [email, emailAttrs] = defineField("email");

// ID único para o campo
const emailId = useId();

// Handler do submit com validação
const onSubmit = handleSubmit((values) => {
	emit("submit", values);
});
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
						Enviamos instruções para redefinir sua senha.
					</p>
				</div>
			</div>
		</div>

		<!-- Formulário -->
		<form v-if="!props.success" class="space-y-4" @submit="onSubmit">
			<!-- Campo E-mail -->
			<UiFormField label="E-mail" required :error="errors.email">
				<UiInput
					:id="emailId"
					v-model="email"
					v-bind="emailAttrs"
					type="email"
					placeholder="seu@email.com"
					:disabled="props.loading"
					autocomplete="email"
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
					:loading="props.loading"
					:disabled="props.loading"
					full-width
				>
					<template #iconLeft>
						<Icon name="lucide:mail" class="w-5 h-5" />
					</template>
					{{ props.loading ? "Enviando..." : "Enviar instruções" }}
				</UiButton>
			</div>
		</form>

		<!-- Links -->
		<div class="space-y-3 text-center">
			<NuxtLink
				to="/login"
				class="text-[var(--primary)] hover:text-[var(--primary-hover)] text-sm font-medium block"
			>
				Voltar para o login
			</NuxtLink>

			<div class="text-[var(--text-secondary)] text-sm">
				Não tem uma conta?
				<NuxtLink
					to="/signup"
					class="text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium ml-1"
				>
					Cadastre-se
				</NuxtLink>
			</div>
		</div>
	</div>
</template>
