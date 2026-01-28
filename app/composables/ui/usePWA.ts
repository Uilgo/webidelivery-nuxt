/**
 * 📱 usePWA - Composable para gerenciar PWA
 *
 * Fornece funcionalidades de Progressive Web App:
 * - Detecção de instalação
 * - Prompt de instalação
 * - Verificação de atualizações
 * - Status offline/online
 *
 * @example
 * ```typescript
 * const { isInstalled, canInstall, install, needRefresh, updateServiceWorker } = useWebiPWA();
 *
 * // Verificar se pode instalar
 * if (canInstall.value) {
 *   await install();
 * }
 *
 * // Verificar se precisa atualizar
 * if (needRefresh.value) {
 *   await updateServiceWorker();
 * }
 * ```
 */

import { useRegisterSW } from "virtual:pwa-register/vue";

export interface UsePWAReturn {
	/**
	 * Se o app está instalado como PWA
	 */
	isInstalled: Ref<boolean>;

	/**
	 * Se pode mostrar prompt de instalação
	 */
	canInstall: Ref<boolean>;

	/**
	 * Se está offline
	 */
	isOffline: Ref<boolean>;

	/**
	 * Se precisa atualizar o service worker
	 */
	needRefresh: Ref<boolean>;

	/**
	 * Se está atualizando
	 */
	offlineReady: Ref<boolean>;

	/**
	 * Instala o PWA
	 */
	install: () => Promise<void>;

	/**
	 * Atualiza o service worker
	 */
	updateServiceWorker: (reloadPage?: boolean) => Promise<void>;

	/**
	 * Fecha o prompt de atualização
	 */
	close: () => void;
}

export const useWebiPWA = (): UsePWAReturn => {
	// Estado de instalação
	const isInstalled = ref(false);
	const canInstall = ref(false);
	const isOffline = ref(import.meta.client ? !navigator.onLine : false);

	// Evento de instalação (beforeinstallprompt)
	let deferredPrompt: BeforeInstallPromptEvent | null = null;

	// Service Worker registration (apenas no cliente)
	const { needRefresh, offlineReady, updateServiceWorker } = import.meta.client
		? useRegisterSW({
				immediate: true,
				onRegistered(registration: unknown) {
					// eslint-disable-next-line no-console
					console.log("[PWA] Service Worker registrado:", registration);
				},
				onRegisterError(error: unknown) {
					console.error("[PWA] Erro ao registrar Service Worker:", error);
				},
			})
		: {
				needRefresh: ref(false),
				offlineReady: ref(false),
				updateServiceWorker: () => Promise.resolve(),
			};

	/**
	 * Verifica se o app está instalado
	 */
	const checkInstalled = (): void => {
		// Verifica se está rodando em modo standalone (instalado)
		if (import.meta.client) {
			const isStandalone =
				window.matchMedia("(display-mode: standalone)").matches ||
				(window.navigator as Navigator & { standalone?: boolean }).standalone ||
				document.referrer.includes("android-app://");

			isInstalled.value = isStandalone;
		}
	};

	/**
	 * Instala o PWA
	 */
	const install = async (): Promise<void> => {
		if (!deferredPrompt) {
			console.warn("[PWA] Prompt de instalação não disponível");
			return;
		}

		try {
			// Mostra o prompt de instalação
			deferredPrompt.prompt();

			// Aguarda a escolha do usuário
			const { outcome } = await deferredPrompt.userChoice;

			if (outcome === "accepted") {
				// eslint-disable-next-line no-console
				console.log("[PWA] Usuário aceitou a instalação");
				isInstalled.value = true;
				canInstall.value = false;
			} else {
				// eslint-disable-next-line no-console
				console.log("[PWA] Usuário recusou a instalação");
			}

			// Limpa o prompt
			deferredPrompt = null;
		} catch (error) {
			console.error("[PWA] Erro ao instalar:", error);
		}
	};

	/**
	 * Fecha o prompt de atualização
	 */
	const close = (): void => {
		needRefresh.value = false;
		offlineReady.value = false;
	};

	// ========================================
	// LIFECYCLE E EVENTOS
	// ========================================

	if (import.meta.client) {
		// Verifica instalação ao montar
		onMounted(() => {
			checkInstalled();
		});

		// Listener para beforeinstallprompt
		window.addEventListener("beforeinstallprompt", (e: Event) => {
			e.preventDefault();
			deferredPrompt = e as BeforeInstallPromptEvent;
			canInstall.value = true;
			// eslint-disable-next-line no-console
			console.log("[PWA] Prompt de instalação disponível");
		});

		// Listener para appinstalled
		window.addEventListener("appinstalled", () => {
			// eslint-disable-next-line no-console
			console.log("[PWA] App instalado com sucesso");
			isInstalled.value = true;
			canInstall.value = false;
			deferredPrompt = null;
		});

		// Listener para online/offline
		window.addEventListener("online", () => {
			isOffline.value = false;
			// eslint-disable-next-line no-console
			console.log("[PWA] Conexão restaurada");
		});

		window.addEventListener("offline", () => {
			isOffline.value = true;
			// eslint-disable-next-line no-console
			console.log("[PWA] Sem conexão");
		});
	}

	return {
		isInstalled,
		canInstall,
		isOffline,
		needRefresh,
		offlineReady,
		install,
		updateServiceWorker,
		close,
	};
};
