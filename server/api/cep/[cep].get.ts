/**
 * 📌 API Endpoint - Consulta CEP
 *
 * Endpoint server-side para consulta de CEP com múltiplos provedores e fallback automático.
 * Utiliza ViaCEP como principal, BrasilAPI como fallback e Postmon como backup.
 * Evita expor APIs externas no cliente e permite rate limiting.
 *
 * @route GET /api/cep/:cep
 * @example GET /api/cep/01001000
 */

/**
 * Valida se CEP tem formato correto (8 dígitos)
 */

const isValidCEP = (cep: string): boolean => {
	return /^\d{8}$/.test(cep);
};

/**
 * Remove formatação do CEP (mantém apenas números)
 */
const parseCEP = (cep: string): string => {
	return cep.replace(/\D/g, "");
};

/**
 * Interface padronizada para resposta da API de CEP
 */
interface EnderecoViaCEP {
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
interface CepError {
	error: true;
	message: string;
	provider?: string;
}

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
	estado_info?: {
		nome?: string;
	};
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
				uf: response.estado || "",
				estado: response.estado_info?.nome || response.estado || "",
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
 */
const consultarCEP = async (cep: string): Promise<EnderecoViaCEP | CepError> => {
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

			const response = await $fetch(provider.url(cepLimpo), {
				signal: controller.signal,
				headers: {
					Accept: "application/json",
					"User-Agent": "WebiDelivery/1.0",
				},
			});

			clearTimeout(timeoutId);

			const endereco = provider.transform(response);
			return endereco;
		} catch (error) {
			// Log do erro para debug
			console.error(`[CEP] Erro no provedor ${provider.name}:`, error);

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

/**
 * Handler do endpoint
 */
export default defineEventHandler(async (event) => {
	const cep = getRouterParam(event, "cep");

	if (!cep) {
		throw createError({
			statusCode: 400,
			statusMessage: "CEP não informado",
		});
	}

	const resultado = await consultarCEP(cep);

	if ("error" in resultado) {
		throw createError({
			statusCode: 404,
			statusMessage: resultado.message,
		});
	}

	return resultado;
});
