<script setup lang="ts">
/**
 * 📌 ConviteCard
 *
 * Card individual de convite de equipe.
 * Exibe informações do convite e ações disponíveis.
 */

import type { Convite } from "../../types/equipe";
import { useEquipe } from "../../composables/useEquipe";
import { formatarCargo, corBadgeCargo, iconeCargo } from "../../utils/cargo-helpers";
import { useToast } from "~/composables/ui/useToast";

interface Props {
	convite: Convite;
	expirado?: boolean;
}

interface Emits {
	cancelar: [conviteId: string];
}

const props = withDefaults(defineProps<Props>(), {
	expirado: false,
});

const emit = defineEmits<Emits>();

const toast = useToast();
const { diasRestantes } = useEquipe();

// Computed properties
const diasRestantesConvite = computed(() => diasRestantes(props.convite));

const statusConvite = computed(() => {
	if (props.expirado) return "Expirado";
	if (diasRestantesConvite.value === null) return "Sem expiração";
	if (diasRestantesConvite.value === 0) return "Expira hoje";
	if (diasRestantesConvite.value === 1) return "Expira amanhã";
	return `Expira em ${diasRestantesConvite.value} dias`;
});

const corStatus = computed(() => {
	if (props.expirado) return "error";
	if (diasRestantesConvite.value === null) return "neutral";
	if (diasRestantesConvite.value <= 1) return "warning";
	return "success";
});

// Função para copiar código
const copiarCodigo = async () => {
	try {
		await navigator.clipboard.writeText(props.convite.codigo);
		toast.add({
			title: "Código copiado!",
			description: "O código do convite foi copiado para a área de transferência.",
			color: "success",
		});
	} catch {
		toast.add({
			title: "Erro ao copiar",
			description: "Não foi possível copiar o código. Tente novamente.",
			color: "error",
		});
	}
};

// Função para cancelar convite
const cancelarConvite = () => {
	emit("cancelar", props.convite.id);
};
</script>

<template>
	<UiCard variant="shadow" :class="{ 'opacity-60': expirado }">
		<!-- Header -->
		<div class="flex items-start justify-between gap-4 mb-4">
			<div class="flex items-center gap-3">
				<div
					class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
					:class="expirado ? 'bg-gray-700' : 'bg-blue-500/10'"
				>
					<Icon
						name="lucide:mail"
						class="w-5 h-5"
						:class="expirado ? 'text-gray-500' : 'text-blue-500'"
					/>
				</div>
				<div class="min-w-0">
					<p class="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Código do Convite</p>
					<div class="flex items-center gap-2">
						<p class="font-mono text-base font-bold text-gray-900 dark:text-white">
							{{ convite.codigo }}
						</p>
						<button
							v-if="!expirado"
							type="button"
							class="p-1 rounded text-gray-400 hover:text-primary-500 hover:bg-primary-500/10 transition-colors"
							title="Copiar código"
							@click="copiarCodigo"
						>
							<Icon name="lucide:copy" class="w-4 h-4" />
						</button>
					</div>
				</div>
			</div>

			<UiBadge :color="corStatus">
				{{ statusConvite }}
			</UiBadge>
		</div>

		<!-- Informações principais -->
		<div class="space-y-3">
			<!-- Cargo -->
			<div class="flex items-center justify-between">
				<span class="text-sm text-gray-600 dark:text-gray-400">Cargo</span>
				<span
					class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg"
					:class="corBadgeCargo(convite.cargo_pretendido)"
				>
					<Icon :name="iconeCargo(convite.cargo_pretendido)" class="w-3.5 h-3.5" />
					{{ formatarCargo(convite.cargo_pretendido) }}
				</span>
			</div>

			<!-- Criador -->
			<div class="flex items-center justify-between">
				<span class="text-sm text-gray-600 dark:text-gray-400">Criado por</span>
				<span class="text-sm text-gray-900 dark:text-white font-medium">
					{{ convite.criador_nome || "Sistema" }}
				</span>
			</div>

			<!-- Descrição (se houver) -->
			<div v-if="convite.descricao" class="pt-3 border-t border-gray-200 dark:border-gray-700">
				<p class="text-sm text-gray-600 dark:text-gray-400">
					{{ convite.descricao }}
				</p>
			</div>
		</div>

		<!-- Footer -->
		<div
			class="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
		>
			<div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
				<span class="flex items-center gap-1.5">
					<Icon name="lucide:calendar" class="w-3.5 h-3.5" />
					{{ new Date(convite.created_at).toLocaleDateString("pt-BR") }}
				</span>
				<span v-if="convite.expires_at" class="flex items-center gap-1.5">
					<Icon name="lucide:clock" class="w-3.5 h-3.5" />
					{{ new Date(convite.expires_at).toLocaleDateString("pt-BR") }}
				</span>
			</div>

			<UiButton
				v-if="!expirado"
				variant="ghost"
				color="error"
				size="sm"
				icon="lucide:trash-2"
				@click="cancelarConvite"
			>
				Cancelar
			</UiButton>
		</div>
	</UiCard>
</template>
