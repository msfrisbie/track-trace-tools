import { zip } from 'lodash-es';

interface CollectionValidator<T> {
  fn: (arr: T[]) => boolean;
  message: string;
}

interface RowValidator<T> {
  fn: (row: T) => boolean;
  message: string;
}

interface ArrayStatus<T> {
  valid: boolean;
  error?: {
    row: any;
    message: string;
  };
}

export function arrayIsValid<T>(
  arr: T[],
  {
    collectionValidators,
    rowValidators,
  }: { collectionValidators?: CollectionValidator<T>[]; rowValidators?: RowValidator<T>[] }
): ArrayStatus<T> {
  if (collectionValidators) {
    for (const collectionValidator of collectionValidators) {
      const valid = collectionValidator.fn(arr);

      if (!valid) {
        return {
          valid,
          error: {
            message: collectionValidator.message,
            row: JSON.stringify(arr),
          },
        };
      }
    }
  }

  if (rowValidators) {
    for (const rowValidator of rowValidators) {
      for (const row of arr) {
        const valid = rowValidator.fn(row);

        if (!valid) {
          return {
            valid,
            error: {
              message: rowValidator.message,
              row: JSON.stringify(arr),
            },
          };
        }
      }
    }
  }

  return {
    valid: true,
  };
}

export function splitMax(value: number, max: number | null): number[] {
  const row = [];

  if (!max) {
    max = Number.POSITIVE_INFINITY;
  }

  let remaining = value;

  while (remaining > 0) {
    const next = Math.min(remaining, max);
    row.push(next);
    remaining -= next;
  }

  return row;
}

export function sameLength(...arrs: any[][]): boolean {
  return arrs.map((x: any[]) => x.length).every((val, i, arr) => val === arr[0]);
}

/**
 * lodash zip() does not enfore same length arrays
 *
 * @param arrs
 */
export function safeZip(...arrs: any[][]) {
  if (!sameLength(...arrs)) {
    throw new Error('Array length mismatch');
  }

  return zip(...arrs);
}
