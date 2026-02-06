<script setup lang="ts">
/**
 * 📌 AdminHeader
 *
 * Header do painel administrativo do estabelecimento.
 * Contém: ícone sidebar, título da página, notificações, toggle loja, ver cardápio e mode toggle.
 */

import { useEstabelecimentos } from "~/composables/data/useEstabelecimentos";
import { useEstabelecimentoStore } from "~/stores/estabelecimento";
import { useToast } from "~/composables/ui/useToast";
import type { Estabelecimento } from "#shared/types/estabelecimentos";

interface Props {
	/** Título da página atual */
	title?: string;
	/** Controla se o sidebar está aberto (mobile) */
	sidebarOpen?: boolean;
	/** Controla se o sidebar está colapsado (desktop) */
	sidebarCollapsed?: boolean;
}

withDefaults(defineProps<Props>(), {
	title: "Dashboard",
	sidebarOpen: false,
	sidebarCollapsed: false,
});

interface Emits {
	/** Evento para toggle do sidebar (mobile) */
	toggleSidebar: [];
	/** Evento para toggle do collapse (desktop) */
	toggleSidebarCollapse: [];
}

const emit = defineEmits<Emits>();

// Composables
const { toggleStoreStatus } = useEstabelecimentos();
const { success, error } = useToast();

// Dados centralizados do layout (evita duplicação)
const estabelecimentoAtual = inject<Ref<Estabelecimento | null>>("estabelecimentoAtual", ref(null));

// Estados reativos
const isTogglingStatus = ref(false);
const notificationsCount = ref(3); // Mock - será implementado depois

// Dados computados do estabelecimento
const isLojaAberta = computed(() => estabelecimentoAtual.value?.aberto || false);
const estabelecimentoSlug = computed(() => estabelecimentoAtual.value?.slug);

/**
 * Toggle do status da loja (aberta/fechada)
 */
const handleToggleLojaStatus = async (novoStatus: boolean): Promise<void> => {
	if (!estabelecimentoAtual.value?.id || isTogglingStatus.value) return;

	isTogglingStatus.value = true;

	try {
		const result = await toggleStoreStatus(novoStatus);

		if (result.success) {
			// Atualizar store diretamente para refletir mudança imediatamente
			const estabelecimentoStore = useEstabelecimentoStore();
			await estabelecimentoStore.refresh(estabelecimentoAtual.value.id);

			success({
				title: "Status alterado",
				description: `Loja ${novoStatus ? "aberta" : "fechada"} com sucesso`,
			});
		} else {
			error({
				title: "Erro ao alterar status",
				description: result.message || "Erro desconhecido",
			});
		}
	} catch (err) {
		console.error("Erro ao alterar status da loja:", err);
		error({
			title: "Erro inesperado",
			description: "Erro ao alterar status da loja",
		});
	} finally {
		isTogglingStatus.value = false;
	}
};

/**
 * Abrir cardápio público em nova aba
 */
const handleVerCardapio = (): void => {
	if (!estabelecimentoSlug.value) return;

	const cardapioUrl = `/${estabelecimentoSlug.value}`;
	window.open(cardapioUrl, "_blank", "noopener,noreferrer");
};

/**
 * Handler para notificações (mock)
 */
const handleNotifications = (): void => {
	// TODO: Implementar sistema de notificações
	console.warn("Abrir painel de notificações - funcionalidade em desenvolvimento");
};

/**
 * Toggle do sidebar (mobile)
 */
const handleSidebarToggle = (): void => {
	emit("toggleSidebar");
};

/**
 * Toggle do collapse do sidebar (desktop)
 */
const handleSidebarCollapseToggle = (): void => {
	emit("toggleSidebarCollapse");
};
</script>

<template>
	<header
		class="w-full border-b border-[var(--border-default)] bg-[var(--card-bg)] backdrop-blur supports-[backdrop-filter]:bg-[var(--card-bg)]/95 relative z-10"
	>
		<div class="flex h-16 items-center justify-between px-4 lg:px-6">
			<!-- Lado Esquerdo: Ícone Sidebar + Título -->
			<div class="flex items-center gap-4">
				<!-- Botão Toggle Sidebar (mobile) -->
				<UiButton
					variant="ghost"
					size="md"
					class="!p-2 !min-h-[40px] !w-[40px] lg:hidden"
					:aria-label="sidebarOpen ? 'Fechar menu lateral' : 'Abrir menu lateral'"
					@click="handleSidebarToggle"
				>
					<Icon name="lucide:menu" class="w-6 h-6" />
				</UiButton>

				<!-- Botão Toggle Collapse Sidebar (desktop) -->
				<UiButton
					variant="ghost"
					size="md"
					class="!p-2 !min-h-[40px] !w-[40px] hidden lg:flex"
					:aria-label="sidebarCollapsed ? 'Expandir menu lateral' : 'Colapsar menu lateral'"
					@click="handleSidebarCollapseToggle"
				>
					<Icon name="lucide:panel-right-open" class="w-6 h-6" />
				</UiButton>

				<!-- Título da Página -->
				<h1 class="text-xl font-semibold text-[var(--text-primary)] truncate">
					{{ title }}
				</h1>
			</div>

			<!-- Lado Direito: Controles -->
			<div class="flex items-center gap-4 relative">
				<!-- Notificações -->
				<div class="relative">
					<UiButton
						variant="ghost"
						size="md"
						class="!p-2 !min-h-[40px] !w-[40px] !flex !items-center !justify-center"
						:aria-label="`${notificationsCount} notificações não lidas`"
						@click="handleNotifications"
					>
						<div class="relative flex items-center justify-center">
							<Icon
								name="lucide:bell"
								class="!w-5 !h-5"
								style="width: 20px !important; height: 20px !important"
							/>
							<!-- Badge de notificações -->
							<span
								v-if="notificationsCount > 0"
								class="absolute -top-1 -right-2 z-50 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--error)] text-[10px] font-bold text-white pointer-events-none leading-none"
							>
								{{ notificationsCount > 9 ? "9+" : notificationsCount }}
							</span>
						</div>
					</UiButton>
				</div>

				<!-- Toggle Status da Loja com Switch -->
				<div class="hidden sm:flex items-center gap-3">
					<UiSwitch
						:model-value="isLojaAberta"
						:disabled="isTogglingStatus"
						size="md"
						color="success"
						:label="
							isTogglingStatus ? 'Alterando...' : isLojaAberta ? 'Loja Aberta' : 'Loja Fechada'
						"
						@update:model-value="handleToggleLojaStatus"
					/>
				</div>

				<!-- Separador -->
				<div class="h-6 w-px bg-[var(--border-default)] hidden md:block"></div>

				<!-- Ver Cardápio -->
				<UiButton
					variant="outline"
					size="sm"
					class="hidden md:flex px-3 py-2 h-10"
					:disabled="!estabelecimentoSlug"
					@click="handleVerCardapio"
				>
					<template #iconLeft>
						<Icon name="lucide:external-link" class="w-4 h-4" />
					</template>
					Ver Cardápio
				</UiButton>

				<!-- Separador -->
				<div class="h-6 w-px bg-[var(--border-default)]"></div>

				<!-- Mode Toggle (Dark/Light) -->
				<LayoutsModeToggle />
			</div>
		</div>
	</header>
</template>
