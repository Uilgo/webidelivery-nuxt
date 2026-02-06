<script setup lang="ts">
/**
 * 📌 PerfilSections
 *
 * Orquestra a exibição das seções do perfil baseada na aba ativa.
 * Recebe a aba ativa via prop e renderiza os componentes correspondentes.
 */

import PerfilAvatar from "./PerfilAvatar.vue";
import PerfilDados from "./PerfilDados.vue";
import PerfilConfiguracoes from "./PerfilConfiguracoes.vue";

interface Props {
	activeTab: "dados" | "configuracoes";
}

defineProps<Props>();
</script>

<template>
	<div class="mt-6">
		<!-- ABA: Dados Pessoais -->
		<div
			v-if="activeTab === 'dados'"
			class="grid grid-cols-1 lg:grid-cols-[480px_1fr] gap-6 animate-in fade-in duration-500"
		>
			<!-- Coluna Esquerda: Foto -->
			<div class="min-w-0 w-full">
				<PerfilAvatar />
			</div>

			<!-- Coluna Direita: Formulário de Dados -->
			<div class="min-w-0 w-full">
				<PerfilDados />
			</div>
		</div>

		<!-- ABA: Configurações e Segurança -->
		<div v-else-if="activeTab === 'configuracoes'" class="animate-in fade-in duration-500">
			<PerfilConfiguracoes />
		</div>
	</div>
</template>
