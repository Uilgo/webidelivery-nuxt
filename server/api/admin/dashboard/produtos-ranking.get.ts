import { defineEventHandler } from "h3";

const produtos = [
	{ id: "1", nome: "X-Bacon Especial", quantidade: 145, valor_total: 4350.0, percentual: 28 },
	{ id: "2", nome: "Coca-Cola 2L", quantidade: 98, valor_total: 1176.0, percentual: 18 },
	{ id: "3", nome: "Batata Frita G", quantidade: 85, valor_total: 1700.0, percentual: 15 },
	{ id: "4", nome: "Açaí 500ml", quantidade: 62, valor_total: 1240.0, percentual: 12 },
	{ id: "5", nome: "Pizza Calabresa", quantidade: 40, valor_total: 2400.0, percentual: 8 },
];

export default defineEventHandler(() => {
	// Simplesmente retorna o mock estático
	// Pode aplicar filtros de limit/order se necessário futuramente
	return produtos;
});
