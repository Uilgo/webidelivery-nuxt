<script setup lang="ts">
/**
 * 📊 RelatoriosManager
 *
 * Componente orquestrador principal da feature de relatórios.
 * Gerencia:
 * - Navegação entre abas (Pedidos, Vendas, Produtos, Marketing, Financeiro)
 * - Filtros globais (período, estabelecimento)
 * - Renderização condicional dos relatórios específicos
 * - Sincronização com URL
 */

import type { AbaRelatorio, OpcoesExportacao } from "../types/relatorios";

import RelatoriosTabs from "./RelatoriosTabs.vue";
import RelatoriosFiltros from "./RelatoriosFiltros.vue";
import ExportarModal from "./shared/ExportarModal.vue";
import PedidosRelatorio from "./pedidos/PedidosRelatorio.vue";
import VendasRelatorio from "./vendas/VendasRelatorio.vue";
import ProdutosRelatorio from "./produtos/ProdutosRelatorio.vue";
import MarketingRelatorio from "./marketing/MarketingRelatorio.vue";
import FinanceiroRelatorio from "./financeiro/FinanceiroRelatorio.vue";
import { useRelatorios } from "../composables/useRelatorios";
import { useRelatoriosPermissions } from "../composables/useRelatoriosPermissions";
import { useRelatoriosExportar } from "../composables/useRelatoriosExportar";
import { useRelatoriosPedidos } from "../composables/useRelatoriosPedidos";
import { useRelatoriosVendas } from "../composables/useRelatoriosVendas";
import { useRelatoriosProdutos } from "../composables/useRelatoriosProdutos";
import { useRelatoriosMarketing } from "../composables/useRelatoriosMarketing";
import { useRelatoriosFinanceiro } from "../composables/useRelatoriosFinanceiro";
import { useRelatoriosFiltros } from "../composables/useRelatoriosFiltros";
import { useToast } from "~/composables/ui/useToast";

// Composables
const { abaAtiva, setAbaAtiva } = useRelatorios();
const { podeAcessarRelatorios } = useRelatoriosPermissions();
const { exportar, exportando } = useRelatoriosExportar();
const { periodo } = useRelatoriosFiltros();
const toast = useToast();

// Dados dos relatórios
const pedidosData = useRelatoriosPedidos();
const vendasData = useRelatoriosVendas();
const produtosData = useRelatoriosProdutos();
const marketingData = useRelatoriosMarketing();
const financeiroData = useRelatoriosFinanceiro();

// Estado do modal
const modalExportarAberto = ref(false);

// Verificar permissões
if (!podeAcessarRelatorios.value) {
	throw createError({
		statusCode: 403,
		statusMessage: "Você não tem permissão para acessar relatórios",
	});
}

// Handler de mudança de aba
const handleAbaChange = (aba: AbaRelatorio) => {
	setAbaAtiva(aba);
};

// Handler de refresh
const refreshing = ref(false);

const handleRefresh = async () => {
	refreshing.value = true;
	try {
		switch (abaAtiva.value) {
			case "pedidos":
				await pedidosData.refresh();
				break;
			case "vendas":
				await vendasData.refresh();
				break;
			case "produtos":
				await produtosData.refresh();
				break;
			case "marketing":
				await marketingData.refresh();
				break;
			case "financeiro":
				await financeiroData.refresh();
				break;
		}
		toast.add({
			title: "Sucesso",
			description: "Relatório atualizado com sucesso!",
			color: "success",
		});
	} catch (error) {
		toast.add({
			title: "Erro",
			description: "Erro ao atualizar relatório",
			color: "error",
		});
		console.error(error);
	} finally {
		refreshing.value = false;
	}
};

// Handler de exportar
const handleExportar = () => {
	modalExportarAberto.value = true;
};

// Handler de confirmar exportação
const handleConfirmarExportacao = async (opcoes: OpcoesExportacao) => {
	try {
		// Preparar dados baseado na aba ativa
		let dados;
		let titulo = "";

		switch (abaAtiva.value) {
			case "pedidos":
				titulo = "Relatório de Pedidos";
				dados = prepararDadosPedidos();
				break;
			case "vendas":
				titulo = "Relatório de Vendas";
				dados = prepararDadosVendas();
				break;
			case "produtos":
				titulo = "Relatório de Produtos";
				dados = prepararDadosProdutos();
				break;
			case "marketing":
				titulo = "Relatório de Marketing";
				dados = prepararDadosMarketing();
				break;
			case "financeiro":
				titulo = "Relatório Financeiro";
				dados = prepararDadosFinanceiro();
				break;
		}

		if (!dados) {
			toast.add({
				title: "Aviso",
				description: "Nenhum dado disponível para exportar",
				color: "warning",
			});
			return;
		}

		// Adicionar período
		const periodoTexto = periodo.value
			? `${new Date(periodo.value.data_inicio).toLocaleDateString("pt-BR")} até ${new Date(periodo.value.data_fim).toLocaleDateString("pt-BR")}`
			: "";

		await exportar(opcoes, {
			titulo,
			periodo: periodoTexto,
			...dados,
		});

		toast.add({
			title: "Sucesso",
			description: "Relatório exportado com sucesso!",
			color: "success",
		});
	} catch (error) {
		toast.add({
			title: "Erro",
			description: "Erro ao exportar relatório",
			color: "error",
		});
		console.error(error);
	}
};

// Funções auxiliares para preparar dados
const prepararDadosPedidos = () => {
	if (!pedidosData.dados.value?.tabela) return null;

	return {
		tabelas: [
			{
				colunas: ["Número", "Data", "Cliente", "Total", "Status", "Tipo Entrega"],
				linhas: pedidosData.dados.value.tabela.map((p) => [
					p.numero,
					new Date(p.created_at).toLocaleDateString("pt-BR"),
					p.cliente_nome,
					`R$ ${p.total.toFixed(2)}`,
					p.status,
					p.tipo_entrega,
				]),
			},
		],
	};
};

const prepararDadosVendas = () => {
	if (!vendasData.dados.value?.tabela) return null;

	return {
		tabelas: [
			{
				colunas: ["Data", "Cliente", "Subtotal", "Desconto", "Total"],
				linhas: vendasData.dados.value.tabela.map((v) => [
					new Date(v.data).toLocaleDateString("pt-BR"),
					v.cliente_nome,
					`R$ ${v.subtotal.toFixed(2)}`,
					`R$ ${v.desconto.toFixed(2)}`,
					`R$ ${v.total.toFixed(2)}`,
				]),
			},
		],
	};
};

const prepararDadosProdutos = () => {
	if (!produtosData.dados.value?.tabela) return null;

	return {
		tabelas: [
			{
				colunas: ["Produto", "Categoria", "Quantidade", "Receita", "% Vendas"],
				linhas: produtosData.dados.value.tabela.map((p) => [
					p.nome,
					p.categoria_nome,
					p.quantidade_vendida,
					`R$ ${p.receita_total.toFixed(2)}`,
					`${p.percentual_vendas.toFixed(1)}%`,
				]),
			},
		],
	};
};

const prepararDadosMarketing = () => {
	if (!marketingData.dados.value?.cupons.desempenho) return null;

	return {
		tabelas: [
			{
				colunas: ["Cupom", "Tipo", "Usos", "Desconto Total", "Receita Gerada"],
				linhas: marketingData.dados.value.cupons.desempenho.map((c) => [
					c.codigo,
					c.tipo,
					c.usos,
					`R$ ${c.desconto_total.toFixed(2)}`,
					`R$ ${c.receita_gerada.toFixed(2)}`,
				]),
			},
		],
	};
};

const prepararDadosFinanceiro = () => {
	if (!financeiroData.dados.value?.tabela) return null;

	return {
		tabelas: [
			{
				colunas: [
					"Número",
					"Data",
					"Descrição",
					"Forma Pagamento",
					"Valor Bruto",
					"Desconto",
					"Valor Líquido",
				],
				linhas: financeiroData.dados.value.tabela.map((t) => [
					t.numero,
					new Date(t.data).toLocaleDateString("pt-BR"),
					t.descricao,
					t.forma_pagamento,
					`R$ ${t.valor_bruto.toFixed(2)}`,
					`R$ ${t.desconto.toFixed(2)}`,
					`R$ ${t.valor_liquido.toFixed(2)}`,
				]),
			},
		],
	};
};
</script>

<template>
	<div class="relatorios-manager space-y-6">
		<!-- Navegação por abas -->
		<RelatoriosTabs :aba-ativa="abaAtiva" @change="handleAbaChange" />

		<!-- Filtros globais -->
		<RelatoriosFiltros :loading="refreshing" @refresh="handleRefresh" @exportar="handleExportar" />

		<!-- Conteúdo do relatório ativo -->
		<div class="relatorio-content">
			<!-- Relatório de Pedidos -->
			<PedidosRelatorio v-if="abaAtiva === 'pedidos'" />

			<!-- Relatório de Vendas -->
			<VendasRelatorio v-else-if="abaAtiva === 'vendas'" />

			<!-- Relatório de Produtos -->
			<ProdutosRelatorio v-else-if="abaAtiva === 'produtos'" />

			<!-- Relatório de Marketing -->
			<MarketingRelatorio v-else-if="abaAtiva === 'marketing'" />

			<!-- Relatório Financeiro -->
			<FinanceiroRelatorio v-else-if="abaAtiva === 'financeiro'" />
		</div>

		<!-- Modal de Exportação -->
		<ExportarModal
			v-model="modalExportarAberto"
			:titulo="`Exportar ${abaAtiva.charAt(0).toUpperCase() + abaAtiva.slice(1)}`"
			@exportar="handleConfirmarExportacao"
		/>

		<!-- Loading overlay durante exportação -->
		<Teleport v-if="exportando" to="body">
			<div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
				<div class="rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
					<div class="flex items-center gap-3">
						<Icon name="lucide:loader" class="h-6 w-6 animate-spin text-blue-600" />
						<span class="text-gray-900 dark:text-white">Exportando relatório...</span>
					</div>
				</div>
			</div>
		</Teleport>
	</div>
</template>
