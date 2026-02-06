<script setup lang="ts">
/**
 * 📌 SuperAdminSignupForm
 *
 * Formulário de cadastro para equipe da plataforma WebiDelivery.
 * Campos: Nome, Sobrenome, E-mail, Senha, Confirmar Senha, Código WEBI
 * Requer código válido gerado pelo Super Admin
 */

import { toTypedSchema } from "@vee-validate/zod";
import { useForm, useField } from "vee-validate";
import { superAdminRegisterSchema, type SuperAdminRegisterFormData } from "#shared/schemas/auth";
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
	submit: [data: SuperAdminRegisterFormData];
}

const emit = defineEmits<Emits>();

// Usar o composable de validadores e auth
const { validateEmailAvailable, validateCodigoWebi } = useValidators();
const { signupSuperAdmin } = useAuth();

// Composable de toast para notificações
const { success: showSuccess, error: showError } = useToast();

// Estados de loading e erro
const isSubmitting = ref(false);
const submitError = ref<string | null>(null);

// Configuração do VeeValidate com Zod
const { handleSubmit } = useForm({
	validationSchema: toTypedSchema(superAdminRegisterSchema),
	initialValues: {
		nome: "",
		sobrenome: "",
		email: "",
		password: "",
		confirm_password: "",
		codigo_webi: "",
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
	const schemaResult = superAdminRegisterSchema.shape.email.safeParse(value);
	if (!schemaResult.success) {
		return schemaResult.error.issues[0]?.message || "E-mail inválido";
	}

	// Depois aplica validação assíncrona (email único)
	const isAvailable = await validateEmailAvailable(value);
	return isAvailable ? true : "Já existe uma conta com este e-mail. Faça login.";
});

// Campo código WEBI com validação assíncrona
const codigoWebi = useField<string>("codigo_webi", async (value: string) => {
	// Primeiro aplica validação do schema (formato, required, etc.)
	const schemaResult = superAdminRegisterSchema.shape.codigo_webi.safeParse(value);
	if (!schemaResult.success) {
		return schemaResult.error.issues[0]?.message || "Código WEBI inválido";
	}

	// Depois aplica validação assíncrona (código válido)
	const isValid = await validateCodigoWebi(value);
	return isValid ? true : "Código WEBI inválido ou expirado";
});

// IDs únicos para os campos
const nomeId = useId();
const sobrenomeId = useId();
const emailId = useId();
const codigoWebiId = useId();
const passwordId = useId();
const confirmPasswordId = useId();

// Handler do submit com validação
const onSubmit = handleSubmit(async (values) => {
	isSubmitting.value = true;
	submitError.value = null;

	try {
		const result = await signupSuperAdmin(values);

		if (result.success) {
			// Cadastro bem-sucedido - mostrar toast de sucesso
			showSuccess({ title: "Conta criada!", description: "Bem-vindo à equipe da plataforma!" });
			emit("submit", values);
			await navigateTo("/super-admin/dashboard");
		} else {
			// Erro no cadastro - mostrar toast de erro
			const errorMessage = result.error?.message || "Erro ao criar conta na plataforma";
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
			<UiFormField label="E-mail Corporativo" required :error="email.errorMessage.value">
				<UiInput
					:id="emailId"
					v-model="email.value.value"
					type="email"
					placeholder="seu@webidelivery.com.br"
					:disabled="isSubmitting || props.loading"
					autocomplete="email"
					required
				/>
			</UiFormField>

			<!-- Campo Código WEBI -->
			<UiFormField
				label="Código WEBI"
				required
				:error="codigoWebi.errorMessage.value"
				help="Código fornecido pelo Super Admin"
			>
				<UiInput
					:id="codigoWebiId"
					v-model="codigoWebi.value.value"
					type="text"
					placeholder="WEBI0000"
					:disabled="isSubmitting || props.loading"
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
					label="Aceito os termos de uso da plataforma"
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
						<Icon name="lucide:user-check" class="w-5 h-5" />
					</template>
					{{ isSubmitting || props.loading ? "Criando conta..." : "Criar conta na plataforma" }}
				</UiButton>
			</div>
		</form>

		<!-- Links -->
		<div class="space-y-3 text-center">
			<div class="text-[var(--text-secondary)] text-sm">
				Já tem acesso à plataforma?
				<NuxtLink
					to="/super-admin/login"
					class="text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium ml-1 transition-colors duration-200"
				>
					Entrar
				</NuxtLink>
			</div>

			<div class="text-[var(--text-muted)] text-xs pt-2 border-t border-[var(--border-light)]">
				<NuxtLink
					to="/signup"
					class="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors duration-200"
				>
					← Cadastrar estabelecimento
				</NuxtLink>
			</div>
		</div>
	</div>
</template>
