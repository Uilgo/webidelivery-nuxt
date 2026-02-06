# 🚨 Componentes de Erro

Componentes personalizados para páginas de erro do sistema.

## 📁 Estrutura

```
app/components/errors/
├── Error404.vue          # Página não encontrada (404)
├── Error403.vue          # Acesso negado (403)
├── Error500.vue          # Erro interno do servidor (500)
├── ErrorGeneric.vue      # Erro genérico (outros códigos)
├── ErrorMaintenance.vue  # Página de manutenção
└── README.md            # Esta documentação
```

## 🎯 Uso Automático

O Nuxt automaticamente usa o arquivo `app/error.vue` para capturar erros. Ele roteia para o componente específico baseado no código de status HTTP:

- **404** → `Error404.vue`
- **403** → `Error403.vue`
- **500** → `Error500.vue`
- **Outros** → `ErrorGeneric.vue`

## 🔧 Uso Manual

### Lançar erro 404

```typescript
throw createError({
	statusCode: 404,
	statusMessage: "Página não encontrada",
	fatal: true,
});
```

### Lançar erro 403

```typescript
throw createError({
	statusCode: 403,
	statusMessage: "Acesso negado",
	message: "Você não tem permissão para acessar este recurso",
	fatal: true,
});
```

### Lançar erro 500

```typescript
throw createError({
	statusCode: 500,
	statusMessage: "Erro interno do servidor",
	fatal: true,
});
```

### Usar página de manutenção

```vue
<template>
	<ErrorsErrorMaintenance
		estimated-time="em 2 horas"
		message="Estamos atualizando o sistema com novas funcionalidades."
	/>
</template>
```

## 🎨 Características

### Design Responsivo

- Mobile-first
- Adaptável a diferentes tamanhos de tela
- Suporte a dark mode

### Interatividade

- Botão "Voltar" (usa `router.back()`)
- Botão "Ir para Início" (redireciona para `/`)
- Botão "Tentar Novamente" (recarrega a página)

### Acessibilidade

- Ícones descritivos
- Mensagens claras
- Contraste adequado
- Navegação por teclado

## 🔗 Links Úteis (404)

A página 404 inclui links rápidos para:

- Dashboard
- Pedidos
- Cardápio
- Configurações

## 🎭 Animações

- Ícones com `animate-pulse`
- Números grandes com gradiente
- Transições suaves

## 📝 Personalização

### Alterar cores

Edite as classes Tailwind nos componentes:

```vue
<!-- De azul para verde -->
<div class="from-blue-500 to-indigo-600">
	<!-- Para -->
	<div class="from-green-500 to-emerald-600"></div>
</div>
```

### Alterar mensagens

As mensagens são props nos componentes:

```vue
<ErrorsErrorGeneric
	:status-code="418"
	status-message="Sou um bule de chá"
	message="Não posso preparar café porque sou um bule de chá."
/>
```

## 🧪 Testando

### Testar 404

Acesse qualquer rota inexistente:

```
http://localhost:3000/rota-que-nao-existe
```

### Testar 500

Crie um erro em qualquer página:

```typescript
throw new Error("Erro de teste");
```

### Testar 403

Use middleware ou lógica de permissão:

```typescript
if (!hasPermission) {
	throw createError({
		statusCode: 403,
		statusMessage: "Acesso negado",
		fatal: true,
	});
}
```

## 📚 Referências

- [Nuxt Error Handling](https://nuxt.com/docs/getting-started/error-handling)
- [Vue Router Navigation Guards](https://router.vuejs.org/guide/advanced/navigation-guards.html)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
