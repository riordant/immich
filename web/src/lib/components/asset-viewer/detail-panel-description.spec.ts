import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { assetFactory } from '@test-data/factories/asset-factory';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import DetailPanelDescription from './detail-panel-description.svelte';

describe('DetailPanelDescription', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('clears unsaved draft on asset change', async () => {
    const user = userEvent.setup();

    const assetA = assetFactory.build({
      id: 'asset-a',
      exifInfo: { description: '' },
    });
    const assetB = assetFactory.build({
      id: 'asset-b',
      exifInfo: { description: '' },
    });

    const { rerender } = render(DetailPanelDescription, {
      props: {
        asset: assetA,
        isOwner: true,
      },
    });

    const textarea = screen.getByTestId('autogrow-textarea') as HTMLTextAreaElement;
    await user.type(textarea, 'unsaved draft');
    expect(textarea).toHaveValue('unsaved draft');

    await rerender({
      asset: assetB,
      isOwner: true,
    });

    expect(screen.getByTestId('autogrow-textarea')).toHaveValue('');
  });

  it('updates description on asset switch', async () => {
    const assetA = assetFactory.build({
      id: 'asset-a',
      exifInfo: { description: 'first description' },
    });
    const assetB = assetFactory.build({
      id: 'asset-b',
      exifInfo: { description: 'second description' },
    });

    const { rerender } = render(DetailPanelDescription, {
      props: {
        asset: assetA,
        isOwner: true,
      },
    });

    expect(screen.getByTestId('autogrow-textarea')).toHaveValue('first description');

    await rerender({
      asset: assetB,
      isOwner: true,
    });

    expect(screen.getByTestId('autogrow-textarea')).toHaveValue('second description');
  });

  it('emits AssetUpdate after saving a new description', async () => {
    const user = userEvent.setup();
    const emitSpy = vi.spyOn(eventManager, 'emit');
    const asset = assetFactory.build({
      id: 'asset-a',
      exifInfo: { description: 'first description' },
    });
    const updatedAsset = assetFactory.build({
      ...asset,
      exifInfo: { description: 'updated description' },
    });
    sdkMock.updateAsset.mockResolvedValue(updatedAsset);

    render(DetailPanelDescription, {
      props: {
        asset,
        isOwner: true,
      },
    });

    const textarea = screen.getByTestId('autogrow-textarea');
    await user.clear(textarea);
    await user.type(textarea, 'updated description');
    await user.tab();

    expect(sdkMock.updateAsset).toHaveBeenCalledWith({
      id: asset.id,
      updateAssetDto: { description: 'updated description' },
    });
    expect(emitSpy).toHaveBeenCalledWith('AssetUpdate', updatedAsset);
  });
});
