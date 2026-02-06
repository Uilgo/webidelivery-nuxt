// @ts-ignore - Tailwind CSS v4 ainda não tem tipos completos
import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
// @ts-ignore - Tailwind CSS v4 ainda não tem tipos completos
export default defineNuxtConfig({
	compatibilityDate: "2025-07-15",
	devtools: { enabled: false },
	modules: [
		"@pinia/nuxt",
		"@nuxtjs/color-mode",
		"@nuxt/eslint",
		"@nuxt/image",
		"@nuxt/icon",
		"@vee-validate/nuxt",
		"@nuxtjs/supabase",
		"@vite-pwa/nuxt",
	],

	css: ["./app/assets/css/main.css"],

	// Server-Side Rendering (Obrigatório para SEO)
	ssr: true,

	// SEO Global (apenas para páginas públicas)
	app: {
		head: {
			htmlAttrs: { lang: "pt-BR" },
			title: "WebiDelivery", // Título padrão (será sobrescrito dinamicamente)
			titleTemplate: "%s", // Sem template - cada página define seu próprio título
			meta: [
				{ charset: "utf-8" },
				{ name: "viewport", content: "width=device-width, initial-scale=1" },
				{ name: "format-detection", content: "telephone=no" },
				// Meta tags padrão (serão sobrescritas dinamicamente)
				{
					name: "description",
					content: "Plataforma de delivery para restaurantes e estabelecimentos",
				},
				{ name: "robots", content: "index, follow" },
				// Open Graph padrão
				{ property: "og:type", content: "website" },
				{ property: "og:site_name", content: "WebiDelivery" },
				// Twitter Card
				{ name: "twitter:card", content: "summary_large_image" },
			],
			link: [
				{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
				{ rel: "canonical", href: "https://webidelivery.com.br" },
			],
		},
	},

	// Configuração do Supabase
	supabase: {
		// Permite acesso à sessão no servidor via cookies
		useSsrCookies: true,
		// Redirecionamento automático para login
		redirect: true,
		// Configuração de rotas de redirecionamento
		redirectOptions: {
			login: "/login", // Página de login
			callback: "/confirm", // Página de confirmação após signup
			exclude: [
				"/",
				"/login",
				"/signup",
				"/signup-equipe",
				"/forgot-password",
				"/confirm",
				"/super-admin/login",
				"/super-admin/signup",
				"/super-admin/forgot-password",
			], // Páginas sem autenticação obrigatória
			include: undefined, // Apenas páginas específicas (undefined = todas exceto exclude)
			saveRedirectToCookie: false, // Não salvar - sempre vai pro dashboard
		},
		// Path para tipos TypeScript gerados do schema do Supabase
		types: "#shared/types/database.ts",
	},

	// Configuração do Color Mode (system/dark/light)
	colorMode: {
		preference: "system", // Valor padrão: segue preferência do sistema
		fallback: "light", // Fallback se não encontrar preferência do sistema
		classSuffix: "", // Remove sufixo da classe (usa apenas 'dark' ao invés de 'dark-mode')
		storage: "cookie",
		storageKey: "nuxt-color-mode", // Chave no localStorage
	},

	// Configuração do PWA (Progressive Web App)
	pwa: {
		registerType: "autoUpdate",
		manifest: {
			name: "WebiDelivery",
			short_name: "Webi",
			description: "Plataforma de delivery para restaurantes e estabelecimentos",
			theme_color: "#10b981",
			background_color: "#ffffff",
			display: "standalone",
			orientation: "portrait",
			scope: "/",
			start_url: "/",
			icons: [
				{
					src: "/icon-192x192.png",
					sizes: "192x192",
					type: "image/png",
					purpose: "any maskable",
				},
				{
					src: "/icon-512x512.png",
					sizes: "512x512",
					type: "image/png",
					purpose: "any maskable",
				},
			],
		},
		workbox: {
			navigateFallback: "/",
			navigateFallbackAllowlist: [/^\/admin/, /^\/super-admin/, /^\//],
			// Remover globPatterns que causam warnings em dev
			globPatterns: [],
			// Desabilitar logs do Workbox no console
			cleanupOutdatedCaches: true,
			// Cache de runtime para imagens e recursos externos
			runtimeCaching: [
				{
					urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*\.(png|jpg|jpeg|webp|avif|svg)$/i,
					handler: "CacheFirst",
					options: {
						cacheName: "supabase-images",
						expiration: {
							maxEntries: 100,
							maxAgeSeconds: 60 * 60 * 24 * 30, // 30 dias
						},
						cacheableResponse: {
							statuses: [0, 200],
						},
					},
				},
				{
					urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
					handler: "CacheFirst",
					options: {
						cacheName: "google-fonts-cache",
						expiration: {
							maxEntries: 10,
							maxAgeSeconds: 60 * 60 * 24 * 365, // 1 ano
						},
						cacheableResponse: {
							statuses: [0, 200],
						},
					},
				},
				{
					urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
					handler: "CacheFirst",
					options: {
						cacheName: "gstatic-fonts-cache",
						expiration: {
							maxEntries: 10,
							maxAgeSeconds: 60 * 60 * 24 * 365, // 1 ano
						},
						cacheableResponse: {
							statuses: [0, 200],
						},
					},
				},
			],
		},
		client: {
			installPrompt: true,
			// Periodicidade de verificação de atualizações (1 hora)
			periodicSyncForUpdates: 3600,
		},
		devOptions: {
			enabled: false, // Desabilita PWA em desenvolvimento
			type: "module",
			suppressWarnings: true,
			navigateFallback: "/",
			navigateFallbackAllowlist: [/^\/admin/, /^\/super-admin/, /^\//],
		},
		injectManifest: {
			globPatterns: [],
		},
	},

	// Runtime Config para SEO dinâmico
	runtimeConfig: {
		// Privadas (server-only)
		apiSecret: "",

		// Públicas (client + server)
		public: {
			apiBase: "/api",
			siteUrl: "https://webidelivery.com.br",
			siteName: "WebiDelivery",
		},
	},

	// Headers de Segurança
	nitro: {
		routeRules: {
			"/**": {
				headers: {
					"X-Frame-Options": "DENY",
					"X-Content-Type-Options": "nosniff",
					"X-XSS-Protection": "1; mode=block",
					"Referrer-Policy": "strict-origin-when-cross-origin",
					"Permissions-Policy": "geolocation=(), microphone=(), camera=()",
				},
			},
		},
		// Configurar alias para o Nitro resolver corretamente
		alias: {
			"#shared": "./shared",
		},
	},

	// Futuro (Nuxt 4 features)
	future: {
		compatibilityVersion: 4,
	},

	// Recursos experimentais (seguros no Nuxt 4.2.2)
	experimental: {
		payloadExtraction: true,
		renderJsonPayloads: true,
		typedPages: true, // Rotas tipadas automaticamente
	},

	// ESLint
	eslint: {
		config: {
			typescript: true,
		},
	},

	// Configuração do Nuxt Icon (otimizada)
	icon: {
		serverBundle: {
			collections: ["lucide"], // Apenas Lucide
		},
		// Garantir que os ícones sejam renderizados no servidor
		clientBundle: {
			scan: true,
			sizeLimitKb: 256,
		},
	},

	// Otimização de Imagens
	image: {
		format: ["webp", "avif"], // Prioriza AVIF (menor) e WebP
		quality: 80,
		// Configuração para aceitar qualquer origem
		provider: "ipx",
	},

	vite: {
		plugins: [tailwindcss()],
		build: {
			sourcemap: false,
			cssCodeSplit: true,
		},
	},

	typescript: {
		strict: true,
		typeCheck: false,
		shim: false,
		tsConfig: {
			compilerOptions: {
				module: "esnext",
				moduleResolution: "bundler",
				target: "es2022",
				lib: ["dom", "dom.iterable", "es2022"],
			},
		},
	},
});
