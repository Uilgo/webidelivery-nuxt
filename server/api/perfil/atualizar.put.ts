/**
 * 📌 API Endpoint - Atualizar Próprio Perfil
 *
 * Endpoint server-side para o usuário atualizar seus próprios dados pessoais.
 * Utiliza o cliente Service Role do Supabase para bypass de RLS.
 * Apenas permite atualização do próprio perfil (auth.uid() == p_id).
 *
 * @route PUT /api/perfil/atualizar
 */

import { serverSupabaseServiceRole, serverSupabaseUser } from "#supabase/server";

/**
 * Interface para os dados de atualização do perfil
 */
interface AtualizarPerfilBody {
	nome?: string;
	sobrenome?: string;
	telefone?: string | null;
	avatar_url?: string | null;
}

/**
 * Resposta padronizada da API
 */
interface AtualizarPerfilResponse {
	sucesso: boolean;
	mensagem?: string;
}

export default defineEventHandler(async (event): Promise<AtualizarPerfilResponse> => {
	// 1. Verifica se o usuário está autenticado
	// serverSupabaseUser retorna o objeto User do Supabase, onde o ID está em 'id'
	const user = await serverSupabaseUser(event);
	const userId = user?.id;

	if (!userId) {
		throw createError({
			statusCode: 401,
			message: "Não autenticado. Faça login para continuar.",
		});
	}

	// 2. Obtém o body da requisição
	const body = await readBody<AtualizarPerfilBody>(event);

	if (!body || Object.keys(body).length === 0) {
		throw createError({
			statusCode: 400,
			message: "Nenhum dado fornecido para atualização.",
		});
	}

	// 3. Validação básica dos campos
	if (body.nome !== undefined && body.nome.trim().length < 2) {
		throw createError({
			statusCode: 400,
			message: "Nome deve ter pelo menos 2 caracteres.",
		});
	}

	if (body.sobrenome !== undefined && body.sobrenome.trim().length < 2) {
		throw createError({
			statusCode: 400,
			message: "Sobrenome deve ter pelo menos 2 caracteres.",
		});
	}

	// 4. Prepara os dados para atualização (só campos fornecidos)
	const dadosAtualizacao: Record<string, unknown> = {};

	if (body.nome !== undefined) {
		dadosAtualizacao.nome = body.nome.trim();
	}
	if (body.sobrenome !== undefined) {
		dadosAtualizacao.sobrenome = body.sobrenome.trim();
	}
	if (body.telefone !== undefined) {
		dadosAtualizacao.telefone = body.telefone?.trim() || null;
	}
	if (body.avatar_url !== undefined) {
		dadosAtualizacao.avatar_url = body.avatar_url || null;
	}

	// Se não há campos válidos para atualizar
	if (Object.keys(dadosAtualizacao).length === 0) {
		throw createError({
			statusCode: 400,
			message: "Nenhum campo válido para atualização.",
		});
	}

	// 5. Usa o cliente Service Role para bypass de RLS
	const supabaseAdmin = serverSupabaseServiceRole(event);

	const { error: updateError } = await supabaseAdmin
		.from("perfis")
		.update(dadosAtualizacao)
		.eq("id", userId);

	if (updateError) {
		console.error("[API /api/perfil/atualizar] Erro ao atualizar perfil:", updateError);
		throw createError({
			statusCode: 500,
			message: "Erro ao atualizar perfil. Tente novamente.",
		});
	}

	// 6. Retorna sucesso
	return {
		sucesso: true,
		mensagem: "Perfil atualizado com sucesso!",
	};
});
