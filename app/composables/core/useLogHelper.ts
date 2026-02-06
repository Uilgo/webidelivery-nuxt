/**
 * 📌 useLogHelper
 *
 * Composable helper para facilitar o registro de logs em todo o sistema.
 * Centraliza a lógica de captura de IP, User Agent e chamada às funções do banco.
 */

export const useLogHelper = () => {
	const supabase = useSupabaseClient();
	const userStore = useUserStore();

	/**
	 * Captura IP do usuário (client-side aproximado)
	 */
	const getClientIP = (): string => {
		// No client-side, não temos acesso direto ao IP real
		// Retorna placeholder que será substituído no server-side se necessário
		return "client";
	};

	/**
	 * Captura User Agent do navegador
	 */
	const getUserAgent = (): string => {
		if (import.meta.client) {
			return navigator.userAgent;
		}
		return "server";
	};

	/**
	 * Registra log operacional do estabelecimento
	 */
	const registrarLogEstabelecimento = async (params: {
		acao: string;
		tabela: string;
		registro_id?: string;
		dados_anteriores?: Record<string, unknown>;
		dados_novos?: Record<string, unknown>;
		metadata?: Record<string, unknown>;
	}): Promise<void> => {
		try {
			if (!userStore.establishmentId || !userStore.authUser?.id) {
				console.warn("Usuário ou estabelecimento não identificado para log");
				return;
			}

			await supabase.rpc("fn_registrar_log_estabelecimento", {
				p_estabelecimento_id: userStore.establishmentId,
				p_usuario_id: userStore.authUser.id,
				p_acao: params.acao,
				p_tabela: params.tabela,
				p_registro_id: params.registro_id || null,
				p_dados_anteriores: params.dados_anteriores || null,
				p_dados_novos: params.dados_novos || null,
				p_ip_address: getClientIP(),
				p_user_agent: getUserAgent(),
				p_metadata: params.metadata || {},
			});
		} catch (error) {
			console.error("Erro ao registrar log estabelecimento:", error);
		}
	};

	/**
	 * Registra log da plataforma (segurança, operacional, analytics)
	 */
	const registrarLogPlataforma = async (params: {
		acao: string;
		categoria: "seguranca" | "operacional" | "analytics";
		estabelecimento_id?: string;
		tabela?: string;
		registro_id?: string;
		dados_anteriores?: Record<string, unknown>;
		dados_novos?: Record<string, unknown>;
		metadata?: Record<string, unknown>;
	}): Promise<void> => {
		try {
			if (!userStore.authUser?.id) {
				console.warn("Usuário não identificado para log plataforma");
				return;
			}

			await supabase.rpc("fn_registrar_log_plataforma", {
				p_usuario_id: userStore.authUser.id,
				p_acao: params.acao,
				p_categoria: params.categoria,
				p_estabelecimento_id: params.estabelecimento_id || null,
				p_tabela: params.tabela || null,
				p_registro_id: params.registro_id || null,
				p_dados_anteriores: params.dados_anteriores || null,
				p_dados_novos: params.dados_novos || null,
				p_ip_address: getClientIP(),
				p_user_agent: getUserAgent(),
				p_metadata: params.metadata || {},
			});
		} catch (error) {
			console.error("Erro ao registrar log plataforma:", error);
		}
	};

	/**
	 * Registra log de visualização (analytics)
	 */
	const registrarVisualizacao = async (params: {
		acao: string;
		tabela?: string;
		registro_id?: string;
		metadata?: Record<string, unknown>;
	}): Promise<void> => {
		await registrarLogPlataforma({
			acao: params.acao,
			categoria: "analytics",
			estabelecimento_id: userStore.establishmentId || undefined,
			tabela: params.tabela,
			registro_id: params.registro_id,
			metadata: params.metadata,
		});
	};

	/**
	 * Registra log de segurança (permanente)
	 */
	const registrarLogSeguranca = async (params: {
		acao: string;
		estabelecimento_id?: string;
		dados_novos?: Record<string, unknown>;
		metadata?: Record<string, unknown>;
	}): Promise<void> => {
		await registrarLogPlataforma({
			acao: params.acao,
			categoria: "seguranca",
			estabelecimento_id: params.estabelecimento_id,
			dados_novos: params.dados_novos,
			metadata: params.metadata,
		});
	};

	return {
		registrarLogEstabelecimento,
		registrarLogPlataforma,
		registrarVisualizacao,
		registrarLogSeguranca,
	};
};
