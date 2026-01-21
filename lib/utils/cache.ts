/**
 * 📌 Utilitários de Cache
 *
 * Funções centralizadas para gerenciar cache do localStorage
 * CRÍTICO para segurança: evita vazamento de dados entre usuários
 */

/**
 * Lista de todas as chaves de cache usadas no sistema
 */
const CACHE_KEYS = [
	// Cardápio
	"cardapio_categorias",
	"cardapio_produtos",
	"cardapio_adicionais",
	"cardapio_grupos_adicionais",
	"cardapio_combos",
	// Pedidos
	"pedidos_cache",
	// Dashboard
	"dashboard_cache",
	// Marketing
	"marketing_cupons",
	"marketing_banners",
	"marketing_promocoes",
] as const;

/**
 * Limpa TODO o cache do localStorage
 * DEVE ser chamado em:
 * - Logout
 * - Login (antes de autenticar)
 * - Troca de estabelecimento
 */
export const clearAllCache = (): void => {
	if (typeof window === "undefined") return;

	try {
		// Limpar chaves conhecidas
		CACHE_KEYS.forEach((key) => {
			localStorage.removeItem(key);
		});

		// Limpar qualquer chave que comece com prefixos conhecidos
		const keysToRemove: string[] = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (
				key &&
				(key.startsWith("cardapio_") ||
					key.startsWith("pedidos_") ||
					key.startsWith("dashboard_") ||
					key.startsWith("marketing_"))
			) {
				keysToRemove.push(key);
			}
		}
		keysToRemove.forEach((key) => localStorage.removeItem(key));
	} catch (error) {
		console.error("[Cache] Erro ao limpar cache:", error);
	}
};

/**
 * Limpa cache de uma categoria específica
 */
export const clearCacheByPrefix = (prefix: string): void => {
	if (typeof window === "undefined") return;

	try {
		const keysToRemove: string[] = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key && key.startsWith(prefix)) {
				keysToRemove.push(key);
			}
		}
		keysToRemove.forEach((key) => localStorage.removeItem(key));
	} catch (error) {
		console.error(`[Cache] Erro ao limpar cache com prefixo "${prefix}":`, error);
	}
};

/**
 * Valida se os dados em cache pertencem ao estabelecimento correto
 */
export const validateCacheEstabelecimento = <T extends { estabelecimento_id?: string }>(
	data: T[],
	estabelecimentoId: string,
): T[] => {
	return data.filter((item) => item.estabelecimento_id === estabelecimentoId);
};
