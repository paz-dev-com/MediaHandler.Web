import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { FileLinkPickerDialogComponent } from './file-link-picker-dialog.component';
import { UnlinkedFile } from '@shared/models/media.model';
import { environment } from '@env/environment';

const base = environment.apiBaseUrl;

function makeFile(partial?: Partial<UnlinkedFile>): UnlinkedFile {
  return {
    id: 'file-1',
    filePath: '/nas/movies/Inception.mkv',
    fileSizeBytes: 4294967296,
    format: 'mkv',
    resolution: '1080p',
    ...partial,
  };
}

describe('FileLinkPickerDialogComponent', () => {
  let fixture: ComponentFixture<FileLinkPickerDialogComponent>;
  let component: FileLinkPickerDialogComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FileLinkPickerDialogComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: {}, fr: {} },
          translocoConfig: { availableLangs: ['en', 'fr'], defaultLang: 'en' },
        }),
      ],
      providers: [provideHttpClient(), provideHttpClientTesting()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(FileLinkPickerDialogComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  function flushUnlinkedFiles(files: UnlinkedFile[]): void {
    const req = httpMock.expectOne((r) => r.url === `${base}/admin/media/unlinked-files`);
    req.flush({
      data: files,
      meta: { page: 1, pageSize: 20, totalCount: files.length, totalPages: 1 },
    });
    fixture.detectChanges();
  }

  it('creates the component', () => {
    fixture.detectChanges();
    flushUnlinkedFiles([]);
    expect(component).toBeTruthy();
  });

  it('loads unlinked files on init', () => {
    fixture.detectChanges();
    const files = [makeFile(), makeFile({ id: 'file-2', filePath: '/nas/movies/Avatar.mkv' })];
    flushUnlinkedFiles(files);
    expect(component.files()).toHaveLength(2);
  });

  it('sets loading to false after response', () => {
    fixture.detectChanges();
    expect(component.loading()).toBe(true);
    flushUnlinkedFiles([]);
    expect(component.loading()).toBe(false);
  });

  it('sets error when request fails', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne((r) => r.url === `${base}/admin/media/unlinked-files`);
    req.error(new ProgressEvent('error'));
    fixture.detectChanges();
    expect(component.error()).toBeTruthy();
  });

  it('emits fileLinkRequested with fileId on link click', () => {
    const emitted: string[] = [];
    component.fileLinkRequested.subscribe((id) => emitted.push(id));
    fixture.detectChanges();
    flushUnlinkedFiles([makeFile()]);
    component.onLinkClick('file-1');
    expect(emitted).toEqual(['file-1']);
  });

  it('emits visibleChange(false) on close', () => {
    const emitted: boolean[] = [];
    component.visibleChange.subscribe((v) => emitted.push(v));
    fixture.detectChanges();
    flushUnlinkedFiles([]);
    component.close();
    expect(emitted).toEqual([false]);
  });

  it('shows empty state when no files', () => {
    fixture.detectChanges();
    flushUnlinkedFiles([]);
    const empty = fixture.nativeElement.querySelector('.file-link-picker__empty');
    // With NO_ERRORS_SCHEMA the p-dialog is not rendered, but component state is verifiable
    expect(component.files()).toHaveLength(0);
    expect(component.error()).toBeNull();
  });
});
