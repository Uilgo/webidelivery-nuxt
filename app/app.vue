<template>
	<div>
		<NuxtRouteAnnouncer />
		<NuxtLayout>
			<NuxtPage />
		</NuxtLayout>

		<!-- Sistema de notificações toast -->
		<UiToaster position="top-right" :duration="5000" :max="5" />
	</div>
</template>

<style>
/* Scrollbar customizada para navegadores webkit (Chrome, Safari, Edge) */
::-webkit-scrollbar {
	width: 8px;
	height: 8px;
}

::-webkit-scrollbar-track {
	background: transparent;
}

::-webkit-scrollbar-thumb {
	background: rgba(128, 128, 128, 0.3);
	border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
	background: rgba(128, 128, 128, 0.5);
}

/* Scrollbar para Firefox */
* {
	scrollbar-width: thin;
	scrollbar-color: rgba(128, 128, 128, 0.3) transparent;
}

/* Remove scrollbar horizontal desnecessária */
html,
body {
	overflow-x: hidden;
}
</style>
