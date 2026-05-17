import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'fileSize', pure: true })
export class FileSizePipe implements PipeTransform {
  transform(bytes: number | null | undefined): string {
    if (bytes === null || bytes === undefined) return '—';
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / Math.pow(1024, exponent);

    return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
  }
}
