<script setup lang="ts">
/**
 * 🔧 ErrorMaintenance
 *
 * Página de manutenção.
 * Exibida quando o sistema está em manutenção programada.
 */

interface Props {
	estimatedTime?: string;
	message?: string;
}

withDefaults(defineProps<Props>(), {
	estimatedTime: "em breve",
	message: "Estamos realizando melhorias no sistema para oferecer uma experiência ainda melhor.",
});

/**
 * Recarrega a página
 */
const handleReload = () => {
	window.location.reload();
};
</script>

<template>
	<div
		class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 px-4"
	>
		<div class="max-w-2xl w-full text-center">
			<!-- Ilustração -->
			<div class="mb-8 flex justify-center">
				<div class="relative">
					<Icon
						name="lucide:wrench"
						class="w-32 h-32 text-purple-500 dark:text-purple-400 animate-bounce"
					/>
					<div class="absolute -top-2 -right-2">
						<Icon
							name="lucide:sparkles"
							class="w-8 h-8 text-pink-500 dark:text-pink-400 animate-pulse"
						/>
					</div>
				</div>
			</div>

			<!-- Mensagem -->
			<h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">Sistema em manutenção</h1>
			<p class="text-lg text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
				{{ message }}
			</p>
			<p class="text-md text-gray-500 dark:text-gray-500 mb-8">
				Voltaremos <strong>{{ estimatedTime }}</strong>
			</p>

			<!-- Ação -->
			<div class="flex justify-center">
				<UiButton size="lg" @click="handleReload">
					<template #iconLeft>
						<Icon name="lucide:refresh-cw" class="w-5 h-5" />
					</template>
					Verificar Status
				</UiButton>
			</div>

			<!-- Informações adicionais -->
			<div class="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
				<p class="text-sm text-gray-500 dark:text-gray-400">
					Agradecemos sua compreensão e paciência.
				</p>
			</div>
		</div>
	</div>
</template>
