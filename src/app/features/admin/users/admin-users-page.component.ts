import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { AdminUser, AdminUserService } from './admin-user.service';

interface RoleOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-admin-users-page',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    TranslocoModule,
    TableModule,
    InputTextModule,
    SelectModule,
    TagModule,
    ToggleSwitchModule,
    ButtonModule,
  ],
  templateUrl: './admin-users-page.component.html',
  styleUrl: './admin-users-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsersPageComponent implements OnInit, OnDestroy {
  private readonly userService = inject(AdminUserService);
  private readonly messageService = inject(MessageService);
  private readonly transloco = inject(TranslocoService);
  private readonly destroy$ = new Subject<void>();
  private readonly search$ = new Subject<string>();

  readonly users = this.userService.users;
  readonly loading = this.userService.loading;
  readonly meta = this.userService.meta;

  readonly searchQuery = signal('');

  readonly roleOptions: RoleOption[] = [
    { label: 'Admin', value: 'admin' },
    { label: 'User', value: 'user' },
  ];

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((query) => {
        this.userService.getUsers(1, this.meta().pageSize, query || undefined);
      });

    this.userService.getUsers(1, 20);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.search$.next(value);
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const pageSize = (event.rows as number) ?? this.meta().pageSize;
    const first = (event.first as number) ?? 0;
    const page = Math.floor(first / pageSize) + 1;
    this.userService.getUsers(page, pageSize, this.searchQuery() || undefined);
  }

  onRoleChange(user: AdminUser, role: string): void {
    this.userService.setRole(user.id, role);
    this.messageService.add({
      severity: 'success',
      summary: this.transloco.translate('admin.users.roleChanged'),
      life: 3000,
    });
  }

  onActiveToggle(user: AdminUser, isActive: boolean): void {
    this.userService.setActive(user.id, isActive);
    this.messageService.add({
      severity: 'success',
      summary: this.transloco.translate(
        isActive ? 'admin.users.activated' : 'admin.users.deactivated',
      ),
      life: 3000,
    });
  }

  getActiveTagSeverity(isActive: boolean): 'success' | 'danger' {
    return isActive ? 'success' : 'danger';
  }
}
