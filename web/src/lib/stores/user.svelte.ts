import { eventManager } from '$lib/managers/event-manager.svelte';
import type {
  AlbumResponseDto,
  AssetResponseDto,
  ServerAboutResponseDto,
  ServerStorageResponseDto,
  ServerVersionHistoryResponseDto,
} from '@immich/sdk';

interface UserInteractions {
  recentAlbums?: AlbumResponseDto[];
  recentVideos?: AssetResponseDto[];
  videoPlaybackPositions?: Record<string, number>;
  versions?: ServerVersionHistoryResponseDto[];
  aboutInfo?: ServerAboutResponseDto;
  serverInfo?: ServerStorageResponseDto;
}

const defaultUserInteraction: UserInteractions = {
  recentAlbums: undefined,
  recentVideos: undefined,
  videoPlaybackPositions: undefined,
  versions: undefined,
  aboutInfo: undefined,
  serverInfo: undefined,
};

export const userInteraction = $state<UserInteractions>(defaultUserInteraction);

const resetRecentAlbums = () => {
  userInteraction.recentAlbums = undefined;
};

const updateRecentVideos = (asset: AssetResponseDto) => {
  if (!userInteraction.recentVideos) {
    return;
  }

  userInteraction.recentVideos = userInteraction.recentVideos.map((video) => (video.id === asset.id ? asset : video));
};

const reset = () => {
  Object.assign(userInteraction, defaultUserInteraction);
};

eventManager.on({
  AssetUpdate: (asset) => updateRecentVideos(asset),
  AlbumCreate: () => resetRecentAlbums(),
  AlbumUpdate: () => resetRecentAlbums(),
  AlbumDelete: () => resetRecentAlbums(),
  AuthLogout: () => reset(),
});
