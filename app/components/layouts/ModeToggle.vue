<script setup lang="ts">
/**
 * 🌙 Componente de toggle para alternar entre os modos de cor: light, dark e system.
 * Usa o composable useColorMode() do @nuxtjs/color-mode para gerenciar o estado.
 * Utiliza o componente UiDropdown da UI para consistência com o design system.
 */

const colorMode = useColorMode();

// Função para obter o ícone baseado no modo
function getIconForMode(mode: string) {
	if (mode === "light") return "lucide:sun";
	if (mode === "dark") return "lucide:moon";
	return "lucide:monitor";
}

// Função para obter o label baseado no modo
function getLabelForMode(mode: string) {
	if (mode === "light") return "Light";
	if (mode === "dark") return "Dark";
	return "System";
}

// Ícone atual baseado na preferência de cor
const currentIcon = computed(() => {
	const mode = colorMode.preference || colorMode.value || "system";

	return getIconForMode(mode);
});

// Label atual baseado na preferência
const currentLabel = computed(() => {
	return getLabelForMode(colorMode.preference || "system");
});

// Opções disponíveis no dropdown com estado selecionado
const themeOptions = computed(() => {
	const currentMode = colorMode.preference || "system";

	return [
		{
			label: "Light",
			value: "light",
			icon: "lucide:sun",
			selected: currentMode === "light",
		},
		{
			label: "Dark",
			value: "dark",
			icon: "lucide:moon",
			selected: currentMode === "dark",
		},
		{
			label: "System",
			value: "system",
			icon: "lucide:monitor",
			selected: currentMode === "system",
		},
	];
});

// Handler para seleção de tema
function handleThemeSelect(item: { label: string; value: string | number; icon?: string }) {
	colorMode.preference = item.value as string;
}
</script>

<template>
	<UiDropdown placement="bottom-end">
		<template #trigger="{ toggle }">
			<UiButton
				variant="ghost"
				size="md"
				class="!p-2 !min-h-[40px] !w-[40px]"
				:aria-label="`Tema atual: ${currentLabel}. Clique para alterar`"
				@click="toggle"
			>
				<Icon :name="currentIcon" class="w-6 h-6" />
			</UiButton>
		</template>

		<!-- Conteúdo customizado do dropdown -->
		<template #default="{ close }">
			<div class="max-w-[140px]">
				<UiButton
					v-for="option in themeOptions"
					:key="option.value"
					variant="ghost"
					size="sm"
					class="flex w-full items-center justify-start gap-1 p-1 text-sm text-left rounded-md cursor-pointer whitespace-nowrap"
					:class="[
						option.selected
							? 'bg-[var(--primary-light)] text-[var(--primary)]'
							: 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
					]"
					@click="
						handleThemeSelect(option);
						close();
					"
				>
					<div class="flex items-center gap-2">
						<Icon :name="option.icon" class="w-4 h-4 flex-shrink-0" />
						<span>{{ option.label }}</span>
						<!-- Check se está selecionado -->
						<Icon
							v-if="option.selected"
							name="lucide:check"
							class="w-4 h-4 flex-shrink-0 text-[var(--primary)] ml-0.5"
						/>
					</div>
				</UiButton>
			</div>
		</template>
	</UiDropdown>
</template>
