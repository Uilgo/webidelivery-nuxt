import { defineEventHandler, getQuery } from "h3";

// Helper de datas (simples)
const hoje = new Date();
const ontem = new Date(hoje);
ontem.setDate(ontem.getDate() - 1);
const semanaPassada = new Date(hoje);
semanaPassada.setDate(semanaPassada.getDate() - 7);

// Mock de Pedidos
const pedidos = [
	// HOJE: ~20 pedidos mistos
	...Array.from({ length: 15 }, (_, i) => ({
		id: `ord_${1000 + i}`,
		numero: 1000 + i,
		status: i < 3 ? "pendente" : i < 6 ? "preparo" : i < 10 ? "entrega" : "concluido",
		total: 45.9 + i * 5,
		created_at: new Date(hoje.getTime() - i * 1000 * 60 * 30).toISOString(), // A cada 30 min
		aceito_em: new Date(hoje.getTime() - i * 1000 * 60 * 25).toISOString(),
		pronto_em: i >= 6 ? new Date(hoje.getTime() - i * 1000 * 60 * 10).toISOString() : null,
		cliente: { nome: `Cliente ${i}` },
	})),
	// ONTEM: ~20 pedidos concluídos
	...Array.from({ length: 20 }, (_, i) => ({
		id: `ord_old_${i}`,
		numero: 900 + i,
		status: "concluido",
		total: 40.0 + i * 2,
		created_at: new Date(ontem.getTime() - i * 1000 * 60 * 20).toISOString(),
		aceito_em: new Date(ontem.getTime() - i * 1000 * 60 * 15).toISOString(),
		pronto_em: new Date(ontem.getTime() - i * 1000 * 60 * 5).toISOString(),
		cliente: { nome: `Cliente Ontem ${i}` },
	})),
	// SEMANA PASSADA: ~15 pedidos
	...Array.from({ length: 15 }, (_, i) => ({
		id: `ord_week_${i}`,
		numero: 800 + i,
		status: "concluido",
		total: 55.0,
		created_at: new Date(semanaPassada.getTime() - i * 1000 * 60 * 60).toISOString(),
		cliente: { nome: `Cliente Week ${i}` },
	})),
	// ALGUNS CANCELADOS
	{
		id: "ord_canc_1",
		numero: 999,
		status: "cancelado",
		total: 80,
		created_at: hoje.toISOString(),
		cliente: { nome: "Cancelador" },
	},
	{
		id: "ord_canc_2",
		numero: 998,
		status: "cancelado",
		total: 60,
		created_at: ontem.toISOString(),
		cliente: { nome: "Cancelador 2" },
	},
];

export default defineEventHandler((event) => {
	const query = getQuery(event);
	const dataInicio = query.data_inicio ? new Date(query.data_inicio as string) : null;
	const dataFim = query.data_fim ? new Date(query.data_fim as string) : null;

	let resultado = pedidos;

	if (dataInicio && dataFim) {
		resultado = pedidos.filter((p) => {
			const d = new Date(p.created_at);
			return d >= dataInicio && d <= dataFim;
		});
	} else if (dataInicio) {
		resultado = pedidos.filter((p) => {
			const d = new Date(p.created_at);
			return d >= dataInicio;
		});
	}

	return resultado;
});
