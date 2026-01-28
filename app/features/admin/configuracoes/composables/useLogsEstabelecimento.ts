/**
 * 📌 useLogsEstabelecimento
 *
 * Composable para gerenciar logs operacionais do estabelecimento.
 * Busca, filtra e exporta logs com retenção de 12 meses.
 *
 * ⚡ OTIMIZAÇÃO SSR: Usa dados pré-carregados do plugin logs-cache.server.ts
 */

import type {
	LogEstabelecimento,
	LogComputado,
	LogEstabelecimentoFiltros,
	LogEstabelecimentoStats,
	LogsPorMes,
} from "#shared/types/logs";

export const useLogsEstabelecimento = () => {
	const supabase = useSupabaseClient();
	const userStore = useUserStore();

	// ⚡ Usar dados pré-carregados do SSR
	const logsSSR = useState<LogEstabelecimento[]>("logs-estabelecimento", () => []);
	const statsSSR = useState<LogEstabelecimentoStats | null>("logs-stats", () => null);

	// Estado
	const logs = ref<LogComputado[]>([]);
	const logsPorMes = ref<LogsPorMes[]>([]);
	const stats = ref<LogEstabelecimentoStats | null>(statsSSR.value);
	const isLoading = ref(false);
	const error = ref<string | null>(null);

	// Filtros
	const filtros = ref<LogEstabelecimentoFiltros>({
		periodo: "30_dias",
	});

	/**
	 * Calcula dias até exclusão do log
	 */
	const calcularDiasAteExclusao = (createdAt: string): number | null => {
		const dataLog = new Date(createdAt);
		const dataExclusao = new Date(dataLog);
		dataExclusao.setMonth(dataExclusao.getMonth() + 12);

		const hoje = new Date();
		const diffTime = dataExclusao.getTime() - hoje.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		return diffDays > 0 ? diffDays : null;
	};

	/**
	 * Formata descrição do log
	 */
	const formatarDescricao = (log: LogEstabelecimento): string => {
		const acao = LOG_ACOES_DESCRICAO[log.acao] || log.acao;
		const tabela = LOG_TABELAS_DESCRICAO[log.tabela] || log.tabela;

		let descricao = `${acao} ${tabela}`;

		// Adicionar nome do registro se disponível
		if (log.dados_novos?.nome) {
			descricao += ` "${log.dados_novos.nome}"`;
		}

		return descricao;
	};

	/**
	 * Converte log para formato computado
	 */
	const computarLog = (log: LogEstabelecimento): LogComputado => {
		const diasAteExclusao = calcularDiasAteExclusao(log.created_at);

		return {
			...log,
			dias_ate_exclusao: diasAteExclusao,
			sera_excluido: diasAteExclusao !== null && diasAteExclusao <= 30,
			retencao: "12_meses",
			descricao_formatada: formatarDescricao(log),
		};
	};

	/**
	 * Buscar logs do estabelecimento
	 */
	const buscarLogs = async (): Promise<void> => {
		if (!userStore.establishmentId) {
			error.value = "Estabelecimento não identificado";
			return;
		}

		isLoading.value = true;
		error.value = null;

		try {
			let query = supabase
				.from("logs_estabelecimento")
				.select("*")
				.eq("estabelecimento_id", userStore.establishmentId)
				.order("created_at", { ascending: false });

			// Aplicar filtros
			if (filtros.value.periodo && filtros.value.periodo !== "tudo") {
				const dataInicio = calcularDataInicio(filtros.value.periodo);
				query = query.gte("created_at", dataInicio.toISOString());
			}

			if (filtros.value.data_inicio) {
				query = query.gte("created_at", filtros.value.data_inicio);
			}

			if (filtros.value.data_fim) {
				query = query.lte("created_at", filtros.value.data_fim);
			}

			if (filtros.value.acao) {
				query = query.eq("acao", filtros.value.acao);
			}

			if (filtros.value.tabela) {
				query = query.eq("tabela", filtros.value.tabela);
			}

			if (filtros.value.usuario_id) {
				query = query.eq("usuario_id", filtros.value.usuario_id);
			}

			if (filtros.value.search) {
				query = query.or(
					`usuario_nome.ilike.%${filtros.value.search}%,usuario_email.ilike.%${filtros.value.search}%,acao.ilike.%${filtros.value.search}%,tabela.ilike.%${filtros.value.search}%`,
				);
			}

			const { data, error: fetchError } = await query;

			if (fetchError) throw fetchError;

			logs.value = (data || []).map(computarLog);
			agruparLogsPorMes();
		} catch (err) {
			error.value = err instanceof Error ? err.message : "Erro ao buscar logs";
			console.error("Erro ao buscar logs:", err);
		} finally {
			isLoading.value = false;
		}
	};

	/**
	 * Calcular data de início baseado no período
	 */
	const calcularDataInicio = (periodo: string): Date => {
		const hoje = new Date();

		switch (periodo) {
			case "hoje":
				return new Date(hoje.setHours(0, 0, 0, 0));
			case "7_dias":
				return new Date(hoje.setDate(hoje.getDate() - 7));
			case "30_dias":
				return new Date(hoje.setDate(hoje.getDate() - 30));
			case "3_meses":
				return new Date(hoje.setMonth(hoje.getMonth() - 3));
			case "12_meses":
				return new Date(hoje.setMonth(hoje.getMonth() - 12));
			default:
				return new Date(0); // Início dos tempos
		}
	};

	/**
	 * Agrupar logs por mês
	 */
	const agruparLogsPorMes = (): void => {
		const grupos = new Map<string, LogComputado[]>();

		logs.value.forEach((log) => {
			const data = new Date(log.created_at);
			const mesKey = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;

			if (!grupos.has(mesKey)) {
				grupos.set(mesKey, []);
			}

			grupos.get(mesKey)!.push(log);
		});

		logsPorMes.value = Array.from(grupos.entries())
			.map(([mes, logsDoMes]) => {
				const [ano, mesNum] = mes.split("-");
				const meses = [
					"Janeiro",
					"Fevereiro",
					"Março",
					"Abril",
					"Maio",
					"Junho",
					"Julho",
					"Agosto",
					"Setembro",
					"Outubro",
					"Novembro",
					"Dezembro",
				];

				const diasAteExclusao = Math.min(
					...logsDoMes.map((l) => l.dias_ate_exclusao).filter((d): d is number => d !== null),
				);

				return {
					mes,
					mes_formatado: `${meses[parseInt(mesNum || "1") - 1]}/${ano}`,
					total: logsDoMes.length,
					dias_ate_exclusao: isFinite(diasAteExclusao) ? diasAteExclusao : null,
					sera_excluido: isFinite(diasAteExclusao) && diasAteExclusao <= 30,
					logs: logsDoMes,
				};
			})
			.sort((a, b) => b.mes.localeCompare(a.mes));
	};

	/**
	 * Buscar estatísticas
	 */
	const buscarEstatisticas = async (): Promise<void> => {
		if (!userStore.establishmentId) return;

		try {
			const { data, error: fetchError } = await supabase
				.from("logs_estabelecimento")
				.select("*")
				.eq("estabelecimento_id", userStore.establishmentId);

			if (fetchError) throw fetchError;

			const logsComputados = (data || []).map(computarLog);

			// Calcular estatísticas
			const porTabela: Record<string, number> = {};
			const porAcao: Record<string, number> = {};
			const porUsuario: Record<string, number> = {};

			logsComputados.forEach((log) => {
				porTabela[log.tabela] = (porTabela[log.tabela] || 0) + 1;
				porAcao[log.acao] = (porAcao[log.acao] || 0) + 1;
				if (log.usuario_nome) {
					porUsuario[log.usuario_nome] = (porUsuario[log.usuario_nome] || 0) + 1;
				}
			});

			const logsProximosExclusao = logsComputados.filter((l) => l.sera_excluido).length;

			const datas = logsComputados.map((l) => new Date(l.created_at));
			const periodoMaisAntigo =
				datas.length > 0 ? new Date(Math.min(...datas.map((d) => d.getTime()))) : null;
			const periodoMaisRecente =
				datas.length > 0 ? new Date(Math.max(...datas.map((d) => d.getTime()))) : null;

			stats.value = {
				total: logsComputados.length,
				por_tabela: porTabela,
				por_acao: porAcao,
				por_usuario: porUsuario,
				logs_proximos_exclusao: logsProximosExclusao,
				periodo_mais_antigo: periodoMaisAntigo?.toISOString() || null,
				periodo_mais_recente: periodoMaisRecente?.toISOString() || null,
			};
		} catch (err) {
			console.error("Erro ao buscar estatísticas:", err);
		}
	};

	/**
	 * Exportar logs para Excel
	 */
	const exportarLogs = async (formato: "excel" | "csv" = "excel"): Promise<void> => {
		try {
			if (logs.value.length === 0) {
				console.warn("Nenhum log para exportar");
				return;
			}

			if (formato === "excel") {
				// Preparar colunas
				const colunas = [
					{ key: "data_hora", label: "Data/Hora", width: 20 },
					{ key: "usuario", label: "Usuário", width: 25 },
					{ key: "cargo", label: "Cargo", width: 15 },
					{ key: "acao", label: "Ação", width: 15 },
					{ key: "tabela", label: "Tabela", width: 20 },
					{ key: "descricao", label: "Descrição", width: 40 },
					{ key: "ip", label: "IP", width: 15 },
				];

				// Preparar dados
				const dados = logs.value.map((log) => ({
					data_hora: new Date(log.created_at).toLocaleString("pt-BR"),
					usuario: log.usuario_nome || "Sistema",
					cargo: log.usuario_cargo || "-",
					acao: LOG_ACOES_DESCRICAO[log.acao] || log.acao,
					tabela: LOG_TABELAS_DESCRICAO[log.tabela] || log.tabela,
					descricao: log.descricao_formatada,
					ip: log.ip_address || "-",
				}));

				// Chamar API para gerar Excel
				const nomeArquivo = `logs-${new Date().toISOString().split("T")[0]}`;

				const response = await $fetch("/api/relatorios/exportar-excel", {
					method: "POST",
					body: {
						titulo: "Logs de Auditoria",
						colunas,
						dados,
						nomeArquivo,
					},
				});

				// Converter resposta para Blob e fazer download
				let blob: Blob;

				if (response instanceof Blob) {
					blob = response;
				} else if (response instanceof ArrayBuffer) {
					blob = new Blob([response], {
						type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
					});
				} else {
					const bufferData = (response as { type?: string; data?: number[] }).data;
					if (bufferData) {
						const uint8Array = new Uint8Array(bufferData);
						blob = new Blob([uint8Array], {
							type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
						});
					} else {
						throw new Error("Formato de resposta inválido");
					}
				}

				// Criar link para download
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement("a");
				link.href = url;
				link.download = `${nomeArquivo}.xlsx`;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				window.URL.revokeObjectURL(url);
			} else if (formato === "csv") {
				// Exportar CSV
				const linhasCSV: string[] = [];

				// Cabeçalho
				linhasCSV.push("Data/Hora,Usuário,Cargo,Ação,Tabela,Descrição,IP");

				// Dados
				logs.value.forEach((log) => {
					const linha = [
						new Date(log.created_at).toLocaleString("pt-BR"),
						log.usuario_nome || "Sistema",
						log.usuario_cargo || "-",
						LOG_ACOES_DESCRICAO[log.acao] || log.acao,
						LOG_TABELAS_DESCRICAO[log.tabela] || log.tabela,
						log.descricao_formatada,
						log.ip_address || "-",
					];

					const linhaFormatada = linha.map((valor) => {
						const valorStr = String(valor);
						if (valorStr.includes(",") || valorStr.includes('"')) {
							return `"${valorStr.replace(/"/g, '""')}"`;
						}
						return valorStr;
					});

					linhasCSV.push(linhaFormatada.join(","));
				});

				const csvContent = linhasCSV.join("\n");

				// Download
				const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
				const url = URL.createObjectURL(blob);
				const link = document.createElement("a");
				link.href = url;
				link.download = `logs-${new Date().toISOString().split("T")[0]}.csv`;
				link.click();
				URL.revokeObjectURL(url);
			}
		} catch (err) {
			console.error("Erro ao exportar logs:", err);
			error.value = "Erro ao exportar logs";
		}
	};

	/**
	 * Atualizar filtros
	 */
	const setFiltros = (novosFiltros: Partial<LogEstabelecimentoFiltros>): void => {
		filtros.value = { ...filtros.value, ...novosFiltros };
		buscarLogs();
	};

	/**
	 * Limpar filtros
	 */
	const limparFiltros = (): void => {
		filtros.value = { periodo: "30_dias" };
		buscarLogs();
	};

	// ⚡ Inicializar com dados do SSR (após declaração das funções)
	if (logsSSR.value.length > 0 && logs.value.length === 0) {
		logs.value = logsSSR.value.map(computarLog);
		agruparLogsPorMes();
	}

	return {
		// Estado
		logs: readonly(logs),
		logsPorMes: readonly(logsPorMes),
		stats: readonly(stats),
		isLoading: readonly(isLoading),
		error: readonly(error),
		filtros: readonly(filtros),

		// Métodos
		buscarLogs,
		buscarEstatisticas,
		exportarLogs,
		setFiltros,
		limparFiltros,
	};
};
