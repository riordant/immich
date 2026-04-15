import { clampResumePosition, getPlaybackPositionToPersist, getPlaybackProgressPercent } from '$lib/utils/video-playback';

describe('video playback utils', () => {
  it('returns null for positions at the start of the video', () => {
    expect(getPlaybackPositionToPersist({ currentTime: 0, durationSeconds: 300 })).toBeNull();
  });

  it('returns the floored playback position while the video is in progress', () => {
    expect(getPlaybackPositionToPersist({ currentTime: 42.9, durationSeconds: 300 })).toBe(42);
  });

  it('returns zero when playback is within the completion threshold', () => {
    expect(getPlaybackPositionToPersist({ currentTime: 296, durationSeconds: 300 })).toBe(0);
  });

  it('clamps the resume position away from the end of the video', () => {
    expect(clampResumePosition({ savedPositionSeconds: 298, durationSeconds: 300 })).toBe(295);
  });

  it('returns null when no saved position is available', () => {
    expect(clampResumePosition({ savedPositionSeconds: null, durationSeconds: 300 })).toBeNull();
  });

  it('returns a playback progress percentage when position and duration are available', () => {
    expect(getPlaybackProgressPercent({ duration: '00:02:00.000', positionSeconds: 30 })).toBe(25);
  });

  it('returns null when playback progress cannot be derived', () => {
    expect(getPlaybackProgressPercent({ duration: null, positionSeconds: 30 })).toBeNull();
    expect(getPlaybackProgressPercent({ duration: '00:02:00.000', positionSeconds: null })).toBeNull();
  });
});
