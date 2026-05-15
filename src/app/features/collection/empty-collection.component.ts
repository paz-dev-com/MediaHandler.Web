import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-empty-collection',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslocoModule, ButtonModule],
  templateUrl: './empty-collection.component.html',
  styleUrl: './empty-collection.component.scss',
})
export class EmptyCollectionComponent {}
