/**
 * �️ Sistema de Cache com TTL (Time To Live)
 *
 * Utilitário para cachear dados que mudam pouco, reduzindo requisições ao banco.
 * Ideal para:
 * - Configurações do estabelecimento
 * - Lista de categorias
 * - Dados de perfil do usuário
 * - Estatísticas que não precisam ser real-time
 *
 * IMPORTANTE: Dados são cacheados no servidor (SSR) e no cliente.
 */

export interface CacheEntry<T> {
	data: T;
	timestamp: number;
	ttl: number;
}

export interface CacheOptions {
	/**
	 * Tempo de vida do cache em milissegundos
	 * @default 5 * 60 * 1000 (5 minutos)
	 */
	ttl?: number;

	/**
	 * Chave única para o cache
	 */
	key: string;

	/**
	 * Se true, força atualização mesmo com cache válido
	 * @default false
	 */
	forceRefresh?: boolean;
}

/**
 * Hook para usar cache com TTL
 *
 * @example
 * ```typescript
 * const { data, refresh, isExpired } = useCachedData({
 *   key: 'estabelecimento-config',
 *   ttl: 5 * 60 * 1000, // 5 minutos
 * });
 *
 * // Buscar dados (usa cache se válido)
 * if (!data.value || isExpired()) {
 *   data.value = await fetchData();
 * }
 *
 * // Forçar refresh
 * await refresh(async () => await fetchData());
 * ```
 */
export const useCachedData = <T>(options: CacheOptions) => {
	const { key, ttl = 5 * 60 * 1000, forceRefresh = false } = options;

	// Estado global compartilhado
	const cacheEntry = useState<CacheEntry<T> | null>(`cache:${key}`, () => null);

	/**
	 * Verifica se o cache expirou
	 */
	const isExpired = (): boolean => {
		if (!cacheEntry.value) return true;
		const now = Date.now();
		const age = now - cacheEntry.value.timestamp;
		return age > cacheEntry.value.ttl;
	};

	/**
	 * Verifica se o cache é válido
	 */
	const isValid = (): boolean => {
		return !forceRefresh && cacheEntry.value !== null && !isExpired();
	};

	/**
	 * Atualiza o cache com novos dados
	 */
	const set = (data: T): void => {
		cacheEntry.value = {
			data,
			timestamp: Date.now(),
			ttl,
		};
	};

	/**
	 * Obtém os dados do cache (ou null se inválido)
	 */
	const get = (): T | null => {
		if (isValid()) {
			return cacheEntry.value!.data;
		}
		return null;
	};

	/**
	 * Limpa o cache
	 */
	const clear = (): void => {
		cacheEntry.value = null;
	};

	/**
	 * Refresh com função de fetch
	 */
	const refresh = async (fetchFn: () => Promise<T>): Promise<T> => {
		const data = await fetchFn();
		set(data);
		return data;
	};

	/**
	 * Obtém dados (do cache ou busca novos)
	 */
	const getOrFetch = async (fetchFn: () => Promise<T>): Promise<T> => {
		const cached = get();
		if (cached !== null) {
			return cached;
		}
		return refresh(fetchFn);
	};

	/**
	 * Tempo restante até expiração (em ms)
	 */
	const timeToExpire = computed((): number => {
		if (!cacheEntry.value) return 0;
		const age = Date.now() - cacheEntry.value.timestamp;
		const remaining = cacheEntry.value.ttl - age;
		return Math.max(0, remaining);
	});

	/**
	 * Tempo restante formatado
	 */
	const timeToExpireFormatted = computed((): string => {
		const ms = timeToExpire.value;
		if (ms === 0) return "Expirado";

		const seconds = Math.floor(ms / 1000);
		const minutes = Math.floor(seconds / 60);

		if (minutes > 0) {
			return `${minutes}min ${seconds % 60}s`;
		}
		return `${seconds}s`;
	});

	return {
		// Estado
		data: computed(() => cacheEntry.value?.data ?? null),
		cacheEntry: readonly(cacheEntry),

		// Métodos
		get,
		set,
		clear,
		refresh,
		getOrFetch,

		// Verificações
		isValid,
		isExpired,

		// Informações
		timeToExpire,
		timeToExpireFormatted,
	};
};

/**
 * Utilitário simples para cache síncrono
 *
 * @example
 * ```typescript
 * const cache = createSimpleCache<User>({ ttl: 60000 });
 *
 * cache.set('user-123', userData);
 * const user = cache.get('user-123');
 * ```
 */
export const createSimpleCache = <T>(options: { ttl: number }) => {
	const store = new Map<string, CacheEntry<T>>();

	const isExpired = (entry: CacheEntry<T>): boolean => {
		const age = Date.now() - entry.timestamp;
		return age > entry.ttl;
	};

	return {
		get(key: string): T | null {
			const entry = store.get(key);
			if (!entry) return null;

			if (isExpired(entry)) {
				store.delete(key);
				return null;
			}

			return entry.data;
		},

		set(key: string, data: T): void {
			store.set(key, {
				data,
				timestamp: Date.now(),
				ttl: options.ttl,
			});
		},

		has(key: string): boolean {
			const entry = store.get(key);
			if (!entry) return false;
			if (isExpired(entry)) {
				store.delete(key);
				return false;
			}
			return true;
		},

		delete(key: string): void {
			store.delete(key);
		},

		clear(): void {
			store.clear();
		},

		size(): number {
			// Limpar entradas expiradas antes de contar
			for (const [key, entry] of store.entries()) {
				if (isExpired(entry)) {
					store.delete(key);
				}
			}
			return store.size;
		},
	};
};

/**
 * ⚡ Cria um cache com TTL para uso em plugins server-side
 *
 * Versão simplificada e otimizada para SSR.
 * Usa useState do Nuxt para compartilhar cache entre requisições.
 *
 * @example
 * ```typescript
 * const cache = createCacheWithTTL<User[]>('users-list', 5 * 60 * 1000);
 *
 * const users = await cache.get(async () => {
 *   const { data } = await supabase.from('users').select('*');
 *   return data || [];
 * });
 * ```
 */
export const createCacheWithTTL = <T>(key: string, ttl: number) => {
	const cache = useState<{ data: T | null; timestamp: number }>(`cache-${key}`, () => ({
		data: null,
		timestamp: 0,
	}));

	return {
		/**
		 * Obtém dados do cache ou executa fetcher se expirado
		 */
		async get(fetcher: () => Promise<T>): Promise<T> {
			const now = Date.now();
			const isExpired = now - cache.value.timestamp > ttl;

			// Se cache válido, retorna
			if (!isExpired && cache.value.data !== null) {
				return cache.value.data;
			}

			// Busca novos dados
			const data = await fetcher();
			cache.value = { data, timestamp: now };
			return data;
		},

		/**
		 * Limpa o cache
		 */
		clear() {
			cache.value = { data: null, timestamp: 0 };
		},

		/**
		 * Verifica se o cache é válido
		 */
		isValid(): boolean {
			const now = Date.now();
			const isExpired = now - cache.value.timestamp > ttl;
			return !isExpired && cache.value.data !== null;
		},
	};
};

/**
 * 🔒 Limpa TODO o cache do sistema
 *
 * CRÍTICO: Usar ao fazer logout para evitar vazamento de dados entre usuários.
 * Também usado antes do login para garantir sessão limpa.
 *
 * @example
 * ```typescript
 * // Ao fazer logout
 * clearAllCache();
 * await supabase.auth.signOut();
 * ```
 */
export const clearAllCache = (): void => {
	if (import.meta.client) {
		// Limpar todos os estados de cache do Nuxt
		clearNuxtState();
	}
};
