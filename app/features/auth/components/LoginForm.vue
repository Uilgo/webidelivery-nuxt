<script setup lang="ts">
/**
 * 📌 LoginForm
 *
 * Formulário de login para estabelecimentos.
 * Campos: E-mail, Senha
 * Links: "Esqueci minha senha", "Cadastre-se"
 */

import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { loginSchema, type LoginFormData } from "#shared/schemas/auth";
import { useAuth } from "~/composables/core/useAuth";
import { useToast } from "~/composables/ui/useToast";

interface Props {
	loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	loading: false,
});

interface Emits {
	submit: [data: LoginFormData];
}

const emit = defineEmits<Emits>();

// Configuração do VeeValidate com Zod
const { handleSubmit, defineField, errors } = useForm({
	validationSchema: toTypedSchema(loginSchema),
	initialValues: {
		email: "",
		password: "",
		remember: false,
	},
});

// Definição dos campos com VeeValidate
const [email, emailAttrs] = defineField("email");
const [password, passwordAttrs] = defineField("password");
const [remember, rememberAttrs] = defineField("remember");

// Composable de autenticação
const { login } = useAuth();

// Composable de toast para notificações
const { success: showSuccess, error: showError } = useToast();

// Estados de loading e erro
const isSubmitting = ref(false);
const submitError = ref<string | null>(null);

// IDs únicos para os campos
const emailId = useId();
const passwordId = useId();

// Handler do submit com validação
const onSubmit = handleSubmit(async (values) => {
	isSubmitting.value = true;
	submitError.value = null;

	try {
		const result = await login(values);

		if (result.success) {
			// Login bem-sucedido - mostrar toast de sucesso
			showSuccess({ title: "Login realizado!", description: "Bem-vindo de volta!" });
			emit("submit", values);
		} else {
			// Erro no login - mostrar toast de erro
			const errorMessage = result.error?.message || "Erro ao fazer login";
			showError({ title: "Erro no login", description: errorMessage });
			submitError.value = errorMessage;
		}
	} catch (error) {
		console.error("Erro inesperado no login:", error);
		const errorMessage = "Erro inesperado. Tente novamente.";
		showError({ title: "Erro inesperado", description: errorMessage });
		submitError.value = errorMessage;
	} finally {
		isSubmitting.value = false;
	}
});
</script>

<template>
	<div class="space-y-6">
		<!-- Formulário -->
		<form class="space-y-6" @submit="onSubmit">
			<!-- Erro de submit -->
			<div
				v-if="submitError"
				class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
			>
				<p class="text-sm text-red-600 dark:text-red-400">{{ submitError }}</p>
			</div>

			<!-- Campo E-mail -->
			<UiFormField label="E-mail" required :error="errors.email">
				<UiInput
					:id="emailId"
					v-model="email"
					v-bind="emailAttrs"
					type="email"
					placeholder="seu@email.com"
					:disabled="isSubmitting || props.loading"
					autocomplete="email"
					required
				/>
			</UiFormField>

			<!-- Campo Senha -->
			<UiFormField label="Senha" required :error="errors.password">
				<UiInput
					:id="passwordId"
					v-model="password"
					v-bind="passwordAttrs"
					type="password"
					placeholder="Digite sua senha"
					:disabled="isSubmitting || props.loading"
					autocomplete="current-password"
					required
				/>
				<!-- Linha com checkbox e link "Esqueci minha senha" -->
				<div class="mt-3 flex items-center justify-between">
					<UiCheckbox
						v-model="remember"
						v-bind="rememberAttrs"
						label="Lembrar de mim"
						size="sm"
						:disabled="isSubmitting || props.loading"
					/>
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
					:loading="isSubmitting || props.loading"
					:disabled="isSubmitting || props.loading"
					full-width
				>
					<template #iconLeft>
						<Icon name="lucide:log-in" class="w-5 h-5" />
					</template>
					{{ props.loading ? "Entrando..." : "Entrar" }}
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
