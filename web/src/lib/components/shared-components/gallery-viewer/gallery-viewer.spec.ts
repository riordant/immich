import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
import { AssetTypeEnum } from '@immich/sdk';
import { assetFactory } from '@test-data/factories/asset-factory';
import { render, screen } from '@testing-library/svelte';

vi.mock('$lib/components/assets/thumbnail/thumbnail.svelte', async () => {
  const { default: MockThumbnail } = await import('@test-data/MockThumbnail.svelte');

  return {
    default: MockThumbnail,
  };
});

describe('GalleryViewer component', () => {
  beforeEach(() => {
    assetMultiSelectManager.clear();
  });

  afterEach(() => {
    assetMultiSelectManager.clear();
  });

  it('renders video title bands only for video assets when enabled', () => {
    const video = assetFactory.build({
      type: AssetTypeEnum.Video,
      originalFileName: 'Holiday Clip.mov',
      exifInfo: { description: 'Edited Holiday Title' },
    });
    const photo = assetFactory.build({
      type: AssetTypeEnum.Image,
      originalFileName: 'family-photo.jpg',
      exifInfo: { description: 'Photo Description' },
    });

    render(GalleryViewer, {
      assets: [video, photo],
      assetInteraction: assetMultiSelectManager,
      viewport: { width: 800, height: 600 },
      showVideoTitleBand: true,
    });

    expect(screen.getByText('Edited Holiday Title')).toBeInTheDocument();
    expect(screen.queryByText('family-photo')).not.toBeInTheDocument();
    expect(screen.queryByText('Photo Description')).not.toBeInTheDocument();
  });
});
