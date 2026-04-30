import VideoProgressBar from '$lib/components/videos-page/video-progress-bar.svelte';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';

describe('VideoProgressBar component', () => {
  it('renders a playback progress bar when progress is provided', () => {
    render(VideoProgressBar, { progressPercent: 25 });

    expect(screen.getByTestId('video-progress-bar')).toHaveStyle({ width: '25%' });
  });

  it('does not render a playback progress bar when progress is missing', () => {
    render(VideoProgressBar);

    expect(screen.queryByTestId('video-progress-bar')).not.toBeInTheDocument();
  });
});
