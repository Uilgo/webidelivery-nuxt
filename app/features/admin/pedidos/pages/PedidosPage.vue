<script setup lang="ts">
/**
 * 📌 PedidosPage
 *
 * Página principal de gerenciamento de pedidos do painel admin.
 * Integra todos os componentes e implementa polling para atualização em tempo real.
 */

import type {
	PedidoCompleto,
	ModoVisualizacao,
	StatusPedido,
} from "~/features/admin/pedidos/types/pedidos-admin";
import { usePedidos } from "~/features/admin/pedidos/composables/usePedidos";
import { usePedidoAcoes } from "~/features/admin/pedidos/composables/usePedidoAcoes";
import PedidoTabs from "~/features/admin/pedidos/components/PedidoTabs.vue";
import PedidoFiltros from "~/features/admin/pedidos/components/PedidoFiltros.vue";
import PedidoCard from "~/features/admin/pedidos/components/PedidoCard.vue";
import PedidoListaItem from "~/features/admin/pedidos/components/PedidoListaItem.vue";
import PedidoDetalhesDrawer from "~/features/admin/pedidos/components/PedidoDetalhesDrawer.vue";
import PedidoCardSkeleton from "~/features/admin/pedidos/components/PedidoCardSkeleton.vue";
import PedidoListaSkeleton from "~/features/admin/pedidos/components/PedidoListaSkeleton.vue";

/**
 * Composables
 */
const { pedidos, loading, erro, filtros, buscarPedidos, pedidosFiltrados, contadores } =
	usePedidos();
const {
	atualizarStatus,
	aceitarPedido,
	iniciarPreparo,
	marcarPronto,
	sairParaEntrega,
	concluirPedido,
	cancelarPedido,
} = usePedidoAcoes();

/**
 * Router e Route para gerenciar query params
 */
const route = useRoute();
const router = useRouter();

/**
 * Cookie para persistir a última tab visitada
 */
const lastTabCookie = useCookie<string | null>("pedidos-last-tab", {
	default: () => null,
	maxAge: 60 * 60 * 24 * 30, // 30 dias
});

/**
 * Determina a tab inicial baseado na URL ou cookie
 */
const getInitialTab = (): string | null => {
	const queryTab = route.query.tab as string;
	const validTabs = [
		"todos",
		"pendente",
		"aceito",
		"preparo",
		"pronto",
		"entrega",
		"concluido",
		"cancelado",
	];

	if (queryTab && validTabs.includes(queryTab)) {
		return queryTab === "todos" ? null : queryTab;
	}

	return lastTabCookie.value;
};

/**
 * Inicializar filtro de status com a tab da URL/cookie
 */
filtros.value.status = getInitialTab() as StatusPedido | null;

/**
 * Estado da página
 */
const modoVisualizacao = ref<ModoVisualizacao>("cards");
const pedidoSelecionado = ref<PedidoCompleto | null>(null);
const mostrarDrawer = ref(false);
const intervalId = ref<NodeJS.Timeout | null>(null);

/**
 * Abrir drawer de detalhes
 */
const abrirDetalhes = (pedido: PedidoCompleto) => {
	pedidoSelecionado.value = pedido;
	mostrarDrawer.value = true;
};

/**
 * Executar ação no pedido
 */
const executarAcao = async (pedido: PedidoCompleto, acao: string, motivo?: string) => {
	try {
		let sucesso = false;
		let novoStatus: StatusPedido | null = null;
		const eraReativacao = pedido.status === "cancelado" && acao !== "cancelar";

		// Ações específicas
		if (acao === "aceitar") {
			sucesso = await aceitarPedido(pedido.id);
			novoStatus = "aceito";
		} else if (acao === "preparo") {
			sucesso = await iniciarPreparo(pedido.id);
			novoStatus = "preparo";
		} else if (acao === "pronto") {
			sucesso = await marcarPronto(pedido.id);
			novoStatus = "pronto";
		} else if (acao === "entrega") {
			sucesso = await sairParaEntrega(pedido.id);
			novoStatus = "entrega";
		} else if (acao === "concluir") {
			sucesso = await concluirPedido(pedido.id);
			novoStatus = "concluido";
		} else if (acao === "cancelar") {
			const motivoCancelamento = motivo || "Cancelado pelo estabelecimento";
			sucesso = await cancelarPedido(pedido.id, motivoCancelamento);
			novoStatus = "cancelado";
		} else {
			// Mudança direta de status (vem do drawer de ações disponíveis)
			sucesso = await atualizarStatus(pedido.id, acao as StatusPedido, motivo);
			novoStatus = acao as StatusPedido;
		}

		if (sucesso) {
			// Fechar drawer primeiro
			if (mostrarDrawer.value) {
				mostrarDrawer.value = false;
			}

			// APENAS quando reativar um pedido cancelado, mudar automaticamente para a tab do novo status
			if (eraReativacao && novoStatus && novoStatus !== "cancelado") {
				filtros.value.status = novoStatus;
			}

			// Buscar IMEDIATAMENTE do servidor para atualizar a lista
			await buscarPedidos();
		}
	} catch (err) {
		console.error("Erro ao executar ação:", err);
	}
};

/**
 * Inicializar polling
 */
const iniciarPolling = () => {
	// Buscar inicial
	buscarPedidos();

	// Polling a cada 10 segundos
	intervalId.value = setInterval(() => {
		buscarPedidos();
	}, 10000);
};

/**
 * Parar polling
 */
const pararPolling = () => {
	if (intervalId.value) {
		clearInterval(intervalId.value);
		intervalId.value = null;
	}
};

/**
 * Lifecycle
 */
onMounted(() => {
	// Se não há pedidos em cache, buscar do servidor
	if (pedidos.value.length === 0) {
		buscarPedidos();
	}

	iniciarPolling();

	// Forçar parâmetro tab na URL se não existir
	if (!route.query.tab) {
		const tabInicial = filtros.value.status || "todos";
		router.replace({
			query: {
				...route.query,
				tab: tabInicial,
			},
		});
	}
});

onUnmounted(() => {
	pararPolling();
});

/**
 * Watch para sincronizar filtro de status com mudanças na URL
 */
watch(
	() => route.query.tab,
	(newTab) => {
		const validTabs = [
			"todos",
			"pendente",
			"aceito",
			"preparo",
			"pronto",
			"entrega",
			"concluido",
			"cancelado",
		];
		const validTab = validTabs.includes(newTab as string) ? (newTab as string) : "todos";
		const novoStatus = validTab === "todos" ? null : (validTab as StatusPedido);

		if (filtros.value.status !== novoStatus) {
			filtros.value.status = novoStatus;
		}
	},
);

/**
 * Watch para atualizar URL e cookie quando mudar o filtro de status
 */
watch(
	() => filtros.value.status,
	(novoStatus) => {
		const tab = novoStatus || "todos";
		lastTabCookie.value = novoStatus;

		// Atualizar URL apenas se for diferente
		if (route.query.tab !== tab) {
			router.push({
				query: {
					...route.query,
					tab,
				},
			});
		}
	},
);
</script>

<template>
	<div class="h-full flex flex-col overflow-hidden">
		<!-- Tabs de Status -->
		<div class="flex-shrink-0">
			<PedidoTabs v-model="filtros.status" :contadores="contadores" />
		</div>

		<!-- Filtros -->
		<div class="flex-shrink-0">
			<PedidoFiltros
				v-model="filtros"
				:view-mode="modoVisualizacao"
				:loading="loading"
				@update:view-mode="(mode) => (modoVisualizacao = mode)"
				@refresh="buscarPedidos"
				@limpar="buscarPedidos"
			/>
		</div>

		<!-- Loading State (Skeleton) - apenas quando não há dados em cache -->
		<div v-if="loading && pedidos.length === 0" class="flex-1 overflow-y-auto custom-scrollbar">
			<!-- Modo Cards -->
			<div
				v-if="modoVisualizacao === 'cards'"
				class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4"
			>
				<PedidoCardSkeleton v-for="i in 6" :key="i" />
			</div>

			<!-- Modo Lista -->
			<div v-else class="space-y-3 py-4">
				<PedidoListaSkeleton v-for="i in 8" :key="i" />
			</div>
		</div>

		<!-- Error State -->
		<div v-else-if="erro" class="flex-1 flex items-center justify-center">
			<UiEmptyState
				variant="error"
				title="Erro ao carregar pedidos"
				:description="erro"
				action-text="Tentar Novamente"
				@action="buscarPedidos"
			/>
		</div>

		<!-- Empty State -->
		<div v-else-if="pedidosFiltrados.length === 0" class="flex-1 flex items-center justify-center">
			<UiEmptyState
				icon="lucide:inbox"
				title="Nenhum pedido encontrado"
				description="Não há pedidos com os filtros selecionados"
			/>
		</div>

		<!-- Lista de Pedidos -->
		<div v-else class="flex-1 overflow-y-auto custom-scrollbar">
			<!-- Modo Cards -->
			<div
				v-if="modoVisualizacao === 'cards'"
				class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 py-4"
			>
				<PedidoCard
					v-for="pedido in pedidosFiltrados"
					:key="pedido.id"
					:pedido="pedido"
					@click="abrirDetalhes"
				/>
			</div>

			<!-- Modo Lista -->
			<div v-else class="space-y-3 py-4">
				<PedidoListaItem
					v-for="pedido in pedidosFiltrados"
					:key="pedido.id"
					:pedido="pedido"
					@click="abrirDetalhes"
					@acao="executarAcao"
				/>
			</div>
		</div>

		<!-- Drawer de Detalhes -->
		<PedidoDetalhesDrawer
			v-model="mostrarDrawer"
			:pedido="pedidoSelecionado"
			@acao="executarAcao"
		/>
	</div>
</template>
