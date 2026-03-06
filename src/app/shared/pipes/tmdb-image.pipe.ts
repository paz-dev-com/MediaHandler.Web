import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'tmdbImage', pure: true })
export class TmdbImagePipe implements PipeTransform {
  private readonly baseUrl = 'https://image.tmdb.org/t/p';

  transform(path: string | null | undefined, size = 'w342'): string | null {
    if (!path) return null;
    return `${this.baseUrl}/${size}${path}`;
  }
}
