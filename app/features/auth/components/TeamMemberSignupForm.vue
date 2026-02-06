<script setup lang="ts">
/**
 * 📌 TeamMemberSignupForm
 *
 * Formulário de cadastro para membros da equipe (Staff/Entregador).
 * Campos: Nome, Sobrenome, E-mail, Senha, Confirmar Senha, Código EQUIPE
 * Define cargo e estabelecimento automaticamente baseado no código
 */

import { toTypedSchema } from "@vee-validate/zod";
import { useForm, useField } from "vee-validate";
import { teamMemberRegisterSchema, type TeamMemberRegisterFormData } from "#shared/schemas/auth";
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
	submit: [data: TeamMemberRegisterFormData];
}

const emit = defineEmits<Emits>();

// Usar o composable de validadores e auth
const { validateEmailAvailable, validateCodigoEquipe } = useValidators();
const { signupTeamMember } = useAuth();

// Composable de toast para notificações
const { success: showSuccess, error: showError } = useToast();

// Estados de loading e erro
const isSubmitting = ref(false);
const submitError = ref<string | null>(null);

// Configuração do VeeValidate com Zod
const { handleSubmit } = useForm({
	validationSchema: toTypedSchema(teamMemberRegisterSchema),
	initialValues: {
		nome: "",
		sobrenome: "",
		email: "",
		password: "",
		confirm_password: "",
		codigo_equipe: "",
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
	// Nota: teamMemberRegisterSchema usa .refine(), então precisamos acessar o schema interno
	const baseSchema = teamMemberRegisterSchema._def.schema;
	const schemaResult = baseSchema.shape.email.safeParse(value);
	if (!schemaResult.success) {
		return schemaResult.error.issues[0]?.message || "E-mail inválido";
	}

	// Depois aplica validação assíncrona (email único)
	const isAvailable = await validateEmailAvailable(value);
	return isAvailable ? true : "Já existe uma conta com este e-mail. Faça login.";
});

// Campo código EQUIPE com validação assíncrona
const codigoEquipe = useField<string>("codigo_equipe", async (value: string) => {
	// Primeiro aplica validação do schema (formato, required, etc.)
	// Nota: teamMemberRegisterSchema usa .refine(), então precisamos acessar o schema interno
	const baseSchema = teamMemberRegisterSchema._def.schema;
	const schemaResult = baseSchema.shape.codigo_equipe.safeParse(value);
	if (!schemaResult.success) {
		return schemaResult.error.issues[0]?.message || "Código da equipe inválido";
	}

	// Depois aplica validação assíncrona (código válido)
	const isValid = await validateCodigoEquipe(value);
	return isValid ? true : "Código da equipe inválido ou expirado";
});

// IDs únicos para os campos
const nomeId = useId();
const sobrenomeId = useId();
const emailId = useId();
const codigoEquipeId = useId();
const passwordId = useId();
const confirmPasswordId = useId();

// Handler do submit com validação
const onSubmit = handleSubmit(async (values) => {
	isSubmitting.value = true;
	submitError.value = null;

	try {
		const result = await signupTeamMember(values);

		if (result.success) {
			// Cadastro bem-sucedido - mostrar toast de sucesso
			showSuccess({
				title: "Bem-vindo à equipe!",
				description: "Sua conta foi criada com sucesso.",
			});
			emit("submit", values);
			await navigateTo("/admin/dashboard");
		} else {
			// Erro no cadastro - mostrar toast de erro
			const errorMessage = result.error?.message || "Erro ao entrar na equipe";
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

			<!-- Campo Código EQUIPE -->
			<UiFormField
				label="Código da Equipe"
				required
				:error="codigoEquipe.errorMessage.value"
				help="Código fornecido pelo seu gerente"
			>
				<UiInput
					:id="codigoEquipeId"
					v-model="codigoEquipe.value.value"
					type="text"
					placeholder="ABC1234567"
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
						<Icon name="lucide:users" class="w-5 h-5" />
					</template>
					{{ isSubmitting || props.loading ? "Criando conta..." : "Entrar na equipe" }}
				</UiButton>
			</div>
		</form>

		<!-- Links -->
		<div class="space-y-3 text-center">
			<div class="text-[var(--text-secondary)] text-sm">
				Já faz parte da equipe?
				<NuxtLink
					to="/login"
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
