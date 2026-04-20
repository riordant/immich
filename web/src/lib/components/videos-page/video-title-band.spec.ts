import VideoTitleBand from '$lib/components/videos-page/video-title-band.svelte';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';

describe('VideoTitleBand component', () => {
  it('renders the provided title when available', () => {
    render(VideoTitleBand, { originalFileName: 'Family Trip 2024.mov', title: 'Best Day Ever' });

    const title = screen.getByText('Best Day Ever');
    expect(title).toHaveAttribute('title', 'Best Day Ever');
  });

  it('falls back to the filename without the extension when the title is missing', () => {
    render(VideoTitleBand, { originalFileName: 'Family Trip 2024.mov', title: null });

    expect(screen.getByText('Family Trip 2024')).toBeInTheDocument();
  });

  it('renders the filename without the extension', () => {
    render(VideoTitleBand, { originalFileName: 'Family Trip 2024.mov' });

    expect(screen.getByText('Family Trip 2024')).toBeInTheDocument();
  });

  it('preserves dots in the base filename', () => {
    render(VideoTitleBand, { originalFileName: 'clip.v1.final.mp4' });

    const title = screen.getByText('clip.v1.final');
    expect(title).toHaveAttribute('title', 'clip.v1.final.mp4');
  });

  it('falls back to the filename when the provided title is blank', () => {
    render(VideoTitleBand, { originalFileName: 'clip.v1.final.mp4', title: '   ' });

    const title = screen.getByText('clip.v1.final');
    expect(title).toHaveAttribute('title', 'clip.v1.final.mp4');
  });

  it('renders a playback progress bar when progress is provided', () => {
    render(VideoTitleBand, { originalFileName: 'Family Trip 2024.mov', progressPercent: 25 });

    expect(screen.getByTestId('video-progress-bar')).toHaveStyle({ width: '25%' });
  });

  it('does not render a playback progress bar when progress is missing', () => {
    render(VideoTitleBand, { originalFileName: 'Family Trip 2024.mov' });

    expect(screen.queryByTestId('video-progress-bar')).not.toBeInTheDocument();
  });
});
