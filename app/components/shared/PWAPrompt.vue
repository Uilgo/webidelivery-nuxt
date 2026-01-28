<script setup lang="ts">
/**
 * 📱 PWAPrompt - Componente de Prompts do PWA
 *
 * Exibe notificações para:
 * - Instalação do app
 * - Atualizações disponíveis
 * - Status offline
 */

import { useWebiPWA } from "~/composables/ui/usePWA";

const { canInstall, install, needRefresh, offlineReady, updateServiceWorker, close, isOffline } =
	useWebiPWA();

// Controle de visibilidade dos prompts
const showInstallPrompt = ref(false);
const showUpdatePrompt = computed(() => needRefresh.value || offlineReady.value);

// Mostrar prompt de instalação após 30 segundos (se disponível)
onMounted(() => {
	setTimeout(() => {
		if (canInstall.value) {
			showInstallPrompt.value = true;
		}
	}, 30000); // 30 segundos
});

/**
 * Instala o PWA e fecha o prompt
 */
const handleInstall = async () => {
	await install();
	showInstallPrompt.value = false;
};

/**
 * Atualiza o service worker e recarrega a página
 */
const handleUpdate = async () => {
	await updateServiceWorker(true);
};

/**
 * Fecha o prompt de instalação
 */
const dismissInstall = () => {
	showInstallPrompt.value = false;
	// Salva no localStorage para não mostrar novamente
	if (import.meta.client) {
		localStorage.setItem("pwa-install-dismissed", "true");
	}
};

// Verifica se o usuário já dispensou o prompt
const wasDismissed = ref(false);
if (import.meta.client) {
	wasDismissed.value = localStorage.getItem("pwa-install-dismissed") === "true";
}
</script>

<template>
	<div class="pwa-prompts">
		<!-- Prompt de Instalação -->
		<Transition name="slide-up">
			<div
				v-if="showInstallPrompt && !wasDismissed"
				class="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800"
			>
				<div class="flex items-start gap-3">
					<div class="flex-shrink-0">
						<Icon name="lucide:download" class="h-6 w-6 text-primary-600 dark:text-primary-400" />
					</div>
					<div class="flex-1">
						<h3 class="text-sm font-semibold text-gray-900 dark:text-white">
							Instalar WebiDelivery
						</h3>
						<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
							Instale o app para acesso rápido e experiência offline.
						</p>
						<div class="mt-3 flex gap-2">
							<button
								type="button"
								class="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
								@click="handleInstall"
							>
								Instalar
							</button>
							<button
								type="button"
								class="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
								@click="dismissInstall"
							>
								Agora não
							</button>
						</div>
					</div>
				</div>
			</div>
		</Transition>

		<!-- Prompt de Atualização -->
		<Transition name="slide-up">
			<div
				v-if="showUpdatePrompt"
				class="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-lg dark:border-blue-700 dark:bg-blue-900"
			>
				<div class="flex items-start gap-3">
					<div class="flex-shrink-0">
						<Icon name="lucide:refresh-cw" class="h-6 w-6 text-blue-600 dark:text-blue-400" />
					</div>
					<div class="flex-1">
						<h3 class="text-sm font-semibold text-blue-900 dark:text-white">
							{{ offlineReady ? "App pronto para uso offline" : "Atualização disponível" }}
						</h3>
						<p class="mt-1 text-sm text-blue-700 dark:text-blue-300">
							{{
								offlineReady
									? "O app está pronto para funcionar offline."
									: "Uma nova versão está disponível. Clique para atualizar."
							}}
						</p>
						<div class="mt-3 flex gap-2">
							<button
								v-if="needRefresh"
								type="button"
								class="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
								@click="handleUpdate"
							>
								Atualizar agora
							</button>
							<button
								type="button"
								class="rounded-md px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-800"
								@click="close"
							>
								{{ needRefresh ? "Depois" : "OK" }}
							</button>
						</div>
					</div>
				</div>
			</div>
		</Transition>

		<!-- Indicador de Offline -->
		<Transition name="slide-down">
			<div
				v-if="isOffline"
				class="fixed left-0 right-0 top-0 z-50 bg-yellow-500 px-4 py-2 text-center text-sm font-medium text-white dark:bg-yellow-600"
			>
				<Icon name="lucide:wifi-off" class="mr-2 inline-block h-4 w-4" />
				Você está offline. Algumas funcionalidades podem estar limitadas.
			</div>
		</Transition>
	</div>
</template>

<style scoped>
/* Animações */
.slide-up-enter-active,
.slide-up-leave-active {
	transition: all 0.3s ease;
}

.slide-up-enter-from {
	transform: translateY(100%);
	opacity: 0;
}

.slide-up-leave-to {
	transform: translateY(100%);
	opacity: 0;
}

.slide-down-enter-active,
.slide-down-leave-active {
	transition: all 0.3s ease;
}

.slide-down-enter-from {
	transform: translateY(-100%);
	opacity: 0;
}

.slide-down-leave-to {
	transform: translateY(-100%);
	opacity: 0;
}
</style>
