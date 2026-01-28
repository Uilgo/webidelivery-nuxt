/**
 * 📱 Tipos para PWA (Progressive Web App)
 *
 * Declarações de tipos para módulos virtuais do @vite-pwa/nuxt
 * e interfaces do PWA.
 */

declare module "virtual:pwa-register/vue" {
	import type { Ref } from "vue";

	export interface RegisterSWOptions {
		immediate?: boolean;
		onNeedRefresh?: () => void;
		onOfflineReady?: () => void;
		onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
		onRegisterError?: (error: Error) => void;
	}

	export function useRegisterSW(options?: RegisterSWOptions): {
		needRefresh: Ref<boolean>;
		offlineReady: Ref<boolean>;
		updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
	};
}

/**
 * Evento beforeinstallprompt do PWA
 */
interface BeforeInstallPromptEvent extends Event {
	/**
	 * Mostra o prompt de instalação
	 */
	prompt: () => Promise<void>;

	/**
	 * Promessa que resolve com a escolha do usuário
	 */
	userChoice: Promise<{
		outcome: "accepted" | "dismissed";
		platform: string;
	}>;
}

/**
 * Extensão do Navigator para PWA
 */
interface Navigator {
	/**
	 * Indica se o app está rodando em modo standalone (iOS)
	 */
	standalone?: boolean;
}

/**
 * Extensão do WindowEventMap para eventos PWA
 */
interface WindowEventMap {
	beforeinstallprompt: BeforeInstallPromptEvent;
	appinstalled: Event;
}
