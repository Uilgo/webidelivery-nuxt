<script setup lang="ts">
/**
 * 📌 AdicionalForm
 *
 * Formulário unificado para criação e edição de adicionais.
 * Usa VeeValidate + Zod para validação tipada e consistente.
 */

import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import {
	createAdicionalSchema,
	updateAdicionalSchema,
	type CreateAdicionalFormData,
	type UpdateAdicionalFormData,
} from "#shared/schemas/cardapio/adicional";
import type { AdicionalComputado, GrupoAdicionalComputado } from "../../../types/adicional";
import { useGruposAdicionaisFetch } from "../composables/useGruposAdicionaisFetch";

// Props do componente
interface Props {
	adicional?: AdicionalComputado | null;
	isEdicao: boolean;
	grupoIdPadrao?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
	adicional: null,
	grupoIdPadrao: null,
});

// Emits tipados
interface Emits {
	submit: [data: CreateAdicionalFormData | UpdateAdicionalFormData];
}

const emit = defineEmits<Emits>();

// Composables
const { gruposAdicionais } = useGruposAdicionaisFetch();

/**
 * Escolhe o schema baseado no modo
 */
const validationSchema = computed(() =>
	props.isEdicao ? toTypedSchema(updateAdicionalSchema) : toTypedSchema(createAdicionalSchema),
);

/**
 * Valores iniciais do formulário
 */
const getInitialValues = () => {
	if (props.adicional && props.isEdicao) {
		return {
			nome: props.adicional.nome || "",
			descricao: props.adicional.descricao || "",
			preco: Number(props.adicional.preco) || 0,
			ativo: props.adicional.ativo ?? true,
		};
	}

	return {
		grupo_id: props.grupoIdPadrao || "",
		nome: "",
		descricao: "",
		preco: 0,
		ativo: true,
	};
};

/**
 * Configura VeeValidate
 */
const { handleSubmit, errors, defineField, resetForm, meta } = useForm({
	validationSchema,
	initialValues: getInitialValues(),
});

/**
 * Define campos com validação automática
 */
const grupo_id = ref<string>(props.grupoIdPadrao || "");

const [nome, nomeAttrs] = defineField("nome");
const [descricao, descricaoAttrs] = defineField("descricao", { validateOnModelUpdate: false });
const [preco, precoAttrs] = defineField("preco");
const [ativo] = defineField("ativo");

/**
 * Opções para o select de grupos
 */
const grupoOptions = computed(() => {
	return gruposAdicionais.value
		.filter((grupo: GrupoAdicionalComputado) => grupo.ativo)
		.map((grupo: GrupoAdicionalComputado) => ({
			value: grupo.id,
			label: grupo.nome,
		}));
});

/**
 * Submit com validação automática
 */
const onSubmit = handleSubmit((values) => {
	// No modo criação, adicionar grupo_id manualmente
	if (!props.isEdicao) {
		const dataComGrupo = {
			...values,
			grupo_id: grupo_id.value,
		};
		emit("submit", dataComGrupo as CreateAdicionalFormData);
	} else {
		emit("submit", values);
	}
});

/**
 * Watch para resetar form quando adicional mudar
 */
watch(
	() => props.adicional,
	(newData) => {
		if (newData && props.isEdicao) {
			resetForm({
				values: {
					nome: newData.nome || "",
					descricao: newData.descricao || "",
					preco: Number(newData.preco) || 0,
					ativo: newData.ativo ?? true,
				},
			});
		}
	},
);

/**
 * Watch para atualizar grupo_id quando grupoIdPadrao mudar
 */
watch(
	() => props.grupoIdPadrao,
	(novoGrupoId) => {
		if (novoGrupoId && !props.isEdicao) {
			grupo_id.value = novoGrupoId;
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

			<!-- Grupo -->
			<div v-if="!isEdicao">
				<UiSelectMenu
					id="grupo"
					v-model="grupo_id"
					:options="grupoOptions"
					label="Grupo de Adicionais *"
					placeholder="Selecione um grupo"
					:required="true"
					searchable
				/>
			</div>
			<div v-else class="p-4 bg-[var(--bg-muted)] rounded-lg">
				<p class="text-sm text-[var(--text-muted)]">O grupo não pode ser alterado após a criação</p>
			</div>

			<!-- Nome -->
			<UiFormField
				label="Nome do Adicional"
				:error="errors.nome"
				help="Nome que aparecerá no cardápio"
				required
			>
				<UiInput
					v-model="nome"
					v-bind="nomeAttrs"
					placeholder="Ex: Queijo Extra, Bacon, Refrigerante"
					:error="!!errors.nome"
					maxlength="100"
				/>
			</UiFormField>

			<!-- Descrição -->
			<UiFormField
				label="Descrição"
				:error="errors.descricao"
				help="Descrição opcional do adicional"
			>
				<UiTextarea
					:model-value="descricao ?? ''"
					v-bind="descricaoAttrs"
					placeholder="Descreva o adicional..."
					:rows="3"
					:max-length="500"
					@update:model-value="descricao = $event"
				/>
			</UiFormField>

			<!-- Preço -->
			<UiFormField
				label="Preço"
				:error="errors.preco"
				help="Valor adicional cobrado ao cliente (pode ser R$ 0,00)"
				required
			>
				<UiCurrencyInput
					:model-value="preco"
					v-bind="precoAttrs"
					placeholder="0,00"
					:error="!!errors.preco"
					@update:model-value="preco = $event"
				/>
			</UiFormField>
		</div>

		<!-- Seção Configurações -->
		<div class="p-6 bg-[var(--card-bg)] border border-[var(--border-default)] rounded-lg">
			<h3 class="text-base font-semibold text-[var(--text-primary)] mb-4">Configurações</h3>

			<div class="space-y-3">
				<!-- Adicional Ativo -->
				<div class="p-4 bg-[var(--bg-muted)] rounded-lg">
					<div class="flex items-center justify-between">
						<div class="flex-1">
							<label for="ativo" class="block text-sm font-medium text-[var(--text-primary)] mb-1">
								Adicional Ativo
							</label>
							<p class="text-xs text-[var(--text-muted)]">Disponível para seleção</p>
						</div>
						<UiSwitch
							id="ativo"
							:model-value="ativo ?? true"
							@update:model-value="ativo = $event"
						/>
					</div>
				</div>
			</div>
		</div>
	</form>
</template>
