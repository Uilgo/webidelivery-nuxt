/**
 * 📦 useRelatoriosProdutos
 *
 * Composable para gerenciar dados do relatório de produtos.
 * Busca e processa informações sobre:
 * - Produtos mais vendidos
 * - Receita por produto
 * - Vendas por categoria
 * - Ranking de produtos
 */

import type { RelatorioProdutos, ProdutoDetalhado } from "../types/produtos";
import type { FiltrosPeriodo } from "../types/relatorios";
import { formatCurrency } from "~/lib/formatters/currency";
import { formatNumber } from "~/lib/formatters/number";
import { useRelatoriosFiltros } from "./useRelatoriosFiltros";

export const useRelatoriosProdutos = () => {
	// Estado reativo
	const dados = useState<RelatorioProdutos | null>("relatorios.produtos.dados", () => null);
	const loading = useState<boolean>("relatorios.produtos.loading", () => false);
	const error = useState<string | null>("relatorios.produtos.error", () => null);

	const supabase = useSupabaseClient();
	const estabelecimentoStore = useEstabelecimentoStore();

	/**
	 * Busca dados do relatório de produtos
	 */
	const fetchDados = async (filtros: FiltrosPeriodo, forceRefresh = false): Promise<void> => {
		// Se já tem dados e não é refresh forçado, não buscar novamente
		if (dados.value && !forceRefresh) {
			return;
		}

		loading.value = true;
		error.value = null;

		try {
			const estabelecimentoId = estabelecimentoStore.estabelecimento?.id;
			if (!estabelecimentoId) {
				throw new Error("Estabelecimento não encontrado");
			}

			// Buscar itens de pedidos concluídos com joins
			const { data: itensPedidos, error: itensError } = await supabase
				.from("pedido_itens")
				.select(
					`
          id,
          quantidade,
          preco_unitario,
          subtotal,
          produto_id,
          produto_nome,
          pedido_id,
          produtos!inner (
            id,
            nome,
            imagem_url,
            categoria_id,
            categorias (
              id,
              nome
            )
          ),
          pedidos!inner (
            id,
            numero,
            created_at,
            status,
            estabelecimento_id
          )
        `,
				)
				.eq("pedidos.estabelecimento_id", estabelecimentoId)
				.eq("pedidos.status", "concluido")
				.gte("pedidos.created_at", filtros.data_inicio)
				.lte("pedidos.created_at", filtros.data_fim);

			if (itensError) throw itensError;

			// Processar dados
			const kpis = calcularKpis(itensPedidos || []);
			const ranking = calcularRanking(itensPedidos || []);
			const graficos = prepararGraficos(itensPedidos || []);
			const tabela = prepararTabela(itensPedidos || []);
			const resumo = calcularResumo(itensPedidos || []);

			dados.value = {
				kpis,
				ranking,
				graficos,
				tabela,
				resumo,
			};
		} catch (err) {
			console.error("Erro ao buscar dados de produtos:", err);
			error.value = err instanceof Error ? err.message : "Erro desconhecido";
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Calcula KPIs do relatório
	 */
	const calcularKpis = (itens: unknown[]): RelatorioProdutos["kpis"] => {
		const totalProdutosVendidos = itens.reduce(
			(acc, item) => (acc as number) + ((item as Record<string, unknown>).quantidade as number),
			0 as number,
		);

		// Agrupar por produto
		const produtosMap = new Map<string, { nome: string; quantidade: number; receita: number }>();

		itens.forEach((item) => {
			const itemData = item as Record<string, unknown>;
			const produto = itemData.produtos as Record<string, unknown>;
			const produtoId = produto.id as string;
			const produtoNome = produto.nome as string;
			const quantidade = itemData.quantidade as number;
			const subtotal = itemData.subtotal as number;

			if (produtosMap.has(produtoId)) {
				const existing = produtosMap.get(produtoId)!;
				existing.quantidade += quantidade;
				existing.receita += subtotal;
			} else {
				produtosMap.set(produtoId, {
					nome: produtoNome,
					quantidade,
					receita: subtotal,
				});
			}
		});

		// Produto mais vendido
		let produtoMaisVendido = { nome: "-", quantidade: 0 };
		produtosMap.forEach((produto) => {
			if (produto.quantidade > produtoMaisVendido.quantidade) {
				produtoMaisVendido = produto;
			}
		});

		// Agrupar por categoria
		const categoriasMap = new Map<string, { nome: string; quantidade: number }>();

		itens.forEach((item) => {
			const itemData = item as Record<string, unknown>;
			const produto = itemData.produtos as Record<string, unknown>;
			const categorias = produto.categorias as Record<string, unknown> | null;

			if (categorias) {
				const categoriaId = categorias.id as string;
				const categoriaNome = categorias.nome as string;
				const quantidade = itemData.quantidade as number;

				if (categoriasMap.has(categoriaId)) {
					const existing = categoriasMap.get(categoriaId)!;
					existing.quantidade += quantidade;
				} else {
					categoriasMap.set(categoriaId, {
						nome: categoriaNome,
						quantidade,
					});
				}
			}
		});

		// Categoria mais vendida
		let categoriaMaisVendida = { nome: "-", quantidade: 0 };
		categoriasMap.forEach((categoria) => {
			if (categoria.quantidade > categoriaMaisVendida.quantidade) {
				categoriaMaisVendida = categoria;
			}
		});

		// Receita total de produtos
		const receitaProdutos = itens.reduce(
			(acc, item) => (acc as number) + ((item as Record<string, unknown>).subtotal as number),
			0 as number,
		);

		return {
			produtos_vendidos: {
				titulo: "Produtos Vendidos",
				valor: formatNumber(totalProdutosVendidos as number),
				icone: "lucide:package",
				cor: "blue",
				formato: "numero",
				descricao: "Total de unidades vendidas",
			},
			produto_mais_vendido: {
				titulo: "Produto Mais Vendido",
				valor: `${produtoMaisVendido.nome} (${produtoMaisVendido.quantidade})`,
				icone: "lucide:trophy",
				cor: "yellow",
				formato: "numero",
				descricao: "Produto com maior volume de vendas",
			},
			categoria_mais_vendida: {
				titulo: "Categoria Mais Vendida",
				valor: `${categoriaMaisVendida.nome} (${categoriaMaisVendida.quantidade})`,
				icone: "lucide:layers",
				cor: "purple",
				formato: "numero",
				descricao: "Categoria com maior volume",
			},
			receita_produtos: {
				titulo: "Receita de Produtos",
				valor: formatCurrency(receitaProdutos as number),
				icone: "lucide:dollar-sign",
				cor: "green",
				formato: "moeda",
				descricao: "Receita total gerada por produtos",
			},
		};
	};

	/**
	 * Calcula ranking de produtos
	 */
	const calcularRanking = (itens: unknown[]): RelatorioProdutos["ranking"] => {
		// Agrupar por produto
		const produtosMap = new Map<
			string,
			{
				id: string;
				nome: string;
				categoria_nome: string;
				quantidade_vendida: number;
				receita: number;
				imagem_url: string | null;
			}
		>();

		itens.forEach((item) => {
			const itemData = item as Record<string, unknown>;
			const produto = itemData.produtos as Record<string, unknown>;
			const categorias = produto.categorias as Record<string, unknown> | null;

			const produtoId = produto.id as string;
			const produtoNome = produto.nome as string;
			const produtoImagem = (produto.imagem_url as string | undefined) || null;
			const categoriaNome = categorias ? (categorias.nome as string) : "Sem categoria";
			const quantidade = itemData.quantidade as number;
			const subtotal = itemData.subtotal as number;

			if (produtosMap.has(produtoId)) {
				const existing = produtosMap.get(produtoId)!;
				existing.quantidade_vendida += quantidade;
				existing.receita += subtotal;
			} else {
				produtosMap.set(produtoId, {
					id: produtoId,
					nome: produtoNome,
					categoria_nome: categoriaNome,
					quantidade_vendida: quantidade,
					receita: subtotal,
					imagem_url: produtoImagem,
				});
			}
		});

		const produtos = Array.from(produtosMap.values());

		// Mais vendidos (por quantidade)
		const maisVendidos = [...produtos]
			.sort((a, b) => b.quantidade_vendida - a.quantidade_vendida)
			.slice(0, 10)
			.map((p, index) => ({ ...p, posicao: index + 1 }));

		// Menos vendidos (por quantidade)
		const menosVendidos = [...produtos]
			.sort((a, b) => a.quantidade_vendida - b.quantidade_vendida)
			.slice(0, 10)
			.map((p, index) => ({ ...p, posicao: index + 1 }));

		// Maior receita
		const maiorReceita = [...produtos]
			.sort((a, b) => b.receita - a.receita)
			.slice(0, 10)
			.map((p, index) => ({ ...p, posicao: index + 1 }));

		return {
			mais_vendidos: maisVendidos,
			menos_vendidos: menosVendidos,
			maior_receita: maiorReceita,
		};
	};

	/**
	 * Prepara dados para gráficos
	 */
	const prepararGraficos = (itens: unknown[]): RelatorioProdutos["graficos"] => {
		// Vendas por categoria
		const categoriasMap = new Map<string, number>();

		itens.forEach((item) => {
			const itemData = item as Record<string, unknown>;
			const produto = itemData.produtos as Record<string, unknown>;
			const categorias = produto.categorias as Record<string, unknown> | null;

			if (categorias) {
				const categoriaNome = categorias.nome as string;
				const quantidade = itemData.quantidade as number;

				categoriasMap.set(categoriaNome, (categoriasMap.get(categoriaNome) || 0) + quantidade);
			}
		});

		const vendasPorCategoria = {
			labels: Array.from(categoriasMap.keys()),
			datasets: [
				{
					label: "Quantidade Vendida",
					data: Array.from(categoriasMap.values()),
					backgroundColor: [
						"#3b82f6",
						"#10b981",
						"#f59e0b",
						"#ef4444",
						"#8b5cf6",
						"#ec4899",
						"#14b8a6",
						"#f97316",
					],
				},
			],
		};

		// Evolução de vendas (por dia)
		const vendasPorDia = new Map<string, number>();

		itens.forEach((item) => {
			const itemData = item as Record<string, unknown>;
			const pedidos = itemData.pedidos as Record<string, unknown>;
			const createdAt = pedidos.created_at as string;
			const data = new Date(createdAt).toISOString().split("T")[0] || "";
			const quantidade = itemData.quantidade as number;

			vendasPorDia.set(data, (vendasPorDia.get(data) || 0) + quantidade);
		});

		const datasOrdenadas = Array.from(vendasPorDia.keys()).sort();

		const evolucaoVendas = {
			labels: datasOrdenadas,
			datasets: [
				{
					label: "Produtos Vendidos",
					data: datasOrdenadas.map((data) => vendasPorDia.get(data) || 0),
					borderColor: "#3b82f6",
					backgroundColor: "#3b82f620",
					fill: true,
					tension: 0.4,
				},
			],
		};

		// Top 10 produtos
		const produtosMap = new Map<string, { nome: string; quantidade: number }>();

		itens.forEach((item) => {
			const itemData = item as Record<string, unknown>;
			const produto = itemData.produtos as Record<string, unknown>;
			const produtoId = produto.id as string;
			const produtoNome = produto.nome as string;
			const quantidade = itemData.quantidade as number;

			if (produtosMap.has(produtoId)) {
				const existing = produtosMap.get(produtoId)!;
				existing.quantidade += quantidade;
			} else {
				produtosMap.set(produtoId, { nome: produtoNome, quantidade });
			}
		});

		const top10 = Array.from(produtosMap.values())
			.sort((a, b) => b.quantidade - a.quantidade)
			.slice(0, 10);

		const top10Produtos = {
			labels: top10.map((p) => p.nome),
			datasets: [
				{
					label: "Quantidade Vendida",
					data: top10.map((p) => p.quantidade),
					backgroundColor: "#3b82f6",
				},
			],
		};

		return {
			vendas_por_categoria: vendasPorCategoria,
			evolucao_vendas: evolucaoVendas,
			top_10_produtos: top10Produtos,
		};
	};

	/**
	 * Prepara dados para tabela
	 */
	const prepararTabela = (itens: unknown[]): ProdutoDetalhado[] => {
		// Agrupar por produto
		const produtosMap = new Map<
			string,
			{
				id: string;
				nome: string;
				categoria_nome: string;
				quantidade_vendida: number;
				receita_total: number;
				preco_medio: number;
				imagem_url: string | null;
			}
		>();

		itens.forEach((item) => {
			const itemData = item as Record<string, unknown>;
			const produto = itemData.produtos as Record<string, unknown>;
			const categorias = produto.categorias as Record<string, unknown> | null;

			const produtoId = produto.id as string;
			const produtoNome = produto.nome as string;
			const produtoImagem = (produto.imagem_url as string | undefined) || null;
			const categoriaNome = categorias ? (categorias.nome as string) : "Sem categoria";
			const quantidade = itemData.quantidade as number;
			const subtotal = itemData.subtotal as number;

			if (produtosMap.has(produtoId)) {
				const existing = produtosMap.get(produtoId)!;
				existing.quantidade_vendida += quantidade;
				existing.receita_total += subtotal;
				existing.preco_medio = existing.receita_total / existing.quantidade_vendida;
			} else {
				produtosMap.set(produtoId, {
					id: produtoId,
					nome: produtoNome,
					categoria_nome: categoriaNome,
					quantidade_vendida: quantidade,
					receita_total: subtotal,
					preco_medio: subtotal / quantidade,
					imagem_url: produtoImagem,
				});
			}
		});

		const produtos = Array.from(produtosMap.values());
		const receitaTotal = produtos.reduce((acc, p) => acc + p.receita_total, 0);

		// Adicionar percentual de vendas
		return produtos
			.map((p) => ({
				...p,
				percentual_vendas: receitaTotal > 0 ? (p.receita_total / receitaTotal) * 100 : 0,
			}))
			.sort((a, b) => b.quantidade_vendida - a.quantidade_vendida);
	};

	/**
	 * Calcula resumo geral
	 */
	const calcularResumo = (itens: unknown[]): RelatorioProdutos["resumo"] => {
		const totalProdutosVendidos = itens.reduce(
			(acc, item) => (acc as number) + ((item as Record<string, unknown>).quantidade as number),
			0 as number,
		) as number;

		const receitaTotal = itens.reduce(
			(acc, item) => (acc as number) + ((item as Record<string, unknown>).subtotal as number),
			0 as number,
		) as number;

		// Categorias únicas
		const categoriasSet = new Set<string>();
		const vendasPorCategoria: Record<string, number> = {};

		itens.forEach((item) => {
			const itemData = item as Record<string, unknown>;
			const produto = itemData.produtos as Record<string, unknown>;
			const categorias = produto.categorias as Record<string, unknown> | null;

			if (categorias) {
				const categoriaId = categorias.id as string;
				const categoriaNome = categorias.nome as string;
				const quantidade = itemData.quantidade as number;

				categoriasSet.add(categoriaId);
				vendasPorCategoria[categoriaNome] = (vendasPorCategoria[categoriaNome] || 0) + quantidade;
			}
		});

		// Produto mais vendido
		const produtosMap = new Map<string, { nome: string; quantidade: number }>();

		itens.forEach((item) => {
			const itemData = item as Record<string, unknown>;
			const produto = itemData.produtos as Record<string, unknown>;
			const produtoId = produto.id as string;
			const produtoNome = produto.nome as string;
			const quantidade = itemData.quantidade as number;

			if (produtosMap.has(produtoId)) {
				const existing = produtosMap.get(produtoId)!;
				existing.quantidade += quantidade;
			} else {
				produtosMap.set(produtoId, { nome: produtoNome, quantidade });
			}
		});

		let produtoMaisVendido: { nome: string; quantidade: number } | null = null;
		produtosMap.forEach((produto) => {
			if (!produtoMaisVendido || produto.quantidade > produtoMaisVendido.quantidade) {
				produtoMaisVendido = produto;
			}
		});

		return {
			total_produtos_vendidos: totalProdutosVendidos,
			total_categorias_ativas: categoriasSet.size,
			receita_total: receitaTotal,
			preco_medio_geral: totalProdutosVendidos > 0 ? receitaTotal / totalProdutosVendidos : 0,
			vendas_por_categoria: vendasPorCategoria,
			produto_mais_vendido: produtoMaisVendido,
		};
	};

	/**
	 * Refresh dos dados (força nova busca)
	 */
	const refresh = async (): Promise<void> => {
		const filtros = useRelatoriosFiltros();
		await fetchDados(filtros.periodo.value, true);
	};

	return {
		dados: readonly(dados),
		loading: readonly(loading),
		error: readonly(error),
		fetchDados,
		refresh,
	};
};
