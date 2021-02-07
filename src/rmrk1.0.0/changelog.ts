export type Change = {
  field: string;
  old: string;
  new: string;
  caller: string;
  block: number;
  valid: boolean;
};
