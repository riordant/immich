import { getMyVideoPlayback, updateMyVideoPlayback } from '@immich/sdk';

export const getVideoPlaybackPosition = async (assetId: string): Promise<number | null> => {
  const { positionSeconds } = await getMyVideoPlayback({ id: assetId });
  return positionSeconds ?? null;
};

export const updateVideoPlaybackPosition = async (
  assetId: string,
  positionSeconds: number,
): Promise<number | null> => {
  const response = await updateMyVideoPlayback({ videoPlaybackUpdateDto: { assetId, positionSeconds } });
  return response.positionSeconds ?? null;
};
