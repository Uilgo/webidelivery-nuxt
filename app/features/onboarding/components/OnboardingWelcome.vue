<script setup lang="ts">
/**
 * 📌 OnboardingWelcome - Tela de Boas-vindas do Onboarding
 *
 * Tela inicial que explica o processo de configuração e motiva o usuário
 * a completar o onboarding.
 *
 * LAYOUT: 2 cards separados lado a lado
 * - Card 1: Apresentação + Benefícios + CTA
 * - Card 2: Lista de etapas
 * - Desktop: Sem scroll, altura fixa
 * - Mobile: Com scroll, layout em coluna
 */

/**
 * Emits do componente
 */
interface Emits {
	"start-onboarding": [];
}

const emit = defineEmits<Emits>();

/**
 * Funcionalidades que serão configuradas
 */
const features = [
	{
		icon: "lucide:store",
		title: "Informações do Estabelecimento",
		description: "Nome, URL personalizada e descrição",
	},
	{
		icon: "lucide:map-pin",
		title: "Endereço Completo",
		description: "Localização para entregas e referências",
	},
	{
		icon: "lucide:message-circle",
		title: "Contato via WhatsApp",
		description: "Canal direto com seus clientes",
	},
	{
		icon: "lucide:clock",
		title: "Horários de Funcionamento",
		description: "Quando você está disponível para pedidos",
	},
	{
		icon: "lucide:credit-card",
		title: "Métodos de Pagamento",
		description: "Como seus clientes podem pagar",
	},
];
</script>

<template>
	<div class="w-full h-full flex items-center">
		<div class="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- CARD 1 - Apresentação -->
			<UiCard variant="elevated" size="lg">
				<template #content>
					<div class="text-center lg:text-left space-y-5">
						<div class="space-y-5">
							<!-- Cabeçalho principal -->
							<div class="space-y-3">
								<div class="flex items-center gap-3 justify-center lg:justify-start">
									<div
										class="w-16 h-16 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center flex-shrink-0"
									>
										<Icon
											name="lucide:rocket"
											class="text-primary-600 dark:text-primary-400"
											style="width: 40px !important; height: 40px !important"
										/>
									</div>

									<h1 class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
										Bem-vindo ao WebiDelivery!
									</h1>
								</div>

								<p class="text-base text-gray-600 dark:text-gray-400">
									Vamos configurar seu estabelecimento em apenas 5 etapas simples. Isso levará cerca
									de 5 minutos.
								</p>
							</div>

							<!-- Benefícios compactos -->
							<div
								class="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-lg p-4"
							>
								<h3 class="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
									Após a configuração, você terá:
								</h3>
								<div class="grid grid-cols-1 gap-2 text-sm">
									<div class="flex items-center space-x-2">
										<Icon
											name="lucide:check-circle"
											class="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0"
										/>
										<span class="text-gray-700 dark:text-gray-300"
											>Cardápio digital personalizado</span
										>
									</div>
									<div class="flex items-center space-x-2">
										<Icon
											name="lucide:check-circle"
											class="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0"
										/>
										<span class="text-gray-700 dark:text-gray-300"
											>Link próprio para compartilhar</span
										>
									</div>
									<div class="flex items-center space-x-2">
										<Icon
											name="lucide:check-circle"
											class="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0"
										/>
										<span class="text-gray-700 dark:text-gray-300">Sistema de pedidos online</span>
									</div>
									<div class="flex items-center space-x-2">
										<Icon
											name="lucide:check-circle"
											class="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0"
										/>
										<span class="text-gray-700 dark:text-gray-300"
											>Painel de controle completo</span
										>
									</div>
								</div>
							</div>
						</div>

						<!-- Botão de início -->
						<div class="space-y-3">
							<UiButton size="lg" class="w-full px-8" @click="emit('start-onboarding')">
								<Icon name="lucide:arrow-right" class="w-5 h-5 mr-2" />
								Começar Configuração
							</UiButton>

							<p class="text-xs text-gray-500 dark:text-gray-400 text-center">
								Você pode pausar e continuar depois a qualquer momento
							</p>
						</div>
					</div>
				</template>
			</UiCard>

			<!-- CARD 2 - Etapas -->
			<UiCard variant="elevated" size="lg">
				<template #content>
					<div class="space-y-4">
						<h2
							class="text-lg font-semibold text-gray-900 dark:text-white text-center lg:text-left"
						>
							O que vamos configurar:
						</h2>

						<div class="grid gap-3">
							<div
								v-for="(feature, index) in features"
								:key="feature.title"
								class="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
							>
								<!-- Número da etapa -->
								<div
									class="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
								>
									{{ index + 1 }}
								</div>

								<!-- Ícone -->
								<div
									class="w-10 h-10 bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0"
								>
									<Icon
										:name="feature.icon"
										class="w-5 h-5 text-primary-600 dark:text-primary-400"
									/>
								</div>

								<!-- Conteúdo -->
								<div class="flex-1 min-w-0">
									<h3 class="font-medium text-gray-900 dark:text-white text-sm">
										{{ feature.title }}
									</h3>
									<p class="text-xs text-gray-600 dark:text-gray-400">
										{{ feature.description }}
									</p>
								</div>
							</div>
						</div>
					</div>
				</template>
			</UiCard>
		</div>
	</div>
</template>
