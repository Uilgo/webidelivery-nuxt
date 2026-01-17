/**
 * 📌 useCheckoutStorage
 *
 * Composable para persistir dados do checkout no localStorage.
 * Permite reutilizar dados em pedidos futuros.
 */

import type { DadosCliente, EnderecoEntrega } from "~/features/public/checkout/types/checkout";

const STORAGE_KEY_CLIENTE = "webi_checkout_cliente";
const STORAGE_KEY_ENDERECO = "webi_checkout_endereco";

export const useCheckoutStorage = () => {
	/**
	 * Salva dados do cliente no localStorage
	 */
	const salvarDadosCliente = (dados: DadosCliente): void => {
		if (import.meta.client) {
			try {
				localStorage.setItem(STORAGE_KEY_CLIENTE, JSON.stringify(dados));
			} catch (error) {
				// Silencioso - falha ao salvar não deve quebrar o fluxo
			}
		}
	};

	/**
	 * Carrega dados do cliente do localStorage
	 */
	const carregarDadosCliente = (): DadosCliente | null => {
		if (import.meta.client) {
			try {
				const dados = localStorage.getItem(STORAGE_KEY_CLIENTE);
				return dados ? JSON.parse(dados) : null;
			} catch (error) {
				return null;
			}
		}
		return null;
	};

	/**
	 * Salva endereço de entrega no localStorage
	 */
	const salvarEndereco = (endereco: EnderecoEntrega): void => {
		if (import.meta.client) {
			try {
				localStorage.setItem(STORAGE_KEY_ENDERECO, JSON.stringify(endereco));
			} catch (error) {
				// Silencioso
			}
		}
	};

	/**
	 * Carrega endereço de entrega do localStorage
	 */
	const carregarEndereco = (): EnderecoEntrega | null => {
		if (import.meta.client) {
			try {
				const endereco = localStorage.getItem(STORAGE_KEY_ENDERECO);
				return endereco ? JSON.parse(endereco) : null;
			} catch (error) {
				return null;
			}
		}
		return null;
	};

	/**
	 * Limpa todos os dados salvos
	 */
	const limparDados = (): void => {
		if (import.meta.client) {
			try {
				localStorage.removeItem(STORAGE_KEY_CLIENTE);
				localStorage.removeItem(STORAGE_KEY_ENDERECO);
			} catch (error) {
				// Silencioso
			}
		}
	};

	return {
		salvarDadosCliente,
		carregarDadosCliente,
		salvarEndereco,
		carregarEndereco,
		limparDados,
	};
};
