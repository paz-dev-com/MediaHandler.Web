# Quickstart: Administration Dashboard

**Feature**: 004-admin-dashboard  
**Branch**: `develop`  
**Updated**: 2025-07-18 (US7–US12 extension)

## Prerequisites

- Backend API running with admin endpoints available
- An Auth0 user with `Admin` role configured
- Node.js and npm installed

## Dev Setup

```bash
cd /home/tpfeifer/Repos/MediaHandler/MediaHandler.Web
npm install
npm start
```

Navigate to `http://localhost:4200` and log in with an Admin account.

## Key Files — Existing (US1–US6, already implemented)

```
src/app/features/admin/
├── admin.routes.ts                      # Parent + child routes
├── admin-layout.component.ts/html/scss  # Shared layout with Tabs sub-nav
├── dashboard/
│   ├── admin-dashboard-page.component.ts/html/scss
│   ├── admin-health.service.ts
│   └── health-panel.component.ts/html/scss
├── users/
│   ├── admin-users-page.component.ts/html/scss
│   ├── admin-user.service.ts
│   └── admin-user.service.spec.ts
├── library-roots/
│   ├── admin-library-roots-page.component.ts/html/scss
│   ├── add-library-root-dialog.component.ts/html/scss
│   ├── admin-library-root.service.ts
│   └── admin-library-root.service.spec.ts
├── scanner/
│   ├── admin-scanner-page.component.ts/html/scss
│   ├── scan-launcher.component.ts/html/scss
│   ├── scan-status.component.ts/html/scss
│   ├── scan-history-table.component.ts/html/scss
│   ├── admin-scan.service.ts
│   └── admin-scan.service.spec.ts
└── review/
    ├── admin-review-page.component.ts/html/scss
    ├── review-resolve-dialog.component.ts/html/scss
    ├── admin-review.service.ts
    └── admin-review.service.spec.ts
```

## Key Files — New (US7–US12, to be created)

### 1. Scan Results Browser (US7, US9)

```
src/app/features/admin/scan-results/
├── admin-scan-results-page.component.ts     # Page: scan selector, filters, table/groups toggle
├── admin-scan-results-page.component.html
├── admin-scan-results-page.component.scss
├── scan-decision-table.component.ts         # p-table: paginated decision list with row expand
├── scan-decision-table.component.html
├── scan-decision-table.component.scss
├── scan-decision-detail.component.ts        # Expanded row: candidates, reassign, search TMDB
├── scan-decision-detail.component.html
├── scan-decision-detail.component.scss
├── tv-show-group-list.component.ts          # Accordion: TV show groups with episodes
├── tv-show-group-list.component.html
├── tv-show-group-list.component.scss
├── admin-scan-decision.service.ts           # decisions, tv-groups, reassign, rename APIs
└── admin-scan-decision.service.spec.ts
```

### 2. Enrichment (US10)

```
src/app/features/admin/enrichment/
├── admin-enrichment-page.component.ts       # Summary, start button, progress, results
├── admin-enrichment-page.component.html
├── admin-enrichment-page.component.scss
├── admin-enrichment.service.ts              # start + polling via interval
└── admin-enrichment.service.spec.ts
```

### 3. Shared Admin Components (US8, US11)

```
src/app/features/admin/shared/
├── tmdb-search-panel.component.ts           # Reusable: search input, results, select+assign
├── tmdb-search-panel.component.html
├── tmdb-search-panel.component.scss
├── rename-dialog.component.ts               # Reusable: preview→confirm rename (single/batch)
├── rename-dialog.component.html
└── rename-dialog.component.scss
```

### 4. New shared model files

```
src/app/shared/models/
├── scan-decision.model.ts      # ScanItemDecision, TvShowGroup
├── enrichment.model.ts         # EnrichmentRun, EnrichmentSummary, EnrichmentError
└── rename.model.ts             # RenamePreview, RenameResult, BatchRenamePreview, BatchRenameResult
```

### 5. Files to modify

| File                                                              | Change                                                                                       |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `src/app/shared/models/enums.ts`                                  | Add `ScanDecisionType`, `EnrichmentStatus` enums                                             |
| `src/app/features/admin/admin.routes.ts`                          | Add `scan-results`, `scan-results/:scanId`, `enrichment` child routes                        |
| `src/app/features/admin/admin-layout.component.ts`                | Add "Scan Results" and "Enrichment" tabs to `tabs` array                                     |
| `src/app/features/admin/review/review-resolve-dialog.component.*` | Integrate `TmdbSearchPanelComponent` for manual search                                       |
| `src/app/app.routes.ts`                                           | Replace `nas-scanner` lazy route with `redirectTo: '/admin/scanner'`                         |
| `src/app/core/layout/sidebar.component.ts`                        | Remove NAS Scanner nav item                                                                  |
| `src/assets/i18n/en.json`                                         | Add `admin.scanResults.*`, `admin.enrichment.*`, `admin.rename.*`, `admin.tmdbSearch.*` keys |
| `src/assets/i18n/fr.json`                                         | Add French translations for all new keys                                                     |

### 6. Files to delete (US12)

```
src/app/features/nas-scanner/
├── nas-scanner-page.component.ts/html/scss
├── nas-scanner.routes.ts
├── nas-scanner.service.ts
├── scan-results.component.ts
└── import-results.component.ts
```

## Key Patterns

### Service pattern (AdminScanDecisionService)

```typescript
@Injectable({ providedIn: 'root' })
export class AdminScanDecisionService {
  private readonly api = inject(ApiService);

  readonly decisions = signal<ScanItemDecision[]>([]);
  readonly tvGroups = signal<TvShowGroup[]>([]);
  readonly loading = signal(false);
  readonly meta = signal<PaginationMeta | null>(null);

  getDecisions(
    scanId: string,
    decisionType?: ScanDecisionType,
    mediaType?: MediaType,
    libraryRootId?: string,
    page = 1,
    pageSize = 20,
  ): void {
    this.loading.set(true);
    const params: Record<string, string | number | undefined> = { page, pageSize };
    if (decisionType) params['decisionType'] = decisionType;
    if (mediaType) params['mediaType'] = mediaType;
    if (libraryRootId) params['libraryRootId'] = libraryRootId;
    this.api
      .get<ScanItemDecision[]>(`admin/scan/${scanId}/decisions`, params)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.decisions.set(res.data ?? []);
          this.meta.set(res.meta);
        },
      });
  }

  reassign(decisionId: string, tmdbId: number, kind: MediaType): Observable<ScanItemDecision> {
    return this.api
      .put<ScanItemDecision>(`admin/scan-decisions/${decisionId}/reassign`, { tmdbId, kind })
      .pipe(map((res) => res.data));
  }

  getTvGroups(scanId: string): void {
    this.api
      .get<TvShowGroup[]>('admin/scan-decisions/tv-groups', { scanId })
      .subscribe({ next: (res) => this.tvGroups.set(res.data ?? []) });
  }

  assignTvGroup(groupId: string, tmdbId: number): Observable<TvShowGroup> {
    return this.api
      .put<TvShowGroup>(`admin/tv-groups/${groupId}/assign`, { tmdbId })
      .pipe(map((res) => res.data));
  }
}
```

### Enrichment polling pattern (AdminEnrichmentService)

```typescript
@Injectable({ providedIn: 'root' })
export class AdminEnrichmentService {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly stopPolling$ = new Subject<void>();

  readonly enrichmentStatus = signal<EnrichmentRun | null>(null);
  readonly summary = signal<EnrichmentSummary | null>(null);
  readonly loading = signal(false);

  startEnrichment(): void {
    this.loading.set(true);
    this.api.post<EnrichmentRun>('admin/enrichment/start', {}).subscribe({
      next: (resp) => {
        this.enrichmentStatus.set(resp.data);
        this.loading.set(false);
        this.beginPolling();
      },
      error: () => this.loading.set(false),
    });
  }

  getStatus(): void {
    this.api.get<EnrichmentRun | EnrichmentSummary>('admin/enrichment/status').subscribe({
      next: (resp) => {
        if ('status' in resp.data && 'enrichedCount' in resp.data) {
          this.enrichmentStatus.set(resp.data as EnrichmentRun);
          if (['Pending', 'Running'].includes((resp.data as EnrichmentRun).status)) {
            this.beginPolling();
          }
        } else {
          this.summary.set(resp.data as EnrichmentSummary);
        }
      },
    });
  }

  private beginPolling(): void {
    this.stopPolling$.next();
    interval(4000)
      .pipe(
        switchMap(() => this.api.get<EnrichmentRun>('admin/enrichment/status')),
        takeUntil(this.stopPolling$),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((resp) => {
        this.enrichmentStatus.set(resp.data as EnrichmentRun);
        if (['Completed', 'Failed'].includes((resp.data as EnrichmentRun).status)) {
          this.stopPolling$.next();
        }
      });
  }
}
```

### TmdbSearchPanelComponent usage

```typescript
// In review-resolve-dialog or scan-decision-detail:
@Component({
  imports: [TmdbSearchPanelComponent /* ... */],
  template: `
    <app-tmdb-search-panel
      [initialQuery]="parsedTitle()"
      [mediaTypeFilter]="mediaTypeFilter()"
      (selected)="onTmdbSelected($event)"
    />
  `,
})
export class ReviewResolveDialogComponent {
  onTmdbSelected(result: TmdbSearchResult): void {
    // Assign the selected TMDB entry
  }
}
```

## PrimeNG Components Used (Complete — US1–US12)

| Component          | Import                    | Usage                                                                       |
| ------------------ | ------------------------- | --------------------------------------------------------------------------- |
| `Table`            | `primeng/table`           | Users, library roots, scan history, review items, scan decisions, TV groups |
| `Button`           | `primeng/button`          | All action buttons                                                          |
| `Tag`              | `primeng/tag`             | Status badges, decision type badges                                         |
| `Dialog`           | `primeng/dialog`          | Add root, resolve review, TMDB search, rename preview                       |
| `ConfirmDialog`    | `primeng/confirmdialog`   | Remove root, start enrichment, confirm rename                               |
| `Select`           | `primeng/select`          | Kind filter, scan mode, role, decision type, media type, library root       |
| `MultiSelect`      | `primeng/multiselect`     | Scan root selector                                                          |
| `InputText`        | `primeng/inputtext`       | Search fields, path input, TMDB query                                       |
| `ToggleSwitch`     | `primeng/toggleswitch`    | Enable/disable library root                                                 |
| `ProgressSpinner`  | `primeng/progressspinner` | Loading states                                                              |
| `ProgressBar`      | `primeng/progressbar`     | Enrichment progress                                                         |
| `Tabs/TabList/Tab` | `primeng/tabs`            | Admin sub-section navigation                                                |
| `Toast`            | `primeng/toast`           | Success/error notifications (global)                                        |
| `Tooltip`          | `primeng/tooltip`         | Contextual help                                                             |
| `Badge`            | `primeng/badge`           | Count indicators                                                            |
| `Toolbar`          | `primeng/toolbar`         | Page action bars                                                            |
| `Accordion`        | `primeng/accordion`       | TV show group expand/collapse                                               |
| `DataView`         | `primeng/dataview`        | TMDB search results                                                         |
| `Image`            | `primeng/image`           | TMDB poster thumbnails                                                      |
| `Message`          | `primeng/message`         | Empty states, warnings                                                      |
| `Chip`             | `primeng/chip`            | Episode count badges                                                        |

## Testing

```bash
npm test                    # Run all tests
npm test -- --reporter=verbose  # Verbose output
```

Tests use Vitest with jsdom. Follow existing patterns in `*.spec.ts` files.
