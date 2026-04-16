import { render } from 'src/services/api.service';

describe('render', () => {
  it('renders extended open graph and twitter tags', () => {
    const html = render('<html><head><!-- metadata:tags --></head></html>', {
      title: 'Ava shared album: Summer 2025 with you',
      description: 'Our best week away',
      url: 'https://vault.example/share/abc123',
      siteName: 'Immich',
      imageUrl: 'https://vault.example/api/assets/asset-1/thumbnail?key=abc123',
      imageAlt: 'Ava shared album: Summer 2025 with you',
      imageWidth: 1920,
      imageHeight: 1080,
    });

    expect(html).toContain('<meta property="og:title" content="Ava shared album: Summer 2025 with you" />');
    expect(html).toContain('<meta property="og:url" content="https://vault.example/share/abc123" />');
    expect(html).toContain('<meta property="og:site_name" content="Immich" />');
    expect(html).toContain(
      '<meta property="og:image" content="https://vault.example/api/assets/asset-1/thumbnail?key=abc123" />',
    );
    expect(html).toContain('<meta property="og:image:alt" content="Ava shared album: Summer 2025 with you" />');
    expect(html).toContain('<meta property="og:image:width" content="1920" />');
    expect(html).toContain('<meta property="og:image:height" content="1080" />');
    expect(html).toContain('<meta name="twitter:url" content="https://vault.example/share/abc123" />');
    expect(html).toContain(
      '<meta name="twitter:image" content="https://vault.example/api/assets/asset-1/thumbnail?key=abc123" />',
    );
    expect(html).toContain('<meta name="twitter:image:alt" content="Ava shared album: Summer 2025 with you" />');
  });
});
