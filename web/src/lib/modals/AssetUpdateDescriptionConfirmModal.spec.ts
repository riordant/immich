import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import AssetUpdateDescriptionConfirmModal from './AssetUpdateDescriptionConfirmModal.svelte';

describe('AssetUpdateDescriptionConfirmModal', () => {
  it('prefills the textarea from the initial description', () => {
    render(AssetUpdateDescriptionConfirmModal, {
      props: {
        initialDescription: 'Existing video title',
        onClose: vi.fn(),
      },
    });

    expect(screen.getByRole('textbox')).toHaveValue('Existing video title');
  });

  it('submits an empty string so descriptions can be cleared', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(AssetUpdateDescriptionConfirmModal, {
      props: {
        initialDescription: 'Existing video title',
        onClose,
      },
    });

    await user.clear(screen.getByRole('textbox'));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onClose).toHaveBeenCalledWith('');
  });
});
