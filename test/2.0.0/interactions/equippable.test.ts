import { equippableInteraction } from "../../../src/rmrk2.0.0/tools/consolidator/interactions/equippable";
import { Equippable } from "../../../src/rmrk2.0.0/classes/equippable";
import { OP_TYPES } from "../../../src/rmrk2.0.0/tools/constants";
import { Base } from "../../../src/rmrk2.0.0/classes/base";

const dummyRemark = {
  block: 0,
  interaction_type: OP_TYPES.EQUIPPABLE,
  caller: "123",
  version: "2.0.0",
  remark: "RMRK:2.0.0:test",
};

const initBaseInstance = () => {
  const baseInstance = new Base(0, "id-test", "12345", "svg");
  baseInstance.parts = [
    {
      id: "slot-test",
      type: "slot",
      equippable: ["class1", "class2", "class3"],
    },
  ];

  return baseInstance;
};

describe("2.0.0 interactions: equippableInteraction", () => {
  it("should throw if base is missing", () => {
    const equippableEntity = new Equippable("id-test", "slot-test", "*");

    expect(() =>
      equippableInteraction(dummyRemark, equippableEntity)
    ).toThrow();
  });

  it("should correctly update equippables on base part", () => {
    const baseInstance = initBaseInstance();
    const equippableEntity = new Equippable("id-test", "slot-test", "*");
    equippableInteraction(dummyRemark, equippableEntity, baseInstance);
    expect(baseInstance.parts?.[0].equippable).toEqual("*");

    const baseInstance2 = initBaseInstance();
    const equippableEntity2 = new Equippable("id-test", "slot-test", "+class4");
    equippableInteraction(dummyRemark, equippableEntity2, baseInstance2);
    expect(baseInstance2.parts?.[0].equippable).toEqual([
      "class1",
      "class2",
      "class3",
      "class4",
    ]);

    const baseInstance3 = initBaseInstance();
    const equippableEntity3 = new Equippable("id-test", "slot-test", "-class2");
    equippableInteraction(dummyRemark, equippableEntity3, baseInstance3);
    expect(baseInstance3.parts?.[0].equippable).toEqual(["class1", "class3"]);
  });
});
