export enum DataLoadErrorType {
    NETWORK = 'NETWORK',
    SERVER = 'SERVER',
    PERMISSIONS = 'PERMISSIONS',
    ZERO_RESULTS = 'ZERO_RESULTS',
}

export class DataLoadError extends Error {
    errorType: DataLoadErrorType;

    constructor(errorType: DataLoadErrorType, message: string) {
      super(message);

      this.name = 'DataLoadError';
      this.errorType = errorType;
    }
}
