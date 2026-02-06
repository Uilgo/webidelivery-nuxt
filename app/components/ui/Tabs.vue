<script setup lang="ts">
/**
 * 📌 Componente UI - Tabs
 *
 * Componente de abas reutilizável com suporte a:
 * - Ícones nas abas
 * - Badges com contadores
 * - Tema claro/escuro
 * - Slot scoped para conteúdo dinâmico
 * - Integração com UiButton para design consistente
 */

interface Tab {
	key: string;
	label: string;
	icon?: string;
	badge?: string | number;
}

interface Props {
	tabs: Tab[];
	defaultTab?: string;
	modelValue?: string;
	/** Preencher altura disponível */
	fillHeight?: boolean;
}

interface Emits {
	"update:modelValue": [value: string];
	"tab-change": [tab: string];
}

const props = withDefaults(defineProps<Props>(), {
	defaultTab: "",
	modelValue: undefined,
	fillHeight: false,
});

const emit = defineEmits<Emits>();

// Estado da aba ativa
const activeTab = ref(
	props.modelValue ||
		props.defaultTab ||
		(props.tabs.length > 0 && props.tabs[0] ? props.tabs[0].key : ""),
);

// Função para alterar aba ativa
const setActiveTab = (tabKey: string): void => {
	activeTab.value = tabKey;
	emit("update:modelValue", tabKey);
	emit("tab-change", tabKey);
};

// Watch para sincronizar com v-model
watch(
	() => props.modelValue,
	(newValue) => {
		if (newValue && newValue !== activeTab.value) {
			activeTab.value = newValue;
		}
	},
);

// Inicializar com primeira aba se não houver valor
onMounted(() => {
	if (!activeTab.value && props.tabs.length > 0) {
		const firstTab = props.tabs[0];
		if (firstTab) {
			setActiveTab(firstTab.key);
		}
	}
});

const rootClasses = computed(() => {
	const classes = ["w-full"];
	if (props.fillHeight) {
		classes.push("h-full flex flex-col overflow-hidden");
	}
	return classes.join(" ");
});

const contentClasses = computed(() => {
	const classes = ["mt-6"];
	if (props.fillHeight) {
		classes.push("flex-1 flex flex-col min-h-0 overflow-hidden");
	}
	return classes.join(" ");
});
</script>

<template>
	<div :class="rootClasses">
		<!-- Tab Headers com slot para elementos extras -->
		<div class="flex items-center gap-4 flex-shrink-0">
			<!-- Tab Headers -->
			<div
				class="p-1 bg-[var(--bg-muted)] rounded-lg shadow-sm border border-[var(--border-default)] flex-1"
			>
				<nav class="flex gap-1" aria-label="Tabs">
					<button
						v-for="tab in tabs"
						:key="tab.key"
						type="button"
						:class="[
							'flex-1 flex items-center justify-center gap-2 px-3 rounded-md font-medium text-sm transition-all duration-200 ease-in-out h-10 focus-ring',
							activeTab === tab.key
								? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border-default)]'
								: 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]',
						]"
						@click="setActiveTab(tab.key)"
					>
						<Icon v-if="tab.icon" :name="tab.icon" class="w-4 h-4 flex-shrink-0" />

						<span class="truncate">{{ tab.label }}</span>

						<span
							v-if="tab.badge !== undefined"
							:class="[
								'inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-bold min-w-[18px] h-[18px] justify-center flex-shrink-0',
								activeTab === tab.key
									? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm'
									: 'bg-[var(--bg-muted)] text-[var(--text-muted)]',
							]"
						>
							{{ tab.badge }}
						</span>
					</button>
				</nav>
			</div>

			<!-- Slot para elementos extras (como filtros) -->
			<div v-if="$slots.extra" class="flex-shrink-0">
				<slot name="extra"></slot>
			</div>
		</div>

		<!-- Tab Content -->
		<div :class="contentClasses">
			<slot :active-tab="activeTab"></slot>
		</div>
	</div>
</template>
