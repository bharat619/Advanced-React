function Person(name, foods) {
  this.name = name;
  this.foods = foods;
}

Person.prototype.fetchFavFoods = function () {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(this.foods), 2000);
  });
};

describe("mocking learning", () => {
  xit("mocks a reg function", () => {
    const fetchDogs = jest.fn();
    fetchDogs("snickers");
    expect(fetchDogs).toHaveBeenCalled();
    expect(fetchDogs).toHaveBeenCalledWith("snickers");
  });

  xit("can creaate a person", () => {
    const me = new Person("Bharat", ["pizza", "burgs"]);
    expect(me.name).toEqual("Bharat");
  });

  xit("can fetch foods", async () => {
    const me = new Person("Bharat", ["pizza", "burgs"]);
    // mock the favFoods function
    me.fetchFavFoods = jest.fn().mockResolvedValue(["pizza", "ramen"]);
    const favFoods = await me.fetchFavFoods();
    expect(favFoods).toContain("pizza");
  });
});
