export class Buy {
  id: string;
  static V = "1.0.0";

  constructor(id: string) {
    this.id = id;
  }

  static fromRemark(remark: string): Buy | string {
    const exploded = remark.split("::");
    try {
      if (exploded[0] != "RMRK")
        throw new Error("Invalid remark - does not start with RMRK");
      if (exploded[2] != Buy.V)
        throw new Error(
          `Version mismatch. Is ${exploded[2]}, should be ${Buy.V}`
        );
      if (exploded[1] != "BUY")
        throw new Error("The op code needs to be BUY, is " + exploded[1]);

      if (undefined === exploded[3]) {
        throw new Error("Cound not find ID");
      }
    } catch (e) {
      console.error(e.message);
      console.log(`BUY error: full input was ${remark}`);
      return e.message;
    }
    return new Buy(exploded[3]);
  }
}
