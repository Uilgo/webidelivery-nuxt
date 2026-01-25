/**
 * 📌 useRelatoriosExportar
 *
 * Composable para gerenciar exportação de relatórios (PDF, Excel, CSV).
 * Suporta exportação de dados tabulares e gráficos.
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

	/**
	 * Exporta dados para Excel
	 */
	const exportarExcel = async (dados: DadosExportacao, opcoes: OpcoesExportacao): Promise<void> => {
		// Import dinâmico de xlsx-populate (apenas quando necessário)
		// Isso evita erro "Buffer is not defined" no browser durante inicialização
		const XlsxPopulate = await import("xlsx-populate");

		// Criar workbook
		const workbook = await XlsxPopulate.default.fromBlankAsync();
		const sheet = workbook.sheet(0);

		// Renomear sheet
		sheet.name(dados.titulo.substring(0, 31)); // Excel limita a 31 caracteres

		let currentRow = 1;

		// Adicionar título
		sheet.cell(`A${currentRow}`).value(dados.titulo).style({
			bold: true,
			fontSize: 16,
		});
		currentRow += 2;

		// Adicionar período
		if (dados.periodo) {
			sheet.cell(`A${currentRow}`).value(`Período: ${dados.periodo}`).style({
				italic: true,
			});
			currentRow += 2;
		}

		// Adicionar tabelas
		if (opcoes.incluir_tabelas && dados.tabelas && dados.tabelas.length > 0) {
			for (const tabela of dados.tabelas) {
				// Cabeçalhos
				tabela.colunas.forEach((coluna, index) => {
					const cellAddress = `${String.fromCharCode(65 + index)}${currentRow}`;
					const cell = sheet.cell(cellAddress);
					cell.value(coluna);
					cell.style({
						bold: true,
						fill: "3b82f6", // Azul primário
						fontColor: "ffffff",
						horizontalAlignment: "center",
					});
				});
				currentRow++;

				// Dados
				tabela.linhas.forEach((linha) => {
					linha.forEach((valor, index) => {
						const cellAddress = `${String.fromCharCode(65 + index)}${currentRow}`;
						sheet.cell(cellAddress).value(valor);
					});
					currentRow++;
				});

				currentRow += 2; // Espaço entre tabelas
			}
		}

		// Ajustar largura das colunas
		if (dados.tabelas && dados.tabelas.length > 0) {
			const primeiraTabela = dados.tabelas[0];
			if (primeiraTabela) {
				primeiraTabela.colunas.forEach((_, index) => {
					const colLetter = String.fromCharCode(65 + index);
					sheet.column(colLetter).width(15);
				});
			}
		}

		// Salvar arquivo
		const nomeArquivo = opcoes.nome_arquivo || gerarNomeArquivo("excel");
		const blob = await workbook.outputAsync();

		// Download no browser
		if (import.meta.client) {
			const url = URL.createObjectURL(blob as Blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = nomeArquivo;
			link.click();
			URL.revokeObjectURL(url);
		}
	};

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
