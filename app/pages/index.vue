<script setup lang="ts">
/**
 * 📌 Página Raiz - Redirecionamento Inteligente
 *
 * Redireciona para dashboard se autenticado, senão para login.
 */

// Verificar se o usuário está autenticado
const user = useSupabaseUser();

// Redirecionamento baseado no estado de autenticação
if (user.value) {
	// Usuário autenticado - redireciona para dashboard
	await navigateTo("/admin/dashboard", { replace: true });
} else {
	// Usuário não autenticado - redireciona para login
	await navigateTo("/login", { replace: true });
}
</script>

<template>
	<div></div>
</template>
