<script setup lang="ts">
/**
 * 📌 PedidoConfirmacaoPage
 *
 * Página de confirmação e acompanhamento do pedido com nova estrutura visual.
 */

import { usePedido } from "~/features/public/pedido/composables/usePedido";
import { useCancelarPedido } from "~/features/public/pedido/composables/useCancelarPedido";
import { useAvaliacaoPedido } from "~/composables/ui/useAvaliacaoPedido";
import { useToast } from "~/composables/ui/useToast";
import { useTemaPublico } from "~/features/public/cardapio/composables/useTemaPublico";
import {
	clientePodeCancelar,
	getAvisoCancelamento,
} from "~/features/admin/pedidos/utils/status-transitions";
import {
	MOTIVOS_CANCELAMENTO_LABELS,
	type MotivoCancelamentoCliente,
} from "~/features/admin/pedidos/types/pedidos-admin";
import { STATUS_PEDIDO } from "#shared/constants/pedidos";
import PedidoAvaliacao from "~/features/public/pedido/components/PedidoAvaliacao.vue";
import PedidoAvaliacaoEstrelas from "~/features/public/pedido/components/PedidoAvaliacaoEstrelas.vue";
import type { PedidoCompleto } from "~/features/public/pedido/types/pedido";

// Novos componentes
import PedidoHeader from "~/features/public/pedido/components/PedidoHeader.vue";
import PedidoBannerSucesso from "~/features/public/pedido/components/PedidoBannerSucesso.vue";
import PedidoCodigoRastreamento from "~/features/public/pedido/components/PedidoCodigoRastreamento.vue";
import PedidoTimeline from "~/features/public/pedido/components/PedidoTimeline.vue";
import PedidoSectionTitle from "~/features/public/pedido/components/PedidoSectionTitle.vue";
import PedidoInfoCard from "~/features/public/pedido/components/PedidoInfoCard.vue";
import PedidoClienteCard from "~/features/public/pedido/components/PedidoClienteCard.vue";
import PedidoEnderecoCard from "~/features/public/pedido/components/PedidoEnderecoCard.vue";
import PedidoItensCard from "~/features/public/pedido/components/PedidoItensCard.vue";
import PedidoAlertaPix from "~/features/public/pedido/components/PedidoAlertaPix.vue";
import PedidoAcoes from "~/features/public/pedido/components/PedidoAcoes.vue";

/**
 * Props da rota
 */
const route = useRoute();
const slug = computed(() => route.params.slug as string);
const codigo = computed(() => route.params.codigo as string);
const supabase = useSupabaseClient();

/**
 * Dados do estabelecimento (reativo para useTemaPublico)
 */
const estabelecimentoRef = ref<{
	id: string;
	nome: string;
	endereco: string;
	whatsapp: string;
	config_tema?: unknown;
} | null>(null);

/**
 * Aplicar tema do estabelecimento usando o mesmo composable do cardápio
 */
useTemaPublico(estabelecimentoRef as Ref<any>);

/**
 * Busca dados do estabelecimento
 */
const buscarEstabelecimento = async () => {
	const { data, error } = await supabase
		.from("estabelecimentos")
		.select(
			"id, nome, endereco_rua, endereco_numero, endereco_bairro, endereco_cidade, endereco_estado, whatsapp, config_tema",
		)
		.eq("slug", slug.value)
		.single();

	if (error || !data) {
		return;
	}

	estabelecimentoRef.value = {
		id: data.id,
		nome: data.nome || "",
		endereco: `${data.endereco_rua}, ${data.endereco_numero} - ${data.endereco_bairro} - ${data.endereco_cidade}/${data.endereco_estado}`,
		whatsapp: data.whatsapp || "",
		config_tema: data.config_tema,
	};
};

/**
 * Composables
 */
const { buscarPedido } = usePedido();
const { cancelando, cancelar } = useCancelarPedido();
const { modalAberto, pedidoAtual, abrirModalAvaliacao, onAvaliacaoEnviada } = useAvaliacaoPedido();
const toast = useToast();

/**
 * Estado do pedido
 */
const pedido = ref<PedidoCompleto | null>(null);
const loading = ref(true);
const erro = ref(false);

/**
 * Busca dados do pedido
 */
const carregarPedido = async () => {
	loading.value = true;
	erro.value = false;

	const resultado = await buscarPedido(codigo.value);

	if (!resultado) {
		erro.value = true;
	} else {
		pedido.value = resultado;
	}

	loading.value = false;
};

/**
 * Carrega pedido ao montar
 */
onMounted(async () => {
	// Buscar dados do estabelecimento primeiro (para aplicar tema)
	await buscarEstabelecimento();

	// Depois carregar o pedido
	await carregarPedido();
});

/**
 * Atualiza pedido a cada 10 segundos (polling)
 */
const intervalId = ref<NodeJS.Timeout | null>(null);

onMounted(() => {
	intervalId.value = setInterval(() => {
		if (
			pedido.value &&
			pedido.value.status !== "concluido" &&
			pedido.value.status !== "cancelado"
		) {
			carregarPedido();
		}
	}, 10000);
});

onUnmounted(() => {
	if (intervalId.value) {
		clearInterval(intervalId.value);
	}
});

/**
 * Estado do modal de cancelamento
 */
const mostrarModalCancelar = ref(false);
const motivoCancelamento = ref<MotivoCancelamentoCliente | "">("");

/**
 * Verificar se pode cancelar
 */
const podeCancelar = computed(() => {
	if (!pedido.value) return false;
	return clientePodeCancelar(pedido.value.status);
});

/**
 * Aviso sobre cancelamento
 */
const avisoCancelamento = computed(() => {
	if (!pedido.value) return null;
	return getAvisoCancelamento(pedido.value.status);
});

/**
 * Confirmar cancelamento
 */
const confirmarCancelamento = async () => {
	if (!pedido.value) return;

	const resultado = await cancelar(pedido.value.id, motivoCancelamento.value || undefined);

	if (resultado.success) {
		toast.add({
			title: "Pedido cancelado",
			description: "Seu pedido foi cancelado com sucesso",
			color: "success",
		});

		// Atualizar pedido
		await carregarPedido();

		// Fechar modal
		mostrarModalCancelar.value = false;
		motivoCancelamento.value = "";
	} else {
		toast.add({
			title: "Não foi possível cancelar",
			description: resultado.error || "Seu pedido já está sendo preparado",
			color: "error",
		});
	}
};

/**
 * Abrir modal de avaliação
 */
const avaliarPedido = () => {
	if (!pedido.value) return;

	abrirModalAvaliacao({
		id: pedido.value.id,
		numero: pedido.value.numero,
	});
};

/**
 * Callback quando avaliação é enviada
 */
const handleAvaliacaoEnviada = async () => {
	toast.add({
		title: "Avaliação enviada!",
		description: "Obrigado pelo seu feedback",
		color: "success",
	});

	// Recarregar pedido para atualizar avaliação
	await carregarPedido();

	onAvaliacaoEnviada();
};
</script>

<template>
	<div class="min-h-screen bg-[var(--cardapio-background)] py-6 md:py-10">
		<div class="container mx-auto px-4 max-w-4xl">
			<!-- Loading -->
			<div v-if="loading && !pedido" class="flex justify-center py-20">
				<Icon
					name="lucide:loader-2"
					class="w-10 h-10 animate-spin text-[var(--cardapio-primary)]"
				/>
			</div>

			<!-- Erro -->
			<div
				v-else-if="erro"
				class="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 shadow-[var(--cardapio-card-shadow)]"
			>
				<div class="flex items-start gap-3">
					<Icon name="lucide:alert-circle" class="w-6 h-6 flex-shrink-0" />
					<div>
						<h3 class="font-bold mb-1">Pedido não encontrado</h3>
						<p class="text-sm">
							Não foi possível encontrar este pedido. Verifique o link ou entre em contato com o
							estabelecimento.
						</p>
					</div>
				</div>
			</div>

			<!-- Conteúdo Principal -->
			<div v-else-if="pedido" class="space-y-6">
				<!-- Header com Logo e Status -->
				<PedidoHeader
					:status="pedido.status"
					:slug="slug"
					:nome-estabelecimento="estabelecimentoRef?.nome"
				/>

				<!-- Banner de Sucesso -->
				<PedidoBannerSucesso :numero-pedido="pedido.numero" />

				<!-- Código de Rastreamento -->
				<PedidoCodigoRastreamento :codigo-rastreamento="pedido.codigo_rastreamento" />

				<!-- Alerta PIX -->
				<PedidoAlertaPix
					v-if="pedido.forma_pagamento === 'pix' && pedido.status === STATUS_PEDIDO.PENDENTE"
					:codigo-rastreamento="pedido.codigo_rastreamento"
					:comprovante-enviado="!!pedido.comprovante_pix"
					@atualizar="carregarPedido"
				/>

				<!-- Timeline do Status -->
				<div>
					<PedidoSectionTitle icon="lucide:clock" title="Status do Pedido" />
					<PedidoTimeline
						:status="pedido.status"
						:created-at="pedido.created_at"
						:aceito-em="pedido.aceito_em"
						:preparo-em="pedido.preparo_em"
						:pronto-em="pedido.pronto_em"
						:entrega-em="pedido.entrega_em"
						:concluido-em="pedido.concluido_em"
						:cancelado-em="pedido.cancelado_em"
					/>
				</div>

				<!-- Informações do Pedido -->
				<div>
					<PedidoSectionTitle icon="lucide:file-text" title="Informações do Pedido" />
					<PedidoInfoCard :pedido="pedido" />
				</div>

				<!-- Dados do Cliente -->
				<div>
					<PedidoSectionTitle icon="lucide:user" title="Dados do Cliente" />
					<PedidoClienteCard :pedido="pedido" />
				</div>

				<!-- Endereço de Entrega -->
				<div v-if="pedido.tipo_entrega === 'delivery' && pedido.endereco_rua">
					<PedidoSectionTitle icon="lucide:map-pin" title="Endereço de Entrega" />
					<PedidoEnderecoCard :pedido="pedido" />
				</div>

				<!-- Itens do Pedido -->
				<div>
					<PedidoSectionTitle icon="lucide:shopping-bag" title="Itens do Pedido" />
					<PedidoItensCard :pedido="pedido" />
				</div>

				<!-- Botão de Avaliar (quando concluído) -->
				<div
					v-if="pedido.status === STATUS_PEDIDO.CONCLUIDO"
					class="p-6 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 shadow-[var(--cardapio-card-shadow)]"
				>
					<!-- Já avaliado - mostrar avaliação existente -->
					<div v-if="pedido.avaliacao" class="text-center space-y-4">
						<div>
							<h3 class="font-bold text-lg text-[var(--cardapio-text)] mb-1">Sua Avaliação</h3>

							<!-- Estrelas usando componente -->
							<div class="mb-2">
								<PedidoAvaliacaoEstrelas :nota="pedido.avaliacao.nota" :tamanho="24" :gap="4" />
							</div>

							<p
								v-if="pedido.avaliacao.comentario"
								class="text-sm text-[var(--cardapio-text-muted)] italic"
							>
								"{{ pedido.avaliacao.comentario }}"
							</p>
						</div>
						<button
							type="button"
							@click="avaliarPedido"
							class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white rounded-2xl font-bold text-base transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
						>
							<Icon name="lucide:edit" class="w-5 h-5" />
							<span>Editar Avaliação</span>
						</button>
					</div>

					<!-- Ainda não avaliado -->
					<div v-else class="text-center space-y-4">
						<div>
							<Icon name="lucide:star" class="w-12 h-12 mx-auto text-yellow-500 mb-2" />
							<h3 class="font-bold text-lg text-[var(--cardapio-text)] mb-1">Pedido Concluído!</h3>
							<p class="text-sm text-[var(--cardapio-text-muted)]">
								Como foi sua experiência? Sua opinião é muito importante para nós!
							</p>
						</div>
						<button
							type="button"
							@click="avaliarPedido"
							class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white rounded-2xl font-bold text-base transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
						>
							<Icon name="lucide:star" class="w-5 h-5" />
							<span>Avaliar Pedido</span>
						</button>
					</div>
				</div>

				<!-- Ações (Cancelar/Voltar) -->
				<PedidoAcoes
					v-if="pedido.status !== 'concluido' && pedido.status !== 'cancelado'"
					:pode-cancelar="podeCancelar"
					:aviso-cancelamento="avisoCancelamento"
					:cancelando="cancelando"
					:slug="slug"
					@cancelar="mostrarModalCancelar = true"
				/>

				<!-- Botão WhatsApp (quando concluído/cancelado) -->
				<div
					v-if="pedido.status === 'concluido' || pedido.status === 'cancelado'"
					class="flex flex-col sm:flex-row gap-3"
				>
					<button
						type="button"
						@click="navigateTo(`/${slug}`)"
						class="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#f97316] to-[#ea580c] text-white rounded-2xl font-bold text-base transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
					>
						<Icon name="lucide:utensils" class="w-5 h-5" />
						<span>Voltar ao Cardápio</span>
					</button>
					<button
						type="button"
						@click="
							navigateTo(`https://wa.me/${estabelecimentoRef?.whatsapp.replace(/\D/g, '')}`, {
								external: true,
								open: { target: '_blank' },
							})
						"
						class="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 bg-[#25d366] text-white rounded-2xl font-bold text-base transition-all duration-300 hover:bg-[#128c7e] hover:-translate-y-0.5 hover:shadow-lg"
					>
						<Icon name="lucide:message-circle" class="w-5 h-5" />
						<span>Falar no WhatsApp</span>
					</button>
				</div>

				<!-- Atualização Automática -->
				<p class="text-xs text-center text-[var(--cardapio-text-muted)] pt-4">
					Esta página atualiza automaticamente a cada 10 segundos
				</p>
			</div>
		</div>
	</div>

	<!-- Modal de Cancelamento -->
	<UiModal v-model="mostrarModalCancelar" title="Cancelar Pedido" size="sm">
		<div class="space-y-4">
			<!-- Aviso -->
			<div
				class="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl shadow-[var(--cardapio-card-shadow)]"
			>
				<div class="flex gap-3">
					<Icon name="lucide:alert-triangle" class="w-5 h-5 text-orange-600 flex-shrink-0" />
					<div class="text-sm">
						<p class="font-medium text-orange-600 mb-1">Tem certeza que deseja cancelar?</p>
						<p class="text-[var(--cardapio-text-muted)]">
							Esta ação não pode ser desfeita. Você precisará fazer um novo pedido.
						</p>
					</div>
				</div>
			</div>

			<!-- Motivo (opcional) -->
			<div>
				<label class="block text-sm font-medium mb-2 text-[var(--cardapio-text)]">
					Motivo do cancelamento (opcional)
				</label>
				<select
					v-model="motivoCancelamento"
					class="w-full px-3 py-2 text-sm bg-[var(--cardapio-secondary)] border border-[var(--cardapio-border)] rounded-xl focus:outline-none focus:border-[var(--cardapio-primary)] focus:ring-2 focus:ring-[var(--cardapio-primary)]/20 text-[var(--cardapio-text)]"
				>
					<option value="">Selecione um motivo</option>
					<option v-for="(label, key) in MOTIVOS_CANCELAMENTO_LABELS" :key="key" :value="key">
						{{ label }}
					</option>
				</select>
			</div>
		</div>

		<template #footer>
			<div class="flex gap-2">
				<UiButton
					color="neutral"
					variant="ghost"
					size="md"
					class="flex-1"
					@click="mostrarModalCancelar = false"
				>
					Voltar
				</UiButton>
				<UiButton
					color="error"
					variant="solid"
					size="md"
					class="flex-[2]"
					:loading="cancelando"
					@click="confirmarCancelamento"
				>
					Sim, Cancelar Pedido
				</UiButton>
			</div>
		</template>
	</UiModal>

	<!-- Modal de Avaliação -->
	<PedidoAvaliacao
		v-if="pedidoAtual"
		v-model="modalAberto"
		:pedido-id="pedidoAtual.id"
		:pedido-numero="pedidoAtual.numero"
		:avaliacao-existente="pedido?.avaliacao"
		@avaliado="handleAvaliacaoEnviada"
	/>
</template>
