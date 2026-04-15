import { userInteraction } from '$lib/stores/user.svelte';
import { getMyVideoPlayback, getMyVideoPlaybacks, updateMyVideoPlayback } from '@immich/sdk';

const setCachedVideoPlaybackPosition = (assetId: string, positionSeconds: number | null) => {
  if (userInteraction.videoPlaybackPositions === undefined) {
    return;
  }

  if (positionSeconds === null) {
    const { [assetId]: _removed, ...remainingPositions } = userInteraction.videoPlaybackPositions;
    userInteraction.videoPlaybackPositions = remainingPositions;
    return;
  }

  userInteraction.videoPlaybackPositions = {
    ...userInteraction.videoPlaybackPositions,
    [assetId]: positionSeconds,
  };
};

export const getVideoPlaybackPositions = async (): Promise<Record<string, number>> => {
  const entries = await getMyVideoPlaybacks();
  const positions = Object.fromEntries(entries.map(({ assetId, positionSeconds }) => [assetId, positionSeconds]));
  userInteraction.videoPlaybackPositions = positions;
  return positions;
};

export const getVideoPlaybackPosition = async (assetId: string): Promise<number | null> => {
  const { positionSeconds } = await getMyVideoPlayback({ id: assetId });
  return positionSeconds ?? null;
};

export const updateVideoPlaybackPosition = async (
  assetId: string,
  positionSeconds: number,
): Promise<number | null> => {
  const response = await updateMyVideoPlayback({ videoPlaybackUpdateDto: { assetId, positionSeconds } });
  const persistedPosition = response.positionSeconds ?? null;
  setCachedVideoPlaybackPosition(assetId, persistedPosition);
  return persistedPosition;
};
