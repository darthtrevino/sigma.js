import floatColor from "../floatColor";

describe("The Float Color utils", () => {
  it("can map hex colors to numeric values", () => {
    const inputs = [
      "#FF0",
      "#D1D1D1",
      "#d1d1d1",
      "rgb(234, 245, 298)",
      "rgba(234, 245, 298, 0.1)",
      "rgba(234, 245, 298, .1)"
    ];

    const outputs = [
      0xff00ffff,
      0xffd1d1d1,
      0xffd1d1d1,
      0xfffff5ea,
      0x19fff5ea,
      0x19fff5ea
    ];

    const buffer = new ArrayBuffer(4);
    const uint32 = new Uint32Array(buffer);
    const float32 = new Float32Array(buffer);
    inputs.forEach((input, i) => {
      float32[0] = floatColor(input);
      expect(uint32[0]).toEqual(outputs[i]);
    });
  });
});
