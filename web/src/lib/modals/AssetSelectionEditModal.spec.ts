import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { user as userStore } from '$lib/stores/user.store';
import { timelineAssetFactory } from '@test-data/factories/asset-factory';
import { userAdminFactory } from '@test-data/factories/user-factory';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { AssetEditAction } from '@immich/sdk';
import { vi } from 'vitest';
import AssetSelectionEditModal from './AssetSelectionEditModal.svelte';

const { waitForWebsocketEventMock } = vi.hoisted(() => ({
  waitForWebsocketEventMock: vi.fn().mockResolvedValue([{ asset: { id: 'unused' } }]),
}));

vi.mock('$lib/stores/websocket', () => ({
  waitForWebsocketEvent: waitForWebsocketEventMock,
}));

describe('AssetSelectionEditModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userStore.set(userAdminFactory.build({ id: 'owner-id' }));
  });

  it('shows orientation controls only', () => {
    render(AssetSelectionEditModal, {
      props: {
        assets: [timelineAssetFactory.build({ ownerId: 'owner-id', livePhotoVideoId: null })],
        onClose: vi.fn(),
      },
    });

    expect(screen.getByText('editor_orientation')).toBeInTheDocument();
    expect(screen.queryByText('crop')).not.toBeInTheDocument();
  });

  it('applies rotate edits to all selected assets', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const emitSpy = vi.spyOn(eventManager, 'emit');
    const refreshedAsset1 = { id: 'asset-1' };
    const refreshedAsset2 = { id: 'asset-2' };
    const assets = [
      timelineAssetFactory.build({ id: 'asset-1', ownerId: 'owner-id', livePhotoVideoId: null }),
      timelineAssetFactory.build({ id: 'asset-2', ownerId: 'owner-id', livePhotoVideoId: null }),
    ];

    sdkMock.getAssetEdits.mockResolvedValue({ assetId: 'asset-1', edits: [] } as never);
    sdkMock.editAsset.mockResolvedValue({ assetId: 'asset-1', edits: [] } as never);
    sdkMock.getAssetInfo.mockResolvedValueOnce(refreshedAsset1 as never).mockResolvedValueOnce(refreshedAsset2 as never);

    render(AssetSelectionEditModal, {
      props: {
        assets,
        onClose,
      },
    });

    await user.click(screen.getByRole('button', { name: 'editor_rotate_right' }));
    await user.click(screen.getByRole('button', { name: 'save' }));

    expect(sdkMock.getAssetEdits).toHaveBeenCalledTimes(2);
    expect(sdkMock.editAsset).toHaveBeenNthCalledWith(1, {
      id: 'asset-1',
      assetEditsCreateDto: {
        edits: [{ action: AssetEditAction.Rotate, parameters: { angle: 90 } }],
      },
    });
    expect(sdkMock.editAsset).toHaveBeenNthCalledWith(2, {
      id: 'asset-2',
      assetEditsCreateDto: {
        edits: [{ action: AssetEditAction.Rotate, parameters: { angle: 90 } }],
      },
    });
    expect(waitForWebsocketEventMock).toHaveBeenCalledTimes(2);
    expect(sdkMock.getAssetInfo).toHaveBeenNthCalledWith(1, { id: 'asset-1' });
    expect(sdkMock.getAssetInfo).toHaveBeenNthCalledWith(2, { id: 'asset-2' });
    expect(emitSpy).toHaveBeenCalledWith('AssetEditsApplied', 'asset-1');
    expect(emitSpy).toHaveBeenCalledWith('AssetUpdate', refreshedAsset1);
    expect(emitSpy).toHaveBeenCalledWith('AssetEditsApplied', 'asset-2');
    expect(emitSpy).toHaveBeenCalledWith('AssetUpdate', refreshedAsset2);
    expect(onClose).toHaveBeenCalledWith(true);
  });

  it('shows a loading spinner while edits are being applied', async () => {
    const user = userEvent.setup();
    const pending = new Promise<[{ asset: { id: string } }]>(() => {});

    waitForWebsocketEventMock.mockReturnValueOnce(pending);
    sdkMock.getAssetEdits.mockResolvedValue({ assetId: 'asset-1', edits: [] } as never);
    sdkMock.editAsset.mockResolvedValue({ assetId: 'asset-1', edits: [] } as never);

    render(AssetSelectionEditModal, {
      props: {
        assets: [timelineAssetFactory.build({ id: 'asset-1', ownerId: 'owner-id', livePhotoVideoId: null })],
        onClose: vi.fn(),
      },
    });

    await user.click(screen.getByRole('button', { name: 'editor_rotate_right' }));
    await user.click(screen.getByRole('button', { name: 'save' }));

    expect(screen.getByRole('button', { name: 'save' })).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
