/**
 * 📊 useDashboardRealtime - Dados em Tempo Real do Dashboard
 *
 * Responsável por:
 * - Buscar pedidos recentes (últimos 10)
 * - Gerenciar notificações do sistema
 * - Detectar novos pedidos e alertas
 * - Polling rápido a cada 10 segundos
 */

import type {
	DashboardRealtime,
	PedidoResumo,
	DashboardNotificacao,
	DashboardAlerta,
} from "~/features/admin/dashboard/types/dashboard";
import type { PedidoCompleto } from "~/features/admin/pedidos/types/pedidos-admin";

export interface UseDashboardRealtimeReturn {
	carregarRealtime: () => Promise<DashboardRealtime>;
	limparCache: () => void;
	adicionarNotificacao: (notificacao: Omit<DashboardNotificacao, "id" | "created_at">) => void;
	marcarNotificacaoLida: (id: string) => void;
	limparNotificacoes: () => void;
}

export const useDashboardRealtime = (): UseDashboardRealtimeReturn => {
	// Estados locais para notificações
	const notificacoes = ref<DashboardNotificacao[]>([]);
	const alertas = ref<DashboardAlerta[]>([]);
	const ultimosPedidosIds = ref<Set<string>>(new Set());

	/**
	 * Gera ID único para notificações
	 */
	const gerarId = (): string => {
		return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	};

	/**
	 * Busca pedidos recentes
	 */
	const buscarPedidosRecentes = async (): Promise<PedidoResumo[]> => {
		try {
			const pedidos = await $fetch<PedidoCompleto[]>(
				"/api/admin/pedidos?limit=10&order=created_at.desc",
			);

			return pedidos.map((pedido) => ({
				id: pedido.id,
				numero: pedido.numero,
				cliente_nome: pedido.cliente_nome,
				status: pedido.status,
				valor_total: pedido.total,
				created_at: pedido.created_at,
			}));
		} catch (error) {
			console.error("Erro ao buscar pedidos recentes:", error);
			return [];
		}
	};

	/**
	 * Detecta novos pedidos e cria notificações
	 */
	const detectarNovosPedidos = (pedidosAtuais: PedidoResumo[]): void => {
		pedidosAtuais.forEach((pedido) => {
			// Se é um pedido novo (não estava na lista anterior)
			if (!ultimosPedidosIds.value.has(pedido.id)) {
				// Adiciona notificação apenas se não for o primeiro carregamento
				if (ultimosPedidosIds.value.size > 0) {
					adicionarNotificacao({
						tipo: "novo_pedido",
						titulo: "Novo Pedido",
						mensagem: `Pedido #${pedido.numero} de ${pedido.cliente_nome}`,
						pedido_id: pedido.id,
						lida: false,
					});
				}

				ultimosPedidosIds.value.add(pedido.id);
			}
		});

		// Remove IDs antigos que não estão mais na lista
		const idsAtuais = new Set(pedidosAtuais.map((p) => p.id));
		ultimosPedidosIds.value.forEach((id) => {
			if (!idsAtuais.has(id)) {
				ultimosPedidosIds.value.delete(id);
			}
		});
	};

	/**
	 * Busca alertas do sistema
	 */
	const buscarAlertas = async (): Promise<DashboardAlerta[]> => {
		try {
			// TODO: Implementar API de alertas
			// const alertas = await $fetch<DashboardAlerta[]>("/api/admin/dashboard/alertas");
			// return alertas;

			// Mock de alertas para desenvolvimento
			return [];
		} catch (error) {
			console.error("Erro ao buscar alertas:", error);
			return [];
		}
	};

	/**
	 * Adiciona nova notificação
	 */
	const adicionarNotificacao = (
		notificacao: Omit<DashboardNotificacao, "id" | "created_at">,
	): void => {
		const novaNotificacao: DashboardNotificacao = {
			...notificacao,
			id: gerarId(),
			created_at: new Date().toISOString(),
		};

		notificacoes.value.unshift(novaNotificacao);

		// Limita a 50 notificações
		if (notificacoes.value.length > 50) {
			notificacoes.value = notificacoes.value.slice(0, 50);
		}
	};

	/**
	 * Marca notificação como lida
	 */
	const marcarNotificacaoLida = (id: string): void => {
		const notificacao = notificacoes.value.find((n) => n.id === id);
		if (notificacao) {
			notificacao.lida = true;
		}
	};

	/**
	 * Limpa todas as notificações
	 */
	const limparNotificacoes = (): void => {
		notificacoes.value = [];
	};

	/**
	 * Carrega todos os dados em tempo real
	 */
	const carregarRealtime = async (): Promise<DashboardRealtime> => {
		try {
			// Busca dados em paralelo
			const [pedidosRecentes, alertasData] = await Promise.all([
				buscarPedidosRecentes(),
				buscarAlertas(),
			]);

			// Detecta novos pedidos
			detectarNovosPedidos(pedidosRecentes);

			// Atualiza alertas
			alertas.value = alertasData;

			return {
				pedidos_recentes: pedidosRecentes,
				notificacoes: notificacoes.value,
				alertas: alertas.value,
			};
		} catch (error) {
			console.error("Erro ao carregar dados em tempo real:", error);
			throw error;
		}
	};

	/**
	 * Limpa cache (na verdade limpa estados locais)
	 */
	const limparCache = (): void => {
		notificacoes.value = [];
		alertas.value = [];
		ultimosPedidosIds.value.clear();
	};

	return {
		carregarRealtime,
		limparCache,
		adicionarNotificacao,
		marcarNotificacaoLida,
		limparNotificacoes,
	};
};
