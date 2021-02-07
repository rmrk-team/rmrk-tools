export class Send {
  recipient: string;
  id: string;
  static V = "RMRK1.0.0";

  constructor(id: string, recipient: string) {
    this.recipient = recipient;
    this.id = id;
  }

  static fromRemark(remark: string): Send | string {
    const exploded = remark.split("::");
    try {
      if (exploded[0] != "RMRK")
        throw new Error("Invalid remark - does not start with RMRK");
      if (exploded[2] != Send.V)
        throw new Error(
          `Version mismatch. Is ${exploded[2]}, should be ${Send.V}`
        );
      if (exploded[1] != "SEND")
        throw new Error("The op code needs to be SEND, is " + exploded[1]);

      if (undefined === exploded[3] || undefined == exploded[4]) {
        throw new Error("Cound not find ID or recipient");
      }
    } catch (e) {
      console.error(e.message);
      console.log(`SEND error: full input was ${remark}`);
      return e.message;
    }
    return new Send(exploded[3], exploded[4]);
  }
}
