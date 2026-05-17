import { LibraryRootKind } from './enums';

export interface LibraryRoot {
  id: string;
  path: string;
  kind: LibraryRootKind;
  label: string | null;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string | null;
}
