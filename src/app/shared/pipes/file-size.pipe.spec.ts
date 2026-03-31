import { FileSizePipe } from './file-size.pipe';

describe('FileSizePipe', () => {
  let pipe: FileSizePipe;

  beforeEach(() => {
    pipe = new FileSizePipe();
  });

  it('should return "—" for null', () => {
    expect(pipe.transform(null)).toBe('—');
  });

  it('should return "—" for undefined', () => {
    expect(pipe.transform(undefined)).toBe('—');
  });

  it('should return "0 B" for 0', () => {
    expect(pipe.transform(0)).toBe('0 B');
  });

  it('should return bytes for values under 1 KB', () => {
    expect(pipe.transform(512)).toBe('512 B');
  });

  it('should return KB for values between 1 KB and 1 MB', () => {
    expect(pipe.transform(1024)).toBe('1.0 KB');
    expect(pipe.transform(1536)).toBe('1.5 KB');
  });

  it('should return MB for values between 1 MB and 1 GB', () => {
    expect(pipe.transform(1024 * 1024)).toBe('1.0 MB');
    expect(pipe.transform(1.5 * 1024 * 1024)).toBe('1.5 MB');
  });

  it('should return GB for values between 1 GB and 1 TB', () => {
    expect(pipe.transform(1024 * 1024 * 1024)).toBe('1.0 GB');
  });

  it('should return TB for very large values', () => {
    expect(pipe.transform(1024 * 1024 * 1024 * 1024)).toBe('1.0 TB');
  });
});
