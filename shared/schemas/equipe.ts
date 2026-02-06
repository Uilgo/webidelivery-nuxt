/**
 * 📌 Schemas de Validação - Equipe
 *
 * Schemas Zod para validação de dados da feature de equipe.
 * Garante integridade dos dados antes de enviar ao backend.
 */

import { z } from "zod";

/**
 * Cargos permitidos para membros de equipe
 */
export const cargoEquipeSchema = z.enum(["admin", "gerente", "staff", "entregador"], {
	message: "Cargo inválido",
});

/**
 * Schema para criar convite
 */
export const criarConviteSchema = z.object({
	cargo_pretendido: cargoEquipeSchema,
	descricao: z.string().max(500, "Descrição muito longa (máximo 500 caracteres)").optional(),
});

/**
 * Schema para editar membro
 */
export const editarMembroSchema = z.object({
	cargo: cargoEquipeSchema.optional(),
	ativo: z.boolean().optional(),
});

/**
 * Schema para validar código de convite
 */
export const codigoConviteSchema = z
	.string()
	.min(1, "Código obrigatório")
	.regex(/^EQUIPE-[A-Z0-9]{6}$/, "Formato de código inválido (ex: EQUIPE-ABC123)");

/**
 * Tipos inferidos dos schemas
 */
export type CriarConviteInput = z.infer<typeof criarConviteSchema>;
export type EditarMembroInput = z.infer<typeof editarMembroSchema>;
export type CodigoConviteInput = z.infer<typeof codigoConviteSchema>;
