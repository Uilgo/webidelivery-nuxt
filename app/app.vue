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
