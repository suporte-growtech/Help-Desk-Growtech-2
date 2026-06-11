interface PriorityBadgeProps {
  priority: string
}

const priorityConfig: Record<string, { color: string; label: string }> = {
  low: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', label: 'Baixa' },
  medium: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300', label: 'Média' },
  high: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300', label: 'Alta' },
  critical: { color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300', label: 'Crítica' },
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority] || priorityConfig.medium
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}
