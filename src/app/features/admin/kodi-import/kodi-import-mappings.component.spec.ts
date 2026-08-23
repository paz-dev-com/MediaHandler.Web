import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ConfirmationService, MessageService } from 'primeng/api';
import { KodiImportMappingsComponent } from './kodi-import-mappings.component';
import { AdminKodiPathMappingService } from './admin-kodi-path-mapping.service';
import { makePathMapping } from './kodi-import-test-factory';
import { vi } from 'vitest';

describe('KodiImportMappingsComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<KodiImportMappingsComponent>>;
  let component: KodiImportMappingsComponent;
  let service: AdminKodiPathMappingService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        KodiImportMappingsComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: {}, fr: {} },
          translocoConfig: { availableLangs: ['en', 'fr'], defaultLang: 'en' },
        }),
      ],
      providers: [provideRouter([]), provideNoopAnimations(), MessageService, ConfirmationService],
    }).compileComponents();

    fixture = TestBed.createComponent(KodiImportMappingsComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(AdminKodiPathMappingService);
    fixture.detectChanges();
  });

  it('should load mappings on init', () => {
    const spy = vi.spyOn(service, 'loadMappings');
    component.ngOnInit();
    expect(spy).toHaveBeenCalled();
  });

  it('should render mappings in sort order', () => {
    service.mappings.set([
      makePathMapping({ id: 'm2', kodiPrefix: 'b/', sortOrder: 2 }),
      makePathMapping({ id: 'm1', kodiPrefix: 'a/', sortOrder: 1 }),
    ]);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('a/');
    expect(text).toContain('b/');
  });

  it('should open add dialog', () => {
    const spy = vi.spyOn(component.mappingDialog, 'open');
    component.onAdd();
    expect(spy).toHaveBeenCalled();
  });

  it('should open edit dialog with mapping', () => {
    const mapping = makePathMapping();
    const spy = vi.spyOn(component.mappingDialog, 'openForEdit');
    component.onEdit(mapping);
    expect(spy).toHaveBeenCalledWith(mapping);
  });

  it('should call remove after confirmation', () => {
    const removeSpy = vi
      .spyOn(service, 'remove')
      .mockReturnValue({ subscribe: () => undefined } as never);
    const confirmationService = (
      component as unknown as { confirmationService: ConfirmationService }
    ).confirmationService;
    const confirmSpy = vi.spyOn(confirmationService, 'confirm').mockImplementation((cfg) => {
      cfg.accept?.();
      return undefined as never;
    });

    component.onRemove(makePathMapping());

    expect(confirmSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalledWith('mapping-1');
  });
});
