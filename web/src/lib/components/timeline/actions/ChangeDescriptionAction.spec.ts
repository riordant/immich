import { sdkMock } from '$lib/__mocks__/sdk.mock';
import ChangeDescriptionAction from '$lib/components/timeline/actions/ChangeDescriptionAction.svelte';
import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
import { eventManager } from '$lib/managers/event-manager.svelte';
import AssetUpdateDescriptionConfirmModal from '$lib/modals/AssetUpdateDescriptionConfirmModal.svelte';
import { user as userStore } from '$lib/stores/user.store';
import { modalManager } from '@immich/ui';
import { timelineAssetFactory } from '@test-data/factories/asset-factory';
import { userAdminFactory } from '@test-data/factories/user-factory';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';

describe('ChangeDescriptionAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assetMultiSelectManager.clear();
    userStore.set(userAdminFactory.build({ id: 'owner-id' }));
  });

  afterEach(() => {
    assetMultiSelectManager.clear();
  });

  it('prefills the modal with the selected asset description', async () => {
    const showSpy = vi.spyOn(modalManager, 'show').mockImplementation(() => Promise.resolve(undefined) as never);
    assetMultiSelectManager.selectAsset(
      timelineAssetFactory.build({
        ownerId: 'owner-id',
        description: 'Existing video title',
      }),
    );

    render(ChangeDescriptionAction, { props: { menuItem: true } });

    await fireEvent.click(screen.getByRole('menuitem', { name: /change_description/ }));

    expect(showSpy).toHaveBeenCalledWith(AssetUpdateDescriptionConfirmModal, {
      initialDescription: 'Existing video title',
    });
  });

  it('leaves the modal blank for mixed selected descriptions', async () => {
    const showSpy = vi.spyOn(modalManager, 'show').mockImplementation(() => Promise.resolve(undefined) as never);
    assetMultiSelectManager.selectAssets([
      timelineAssetFactory.build({ ownerId: 'owner-id', description: 'First title' }),
      timelineAssetFactory.build({ ownerId: 'owner-id', description: 'Second title' }),
    ]);

    render(ChangeDescriptionAction, { props: { menuItem: true } });

    await fireEvent.click(screen.getByRole('menuitem', { name: /change_description/ }));

    expect(showSpy).toHaveBeenCalledWith(AssetUpdateDescriptionConfirmModal, {
      initialDescription: '',
    });
  });

  it('saves an empty description and emits AssetUpdate after refreshing the asset', async () => {
    vi.spyOn(modalManager, 'show').mockImplementation(() => Promise.resolve('') as never);
    const emitSpy = vi.spyOn(eventManager, 'emit');
    const asset = timelineAssetFactory.build({
      id: 'asset-1',
      ownerId: 'owner-id',
      description: 'Existing video title',
    });
    const refreshedAsset = { id: 'asset-1' };

    assetMultiSelectManager.selectAsset(asset);
    sdkMock.getAssetInfo.mockResolvedValue(refreshedAsset as never);

    render(ChangeDescriptionAction, { props: { menuItem: true } });

    await fireEvent.click(screen.getByRole('menuitem', { name: /change_description/ }));

    await waitFor(() => {
      expect(sdkMock.updateAssets).toHaveBeenCalledWith({
        assetBulkUpdateDto: {
          ids: ['asset-1'],
          description: '',
        },
      });
    });
    expect(sdkMock.getAssetInfo).toHaveBeenCalledWith({ id: 'asset-1' });
    expect(emitSpy).toHaveBeenCalledWith('AssetUpdate', refreshedAsset);
  });
});
