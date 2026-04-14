import VideoTitleBand from '$lib/components/videos-page/video-title-band.svelte';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';

describe('VideoTitleBand component', () => {
  it('renders the filename without the extension', () => {
    render(VideoTitleBand, { originalFileName: 'Family Trip 2024.mov' });

    expect(screen.getByText('Family Trip 2024')).toBeInTheDocument();
  });

  it('preserves dots in the base filename', () => {
    render(VideoTitleBand, { originalFileName: 'clip.v1.final.mp4' });

    const title = screen.getByText('clip.v1.final');
    expect(title).toHaveAttribute('title', 'clip.v1.final.mp4');
  });
});
