<script setup lang="ts">
/**
 * 📌 SegurancaTab
 *
 * Tab de segurança (Admin only).
 * Alteração de senha, sessões ativas e logs de acesso.
 */

// TODO: Implementar composable useSeguranca

const loading = ref(false);

const handleChangePassword = async () => {
	loading.value = true;
	// TODO: Implementar alteração de senha
	await new Promise((resolve) => setTimeout(resolve, 1000));
	loading.value = false;
};
</script>

<template>
	<div class="space-y-6">
		<ConfiguracaoCard
			title="Alterar Senha"
			description="Atualize sua senha de acesso ao sistema."
			icon="lucide:lock"
			:loading="loading"
			save-button-text="Alterar Senha"
			@save="handleChangePassword"
		>
			<!-- TODO: Implementar formulário de alteração de senha -->
			<div class="text-center py-12 text-[var(--text-muted)]">
				Formulário de senha será implementado aqui
			</div>
		</ConfiguracaoCard>

		<ConfiguracaoCard
			title="Sessões Ativas"
			description="Gerencie os dispositivos conectados à sua conta."
			icon="lucide:monitor"
			:show-save-button="false"
		>
			<!-- TODO: Implementar lista de sessões ativas -->
			<div class="text-center py-12 text-[var(--text-muted)]">
				Lista de sessões será implementada aqui
			</div>
		</ConfiguracaoCard>

		<ConfiguracaoCard
			title="Logs de Acesso"
			description="Histórico dos últimos acessos à sua conta."
			icon="lucide:history"
			:show-save-button="false"
		>
			<!-- TODO: Implementar lista de logs -->
			<div class="text-center py-12 text-[var(--text-muted)]">
				Logs de acesso serão implementados aqui
			</div>
		</ConfiguracaoCard>
	</div>
</template>
