describe("Sample test 101", () => {
  it("works as expected", () => {
    var age = 100;
    expect(age).toEqual(100);
  });

  it("handles ranges just fine", () => {
    const age = 200;
    expect(age).toBeGreaterThan(100);
  });

  it("makes a list of god names", () => {
    const dogs = ["snickers", "hugo"];
    expect(dogs).toEqual(dogs);
    expect(dogs).toContain("snickers");
  });
});
