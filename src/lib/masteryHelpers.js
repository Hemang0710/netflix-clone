export const getMasteryColor = (score) => {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-blue-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

export const getMasteryLabel = (score) => {
  if (score >= 80) return 'Mastered'
  if (score >= 60) return 'Proficient'
  if (score >= 40) return 'Developing'
  return 'Beginning'
}

export const getMasteryTierColor = (score, format = 'bg') => {
  const tier = getMasteryTier(score)
  if (format === 'text') {
    return {
      Mastered: 'text-green-600',
      Proficient: 'text-blue-600',
      Developing: 'text-amber-600',
      Beginning: 'text-red-600'
    }[tier]
  }
  if (format === 'border') {
    return {
      Mastered: 'border-green-200',
      Proficient: 'border-blue-200',
      Developing: 'border-amber-200',
      Beginning: 'border-red-200'
    }[tier]
  }
  return {
    Mastered: '#22c55e',
    Proficient: '#3b82f6',
    Developing: '#f59e0b',
    Beginning: '#ef4444'
  }[tier]
}

export const getMasteryTier = (score) => {
  if (score >= 80) return 'Mastered'
  if (score >= 60) return 'Proficient'
  if (score >= 40) return 'Developing'
  return 'Beginning'
}
