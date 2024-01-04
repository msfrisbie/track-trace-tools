export enum LabCsvMutations {
  LAB_CSV_MUTATION = "LAB_CSV_MUTATION",
  RECORD_MESSAGE = "RECORD_MESSAGE",
}

export enum LabCsvGetters {
  HAS_ERRORS = "HAS_ERRORS",
}

export enum LabCsvActions {
  LAB_CSV_ACTION = "LAB_CSV_ACTION",
  RESET = "RESET",
  LOAD_CSV = "LOAD_CSV",
  SELECT_COA_FILES = "SELECT_COA_FILES",
  UPLOAD_COA_FILES = "UPLOAD_COA_FILES",
  ASSIGN_COA_FILES = "ASSIGN_COA_FILES",
}

export enum LabCsvStatus {
  INITIAL = "INITIAL",
  INFLIGHT = "INFLIGHT",
  UPLOADED_CSV = "UPLOADED_CSV",
  UPLOADED_COAS = "UPLOADED_COAS",
  SUBMITTED_COAS = "SUBMITTED_COAS",
}
