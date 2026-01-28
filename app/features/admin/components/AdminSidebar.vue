<script setup lang="ts">
/**
 * 📌 AdminSidebar
 *
 * Menu lateral do painel administrativo do estabelecimento.
 * Usa dados centralizados do layout para evitar duplicação.
 */

import { useAuth } from "~/composables/core/useAuth";
import { useEstabelecimentoStore } from "~/stores/estabelecimento";

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
const route = useRoute();
const estabelecimentoStore = useEstabelecimentoStore();

// Verificar se onboarding foi concluído
const onboardingConcluido = computed(() => {
	return estabelecimentoStore.estabelecimento?.onboarding === true;
});

// Dados centralizados do layout (evita duplicação)
const estabelecimentoAtual = inject<
	ComputedRef<{
		id: string;
		nome: string;
		slug?: string;
		logo_url?: string | null;
		onboarding?: boolean;
	}>
>(
	"estabelecimentoAtual",
	computed(() => ({
		id: "",
		nome: "Estabelecimento",
		slug: "",
		logo_url: null,
		onboarding: false,
	})),
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

// Menu de navegação baseado no PRD (otimizado)
const menuItemsCompleto = [
	{
		label: "Dashboard",
		icon: "lucide:layout-dashboard",
		route: "/admin/dashboard",
	},
	{
		label: "Pedidos",
		icon: "lucide:shopping-bag",
		route: "/admin/pedidos",
	},
	{
		label: "Cardápio",
		icon: "lucide:book-open",
		route: "/admin/cardapio",
	},
	{
		label: "Marketing",
		icon: "lucide:megaphone",
		route: "/admin/marketing",
	},
	{
		label: "Equipe",
		icon: "lucide:users",
		route: "/admin/equipe",
	},
	{
		label: "Relatórios",
		icon: "lucide:bar-chart-3",
		route: "/admin/relatorios",
	},
	{
		label: "Configurações",
		icon: "lucide:settings",
		route: "/admin/configuracoes",
	},
];

// Menu apenas com Onboarding (quando onboarding não concluído)
const menuItemsOnboarding = [
	{
		label: "Onboarding",
		icon: "lucide:rocket",
		route: "/admin/onboarding",
	},
];

// Menu exibido baseado no status do onboarding
const menuItems = computed(() => {
	return onboardingConcluido.value ? menuItemsCompleto : menuItemsOnboarding;
});

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
 * Handler para fechar sidebar (mobile)
 */
const handleCloseSidebar = (): void => {
	emit("close");
};
</script>

<template>
	<aside
		class="fixed inset-y-0 left-0 z-50 bg-[var(--card-bg)] border-r border-[var(--border-default)] transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 w-64"
		:class="[
			// Mobile: slide in/out
			isOpen ? 'translate-x-0' : '-translate-x-full',
			// Desktop: width based on collapsed state
			'lg:translate-x-0',
			{ '!w-20': isCollapsed },
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
				class="flex items-center gap-3 h-16 border-b border-[var(--border-default)] px-6"
				:class="{ 'justify-center !px-2': isCollapsed }"
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
				<NuxtLink
					v-for="item in menuItems"
					:key="item.route"
					v-memo="[route.path, isCollapsed]"
					:to="item.route"
					class="w-full flex items-center gap-4 px-4 py-3 text-left rounded-lg transition-colors duration-200"
					:class="[
						route.path === item.route
							? 'bg-[var(--primary-light)] text-[var(--primary)] font-medium'
							: 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
						{ 'justify-center': isCollapsed },
					]"
					@click="emit('close')"
				>
					<Icon :name="item.icon" class="!w-6 !h-6 flex-shrink-0" />
					<span v-show="!isCollapsed" class="truncate">{{ item.label }}</span>
				</NuxtLink>
			</nav>

			<!-- Rodapé: Card do Usuário -->
			<div class="p-2 border-t border-[var(--border-default)]">
				<UiDropdown
					:placement="isCollapsed ? 'right' : 'top-start'"
					class="!block w-full"
					:class="{
						'[&>div:last-child]:!left-full [&>div:last-child]:!bottom-0 [&>div:last-child]:!top-auto [&>div:last-child]:!w-36 [&>div:last-child]:!ml-3':
							isCollapsed,
						'[&>div:last-child]:w-full': !isCollapsed,
					}"
				>
					<template #trigger="{ toggle, isOpen: isDropdownOpen }">
						<div
							class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-hover)] transition-colors duration-200 cursor-pointer"
							:class="{ 'justify-center': isCollapsed }"
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
							<div v-show="!isCollapsed" class="flex-1 min-w-0 text-left">
								<p class="text-sm font-medium text-[var(--text-primary)] truncate">
									{{ userName }}
								</p>
								<p class="text-xs text-[var(--text-muted)] truncate">
									{{ userEmail }}
								</p>
							</div>

							<!-- Ícone de dropdown (oculto quando colapsado) -->
							<Icon
								v-show="!isCollapsed"
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
