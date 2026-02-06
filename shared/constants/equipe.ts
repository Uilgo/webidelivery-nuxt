/**
 * 📌 Constantes - Equipe
 *
 * Constantes globais relacionadas ao gerenciamento de equipe.
 */

/**
 * Formato do código de convite
 * Exemplo: EQUIPE-ABC123
 */
export const FORMATO_CODIGO_CONVITE = /^EQUIPE-[A-Z0-9]{6}$/;

/**
 * Prefixo do código de convite
 */
export const PREFIXO_CODIGO_CONVITE = "EQUIPE-";

/**
 * Tamanho do código aleatório (após o prefixo)
 */
export const TAMANHO_CODIGO_CONVITE = 6;

/**
 * Dias de validade do convite
 */
export const DIAS_VALIDADE_CONVITE = 7;

/**
 * Mensagens de erro
 */
export const MENSAGENS_ERRO_EQUIPE = {
	CODIGO_INVALIDO: "Código de convite inválido",
	CODIGO_EXPIRADO: "Este código de convite expirou",
	CODIGO_USADO: "Este código de convite já foi utilizado",
	CODIGO_NAO_ENCONTRADO: "Código de convite não encontrado",
	SEM_PERMISSAO_CRIAR: "Você não tem permissão para criar este cargo",
	SEM_PERMISSAO_EDITAR: "Você não tem permissão para editar este membro",
	SEM_PERMISSAO_REMOVER: "Você não tem permissão para remover este membro",
	NAO_PODE_EDITAR_SI_MESMO: "Você não pode editar seu próprio cargo",
	NAO_PODE_REMOVER_SI_MESMO: "Você não pode remover a si mesmo da equipe",
	CARGO_SUPERIOR: "Não é possível editar membros com cargo superior ao seu",
} as const;

/**
 * Mensagens de sucesso
 */
export const MENSAGENS_SUCESSO_EQUIPE = {
	CONVITE_CRIADO: "Convite criado com sucesso",
	CONVITE_CANCELADO: "Convite cancelado",
	MEMBRO_EDITADO: "Membro atualizado com sucesso",
	MEMBRO_REMOVIDO: "Membro removido da equipe",
	MEMBRO_ATIVADO: "Membro ativado",
	MEMBRO_DESATIVADO: "Membro desativado",
} as const;
