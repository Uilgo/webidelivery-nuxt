/**
 * 📌 useRelatoriosExportar
 *
 * Composable para gerenciar exportação de relatórios (PDF, Excel, CSV).
 * Suporta exportação de dados tabulares e gráficos.
 *
 * Excel é gerado via API server-side para evitar problemas com módulos Node.js no browser.
 */

import type { OpcoesExportacao } from "../types/relatorios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ========================================
// TIPOS INTERNOS
// ========================================

interface DadosTabela {
	readonly colunas: readonly string[];
	readonly linhas: readonly (readonly (string | number)[])[];
}

interface DadosExportacao {
	readonly titulo: string;
	readonly tabelas?: readonly DadosTabela[];
	readonly graficos?: readonly {
		readonly titulo: string;
		readonly imagemBase64: string;
	}[];
	readonly periodo?: string;
}

// ========================================
// COMPOSABLE
// ========================================

export const useRelatoriosExportar = () => {
	// ========================================
	// ESTADO
	// ========================================

	const exportando = useState<boolean>("relatorios.exportar.loading", () => false);
	const erro = useState<string | null>("relatorios.exportar.erro", () => null);

	// ========================================
	// MÉTODOS DE EXPORTAÇÃO PDF
	// ========================================

	/**
	 * Exporta dados para PDF
	 */
	const exportarPDF = async (dados: DadosExportacao, opcoes: OpcoesExportacao): Promise<void> => {
		const orientacao = opcoes.orientacao === "paisagem" ? "landscape" : "portrait";
		const doc = new jsPDF({
			orientation: orientacao,
			unit: "mm",
			format: "a4",
		});

		let yPosition = 20;

		// Adicionar título
		doc.setFontSize(18);
		doc.setFont("helvetica", "bold");
		doc.text(dados.titulo, 15, yPosition);
		yPosition += 10;

		// Adicionar período
		if (dados.periodo) {
			doc.setFontSize(10);
			doc.setFont("helvetica", "normal");
			doc.text(`Período: ${dados.periodo}`, 15, yPosition);
			yPosition += 10;
		}

		// Adicionar gráficos (se incluídos)
		if (opcoes.incluir_graficos && dados.graficos && dados.graficos.length > 0) {
			for (const grafico of dados.graficos) {
				// Verificar se precisa de nova página
				if (yPosition > 250) {
					doc.addPage();
					yPosition = 20;
				}

				// Título do gráfico
				doc.setFontSize(12);
				doc.setFont("helvetica", "bold");
				doc.text(grafico.titulo, 15, yPosition);
				yPosition += 5;

				// Adicionar imagem do gráfico
				try {
					doc.addImage(grafico.imagemBase64, "PNG", 15, yPosition, 180, 100);
					yPosition += 110;
				} catch (error) {
					console.error("Erro ao adicionar gráfico:", error);
				}
			}
		}

		// Adicionar tabelas (se incluídas)
		if (opcoes.incluir_tabelas && dados.tabelas && dados.tabelas.length > 0) {
			for (const tabela of dados.tabelas) {
				// Verificar se precisa de nova página
				if (yPosition > 250) {
					doc.addPage();
					yPosition = 20;
				}

				autoTable(doc, {
					head: [tabela.colunas as string[]],
					body: tabela.linhas as (string | number)[][],
					startY: yPosition,
					theme: "grid",
					headStyles: {
						fillColor: [59, 130, 246], // Azul primário
						textColor: [255, 255, 255],
						fontStyle: "bold",
					},
					styles: {
						fontSize: 9,
						cellPadding: 3,
					},
					margin: { left: 15, right: 15 },
				});

				// Atualizar posição Y após a tabela
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const finalY = (doc as any).lastAutoTable?.finalY || yPosition;
				yPosition = finalY + 10;
			}
		}

		// Salvar PDF
		const nomeArquivo = opcoes.nome_arquivo || gerarNomeArquivo("pdf");
		doc.save(nomeArquivo);
	};

	// ========================================
	// MÉTODOS DE EXPORTAÇÃO EXCEL
	// ========================================

	/**
	 * Exporta dados para Excel via API server-side
	 *
	 * Usa API route para gerar Excel no servidor, evitando problemas
	 * com módulos Node.js (fs, crypto, stream) no browser.
	 */
	const exportarExcel = async (dados: DadosExportacao, opcoes: OpcoesExportacao): Promise<void> => {
		try {
			exportando.value = true;
			erro.value = null;

			// Preparar dados para enviar à API
			const colunas: Array<{ key: string; label: string; width?: number }> = [];
			const linhasFormatadas: Array<Record<string, unknown>> = [];

			// Processar primeira tabela (se houver)
			if (dados.tabelas && dados.tabelas.length > 0) {
				const tabela = dados.tabelas[0];

				// Verificar se a tabela existe
				if (!tabela) {
					throw new Error("Tabela inválida para exportação");
				}

				// Criar colunas
				tabela.colunas.forEach((coluna, index) => {
					colunas.push({
						key: `col_${index}`,
						label: coluna,
						width: 15,
					});
				});

				// Criar linhas
				tabela.linhas.forEach((linha) => {
					const linhaObj: Record<string, unknown> = {};
					linha.forEach((valor, index) => {
						linhaObj[`col_${index}`] = valor;
					});
					linhasFormatadas.push(linhaObj);
				});
			}

			// Chamar API para gerar Excel
			const nomeArquivo = opcoes.nome_arquivo?.replace(".xlsx", "") || gerarNomeArquivo("excel");

			const response = await $fetch("/api/relatorios/exportar-excel", {
				method: "POST",
				body: {
					titulo: dados.titulo,
					colunas,
					dados: linhasFormatadas,
					nomeArquivo,
				},
			});

			// Converter resposta para Blob
			// A API retorna um Buffer que precisa ser convertido
			let blob: Blob;

			if (response instanceof Blob) {
				blob = response;
			} else if (response instanceof ArrayBuffer) {
				blob = new Blob([response], {
					type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				});
			} else {
				// Se vier como objeto com data array (Buffer serializado)
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
		} catch (error) {
			console.error("Erro ao exportar Excel:", error);
			erro.value = "Erro ao exportar para Excel";
			throw error;
		} finally {
			exportando.value = false;
		}
	};

	// ========================================
	// MÉTODOS DE EXPORTAÇÃO CSV
	// ========================================

	/**
	 * Exporta dados para CSV
	 */
	const exportarCSV = (dados: DadosExportacao, opcoes: OpcoesExportacao): void => {
		if (!dados.tabelas || dados.tabelas.length === 0) {
			throw new Error("Nenhuma tabela disponível para exportar");
		}

		// Usar primeira tabela
		const tabela = dados.tabelas[0];
		if (!tabela) {
			throw new Error("Tabela inválida para exportação");
		}

		// Criar CSV
		const linhasCSV: string[] = [];

		// Cabeçalho
		linhasCSV.push(tabela.colunas.join(","));

		// Dados
		tabela.linhas.forEach((linha) => {
			const linhaFormatada = linha.map((valor) => {
				// Escapar valores com vírgula ou aspas
				const valorStr = String(valor);
				if (valorStr.includes(",") || valorStr.includes('"')) {
					return `"${valorStr.replace(/"/g, '""')}"`;
				}
				return valorStr;
			});
			linhasCSV.push(linhaFormatada.join(","));
		});

		const csvContent = linhasCSV.join("\n");

		// Download no browser
		if (import.meta.client) {
			const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = opcoes.nome_arquivo || gerarNomeArquivo("csv");
			link.click();
			URL.revokeObjectURL(url);
		}
	};

	// ========================================
	// MÉTODO PRINCIPAL
	// ========================================

	/**
	 * Exporta relatório no formato especificado
	 */
	const exportar = async (opcoes: OpcoesExportacao, dados: DadosExportacao): Promise<void> => {
		exportando.value = true;
		erro.value = null;

		try {
			switch (opcoes.tipo) {
				case "pdf":
					await exportarPDF(dados, opcoes);
					break;
				case "excel":
					await exportarExcel(dados, opcoes);
					break;
				case "csv":
					exportarCSV(dados, opcoes);
					break;
				default:
					throw new Error(`Formato de exportação não suportado: ${opcoes.tipo}`);
			}
		} catch (error) {
			erro.value = error instanceof Error ? error.message : "Erro ao exportar relatório";
			throw error;
		} finally {
			exportando.value = false;
		}
	};

	// ========================================
	// MÉTODOS AUXILIARES
	// ========================================

	/**
	 * Gera nome do arquivo baseado no tipo e data atual
	 */
	const gerarNomeArquivo = (tipo: "pdf" | "excel" | "csv"): string => {
		const dataAtual = new Date().toISOString().split("T")[0];
		const extensao = tipo === "excel" ? "xlsx" : tipo;
		return `relatorio-${dataAtual}.${extensao}`;
	};

	/**
	 * Valida se os dados podem ser exportados
	 */
	const podeExportar = (dados: DadosExportacao): boolean => {
		if (!dados) return false;
		if (dados.tabelas && dados.tabelas.length > 0) return true;
		if (dados.graficos && dados.graficos.length > 0) return true;
		return false;
	};

	/**
	 * Converte elemento canvas de gráfico para base64
	 */
	const graficoParaBase64 = (canvasElement: HTMLCanvasElement): string => {
		return canvasElement.toDataURL("image/png");
	};

	// ========================================
	// RETORNO
	// ========================================

	return {
		// Estado
		exportando: readonly(exportando),
		erro: readonly(erro),

		// Métodos
		exportar,
		podeExportar,
		gerarNomeArquivo,
		graficoParaBase64,
	};
};
