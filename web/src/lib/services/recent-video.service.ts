import { userInteraction } from '$lib/stores/user.svelte';
import { getMyRecentVideos, updateMyRecentVideos, type AssetResponseDto } from '@immich/sdk';

export const getRecentVideos = async (): Promise<AssetResponseDto[]> => {
  const assets = await getMyRecentVideos();
  userInteraction.recentVideos = assets;
  return assets;
};

export const recordRecentVideo = async (assetId: string): Promise<AssetResponseDto[]> => {
  const assets = await updateMyRecentVideos({ recentVideoUpdateDto: { assetId } });
  userInteraction.recentVideos = assets;
  return assets;
};
