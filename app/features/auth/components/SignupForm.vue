<script setup lang="ts">
/**
 * 📌 SignupForm
 *
 * Formulário de cadastro para estabelecimentos.
 * Campos: Nome, Sobrenome, E-mail, Senha, Confirmar Senha
 * Cria estabelecimento em "rascunho" → Redireciona /onboarding
 */

import { toTypedSchema } from "@vee-validate/zod";
import { useForm, useField } from "vee-validate";
import { registerSchema, type RegisterFormData } from "#shared/schemas/auth";
import { useValidators } from "~/composables/form/useValidators";
import { useAuth } from "~/composables/core/useAuth";
import { useToast } from "~/composables/ui/useToast";

interface Props {
	loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	loading: false,
});

interface Emits {
	submit: [data: RegisterFormData];
}

const emit = defineEmits<Emits>();

// Usar o composable de validadores e auth
const { validateEmailAvailable } = useValidators();
const { signupEstablishment } = useAuth();

// Composable de toast para notificações
const { success: showSuccess, error: showError } = useToast();

// Estados de loading e erro
const submitError = ref<string | null>(null);
const isSubmitting = ref<boolean>(false);

// Configuração do VeeValidate com Zod
const { handleSubmit } = useForm({
	validationSchema: toTypedSchema(registerSchema),
	initialValues: {
		nome: "",
		sobrenome: "",
		email: "",
		password: "",
		confirm_password: "",
		terms: false,
		privacy: false,
	},
});

// Definição dos campos básicos com useField
const nome = useField<string>("nome");
const sobrenome = useField<string>("sobrenome");
const password = useField<string>("password");
const confirmPassword = useField<string>("confirm_password");
const terms = useField<boolean>("terms");
const privacy = useField<boolean>("privacy");

// Campo email com validação assíncrona
const email = useField<string>("email", async (value: string) => {
	// Primeiro aplica validação do schema (formato, required, etc.)
	// Nota: registerSchema usa .refine(), então precisamos acessar o schema interno
	const baseSchema = registerSchema._def.schema;
	const schemaResult = baseSchema.shape.email.safeParse(value);
	if (!schemaResult.success) {
		return schemaResult.error.issues[0]?.message || "E-mail inválido";
	}

	// Depois aplica validação assíncrona (email único)
	const isAvailable = await validateEmailAvailable(value);
	return isAvailable ? true : "Já existe uma conta com este e-mail. Faça login.";
});

// IDs únicos para os campos
const nomeId = useId();
const sobrenomeId = useId();
const emailId = useId();
const passwordId = useId();
const confirmPasswordId = useId();

// Handler do submit com validação
const onSubmit = handleSubmit(async (values) => {
	isSubmitting.value = true;
	submitError.value = null;

	try {
		const result = await signupEstablishment(values);

		if (result.success) {
			// Cadastro bem-sucedido - mostrar toast de sucesso
			showSuccess({
				title: "Conta criada!",
				description: "Agora vamos configurar seu estabelecimento.",
			});
			emit("submit", values);
			await navigateTo("/onboarding");
		} else {
			// Erro no cadastro - mostrar toast de erro
			const errorMessage = result.error?.message || "Erro ao criar conta";
			showError({ title: "Erro no cadastro", description: errorMessage });
			submitError.value = errorMessage;
		}
	} catch (error) {
		console.error("Erro inesperado no cadastro:", error);
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
		<form class="space-y-5" @submit="onSubmit">
			<!-- Erro de submit -->
			<div
				v-if="submitError"
				class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
			>
				<p class="text-sm text-red-600 dark:text-red-400">{{ submitError }}</p>
			</div>

			<!-- Nome e Sobrenome -->
			<div class="grid grid-cols-2 gap-4">
				<UiFormField label="Nome" required :error="nome.errorMessage.value">
					<UiInput
						:id="nomeId"
						v-model="nome.value.value"
						type="text"
						placeholder="Seu nome"
						:disabled="isSubmitting || props.loading"
						autocomplete="given-name"
						required
					/>
				</UiFormField>
				<UiFormField label="Sobrenome" required :error="sobrenome.errorMessage.value">
					<UiInput
						:id="sobrenomeId"
						v-model="sobrenome.value.value"
						type="text"
						placeholder="Seu sobrenome"
						:disabled="isSubmitting || props.loading"
						autocomplete="family-name"
						required
					/>
				</UiFormField>
			</div>

			<!-- Campo E-mail -->
			<UiFormField label="E-mail" required :error="email.errorMessage.value">
				<UiInput
					:id="emailId"
					v-model="email.value.value"
					type="email"
					placeholder="seu@email.com"
					:disabled="isSubmitting || props.loading"
					autocomplete="email"
					required
				/>
			</UiFormField>

			<!-- Campos de Senha -->
			<UiFormField label="Senha" required :error="password.errorMessage.value">
				<UiInput
					:id="passwordId"
					v-model="password.value.value"
					type="password"
					placeholder="Mínimo 8 caracteres"
					:disabled="isSubmitting || props.loading"
					autocomplete="new-password"
					required
				/>
			</UiFormField>

			<UiFormField label="Confirmar Senha" required :error="confirmPassword.errorMessage.value">
				<UiInput
					:id="confirmPasswordId"
					v-model="confirmPassword.value.value"
					type="password"
					placeholder="Confirme sua senha"
					:disabled="isSubmitting || props.loading"
					autocomplete="new-password"
					required
				/>
			</UiFormField>

			<!-- Checkboxes de Termos -->
			<div class="space-y-3">
				<UiCheckbox
					v-model="terms.value.value"
					label="Aceito os termos de uso"
					size="sm"
					:disabled="isSubmitting || props.loading"
					class="text-sm"
				/>
				<div
					v-if="terms.errorMessage.value"
					class="text-[var(--error)] text-sm flex items-center gap-1"
				>
					<Icon name="lucide:alert-circle" class="w-4 h-4 flex-shrink-0" />
					<span>{{ terms.errorMessage.value }}</span>
				</div>

				<UiCheckbox
					v-model="privacy.value.value"
					label="Aceito a política de privacidade"
					size="sm"
					:disabled="isSubmitting || props.loading"
					class="text-sm"
				/>
				<div
					v-if="privacy.errorMessage.value"
					class="text-[var(--error)] text-sm flex items-center gap-1"
				>
					<Icon name="lucide:alert-circle" class="w-4 h-4 flex-shrink-0" />
					<span>{{ privacy.errorMessage.value }}</span>
				</div>
			</div>

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
						<Icon name="lucide:user-plus" class="w-5 h-5" />
					</template>
					{{ isSubmitting || props.loading ? "Criando conta..." : "Criar conta" }}
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
