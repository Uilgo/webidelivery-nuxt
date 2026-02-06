<script setup lang="ts">
/**
 * 📌 UiStepper - Componente Stepper Reutilizável
 *
 * Componente de stepper com suporte para orientação horizontal e vertical.
 * Exibe steps com indicadores visuais, barras de conexão e estados (completed, active, pending).
 * Segue o design system definido no main.css.
 */

export interface StepperItem {
	/** Título do step */
	title: string;
	/** Descrição opcional do step */
	description?: string;
	/** Ícone opcional do step */
	icon?: string;
	/** Valor único do step (usado para v-model) */
	value?: string | number;
	/** Se o step está desabilitado */
	disabled?: boolean;
}

interface Props {
	/** Lista de steps */
	items: StepperItem[];
	/** Step ativo atual (v-model) */
	modelValue?: number;
	/** Orientação do stepper */
	orientation?: "horizontal" | "vertical";
	/** Tamanho dos indicadores */
	size?: "sm" | "md" | "lg";
	/** Cor do stepper (seguindo design system do projeto) */
	color?: "primary" | "success" | "warning" | "error" | "neutral";
	/** Se permite clicar nos steps para navegar */
	clickable?: boolean;
}

interface Emits {
	"update:modelValue": [value: number];
	"step-click": [index: number];
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: 0,
	orientation: "vertical",
	size: "md",
	color: "primary",
	clickable: false,
});

const emit = defineEmits<Emits>();

/**
 * Determinar estado de cada step
 */
const getStepState = (index: number): "completed" | "active" | "pending" => {
	if (index < props.modelValue) return "completed";
	if (index === props.modelValue) return "active";
	return "pending";
};

/**
 * Handler para clique no step
 */
const handleStepClick = (index: number): void => {
	if (!props.clickable) return;
	if (props.items[index]?.disabled) return;

	emit("update:modelValue", index);
	emit("step-click", index);
};

/**
 * Classes do indicador baseado no estado (usando design system do projeto)
 */
const getIndicatorClasses = (state: "completed" | "active" | "pending"): string => {
	const baseClasses =
		"rounded-full font-semibold flex items-center justify-center transition-all duration-200 relative z-10 flex-shrink-0";

	const sizeClasses = {
		sm: "size-8 text-sm",
		md: "size-10 text-base",
		lg: "size-12 text-lg",
	};

	const colorClasses = {
		primary: {
			completed: "bg-[var(--primary)] text-[var(--primary-foreground)]",
			active:
				"bg-[var(--primary)] text-[var(--primary-foreground)] ring-4 ring-[var(--primary-light)]",
			pending: "bg-[var(--bg-muted)] text-[var(--text-muted)]",
		},
		success: {
			completed: "bg-[var(--success)] text-[var(--success-foreground)]",
			active:
				"bg-[var(--success)] text-[var(--success-foreground)] ring-4 ring-[var(--success-light)]",
			pending: "bg-[var(--bg-muted)] text-[var(--text-muted)]",
		},
		warning: {
			completed: "bg-[var(--warning)] text-[var(--warning-foreground)]",
			active:
				"bg-[var(--warning)] text-[var(--warning-foreground)] ring-4 ring-[var(--warning-light)]",
			pending: "bg-[var(--bg-muted)] text-[var(--text-muted)]",
		},
		error: {
			completed: "bg-[var(--error)] text-[var(--error-foreground)]",
			active: "bg-[var(--error)] text-[var(--error-foreground)] ring-4 ring-[var(--error-light)]",
			pending: "bg-[var(--bg-muted)] text-[var(--text-muted)]",
		},
		neutral: {
			completed: "bg-[var(--text-primary)] text-[var(--text-inverse)]",
			active: "bg-[var(--text-primary)] text-[var(--text-inverse)] ring-4 ring-[var(--bg-muted)]",
			pending: "bg-[var(--bg-muted)] text-[var(--text-muted)]",
		},
	};

	return `${baseClasses} ${sizeClasses[props.size]} ${colorClasses[props.color][state]}`;
};

/**
 * Cor da barra conectora baseado no estado
 */
const getSeparatorColor = (index: number): string => {
	const isCompleted = index < props.modelValue;

	const colorClasses = {
		primary: isCompleted ? "bg-[var(--primary)]" : "bg-[var(--border-default)]",
		success: isCompleted ? "bg-[var(--success)]" : "bg-[var(--border-default)]",
		warning: isCompleted ? "bg-[var(--warning)]" : "bg-[var(--border-default)]",
		error: isCompleted ? "bg-[var(--error)]" : "bg-[var(--border-default)]",
		neutral: isCompleted ? "bg-[var(--text-primary)]" : "bg-[var(--border-default)]",
	};

	return colorClasses[props.color];
};

/**
 * Classes do texto baseado no estado (usando design system do projeto)
 */
const getTextClasses = (state: "completed" | "active" | "pending"): string => {
	if (state === "active") return "text-[var(--text-primary)] font-semibold";
	if (state === "completed") return "text-[var(--text-secondary)]";
	return "text-[var(--text-muted)]";
};
</script>

<template>
	<!-- Container principal do stepper -->
	<div
		class="flex"
		:class="{
			'flex-col': orientation === 'vertical',
			'flex-row items-start justify-between gap-2': orientation === 'horizontal',
		}"
	>
		<!-- Cada item do stepper -->
		<div
			v-for="(item, index) in items"
			:key="item.value ?? index"
			class="flex flex-col"
			:class="{
				'cursor-pointer': clickable && !item.disabled,
				'opacity-50 cursor-not-allowed': item.disabled,
			}"
			@click="handleStepClick(index)"
		>
			<!-- Linha do círculo + texto -->
			<div
				class="flex"
				:class="{
					'flex-row gap-4 items-center': orientation === 'vertical',
					'flex-col items-center text-center': orientation === 'horizontal',
				}"
			>
				<!-- Círculo indicador -->
				<div :class="getIndicatorClasses(getStepState(index))">
					<!-- Ícone de check para completed -->
					<Icon
						v-if="getStepState(index) === 'completed'"
						name="lucide:check"
						:class="{
							'w-4 h-4': size === 'sm',
							'w-5 h-5': size === 'md',
							'w-6 h-6': size === 'lg',
						}"
					/>
					<!-- Ícone customizado -->
					<Icon
						v-else-if="item.icon"
						:name="item.icon"
						:class="{
							'w-4 h-4': size === 'sm',
							'w-5 h-5': size === 'md',
							'w-6 h-6': size === 'lg',
						}"
					/>
					<!-- Número do step -->
					<span v-else>{{ index + 1 }}</span>
				</div>

				<!-- Conteúdo do step (título + descrição) -->
				<div
					class="flex flex-col"
					:class="{
						'items-start': orientation === 'vertical',
						'items-center text-center mt-3': orientation === 'horizontal',
					}"
				>
					<!-- Título -->
					<span
						:class="[
							getTextClasses(getStepState(index)),
							{
								'text-base font-medium': size === 'sm' || size === 'md',
								'text-lg font-medium': size === 'lg',
							},
						]"
					>
						{{ item.title }}
					</span>

					<!-- Descrição -->
					<span
						v-if="item.description"
						class="text-sm text-[var(--text-muted)] mt-1"
						:class="{
							truncate: orientation === 'horizontal',
						}"
					>
						{{ item.description }}
					</span>
				</div>
			</div>

			<!-- Barra conectora vertical (não renderiza no último item) -->
			<div v-if="index < items.length - 1 && orientation === 'vertical'" class="flex justify-start">
				<div
					class="w-0.5 h-12 transition-all duration-300"
					:class="[
						getSeparatorColor(index),
						{
							'ml-4': size === 'sm',
							'ml-5': size === 'md',
							'ml-6': size === 'lg',
						},
					]"
				></div>
			</div>

			<!-- Barra conectora horizontal (não renderiza no último item) -->
			<div
				v-if="index < items.length - 1 && orientation === 'horizontal'"
				class="absolute top-1/2 -translate-y-1/2 h-0.5 transition-all duration-300"
				:class="getSeparatorColor(index)"
				:style="{
					left:
						size === 'sm'
							? 'calc(50% + 20px)'
							: size === 'md'
								? 'calc(50% + 24px)'
								: 'calc(50% + 28px)',
					right:
						size === 'sm'
							? 'calc(-50% + 20px)'
							: size === 'md'
								? 'calc(-50% + 24px)'
								: 'calc(-50% + 28px)',
				}"
			></div>
		</div>
	</div>
</template>
