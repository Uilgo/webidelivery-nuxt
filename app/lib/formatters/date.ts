/**
 * 📌 Formatadores de Data e Hora
 *
 * Funções para formatação de datas, horas e timestamps.
 * Todas as funções aceitam timestamptz (string ISO) do Postgres.
 */

/**
 * Formata data completa com hora
 *
 * @param date - Timestamptz (string ISO) do Postgres
 * @returns String formatada (ex: "25/01/2024 14:30")
 *
 * @example
 * formatDateTime("2024-01-25T14:30:00.000Z") // "25/01/2024 14:30"
 */
export const formatDateTime = (date: string): string => {
	return new Date(date).toLocaleString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

/**
 * Formata apenas a data (sem hora)
 *
 * @param date - Timestamptz (string ISO) do Postgres
 * @returns String formatada (ex: "25/01/2024")
 *
 * @example
 * formatDate("2024-01-25T14:30:00.000Z") // "25/01/2024"
 */
export const formatDate = (date: string): string => {
	return new Date(date).toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
};

/**
 * Formata apenas a hora
 *
 * @param date - Timestamptz (string ISO) do Postgres
 * @returns String formatada (ex: "14:30")
 *
 * @example
 * formatTime("2024-01-25T14:30:00.000Z") // "14:30"
 */
export const formatTime = (date: string): string => {
	return new Date(date).toLocaleTimeString("pt-BR", {
		hour: "2-digit",
		minute: "2-digit",
	});
};

/**
 * Formata data de forma relativa (há X minutos/horas/dias)
 *
 * @param date - Timestamptz (string ISO) do Postgres
 * @returns String formatada (ex: "Há 5 minutos", "Há 2 horas")
 *
 * @example
 * formatRelativeTime("2024-01-25T14:25:00.000Z") // "Há 5 minutos" (se agora for 14:30)
 */
export const formatRelativeTime = (date: string): string => {
	const now = new Date();
	const dateObj = new Date(date);
	const diffMs = now.getTime() - dateObj.getTime();
	const diffMinutes = Math.floor(diffMs / 60000);

	if (diffMinutes < 1) {
		return "Agora mesmo";
	}

	if (diffMinutes < 60) {
		return `Há ${diffMinutes} minuto${diffMinutes > 1 ? "s" : ""}`;
	}

	const diffHours = Math.floor(diffMinutes / 60);
	if (diffHours < 24) {
		return `Há ${diffHours} hora${diffHours > 1 ? "s" : ""}`;
	}

	const diffDays = Math.floor(diffHours / 24);
	return `Há ${diffDays} dia${diffDays > 1 ? "s" : ""}`;
};

/**
 * Formata data de forma curta (ex: "Hoje", "Ontem", "25/01")
 *
 * @param date - Timestamptz (string ISO) do Postgres
 * @returns String formatada
 *
 * @example
 * formatShortDate("2024-01-25T14:30:00.000Z") // "Hoje" (se for hoje)
 * formatShortDate("2024-01-24T14:30:00.000Z") // "Ontem" (se for ontem)
 * formatShortDate("2024-01-20T14:30:00.000Z") // "20/01"
 */
export const formatShortDate = (date: string): string => {
	const dateObj = new Date(date);
	const today = new Date();
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);

	// Zera as horas para comparação
	const dateOnly = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
	const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	const yesterdayOnly = new Date(
		yesterday.getFullYear(),
		yesterday.getMonth(),
		yesterday.getDate(),
	);

	if (dateOnly.getTime() === todayOnly.getTime()) {
		return "Hoje";
	}

	if (dateOnly.getTime() === yesterdayOnly.getTime()) {
		return "Ontem";
	}

	return dateObj.toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
	});
};

/**
 * Formata duração em minutos para formato legível
 *
 * @param minutes - Duração em minutos
 * @returns String formatada (ex: "1h 30min", "45min")
 *
 * @example
 * formatDuration(90) // "1h 30min"
 * formatDuration(45) // "45min"
 */
export const formatDuration = (minutes: number): string => {
	if (minutes < 60) {
		return `${minutes}min`;
	}

	const hours = Math.floor(minutes / 60);
	const remainingMinutes = minutes % 60;

	if (remainingMinutes === 0) {
		return `${hours}h`;
	}

	return `${hours}h ${remainingMinutes}min`;
};
