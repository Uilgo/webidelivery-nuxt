/**
 * 📌 API Route: Exportar Relatório para Excel
 *
 * Endpoint server-side para gerar arquivos Excel.
 * Usa xlsx-populate apenas no servidor, evitando problemas no browser.
 */

import { serverSupabaseUser } from "#supabase/server";

// Tipos para xlsx-populate (inline para evitar problemas de resolução)
type XlsxCell = {
	value(): string | number | boolean | null;
	value(val: string | number | boolean | null): XlsxCell;
	style(styles: Record<string, unknown>): XlsxCell;
};

type XlsxRange = {
	merged(merged: boolean): XlsxRange;
};

type XlsxColumn = {
	width(width: number): XlsxColumn;
};

type XlsxSheet = {
	name(): string;
	name(name: string): XlsxSheet;
	cell(address: string): XlsxCell;
	column(col: string): XlsxColumn;
	range(address: string): XlsxRange;
};

type XlsxWorkbook = {
	sheet(index: number): XlsxSheet;
	outputAsync(): Promise<Buffer>;
};

type XlsxPopulateModule = {
	default: {
		fromBlankAsync(): Promise<XlsxWorkbook>;
	};
};

interface ExportarExcelBody {
	titulo: string;
	colunas: Array<{ key: string; label: string; width?: number }>;
	dados: Array<Record<string, unknown>>;
	nomeArquivo: string;
}

export default defineEventHandler(async (event) => {
	// 1. Verificar autenticação
	const user = await serverSupabaseUser(event);
	if (!user?.id) {
		throw createError({
			statusCode: 401,
			message: "Não autenticado",
		});
	}

	// 2. Ler body da requisição
	const body = await readBody<ExportarExcelBody>(event);
	const { titulo, colunas, dados, nomeArquivo } = body;

	// 3. Validar dados
	if (!titulo || !colunas || !dados || !nomeArquivo) {
		throw createError({
			statusCode: 400,
			message: "Dados inválidos para exportação",
		});
	}

	try {
		// 4. Import dinâmico de xlsx-populate (apenas no servidor)
		// Tipos definidos inline acima para evitar dependência de @types
		// @ts-ignore - xlsx-populate não tem tipos oficiais
		const XlsxPopulate = (await import("xlsx-populate")) as XlsxPopulateModule;

		// 5. Criar workbook
		const workbook = await XlsxPopulate.default.fromBlankAsync();
		const sheet = workbook.sheet(0);

		// 6. Renomear sheet
		sheet.name(titulo.substring(0, 31)); // Excel limita a 31 caracteres

		let currentRow = 1;

		// 7. Adicionar título
		sheet.cell(`A${currentRow}`).value(titulo).style({
			bold: true,
			fontSize: 14,
			horizontalAlignment: "center",
		});

		// Mesclar células do título
		const lastColumn = String.fromCharCode(64 + colunas.length);
		sheet.range(`A${currentRow}:${lastColumn}${currentRow}`).merged(true);
		currentRow += 2;

		// 8. Adicionar cabeçalhos
		colunas.forEach((coluna, index) => {
			const cellAddress = `${String.fromCharCode(65 + index)}${currentRow}`;
			sheet.cell(cellAddress).value(coluna.label).style({
				bold: true,
				fill: "E0E0E0",
				horizontalAlignment: "center",
			});

			// Definir largura da coluna
			if (coluna.width) {
				sheet.column(String.fromCharCode(65 + index)).width(coluna.width);
			}
		});
		currentRow++;

		// 9. Adicionar dados
		dados.forEach((linha) => {
			colunas.forEach((coluna, colIndex) => {
				const cellAddress = `${String.fromCharCode(65 + colIndex)}${currentRow}`;
				const valor = linha[coluna.key];

				// Converter valor para tipo aceito pelo Excel
				let valorFormatado: string | number | boolean | null = null;
				if (typeof valor === "string" || typeof valor === "number" || typeof valor === "boolean") {
					valorFormatado = valor;
				} else if (valor !== null && valor !== undefined) {
					valorFormatado = String(valor);
				}

				sheet.cell(cellAddress).value(valorFormatado);
			});
			currentRow++;
		});

		// 10. Gerar buffer do Excel
		const buffer = await workbook.outputAsync();

		// 11. Retornar arquivo
		setResponseHeaders(event, {
			"Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			"Content-Disposition": `attachment; filename="${nomeArquivo}.xlsx"`,
		});

		return buffer;
	} catch (error) {
		console.error("Erro ao gerar Excel:", error);
		throw createError({
			statusCode: 500,
			message: "Erro ao gerar arquivo Excel",
		});
	}
});
