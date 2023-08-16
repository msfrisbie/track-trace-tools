export interface IClientState {
  clientName: string | null;
  values: {
    [key: string]: string;
  };
}
