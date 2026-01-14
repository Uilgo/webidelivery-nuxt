<script setup lang="ts">
/**
 * 📌 AdminSidebar
 *
 * Menu lateral do painel administrativo do estabelecimento.
 * Usa dados centralizados do layout para evitar duplicação.
 */

import { useAuth } from "~/composables/core/useAuth";

interface Props {
	/** Controla se o sidebar está aberto/expandido */
	isOpen?: boolean;
	/** Controla se o sidebar está colapsado (desktop) */
	isCollapsed?: boolean;
}

withDefaults(defineProps<Props>(), {
	isOpen: false,
	isCollapsed: false,
});

interface Emits {
	/** Evento para fechar o sidebar (mobile) */
	close: [];
	/** Evento para toggle do collapse (desktop) */
	toggleCollapse: [];
}

const emit = defineEmits<Emits>();

// Composables
const { logout } = useAuth();

// Dados centralizados do layout (evita duplicação)
const estabelecimentoAtual = inject<
	ComputedRef<{ id: string; nome: string; slug?: string; logo_url?: string | null }>
>(
	"estabelecimentoAtual",
	computed(() => ({ id: "", nome: "Estabelecimento", slug: "", logo_url: null })),
);
const userProfile = inject<
	ComputedRef<{ nome?: string; sobrenome?: string; email?: string; avatar_url?: string | null }>
>(
	"userProfile",
	computed(() => ({ nome: "Usuário", sobrenome: "", email: "", avatar_url: null })),
);

// Dados computados do usuário com fallbacks para evitar hydration mismatch
const userName = computed(() => {
	if (!userProfile.value?.nome || userProfile.value.nome === "Usuário") return "Usuário";
	const nome = userProfile.value.nome || "";
	const sobrenome = userProfile.value.sobrenome || "";
	return `${nome} ${sobrenome}`.trim() || "Usuário";
});

const userEmail = computed(() => userProfile.value?.email || "");

const userInitials = computed(() => {
	if (!userProfile.value?.nome || userProfile.value.nome === "Usuário") return "U";
	const nome = userProfile.value.nome?.charAt(0) || "";
	const sobrenome = userProfile.value.sobrenome?.charAt(0) || "";
	const initials = `${nome}${sobrenome}`.toUpperCase();
	return initials || "U";
});

// Dados do estabelecimento
const estabelecimentoNome = computed(() => estabelecimentoAtual.value?.nome || "Estabelecimento");

// Menu de navegação baseado no PRD
const menuItems = [
	{
		label: "Dashboard",
		icon: "lucide:layout-dashboard",
		route: "/admin/dashboard",
		active: true, // TODO: implementar lógica de rota ativa
	},
	{
		label: "Pedidos",
		icon: "lucide:shopping-bag",
		route: "/admin/pedidos",
		active: false,
	},
	{
		label: "Cardápio",
		icon: "lucide:book-open",
		route: "/admin/cardapio",
		active: false,
	},
	{
		label: "Marketing",
		icon: "lucide:megaphone",
		route: "/admin/marketing",
		active: false,
	},
	{
		label: "Equipe",
		icon: "lucide:users",
		route: "/admin/equipe",
		active: false,
	},
	{
		label: "Relatórios",
		icon: "lucide:bar-chart-3",
		route: "/admin/relatorios",
		active: false,
	},
	{
		label: "Configurações",
		icon: "lucide:settings",
		route: "/admin/configuracoes",
		active: false,
	},
];

// Opções do dropdown do usuário
const userDropdownItems = [
	{
		label: "Perfil",
		icon: "lucide:user",
		action: () => navigateTo("/admin/perfil"),
	},
	{
		label: "Sair",
		icon: "lucide:log-out",
		action: handleLogout,
	},
];

/**
 * Handler para logout
 */
async function handleLogout(): Promise<void> {
	try {
		await logout();
	} catch (error) {
		console.error("Erro ao fazer logout:", error);
	}
}

/**
 * Handler para navegação
 */
const handleNavigation = (route: string): void => {
	navigateTo(route);
	// Fechar sidebar no mobile após navegação
	emit("close");
};

/**
 * Handler para fechar sidebar (mobile)
 */
const handleCloseSidebar = (): void => {
	emit("close");
};
</script>

<template>
	<aside
		class="fixed inset-y-0 left-0 z-50 bg-[var(--card-bg)] border-r border-[var(--border-default)] transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0"
		:class="[
			// Mobile: slide in/out
			isOpen ? 'translate-x-0' : '-translate-x-full',
			// Desktop: width based on collapsed state
			'lg:translate-x-0',
			isCollapsed ? 'w-20' : 'w-64',
		]"
	>
		<!-- Overlay para mobile -->
		<div
			v-if="isOpen"
			class="fixed inset-0 bg-black/50 lg:hidden"
			@click="handleCloseSidebar"
		></div>

		<!-- Conteúdo do Sidebar -->
		<div class="relative flex flex-col h-full">
			<!-- Cabeçalho: Logo + Nome do Estabelecimento -->
			<div
				class="flex items-center gap-3 h-16 border-b border-[var(--border-default)]"
				:class="isCollapsed ? 'justify-center px-2' : 'px-6'"
			>
				<!-- Logo (placeholder - será substituído por logo real) -->
				<div
					class="flex items-center justify-center w-10 h-10 bg-[var(--primary)] text-white rounded-lg font-bold text-lg flex-shrink-0"
				>
					W
				</div>

				<!-- Nome do Estabelecimento (oculto quando colapsado) -->
				<div v-if="!isCollapsed" class="flex-1 min-w-0">
					<h2 class="text-lg font-semibold text-[var(--text-primary)] truncate">
						{{ estabelecimentoNome }}
					</h2>
				</div>

				<!-- Botão fechar (mobile) -->
				<UiButton
					variant="ghost"
					size="sm"
					class="!p-2 !min-h-[32px] !w-[32px] lg:hidden"
					@click="handleCloseSidebar"
				>
					<Icon name="lucide:x" class="w-4 h-4" />
				</UiButton>
			</div>

			<!-- Menu de Navegação -->
			<nav class="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
				<button
					v-for="item in menuItems"
					:key="item.route"
					type="button"
					class="w-full flex items-center gap-4 px-4 py-3 text-left rounded-lg transition-colors duration-200"
					:class="[
						item.active
							? 'bg-[var(--primary-light)] text-[var(--primary)] font-medium'
							: 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
						isCollapsed ? 'justify-center' : '',
					]"
					:title="isCollapsed ? item.label : undefined"
					@click="handleNavigation(item.route)"
				>
					<Icon
						:name="item.icon"
						:class="isCollapsed ? '!w-7 !h-7' : '!w-6 !h-6'"
						class="flex-shrink-0"
					/>
					<span v-if="!isCollapsed" class="truncate">{{ item.label }}</span>
				</button>
			</nav>

			<!-- Rodapé: Card do Usuário -->
			<div class="p-2 border-t border-[var(--border-default)]">
				<UiDropdown
					:placement="isCollapsed ? 'right' : 'top-start'"
					:class="[
						'!block w-full',
						isCollapsed
							? '[&>div:last-child]:!left-full [&>div:last-child]:!bottom-0 [&>div:last-child]:!top-auto [&>div:last-child]:!w-36 [&>div:last-child]:!ml-3'
							: '[&>div:last-child]:w-full',
					]"
				>
					<template #trigger="{ toggle, isOpen: isDropdownOpen }">
						<div
							class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-hover)] transition-colors duration-200 cursor-pointer"
							:class="[isCollapsed ? 'justify-center' : '']"
							:title="isCollapsed ? `${userName} - ${userEmail}` : undefined"
							@click="toggle"
						>
							<!-- Avatar do Usuário -->
							<UiAvatar
								:name="userName"
								:initials="userInitials"
								:src="userProfile?.avatar_url ?? undefined"
								size="md"
								class="flex-shrink-0"
							/>

							<!-- Informações do Usuário (ocultas quando colapsado) -->
							<div v-if="!isCollapsed" class="flex-1 min-w-0 text-left">
								<p class="text-sm font-medium text-[var(--text-primary)] truncate">
									{{ userName }}
								</p>
								<p class="text-xs text-[var(--text-muted)] truncate">
									{{ userEmail }}
								</p>
							</div>

							<!-- Ícone de dropdown (oculto quando colapsado) -->
							<Icon
								v-if="!isCollapsed"
								name="lucide:chevron-up"
								class="w-4 h-4 text-[var(--text-muted)] transition-transform duration-200"
								:class="{ 'rotate-180': !isDropdownOpen }"
							/>
						</div>
					</template>

					<template #default="{ close }">
						<div class="w-full">
							<button
								v-for="option in userDropdownItems"
								:key="option.label"
								type="button"
								class="w-full flex items-center gap-3 px-2 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors duration-200 rounded-md"
								@click="
									option.action();
									close();
								"
							>
								<Icon :name="option.icon" class="w-4 h-4" />
								<span>{{ option.label }}</span>
							</button>
						</div>
					</template>
				</UiDropdown>
			</div>
		</div>
	</aside>
</template>
