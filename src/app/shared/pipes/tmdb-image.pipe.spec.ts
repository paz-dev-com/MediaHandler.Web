import { TmdbImagePipe } from './tmdb-image.pipe';

describe('TmdbImagePipe', () => {
  let pipe: TmdbImagePipe;

  beforeEach(() => {
    pipe = new TmdbImagePipe();
  });

  it('should return null for null path', () => {
    expect(pipe.transform(null)).toBeNull();
  });

  it('should return null for undefined path', () => {
    expect(pipe.transform(undefined)).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(pipe.transform('')).toBeNull();
  });

  it('should build a valid URL with default size (w342)', () => {
    expect(pipe.transform('/abc.jpg')).toBe('https://image.tmdb.org/t/p/w342/abc.jpg');
  });

  it('should build a valid URL with a custom size', () => {
    expect(pipe.transform('/abc.jpg', 'original')).toBe(
      'https://image.tmdb.org/t/p/original/abc.jpg',
    );
  });

  it('should build a valid URL with w185 size', () => {
    expect(pipe.transform('/poster.jpg', 'w185')).toBe(
      'https://image.tmdb.org/t/p/w185/poster.jpg',
    );
  });
});
