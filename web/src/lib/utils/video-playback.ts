export const PLAYBACK_SAVE_INTERVAL_MS = 5000;
export const PLAYBACK_COMPLETE_THRESHOLD_SECONDS = 5;

export const getPlaybackPositionToPersist = ({
  currentTime,
  durationSeconds,
}: {
  currentTime: number;
  durationSeconds?: number | null;
}): number | null => {
  const currentPositionSeconds = Math.floor(currentTime);
  const resolvedDurationSeconds =
    durationSeconds !== null && durationSeconds !== undefined && Number.isFinite(durationSeconds)
      ? Math.floor(durationSeconds)
      : null;

  if (
    resolvedDurationSeconds !== null &&
    resolvedDurationSeconds - currentPositionSeconds <= PLAYBACK_COMPLETE_THRESHOLD_SECONDS
  ) {
    return 0;
  }

  return currentPositionSeconds > 0 ? currentPositionSeconds : null;
};

export const clampResumePosition = ({
  savedPositionSeconds,
  durationSeconds,
}: {
  savedPositionSeconds: number | null;
  durationSeconds: number;
}): number | null => {
  if (!savedPositionSeconds || !Number.isFinite(durationSeconds)) {
    return null;
  }

  return Math.min(savedPositionSeconds, Math.max(durationSeconds - PLAYBACK_COMPLETE_THRESHOLD_SECONDS, 0));
};
