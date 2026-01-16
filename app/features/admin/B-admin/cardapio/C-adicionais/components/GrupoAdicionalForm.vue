<script setup lang="ts">
/**
 * 📌 GrupoAdicionalForm
 *
 * Formulário unificado para criação e edição de grupos de adicionais.
 * Suporta configuração de min/max seleção e obrigatoriedade.
 */

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
	submit: [data: FormData];
}

interface FormData {
	nome: string;
	descricao: string;
	min_selecao: number;
	max_selecao: number;
	obrigatorio: boolean;
	ativo: boolean;
}

const emit = defineEmits<Emits>();

// Estado do formulário
const form = reactive({
	nome: "",
	descricao: "",
	min_selecao: 0,
	max_selecao: 1,
	obrigatorio: false,
	ativo: true,
});

// Estado de erros
const errors = reactive({
	nome: "",
	min_selecao: "",
	max_selecao: "",
});

// Inicializar formulário com dados do grupo (edição)
const inicializarFormulario = (): void => {
	if (props.grupo && props.isEdicao) {
		form.nome = props.grupo.nome;
		form.descricao = props.grupo.descricao || "";
		form.min_selecao = props.grupo.min_selecao;
		form.max_selecao = props.grupo.max_selecao;
		form.obrigatorio = props.grupo.obrigatorio;
		form.ativo = props.grupo.ativo;
	} else {
		// Reset para criação
		form.nome = "";
		form.descricao = "";
		form.min_selecao = 0;
		form.max_selecao = 1;
		form.obrigatorio = false;
		form.ativo = true;
	}
};

// Validar formulário
const validarFormulario = (): boolean => {
	// Reset erros
	errors.nome = "";
	errors.min_selecao = "";
	errors.max_selecao = "";

	let isValid = true;

	// Validar nome
	if (!form.nome.trim()) {
		errors.nome = "Nome é obrigatório";
		isValid = false;
	} else if (form.nome.trim().length < 3) {
		errors.nome = "Nome deve ter pelo menos 3 caracteres";
		isValid = false;
	}

	// Validar min_selecao
	if (form.min_selecao < 0) {
		errors.min_selecao = "Mínimo não pode ser negativo";
		isValid = false;
	}

	// Validar max_selecao
	if (form.max_selecao < 1) {
		errors.max_selecao = "Máximo deve ser pelo menos 1";
		isValid = false;
	}

	// Validar que max >= min
	if (form.max_selecao < form.min_selecao) {
		errors.max_selecao = "Máximo deve ser maior ou igual ao mínimo";
		isValid = false;
	}

	return isValid;
};

// Handler do submit
const handleSubmit = (): void => {
	if (!validarFormulario()) {
		return;
	}

	emit("submit", { ...form });
};

// Watchers
watch(
	() => props.grupo,
	() => {
		inicializarFormulario();
	},
	{ immediate: true },
);

// Inicializar ao montar
onMounted(() => {
	inicializarFormulario();
});

// Expor método handleSubmit para o componente pai
defineExpose({
	handleSubmit,
});
</script>

<template>
	<form class="space-y-6" @submit.prevent="handleSubmit">
		<!-- Seção Básica -->
		<div class="space-y-5">
			<h3
				class="text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border-muted)] pb-3"
			>
				Informações Básicas
			</h3>

			<!-- Nome -->
			<div>
				<label for="nome" class="block text-sm font-medium text-[var(--text-primary)] mb-2">
					Nome do Grupo *
				</label>
				<UiInput
					id="nome"
					v-model="form.nome"
					placeholder="Ex: Bordas, Extras, Bebidas"
					:error="errors.nome ? true : undefined"
					required
				/>
				<p v-if="errors.nome" class="text-xs text-red-600 mt-1">{{ errors.nome }}</p>
			</div>

			<!-- Descrição -->
			<div>
				<label for="descricao" class="block text-sm font-medium text-[var(--text-primary)] mb-2">
					Descrição
				</label>
				<UiTextarea
					id="descricao"
					v-model="form.descricao"
					placeholder="Descreva o grupo de adicionais..."
					:rows="3"
				/>
			</div>
		</div>

		<!-- Seção Configurações de Seleção -->
		<div class="p-6 bg-[var(--card-bg)] border border-[var(--border-default)] rounded-lg">
			<h3 class="text-base font-semibold text-[var(--text-primary)] mb-4">
				Configurações de Seleção
			</h3>

			<div class="space-y-4">
				<!-- Mínimo de Seleções -->
				<div>
					<label
						for="min_selecao"
						class="block text-sm font-medium text-[var(--text-primary)] mb-2"
					>
						Mínimo de Seleções
					</label>
					<UiInput
						id="min_selecao"
						v-model.number="form.min_selecao"
						type="number"
						min="0"
						placeholder="0"
						:error="errors.min_selecao ? true : undefined"
					/>
					<p v-if="errors.min_selecao" class="text-xs text-red-600 mt-1">
						{{ errors.min_selecao }}
					</p>
					<p class="text-xs text-[var(--text-muted)] mt-1">
						Quantidade mínima que o cliente deve selecionar
					</p>
				</div>

				<!-- Máximo de Seleções -->
				<div>
					<label
						for="max_selecao"
						class="block text-sm font-medium text-[var(--text-primary)] mb-2"
					>
						Máximo de Seleções
					</label>
					<UiInput
						id="max_selecao"
						v-model.number="form.max_selecao"
						type="number"
						min="1"
						placeholder="1"
						:error="errors.max_selecao ? true : undefined"
					/>
					<p v-if="errors.max_selecao" class="text-xs text-red-600 mt-1">
						{{ errors.max_selecao }}
					</p>
					<p class="text-xs text-[var(--text-muted)] mt-1">
						Quantidade máxima que o cliente pode selecionar
					</p>
				</div>
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
						<UiSwitch id="obrigatorio" v-model="form.obrigatorio" />
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
						<UiSwitch id="ativo" v-model="form.ativo" />
					</div>
				</div>
			</div>
		</div>
	</form>
</template>
