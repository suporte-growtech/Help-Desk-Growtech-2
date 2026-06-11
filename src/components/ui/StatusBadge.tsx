interface StatusBadgeProps {
  status: string
}

const statusConfig: Record<string, { color: string; label: string }> = {
  open: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300', label: 'Aberto' },
  in_progress: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300', label: 'Em Andamento' },
  resolved: { color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300', label: 'Resolvido' },
  closed: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300', label: 'Fechado' },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.open
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}
