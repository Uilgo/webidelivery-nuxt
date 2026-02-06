/**
 * 📌 Declaração de tipos para xlsx-populate (Server-side)
 *
 * Tipos mínimos necessários para o uso da biblioteca no servidor.
 */

declare module "xlsx-populate" {
	interface Cell {
		value(): string | number | boolean | null;
		value(val: string | number | boolean | null): Cell;
		style(styles: Record<string, unknown>): Cell;
	}

	interface Range {
		merged(merged: boolean): Range;
		style(styles: Record<string, unknown>): Range;
	}

	interface Column {
		width(width: number): Column;
	}

	interface Sheet {
		name(): string;
		name(name: string): Sheet;
		cell(address: string): Cell;
		column(col: string): Column;
		range(address: string): Range;
	}

	interface Workbook {
		sheet(index: number | string): Sheet;
		outputAsync(): Promise<Buffer>;
	}

	interface XlsxPopulate {
		fromBlankAsync(): Promise<Workbook>;
		fromFileAsync(path: string): Promise<Workbook>;
		fromDataAsync(data: ArrayBuffer | Buffer): Promise<Workbook>;
	}

	const xlsxPopulate: XlsxPopulate;
	export default xlsxPopulate;
}
