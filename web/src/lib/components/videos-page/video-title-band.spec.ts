import VideoTitleBand from '$lib/components/videos-page/video-title-band.svelte';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';

describe('VideoTitleBand component', () => {
  it('renders the provided title when available', () => {
    render(VideoTitleBand, { title: 'Best Day Ever' });

    const title = screen.getByText('Best Day Ever');
    expect(title).toHaveAttribute('title', 'Best Day Ever');
  });

  it('trims the title before rendering', () => {
    render(VideoTitleBand, { title: '  Best Day Ever  ' });

    const title = screen.getByText('Best Day Ever');
    expect(title).toHaveAttribute('title', 'Best Day Ever');
  });

  it('renders nothing when the title is missing', () => {
    render(VideoTitleBand, { title: null });

    expect(screen.queryByText(/.+/)).not.toBeInTheDocument();
  });

  it('renders nothing when the title is blank', () => {
    render(VideoTitleBand, { title: '   ' });

    expect(screen.queryByText(/.+/)).not.toBeInTheDocument();
  });
});
