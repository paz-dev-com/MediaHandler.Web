import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { AccordionModule } from 'primeng/accordion';

@Component({
  selector: 'app-import-results',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule, AccordionModule],
  template: `
    <p-accordion [multiple]="true">
      <p-accordion-panel>
        <p-accordion-header>{{ titleKey() | transloco }}</p-accordion-header>
        <p-accordion-content>
          <dl class="import-results__stats">
            @if (totalUnlinked() !== null) {
              <dt>{{ 'nasScanner.autoImport.results.totalUnlinked' | transloco }}</dt>
              <dd>{{ totalUnlinked() }}</dd>
            }
            <dt>{{ 'nasScanner.scanAndImport.results.matched' | transloco }}</dt>
            <dd>{{ matched() }}</dd>
            <dt>{{ 'nasScanner.scanAndImport.results.skipped' | transloco }}</dt>
            <dd>{{ skipped() }}</dd>
            <dt>{{ 'nasScanner.scanAndImport.results.failed' | transloco }}</dt>
            <dd>{{ failed() }}</dd>
          </dl>
        </p-accordion-content>
      </p-accordion-panel>
      @if (errors().length > 0) {
        <p-accordion-panel>
          <p-accordion-header>{{ 'nasScanner.scanAndImport.errors.title' | transloco }}</p-accordion-header>
          <p-accordion-content>
            <ul>
              @for (err of errors(); track err) {
                <li>{{ err }}</li>
              }
            </ul>
          </p-accordion-content>
        </p-accordion-panel>
      }
    </p-accordion>
  `,
  styles: [`
    .import-results__stats {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.4rem 1.5rem;
      margin: 0;

      dt {
        font-weight: 600;
        color: var(--text-color-secondary);
      }

      dd {
        margin: 0;
        font-weight: 500;
      }
    }
  `],
})
export class ImportResultsComponent {
  readonly matched = input.required<number>();
  readonly skipped = input.required<number>();
  readonly failed = input.required<number>();
  readonly errors = input.required<string[]>();
  readonly totalUnlinked = input<number | null>(null);
  readonly titleKey = input<string>('nasScanner.scanAndImport.results.title');
}

