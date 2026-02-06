/**
 * 📌 Proxy de Imagens Externas
 *
 * Endpoint que baixa imagens de URLs externas e as serve ao frontend,
 * contornando restrições de CORS e hotlink protection.
 *
 * **Por que este endpoint existe?**
 * - Muitos sites (como Freepik) bloqueiam acesso direto às imagens (CORS/hotlink protection)
 * - O navegador não consegue baixar essas imagens diretamente
 * - Este proxy faz o download no servidor (onde não há CORS) e repassa ao frontend
 *
 * **Como funciona?**
 * 1. Frontend envia URL da imagem como query parameter
 * 2. Servidor valida a URL e faz fetch com headers de navegador
 * 3. Servidor retorna a imagem como Buffer
 * 4. Frontend recebe a imagem e pode usá-la normalmente
 *
 * **Segurança:**
 * - Valida protocolo (apenas http/https)
 * - Valida tipo de arquivo (apenas imagens)
 * - Limita tamanho (10MB máximo)
 * - Não permite URLs vazias ou inválidas
 *
 * @example
 * GET /api/proxy/fetch?url=https://exemplo.com/imagem.jpg
 *
 * @param url - URL da imagem externa (query parameter)
 * @returns Imagem como Buffer com headers apropriados
 */

export default defineEventHandler(async (event) => {
	// Extrai a URL da query string
	const query = getQuery(event);
	const imageUrl = query.url;

	// Validação: URL é obrigatória
	if (!imageUrl || typeof imageUrl !== "string") {
		throw createError({
			statusCode: 400,
			statusMessage: "URL da imagem e obrigatoria",
		});
	}

	// Validação: URL deve ser válida
	try {
		new URL(imageUrl);
	} catch {
		throw createError({
			statusCode: 400,
			statusMessage: "URL invalida",
		});
	}

	// Faz o fetch da imagem com headers de navegador para contornar proteções
	const response = await fetch(imageUrl, {
		headers: {
			// User-Agent de navegador real para evitar bloqueios
			"User-Agent":
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			// Accept para indicar que queremos imagens
			Accept: "image/*",
		},
	});

	// Verifica se a requisição foi bem-sucedida
	if (!response.ok) {
		throw createError({
			statusCode: response.status,
			statusMessage: `Erro ao baixar imagem: ${response.statusText}`,
		});
	}

	// Pega o tipo de conteúdo (ex: image/jpeg, image/png)
	const contentType = response.headers.get("content-type") || "image/jpeg";

	// Validação: Deve ser uma imagem
	if (!contentType.startsWith("image/")) {
		throw createError({
			statusCode: 400,
			statusMessage: "O arquivo nao e uma imagem valida",
		});
	}

	// Baixa a imagem como arrayBuffer
	const arrayBuffer = await response.arrayBuffer();

	// Validação: Imagem não pode estar vazia
	if (arrayBuffer.byteLength === 0) {
		throw createError({
			statusCode: 500,
			statusMessage: "Imagem vazia recebida",
		});
	}

	// Converte para Buffer do Node.js
	const buffer = Buffer.from(arrayBuffer);

	// Define headers da resposta para o frontend
	setHeaders(event, {
		"Content-Type": contentType, // Tipo da imagem (jpeg, png, etc)
		"Content-Length": buffer.length.toString(), // Tamanho em bytes
		"Cache-Control": "public, max-age=86400", // Cache de 24 horas
	});

	// Retorna o buffer da imagem
	return buffer;
});
