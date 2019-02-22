import Configurable from "../Configurable";

describe("The Configurable class", () => {
  it("Basic manipulation", () => {
    let settings = Configurable();
    settings("mySetting", 42);
    expect(settings("mySetting")).toEqual(42);
    settings("mySetting", 123);
    expect(settings("mySetting")).toEqual(123);
    settings({ mySetting: 456 });
    expect(settings("mySetting")).toEqual(456);

    expect(settings({ mySetting: "abc" }, "mySetting")).toEqual("abc");
    expect(settings({ hisSetting: "abc" }, "mySetting")).toEqual(456);

    settings = Configurable({ mySetting: 42 });
    expect(settings("mySetting")).toEqual(42);
  });

  it("Embed objects", () => {
    const data = { key1: "data", key2: "data" };

    const object = { key1: "object" };

    const settings = Configurable(data);

    const embedSettings = settings.embedObjects(object);

    expect(embedSettings("key2")).toEqual("data");
    expect(embedSettings("key1")).toEqual("object");
    expect(embedSettings({ key1: "onthefly" }, "key1")).toEqual("onthefly");
  });

  it("Deeply embed objects", () => {
    const data = { key1: "data", key2: "data", key3: "data" };
    const object1 = { key1: "object1", key2: "object1" };
    const object2 = { key1: "object2" };
    const settings = Configurable(data);
    const embedSettings1 = settings.embedObjects(object1);
    const embedSettings2 = embedSettings1.embedObjects(object2);

    expect(embedSettings2("key3")).toEqual("data");
    expect(embedSettings2("key2")).toEqual("object1");
    expect(embedSettings2("key1")).toEqual("object2");
    expect(embedSettings2({ key1: "onthefly" }, "key1")).toEqual("onthefly");
  });
});
