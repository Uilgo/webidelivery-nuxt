<script setup lang="ts">
/**
 * 📌 PerfilAvatar
 *
 * Componente para upload e gerenciamento do avatar do usuário.
 * Usa o componente AvatarUpload e API do servidor para salvar.
 */

import { usePerfil } from "~/features/admin/perfil/composables/usePerfil";
import { useToast } from "~/composables/ui/useToast";

const { perfil, refresh } = usePerfil();
const { success, error: showToastError } = useToast();

// Estado do avatar
const avatarUrl = ref("");
const loading = ref(false);

// Inicializa com o avatar atual
watch(
	perfil,
	(newPerfil) => {
		if (newPerfil?.avatar_url) {
			avatarUrl.value = newPerfil.avatar_url;
		}
	},
	{ immediate: true },
);

/**
 * Atualiza o avatar via API do servidor quando o componente AvatarUpload emite mudança
 */
const handleAvatarChange = async (newAvatarUrl: string) => {
	loading.value = true;

	try {
		// Chama a API do servidor para atualizar o avatar
		// Os cookies de autenticação são enviados automaticamente pelo browser
		const response = await $fetch("/api/perfil/atualizar", {
			method: "PUT",
			body: {
				avatar_url: newAvatarUrl || null,
			},
		});

		if (response?.sucesso) {
			avatarUrl.value = newAvatarUrl;
			// Atualiza o cache do perfil
			await refresh();
			success({ title: newAvatarUrl ? "Avatar atualizado!" : "Avatar removido!" });
		} else {
			throw new Error("Falha na atualização do avatar");
		}
	} catch (err: unknown) {
		console.error("Erro ao atualizar avatar:", err);
		const message = err instanceof Error ? err.message : "Erro desconhecido";
		showToastError({ title: "Erro ao atualizar avatar", description: message });
	} finally {
		loading.value = false;
	}
};
</script>

<template>
	<UiCard class="h-full">
		<template #header>
			<h3 class="text-lg font-semibold text-center">Foto do Perfil</h3>
		</template>

		<div class="w-full">
			<UiAvatarUpload
				v-model="avatarUrl"
				:disabled="loading"
				:size="128"
				:max-size="256"
				:max-size-k-b="50"
				hint="Imagem circular"
				@update:model-value="handleAvatarChange"
			/>
		</div>
	</UiCard>
</template>
