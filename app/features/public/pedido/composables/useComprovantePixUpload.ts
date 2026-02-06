/**
 * 📌 useComprovantePixUpload
 *
 * Composable para upload e gerenciamento de comprovantes PIX.
 * Converte arquivos para Base64 e envia via RPC.
 */

import { useToast } from "~/composables/ui/useToast";

export const useComprovantePixUpload = () => {
	const supabase = useSupabaseClient();
	const toast = useToast();

	const uploading = ref(false);
	const arquivoSelecionado = ref<File | null>(null);
	const preview = ref<string | null>(null);

	/**
	 * Comprime imagem usando canvas
	 */
	const comprimirImagem = (file: File, maxWidth = 1200, quality = 0.8): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();

			reader.onload = (e) => {
				const img = new Image();
				img.onload = () => {
					const canvas = document.createElement("canvas");
					let width = img.width;
					let height = img.height;

					// Redimensionar se necessário
					if (width > maxWidth) {
						height = (height * maxWidth) / width;
						width = maxWidth;
					}

					canvas.width = width;
					canvas.height = height;

					const ctx = canvas.getContext("2d");
					if (!ctx) {
						reject(new Error("Erro ao criar contexto do canvas"));
						return;
					}

					ctx.drawImage(img, 0, 0, width, height);

					// Converter para Base64 com compressão
					const base64 = canvas.toDataURL(file.type, quality);
					resolve(base64);
				};

				img.onerror = () => reject(new Error("Erro ao carregar imagem"));
				img.src = e.target?.result as string;
			};

			reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
			reader.readAsDataURL(file);
		});
	};

	/**
	 * Converte arquivo para Base64
	 */
	const converterParaBase64 = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();

			reader.onload = (e) => {
				resolve(e.target?.result as string);
			};

			reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
			reader.readAsDataURL(file);
		});
	};

	/**
	 * Selecionar arquivo
	 */
	const selecionarArquivo = async (event: Event) => {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (!file) return;

		// Validar tamanho (5MB antes da compressão)
		if (file.size > 5 * 1024 * 1024) {
			toast.add({
				title: "Arquivo muito grande",
				description: "O arquivo deve ter no máximo 5MB",
				color: "error",
			});
			return;
		}

		// Validar tipo
		const tiposPermitidos = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
		if (!tiposPermitidos.includes(file.type)) {
			toast.add({
				title: "Tipo de arquivo não suportado",
				description: "Use apenas JPG, PNG, WEBP ou PDF",
				color: "error",
			});
			return;
		}

		arquivoSelecionado.value = file;

		// Gerar preview
		try {
			if (file.type.startsWith("image/")) {
				preview.value = await comprimirImagem(file);
			} else {
				preview.value = await converterParaBase64(file);
			}
		} catch (error) {
			toast.add({
				title: "Erro ao processar arquivo",
				description: "Não foi possível processar o arquivo selecionado",
				color: "error",
			});
		}
	};

	/**
	 * Enviar comprovante
	 */
	const enviarComprovante = async (codigoRastreamento: string): Promise<boolean> => {
		if (!arquivoSelecionado.value || !preview.value) {
			toast.add({
				title: "Nenhum arquivo selecionado",
				description: "Selecione um comprovante antes de enviar",
				color: "error",
			});
			return false;
		}

		uploading.value = true;

		try {
			const { data, error } = await supabase.rpc("enviar_comprovante_pix", {
				codigo_rastreamento: codigoRastreamento,
				comprovante_base64: preview.value,
				comprovante_tipo: arquivoSelecionado.value.type,
			});

			if (error) throw error;

			const resultado = data as { success: boolean; error?: string; message?: string };

			if (!resultado.success) {
				toast.add({
					title: "Erro ao enviar comprovante",
					description: resultado.error || "Ocorreu um erro desconhecido",
					color: "error",
				});
				return false;
			}

			toast.add({
				title: "Comprovante enviado!",
				description: "Aguarde a confirmação do estabelecimento",
				color: "success",
			});

			// Limpar seleção
			arquivoSelecionado.value = null;
			preview.value = null;

			return true;
		} catch (error) {
			console.error("Erro ao enviar comprovante:", error);
			toast.add({
				title: "Erro ao enviar",
				description: "Não foi possível enviar o comprovante. Tente novamente",
				color: "error",
			});
			return false;
		} finally {
			uploading.value = false;
		}
	};

	/**
	 * Limpar seleção
	 */
	const limparSelecao = () => {
		arquivoSelecionado.value = null;
		preview.value = null;
	};

	return {
		uploading,
		arquivoSelecionado,
		preview,
		selecionarArquivo,
		enviarComprovante,
		limparSelecao,
	};
};
