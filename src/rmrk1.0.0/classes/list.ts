export class List {
  price: BigInt;
  id: string;
  static V = "1.0.0";

  constructor(id: string, price: BigInt) {
    this.price = price;
    this.id = id;
  }

  static fromRemark(remark: string): List | string {
    const exploded = remark.split("::");
    try {
      if (exploded[0] != "RMRK")
        throw new Error("Invalid remark - does not start with RMRK");
      if (exploded[2] != List.V)
        throw new Error(
          `Version mismatch. Is ${exploded[2]}, should be ${List.V}`
        );
      if (exploded[1] != "LIST")
        throw new Error("The op code needs to be LIST, is " + exploded[1]);

      if (undefined === exploded[3] || undefined == exploded[4]) {
        throw new Error("Cound not find ID or price");
      }
    } catch (e) {
      console.error(e.message);
      console.log(`LIST error: full input was ${remark}`);
      return e.message;
    }
    return new List(exploded[3], BigInt(exploded[4]));
  }
}
