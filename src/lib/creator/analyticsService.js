import prisma from '@/lib/prisma';

export async function generateConfusionHeatmap(contentId) {
  const explanationFeedback = await prisma.explanationFeedback.findMany({
    where: { contentId },
    include: { progress: { select: { timestamp: true } } },
  });

  if (!explanationFeedback.length) return null;

  const confusionMap = {};
  explanationFeedback.forEach((feedback) => {
    if (feedback.wasConfused) {
      const second = Math.floor(feedback.timestamp / 1000);
      confusionMap[second] = (confusionMap[second] || 0) + 1;
    }
  });

  const heatmapData = Object.entries(confusionMap).map(([second, count]) => ({
    second: parseInt(second),
    confusionCount: count,
    severity: count > 5 ? 'high' : count > 2 ? 'medium' : 'low',
  }));

  return {
    contentId,
    totalConfusionPoints: Object.values(confusionMap).reduce((a, b) => a + b, 0),
    totalViewers: new Set(explanationFeedback.map(f => f.userId)).size,
    hotspots: heatmapData.filter(h => h.severity !== 'low').sort((a, b) => b.confusionCount - a.confusionCount),
    heatmapData: heatmapData.sort((a, b) => a.second - b.second),
  };
}

export async function generateDropoffAnalytics(contentId) {
  const progressData = await prisma.progress.findMany({
    where: { contentId },
    select: {
      userId: true,
      watchedSeconds: true,
      completedAt: true,
      totalSeconds: true,
    },
  });

  if (!progressData.length) return null;

  const dropoffMap = {};
  const maxSeconds = Math.max(...progressData.map(p => p.totalSeconds || 0));

  progressData.forEach((progress) => {
    const dropoffPercent = Math.round((progress.watchedSeconds / maxSeconds) * 100);
    const bucket = Math.floor(dropoffPercent / 10) * 10;
    dropoffMap[bucket] = (dropoffMap[bucket] || 0) + 1;
  });

  const completionRate = (progressData.filter(p => p.completedAt).length / progressData.length) * 100;
  const avgWatchTime = progressData.reduce((sum, p) => sum + p.watchedSeconds, 0) / progressData.length;

  return {
    contentId,
    totalViewers: progressData.length,
    completionRate: Math.round(completionRate),
    averageWatchTimeSeconds: Math.round(avgWatchTime),
    dropoffDistribution: Object.entries(dropoffMap).map(([percent, count]) => ({
      watchedPercentage: parseInt(percent),
      viewerCount: count,
    })),
    criticalDropoffPoints: Object.entries(dropoffMap)
      .filter(([_, count]) => count > progressData.length * 0.2)
      .map(([percent]) => parseInt(percent)),
  };
}

export async function generateContentGaps(contentId) {
  const explanationRequests = await prisma.explanationFeedback.findMany({
    where: { contentId, wasConfused: true },
    select: { explanation: true, concept: true },
  });

  if (!explanationRequests.length) return null;

  const conceptFrequency = {};
  explanationRequests.forEach((req) => {
    const concept = req.concept || 'General Understanding';
    conceptFrequency[concept] = (conceptFrequency[concept] || 0) + 1;
  });

  const gaps = Object.entries(conceptFrequency)
    .map(([concept, count]) => ({
      concept,
      timesAskedFor: count,
      priority: count > 3 ? 'high' : count > 1 ? 'medium' : 'low',
    }))
    .sort((a, b) => b.timesAskedFor - a.timesAskedFor);

  return {
    contentId,
    totalGapsIdentified: gaps.length,
    topGaps: gaps.slice(0, 5),
    allGaps: gaps,
    recommendation: gaps.length > 0 ? `Focus on: ${gaps[0].concept}` : 'Content clarity is good!',
  };
}
