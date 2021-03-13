export type Change = {
  field: string;
  old: any;
  new: any;
  caller: string;
  block: number;
  valid: boolean;
};
