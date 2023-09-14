export interface IClientState {
  clientName: string | null;
  t3plus: boolean;
  values: {
    [key: string]: any;
  };
}
