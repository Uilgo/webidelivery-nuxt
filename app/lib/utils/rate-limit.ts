/**
 * 🚦 Sistema de Rate Limiting Client-Side
 *
 * Protege contra spam de requisições e abuso de APIs.
 * Implementa sliding window algorithm para controle preciso.
 *
 * @example
 * ```typescript
 * const limiter = createRateLimiter(10, 60000); // 10 req/min
 *
 * if (!limiter.check('user-action')) {
 *   throw new Error('Muitas requisições. Aguarde.');
 * }
 * ```
 */

export interface RateLimiterOptions {
	/**
	 * Número máximo de requisições permitidas
	 */
	maxRequests: number;

	/**
	 * Janela de tempo em milissegundos
	 */
	windowMs: number;

	/**
	 * Mensagem de erro customizada
	 */
	errorMessage?: string;
}

export interface RateLimiterResult {
	allowed: boolean;
	remaining: number;
	resetAt: number;
	retryAfter?: number;
}

/**
 * Cria um rate limiter com sliding window
 */
export const createRateLimiter = (options: RateLimiterOptions) => {
	const { maxRequests, windowMs, errorMessage } = options;

	// Map para armazenar timestamps de requisições por chave
	const requests = new Map<string, number[]>();

	/**
	 * Limpa requisições antigas da janela
	 */
	const cleanOldRequests = (key: string, now: number): number[] => {
		const userRequests = requests.get(key) || [];
		const validRequests = userRequests.filter((time) => now - time < windowMs);
		requests.set(key, validRequests);
		return validRequests;
	};

	/**
	 * Verifica se a requisição é permitida
	 */
	const check = (key: string): RateLimiterResult => {
		const now = Date.now();
		const validRequests = cleanOldRequests(key, now);

		const allowed = validRequests.length < maxRequests;
		const remaining = Math.max(0, maxRequests - validRequests.length);

		// Calcular quando o rate limit será resetado
		const oldestRequest = validRequests[0];
		const resetAt = oldestRequest ? oldestRequest + windowMs : now + windowMs;

		// Se bloqueado, calcular tempo de espera
		let retryAfter: number | undefined;
		if (!allowed && oldestRequest) {
			retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000); // em segundos
		}

		return {
			allowed,
			remaining,
			resetAt,
			retryAfter,
		};
	};

	/**
	 * Registra uma requisição (só chamar se check() retornar allowed: true)
	 */
	const record = (key: string): void => {
		const now = Date.now();
		const validRequests = cleanOldRequests(key, now);
		validRequests.push(now);
		requests.set(key, validRequests);
	};

	/**
	 * Verifica E registra em uma única operação
	 */
	const attempt = (key: string): RateLimiterResult => {
		const result = check(key);

		if (result.allowed) {
			record(key);
		}

		return result;
	};

	/**
	 * Reseta o rate limit para uma chave específica
	 */
	const reset = (key: string): void => {
		requests.delete(key);
	};

	/**
	 * Limpa TODOS os rate limits
	 */
	const clear = (): void => {
		requests.clear();
	};

	/**
	 * Obtém estatísticas de uma chave
	 */
	const getStats = (key: string) => {
		const now = Date.now();
		const validRequests = cleanOldRequests(key, now);

		return {
			total: validRequests.length,
			remaining: Math.max(0, maxRequests - validRequests.length),
			oldestRequest: validRequests[0] || null,
			newestRequest: validRequests[validRequests.length - 1] || null,
		};
	};

	/**
	 * Wrapper para usar com async functions
	 */
	const wrap = <T>(key: string, fn: () => Promise<T>): Promise<T> => {
		const result = attempt(key);

		if (!result.allowed) {
			const message =
				errorMessage ||
				`Muitas requisições. Aguarde ${result.retryAfter}s antes de tentar novamente.`;
			throw new Error(message);
		}

		return fn();
	};

	return {
		check,
		record,
		attempt,
		reset,
		clear,
		getStats,
		wrap,
	};
};

/**
 * 🎯 Rate Limiters Pré-configurados
 */

/**
 * Rate limiter para ações de pedidos (aceitar, cancelar, etc)
 * Limite: 30 ações por minuto
 */
export const pedidosRateLimiter = createRateLimiter({
	maxRequests: 30,
	windowMs: 60 * 1000, // 1 minuto
	errorMessage: "Muitas ações em pedidos. Aguarde um momento.",
});

/**
 * Rate limiter para atualizações de cardápio
 * Limite: 20 atualizações por minuto
 */
export const cardapioRateLimiter = createRateLimiter({
	maxRequests: 20,
	windowMs: 60 * 1000,
	errorMessage: "Muitas atualizações no cardápio. Aguarde um momento.",
});

/**
 * Rate limiter para login/autenticação
 * Limite: 5 tentativas por 5 minutos
 */
export const authRateLimiter = createRateLimiter({
	maxRequests: 5,
	windowMs: 5 * 60 * 1000, // 5 minutos
	errorMessage: "Muitas tentativas de login. Aguarde 5 minutos.",
});

/**
 * Rate limiter para busca/filtros
 * Limite: 60 requisições por minuto
 */
export const searchRateLimiter = createRateLimiter({
	maxRequests: 60,
	windowMs: 60 * 1000,
	errorMessage: "Muitas buscas. Aguarde um momento.",
});

/**
 * Rate limiter para uploads
 * Limite: 10 uploads por 5 minutos
 */
export const uploadRateLimiter = createRateLimiter({
	maxRequests: 10,
	windowMs: 5 * 60 * 1000,
	errorMessage: "Muitos uploads. Aguarde 5 minutos.",
});

/**
 * Rate limiter genérico para ações administrativas
 * Limite: 100 ações por minuto
 */
export const adminRateLimiter = createRateLimiter({
	maxRequests: 100,
	windowMs: 60 * 1000,
	errorMessage: "Muitas ações. Aguarde um momento.",
});

/**
 * 🔧 Composable para usar rate limiter em componentes Vue
 */
export const useRateLimiter = (options: RateLimiterOptions) => {
	const limiter = createRateLimiter(options);

	/**
	 * Verifica se pode executar ação
	 */
	const canExecute = (key: string): boolean => {
		return limiter.check(key).allowed;
	};

	/**
	 * Executa ação com rate limiting
	 */
	const execute = async <T>(key: string, fn: () => Promise<T>): Promise<T> => {
		return limiter.wrap(key, fn);
	};

	/**
	 * Obtém informações do rate limit
	 */
	const getInfo = (key: string) => {
		const result = limiter.check(key);
		const stats = limiter.getStats(key);

		return {
			...result,
			...stats,
		};
	};

	return {
		canExecute,
		execute,
		getInfo,
		reset: limiter.reset,
		clear: limiter.clear,
	};
};
