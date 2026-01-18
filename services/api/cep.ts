/**
 * 📌 API Service - CEP
 *
 * Service para consulta de CEP com múltiplos provedores e fallback automático.
 * Utiliza ViaCEP como principal, BrasilAPI como fallback e Postmon como backup.
 */

import { parseCEP, isValidCEP } from "../../lib/formatters/address";

/**
 * Interface padronizada para resposta da API de CEP
 */
export interface EnderecoViaCEP {
	cep: string;
	logradouro: string;
	complemento?: string;
	bairro: string;
	localidade: string; // cidade
	uf: string;
	estado: string;
	regiao?: string;
	ibge?: string;
	ddd?: string;
	siafi?: string;
}

/**
 * Resposta de erro padronizada
 */
export interface CepError {
	error: true;
	message: string;
	provider?: string;
}

/**
 * Resultado da consulta
 */
export type CepResult = EnderecoViaCEP | CepError;

/**
 * Tipos de resposta dos provedores
 */
interface ViaCepResponse {
	cep?: string;
	logradouro?: string;
	complemento?: string;
	bairro?: string;
	localidade?: string;
	uf?: string;
	estado?: string;
	regiao?: string;
	ibge?: string;
	ddd?: string;
	siafi?: string;
	erro?: boolean;
}

interface BrasilApiResponse {
	cep?: string;
	street?: string;
	neighborhood?: string;
	city?: string;
	state?: string;
}

interface PostmonResponse {
	cep?: string;
	logradouro?: string;
	bairro?: string;
	cidade?: string;
	uf?: string;
	estado?: string;
	ibge?: string;
}

/**
 * Configuração dos provedores
 */
interface CepProvider {
	name: string;
	url: (cep: string) => string;
	transform: (data: unknown) => EnderecoViaCEP;
	timeout: number;
}

/**
 * Configuração dos provedores de CEP
 */
const CEP_PROVIDERS: CepProvider[] = [
	// 1. ViaCEP - Principal (mais confiável)
	{
		name: "ViaCEP",
		url: (cep: string) => `https://viacep.com.br/ws/${cep}/json/`,
		timeout: 5000,
		transform: (data: unknown): EnderecoViaCEP => {
			const response = data as ViaCepResponse;

			// ViaCEP retorna erro como { erro: true }
			if (response.erro) {
				throw new Error("CEP não encontrado");
			}

			return {
				cep: response.cep || "",
				logradouro: response.logradouro || "",
				complemento: response.complemento || undefined,
				bairro: response.bairro || "",
				localidade: response.localidade || "",
				uf: response.uf || "",
				estado: response.estado || "",
				regiao: response.regiao || undefined,
				ibge: response.ibge || undefined,
				ddd: response.ddd || undefined,
				siafi: response.siafi || undefined,
			};
		},
	},

	// 2. BrasilAPI - Fallback (moderna, múltiplos provedores)
	{
		name: "BrasilAPI",
		url: (cep: string) => `https://brasilapi.com.br/api/cep/v2/${cep}`,
		timeout: 4000,
		transform: (data: unknown): EnderecoViaCEP => {
			const response = data as BrasilApiResponse;

			return {
				cep: response.cep || "",
				logradouro: response.street || "",
				complemento: undefined,
				bairro: response.neighborhood || "",
				localidade: response.city || "",
				uf: response.state || "",
				estado: response.state || "", // BrasilAPI não retorna nome completo do estado
				regiao: undefined,
				ibge: undefined,
				ddd: undefined,
				siafi: undefined,
			};
		},
	},

	// 3. Postmon - Backup (alternativa sólida)
	{
		name: "Postmon",
		url: (cep: string) => `https://api.postmon.com.br/v1/cep/${cep}`,
		timeout: 4000,
		transform: (data: unknown): EnderecoViaCEP => {
			const response = data as PostmonResponse;

			return {
				cep: response.cep || "",
				logradouro: response.logradouro || "",
				complemento: undefined,
				bairro: response.bairro || "",
				localidade: response.cidade || "",
				uf: response.uf || "",
				estado: response.estado || "",
				regiao: undefined,
				ibge: response.ibge || undefined,
				ddd: undefined,
				siafi: undefined,
			};
		},
	},
];

/**
 * Consulta CEP com fallback automático
 *
 * @param cep - CEP a ser consultado (com ou sem formatação)
 * @returns Promise com dados do endereço ou erro
 *
 * @example
 * const resultado = await consultarCEP('01001-000')
 * if ('error' in resultado) {
 *   console.error(resultado.message)
 * } else {
 *   console.log(resultado.logradouro)
 * }
 */
export const consultarCEP = async (cep: string): Promise<CepResult> => {
	// Limpar e validar CEP
	const cepLimpo = parseCEP(cep);

	if (!isValidCEP(cepLimpo)) {
		return {
			error: true,
			message: "CEP inválido. Deve conter exatamente 8 dígitos.",
		};
	}

	// Tentar cada provedor em sequência
	for (const provider of CEP_PROVIDERS) {
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), provider.timeout);

			const response = await fetch(provider.url(cepLimpo), {
				signal: controller.signal,
				headers: {
					Accept: "application/json",
					"User-Agent": "WebiDelivery/1.0",
				},
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const data = await response.json();
			const endereco = provider.transform(data);

			return endereco;
		} catch {
			// Se não é o último provedor, continua tentando
			if (provider !== CEP_PROVIDERS[CEP_PROVIDERS.length - 1]) {
				continue;
			}
		}
	}

	// Se chegou aqui, todos os provedores falharam
	return {
		error: true,
		message: "CEP não encontrado em nenhum provedor disponível.",
	};
};
