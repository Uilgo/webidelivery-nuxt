/**
 * 📌 useToast Composable
 *
 * Composable para gerenciar notificações toast globalmente.
 * Baseado no sistema do Nuxt UI com funcionalidades completas.
 */

// Tipos locais do composable
interface ButtonProps {
	variant?: "solid" | "outline" | "soft" | "ghost" | "link";
	size?: "sm" | "md" | "lg";
	color?: "primary" | "success" | "warning" | "error" | "neutral";
	icon?: string;
	loading?: boolean;
	disabled?: boolean;
	type?: "button" | "submit" | "reset";
	fullWidth?: boolean;
	label?: string;
	onClick?: (event: MouseEvent) => void;
}

interface AvatarProps {
	src?: string;
	alt?: string;
	name?: string;
	initials?: string;
	size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
	shape?: "circle" | "square" | "rounded";
	status?: "online" | "offline" | "away" | "busy" | "none";
	statusPosition?: "top-right" | "bottom-right" | "top-left" | "bottom-left";
	clickable?: boolean;
}

export interface ToastItem {
	/** ID único do toast */
	id: string | number;
	/** Título do toast */
	title?: string;
	/** Descrição do toast */
	description?: string;
	/** Ícone do toast */
	icon?: string;
	/** Avatar do toast */
	avatar?: AvatarProps;
	/** Cor do toast */
	color?: "primary" | "success" | "warning" | "error" | "neutral";
	/** Orientação entre conteúdo e ações */
	orientation?: "vertical" | "horizontal";
	/** Botão de fechar customizável */
	close?: boolean | Omit<ButtonProps, "onClick">;
	/** Ícone do botão fechar */
	closeIcon?: string;
	/** Ações do toast */
	actions?: readonly ButtonProps[];
	/** Barra de progresso */
	progress?: boolean | { color?: string };
	/** Estado aberto/fechado */
	open?: boolean;
	/** Duração em ms antes de fechar automaticamente */
	duration?: number;
	/** Tipo para acessibilidade */
	type?: "foreground" | "background";
	/** Callback ao clicar no toast */
	onClick?: (toast: ToastItem) => void;
	/** Callback quando o estado open muda */
	onUpdateOpen?: (open: boolean) => void;
}

export type ToastData = Partial<Omit<ToastItem, "id">> & {
	id?: string | number;
};

// ============================================
// STATE
// ============================================

// ============================================
// COMPOSABLE
// ============================================

/**
 * Composable principal para gerenciar toasts
 */
export const useToast = () => {
	/**
	 * Estado global dos toasts usando useState do Nuxt
	 */
	const toasts = useState<ToastItem[]>("ui.toasts", () => []);
	/**
	 * Adicionar um novo toast
	 */
	const add = (toast: ToastData): ToastItem => {
		const id = toast.id || Date.now() + Math.random();

		const newToast: ToastItem = {
			...toast,
			id,
			open: true,
			color: toast.color || "primary",
			orientation: toast.orientation || "vertical",
			close: toast.close !== undefined ? toast.close : true,
			closeIcon: toast.closeIcon || "lucide:x",
			actions: toast.actions || [],
			progress: toast.progress !== undefined ? toast.progress : true,
			duration: toast.duration || 5000,
			type: toast.type || "foreground",
		};

		// Adicionar ao início da lista
		toasts.value.unshift(newToast);

		// Limitar máximo de toasts (5 por padrão)
		if (toasts.value.length > 5) {
			toasts.value = toasts.value.slice(0, 5);
		}

		return newToast;
	};

	/**
	 * Atualizar um toast existente
	 */
	const update = (id: string | number, data: Partial<ToastItem>): void => {
		const index = toasts.value.findIndex((toast) => toast.id === id);
		if (index !== -1) {
			const currentToast = toasts.value[index];
			if (currentToast) {
				toasts.value[index] = { ...currentToast, ...data };
			}
		}
	};

	/**
	 * Remover um toast
	 */
	const remove = (id: string | number): void => {
		const index = toasts.value.findIndex((toast) => toast.id === id);
		if (index !== -1) {
			// Marcar como fechado primeiro para animação
			const toast = toasts.value[index];
			if (toast) {
				toast.open = false;
			}

			// Remover após delay para animação
			setTimeout(() => {
				const currentIndex = toasts.value.findIndex((toast) => toast.id === id);
				if (currentIndex !== -1) {
					toasts.value.splice(currentIndex, 1);
				}
			}, 200);
		}
	};

	/**
	 * Limpar todos os toasts
	 */
	const clear = (): void => {
		// Marcar todos como fechados
		toasts.value.forEach((toast) => {
			toast.open = false;
		});

		// Limpar após delay
		setTimeout(() => {
			toasts.value = [];
		}, 200);
	};

	/**
	 * Métodos de conveniência para diferentes tipos de toast
	 */
	const success = (data: Omit<ToastData, "color">): ToastItem => {
		return add({
			...data,
			color: "success",
			icon: data.icon || "lucide:check-circle",
		});
	};

	const error = (data: Omit<ToastData, "color">): ToastItem => {
		return add({
			...data,
			color: "error",
			icon: data.icon || "lucide:alert-circle",
		});
	};

	const warning = (data: Omit<ToastData, "color">): ToastItem => {
		return add({
			...data,
			color: "warning",
			icon: data.icon || "lucide:alert-triangle",
		});
	};

	const info = (data: Omit<ToastData, "color">): ToastItem => {
		return add({
			...data,
			color: "primary",
			icon: data.icon || "lucide:info",
		});
	};

	return {
		// Estado
		toasts: readonly(toasts),

		// Métodos principais
		add,
		update,
		remove,
		clear,

		// Métodos de conveniência
		success,
		error,
		warning,
		info,
	};
};

// ============================================
// HELPERS
// ============================================

/**
 * Helper para criar toasts de sucesso rapidamente
 */
export const showSuccess = (title: string, description?: string): ToastItem => {
	const { success } = useToast();
	return success({ title, description });
};

/**
 * Helper para criar toasts de erro rapidamente
 */
export const showError = (title: string, description?: string): ToastItem => {
	const { error } = useToast();
	return error({ title, description });
};

/**
 * Helper para criar toasts de aviso rapidamente
 */
export const showWarning = (title: string, description?: string): ToastItem => {
	const { warning } = useToast();
	return warning({ title, description });
};

/**
 * Helper para criar toasts informativos rapidamente
 */
export const showInfo = (title: string, description?: string): ToastItem => {
	const { info } = useToast();
	return info({ title, description });
};
