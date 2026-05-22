import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { vi } from 'vitest';
import { RootFolderComponent } from './root-folder.component';
import { ClipboardService } from '@core/services/clipboard.service';

describe('RootFolderComponent', () => {
  let fixture: ComponentFixture<RootFolderComponent>;
  let component: RootFolderComponent;

  const clipboardSpy = { copy: vi.fn().mockResolvedValue(true) };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RootFolderComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: {}, fr: {} },
          translocoConfig: { availableLangs: ['en', 'fr'], defaultLang: 'en' },
        }),
      ],
      providers: [{ provide: ClipboardService, useValue: clipboardSpy }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(RootFolderComponent);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('initial state', () => {
    it('editing starts false', () => {
      fixture.detectChanges();
      expect(component.editing()).toBe(false);
    });

    it('showFallback starts false', () => {
      fixture.detectChanges();
      expect(component.showFallback()).toBe(false);
    });
  });

  describe('when rootFolder is set', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('rootFolder', '/nas/Movies/Breaking Bad');
      fixture.detectChanges();
    });

    it('displays the path', () => {
      expect(component.rootFolder()).toBe('/nas/Movies/Breaking Bad');
    });

    it('calls clipboard.copy on copyPath()', async () => {
      await component.copyPath();
      expect(clipboardSpy.copy).toHaveBeenCalledWith('/nas/Movies/Breaking Bad');
    });

    it('sets showFallback true when clipboard fails', async () => {
      clipboardSpy.copy.mockResolvedValue(false);
      await component.copyPath();
      expect(component.showFallback()).toBe(true);
    });

    it('clearFallback resets showFallback', async () => {
      clipboardSpy.copy.mockResolvedValue(false);
      await component.copyPath();
      component.clearFallback();
      expect(component.showFallback()).toBe(false);
    });
  });

  describe('when rootFolder is null', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('rootFolder', null);
      fixture.detectChanges();
    });

    it('has null rootFolder', () => {
      expect(component.rootFolder()).toBeNull();
    });
  });

  describe('edit mode (admin)', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('rootFolder', '/nas/Movies');
      fixture.componentRef.setInput('isAdmin', true);
      fixture.detectChanges();
    });

    it('startEdit sets editing true and populates editValue', () => {
      component.startEdit();
      expect(component.editing()).toBe(true);
      expect(component.editValue()).toBe('/nas/Movies');
    });

    it('cancelEdit resets editing to false', () => {
      component.startEdit();
      component.cancelEdit();
      expect(component.editing()).toBe(false);
    });

    it('saveEdit emits rootFolderSaved with trimmed value', () => {
      const emitted: (string | null)[] = [];
      component.rootFolderSaved.subscribe((v) => emitted.push(v));
      component.startEdit();
      component.editValue.set('  /new/path  ');
      component.saveEdit();
      expect(emitted).toEqual(['/new/path']);
      expect(component.editing()).toBe(false);
    });

    it('saveEdit emits null when edit value is empty', () => {
      const emitted: (string | null)[] = [];
      component.rootFolderSaved.subscribe((v) => emitted.push(v));
      component.startEdit();
      component.editValue.set('   ');
      component.saveEdit();
      expect(emitted).toEqual([null]);
    });
  });

  describe('non-admin', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('isAdmin', false);
      fixture.detectChanges();
    });

    it('isAdmin is false', () => {
      expect(component.isAdmin()).toBe(false);
    });
  });
});
