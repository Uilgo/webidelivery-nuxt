/**
 * 📌 Declaração de tipos para xlsx-populate
 *
 * Tipos mínimos necessários para o uso da biblioteca.
 */

declare module "xlsx-populate" {
	interface Cell {
		value(): string | number | boolean | null;
		value(val: string | number | boolean | null): Cell;
		style(styles: Record<string, unknown>): Cell;
	}

	interface Column {
		width(width: number): Column;
	}

	interface Sheet {
		name(): string;
		name(name: string): Sheet;
		cell(address: string): Cell;
		column(col: string): Column;
	}

	interface Workbook {
		sheet(index: number | string): Sheet;
		outputAsync(): Promise<Blob>;
	}

	interface XlsxPopulate {
		fromBlankAsync(): Promise<Workbook>;
		fromFileAsync(path: string): Promise<Workbook>;
		fromDataAsync(data: ArrayBuffer | Buffer): Promise<Workbook>;
	}

	const xlsxPopulate: XlsxPopulate;
	export default xlsxPopulate;
}
