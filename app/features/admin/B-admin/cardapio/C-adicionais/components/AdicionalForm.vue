<script setup lang="ts">
/**
 * 📌 AdicionalForm
 *
 * Formulário unificado para criação e edição de adicionais.
 * Suporta seleção de grupo e configuração de preço.
 */

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
	submit: [data: FormData];
}

interface FormData {
	grupo_id: string;
	nome: string;
	descricao: string;
	preco: number;
	ativo: boolean;
}

const emit = defineEmits<Emits>();

// Composables
const { gruposAdicionais } = useGruposAdicionaisFetch();

// Estado do formulário
const form = reactive({
	grupo_id: "",
	nome: "",
	descricao: "",
	preco: 0,
	ativo: true,
});

// Estado de erros
const errors = reactive({
	grupo_id: "",
	nome: "",
	preco: "",
});

// Opções para o select de grupos
const grupoOptions = computed(() => {
	return gruposAdicionais.value
		.filter((grupo: GrupoAdicionalComputado) => grupo.ativo)
		.map((grupo: GrupoAdicionalComputado) => ({
			value: grupo.id,
			label: grupo.nome,
		}));
});

// Inicializar formulário com dados do adicional (edição)
const inicializarFormulario = (): void => {
	if (props.adicional && props.isEdicao) {
		form.grupo_id = props.adicional.grupo_id;
		form.nome = props.adicional.nome;
		form.descricao = props.adicional.descricao || "";
		form.preco = Number(props.adicional.preco);
		form.ativo = props.adicional.ativo;
	} else {
		// Reset para criação
		form.grupo_id = props.grupoIdPadrao || "";
		form.nome = "";
		form.descricao = "";
		form.preco = 0;
		form.ativo = true;
	}
};

// Validar formulário
const validarFormulario = (): boolean => {
	// Reset erros
	errors.grupo_id = "";
	errors.nome = "";
	errors.preco = "";

	let isValid = true;

	// Validar grupo
	if (!form.grupo_id) {
		errors.grupo_id = "Grupo é obrigatório";
		isValid = false;
	}

	// Validar nome
	if (!form.nome.trim()) {
		errors.nome = "Nome é obrigatório";
		isValid = false;
	} else if (form.nome.trim().length < 2) {
		errors.nome = "Nome deve ter pelo menos 2 caracteres";
		isValid = false;
	}

	// Validar preço
	if (form.preco < 0) {
		errors.preco = "Preço não pode ser negativo";
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
	() => props.adicional,
	() => {
		inicializarFormulario();
	},
	{ immediate: true },
);

watch(
	() => props.grupoIdPadrao,
	(novoGrupoId) => {
		if (novoGrupoId && !props.isEdicao) {
			form.grupo_id = novoGrupoId;
		}
	},
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

			<!-- Grupo -->
			<div>
				<UiSelectMenu
					id="grupo"
					v-model="form.grupo_id"
					:options="grupoOptions"
					label="Grupo de Adicionais *"
					placeholder="Selecione um grupo"
					:error-message="errors.grupo_id"
					:required="true"
					:disabled="isEdicao"
					searchable
				/>
				<p v-if="isEdicao" class="text-xs text-[var(--text-muted)] mt-1">
					O grupo não pode ser alterado após a criação
				</p>
			</div>

			<!-- Nome -->
			<div>
				<label for="nome" class="block text-sm font-medium text-[var(--text-primary)] mb-2">
					Nome do Adicional *
				</label>
				<UiInput
					id="nome"
					v-model="form.nome"
					placeholder="Ex: Queijo Extra, Bacon, Refrigerante"
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
					placeholder="Descreva o adicional..."
					:rows="3"
				/>
			</div>

			<!-- Preço -->
			<div>
				<label for="preco" class="block text-sm font-medium text-[var(--text-primary)] mb-2">
					Preço
				</label>
				<UiInput
					id="preco"
					v-model.number="form.preco"
					type="number"
					step="0.01"
					min="0"
					placeholder="0,00"
					:error="errors.preco ? true : undefined"
				/>
				<p v-if="errors.preco" class="text-xs text-red-600 mt-1">{{ errors.preco }}</p>
				<p class="text-xs text-[var(--text-muted)] mt-1">
					Valor adicional cobrado ao cliente (pode ser R$ 0,00)
				</p>
			</div>
		</div>

		<!-- Seção Configurações -->
		<div class="p-6 bg-[var(--card-bg)] border border-[var(--border-default)] rounded-lg">
			<h3 class="text-base font-semibold text-[var(--text-primary)] mb-4">Configurações</h3>

			<div class="p-4 bg-[var(--bg-muted)] rounded-lg">
				<div class="flex items-center justify-between">
					<div class="flex-1">
						<label for="ativo" class="block text-sm font-medium text-[var(--text-primary)] mb-1">
							Adicional Ativo
						</label>
						<p class="text-xs text-[var(--text-muted)]">Disponível para seleção</p>
					</div>
					<UiSwitch id="ativo" v-model="form.ativo" />
				</div>
			</div>
		</div>
	</form>
</template>
