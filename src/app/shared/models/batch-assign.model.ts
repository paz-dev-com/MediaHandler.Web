export interface BatchAssignRequest {
  reviewItemIds: string[];
  targetMediaId: string;
}

export interface BatchAssignItemResult {
  reviewItemId: string;
  success: boolean;
  errorMessage?: string;
}

export interface BatchAssignResult {
  results: BatchAssignItemResult[];
}
