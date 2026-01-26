<script setup lang="ts">
/**
 * 📌 GrupoAdicionalForm
 *
 * Formulário unificado para criação e edição de grupos de adicionais.
 * Usa VeeValidate + Zod para validação tipada e consistente.
 */

import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import {
	createGrupoAdicionalSchema,
	updateGrupoAdicionalSchema,
	type CreateGrupoAdicionalFormData,
	type UpdateGrupoAdicionalFormData,
} from "#shared/schemas/cardapio/grupo-adicional";
import type { GrupoAdicionalComputado } from "../../../types/adicional";

// Props do componente
interface Props {
	grupo?: GrupoAdicionalComputado | null;
	isEdicao: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	grupo: null,
});

// Emits tipados
interface Emits {
	submit: [data: CreateGrupoAdicionalFormData | UpdateGrupoAdicionalFormData];
}

const emit = defineEmits<Emits>();

/**
 * Escolhe o schema baseado no modo
 */
const validationSchema = computed(() =>
	props.isEdicao
		? toTypedSchema(updateGrupoAdicionalSchema)
		: toTypedSchema(createGrupoAdicionalSchema),
);

/**
 * Valores iniciais do formulário
 */
const initialValues = computed<
	Partial<CreateGrupoAdicionalFormData & UpdateGrupoAdicionalFormData>
>(() => {
	if (props.grupo && props.isEdicao) {
		return {
			nome: props.grupo.nome,
			descricao: props.grupo.descricao || "",
			min_selecao: props.grupo.min_selecao,
			max_selecao: props.grupo.max_selecao,
			obrigatorio: props.grupo.obrigatorio,
			ativo: props.grupo.ativo,
		};
	}

	return {
		nome: "",
		descricao: "",
		min_selecao: 0,
		max_selecao: 1,
		obrigatorio: false,
		ativo: true,
	};
});

/**
 * Configura VeeValidate
 */
const { handleSubmit, errors, defineField, resetForm, meta } = useForm({
	validationSchema,
	initialValues: initialValues as unknown as Partial<
		CreateGrupoAdicionalFormData & UpdateGrupoAdicionalFormData
	>,
});

/**
 * Define campos com validação automática
 */
const [nome, nomeAttrs] = defineField("nome");
const [descricao, descricaoAttrs] = defineField("descricao");
const [min_selecao, minSelecaoAttrs] = defineField("min_selecao");
const [max_selecao, maxSelecaoAttrs] = defineField("max_selecao");
const [obrigatorio] = defineField("obrigatorio");
const [ativo] = defineField("ativo");

/**
 * Submit com validação automática
 */
const onSubmit = handleSubmit((values) => {
	emit("submit", values);
});

/**
 * Watch para resetar form quando grupo mudar
 */
watch(
	() => props.grupo,
	(newData) => {
		if (newData && props.isEdicao) {
			resetForm({
				values: {
					nome: newData.nome,
					descricao: newData.descricao || "",
					min_selecao: newData.min_selecao,
					max_selecao: newData.max_selecao,
					obrigatorio: newData.obrigatorio,
					ativo: newData.ativo,
				},
			});
		}
	},
);

/**
 * Expor método handleSubmit para o componente pai
 */
defineExpose({
	handleSubmit: onSubmit,
	isFormValid: computed(() => meta.value.valid),
});
</script>

<template>
	<form class="space-y-6" @submit.prevent="onSubmit">
		<!-- Seção Básica -->
		<div class="space-y-5">
			<h3
				class="text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border-muted)] pb-3"
			>
				Informações Básicas
			</h3>

			<!-- Nome -->
			<UiFormField
				label="Nome do Grupo"
				:error="errors.nome"
				help="Nome que aparecerá no cardápio"
				required
			>
				<UiInput
					v-model="nome"
					v-bind="nomeAttrs"
					placeholder="Ex: Bordas, Extras, Bebidas"
					:error="!!errors.nome"
					maxlength="100"
				/>
			</UiFormField>

			<!-- Descrição -->
			<UiFormField label="Descrição" :error="errors.descricao" help="Descrição opcional do grupo">
				<UiTextarea
					:model-value="descricao || ''"
					v-bind="descricaoAttrs"
					placeholder="Descreva o grupo de adicionais..."
					:rows="3"
					:max-length="500"
					@update:model-value="descricao = $event"
				/>
			</UiFormField>
		</div>

		<!-- Seção Configurações de Seleção -->
		<div class="p-6 bg-[var(--card-bg)] border border-[var(--border-default)] rounded-lg">
			<h3 class="text-base font-semibold text-[var(--text-primary)] mb-4">
				Configurações de Seleção
			</h3>

			<div class="space-y-4">
				<!-- Mínimo de Seleções -->
				<UiFormField
					label="Mínimo de Seleções"
					:error="errors.min_selecao"
					help="Quantidade mínima que o cliente deve selecionar"
				>
					<UiInput
						:model-value="min_selecao ?? undefined"
						v-bind="minSelecaoAttrs"
						type="number"
						min="0"
						placeholder="0"
						:error="!!errors.min_selecao"
						@update:model-value="min_selecao = $event === '' ? undefined : Number($event)"
					/>
				</UiFormField>

				<!-- Máximo de Seleções -->
				<UiFormField
					label="Máximo de Seleções"
					:error="errors.max_selecao"
					help="Quantidade máxima que o cliente pode selecionar"
				>
					<UiInput
						:model-value="max_selecao ?? undefined"
						v-bind="maxSelecaoAttrs"
						type="number"
						min="1"
						placeholder="1"
						:error="!!errors.max_selecao"
						@update:model-value="max_selecao = $event === '' ? undefined : Number($event)"
					/>
				</UiFormField>
			</div>
		</div>

		<!-- Seção Configurações -->
		<div class="p-6 bg-[var(--card-bg)] border border-[var(--border-default)] rounded-lg">
			<h3 class="text-base font-semibold text-[var(--text-primary)] mb-4">Configurações</h3>

			<div class="space-y-3">
				<!-- Obrigatório -->
				<div class="p-4 bg-[var(--bg-muted)] rounded-lg">
					<div class="flex items-center justify-between">
						<div class="flex-1">
							<label
								for="obrigatorio"
								class="block text-sm font-medium text-[var(--text-primary)] mb-1"
							>
								Seleção Obrigatória
							</label>
							<p class="text-xs text-[var(--text-muted)]">Cliente deve escolher</p>
						</div>
						<UiSwitch
							id="obrigatorio"
							:model-value="obrigatorio || false"
							@update:model-value="obrigatorio = $event"
						/>
					</div>
				</div>

				<!-- Ativo -->
				<div class="p-4 bg-[var(--bg-muted)] rounded-lg">
					<div class="flex items-center justify-between">
						<div class="flex-1">
							<label for="ativo" class="block text-sm font-medium text-[var(--text-primary)] mb-1">
								Grupo Ativo
							</label>
							<p class="text-xs text-[var(--text-muted)]">Disponível para uso</p>
						</div>
						<UiSwitch
							id="ativo"
							:model-value="ativo || false"
							@update:model-value="ativo = $event"
						/>
					</div>
				</div>
			</div>
		</div>
	</form>
</template>
