import ItemComponent from "../components/Item";
import { shallow } from "enzyme";
import toJSON from "enzyme-to-json";

const fakeItem = {
  id: "ABC123",
  title: "A cool item",
  price: 5000,
  description: "Description",
  image: "dog.jpg",
  largeImage: "largeDog.jpg",
};

describe("<Item/>", () => {
  it("renders and matches the snapshot", () => {
    const wrapper = shallow(<ItemComponent item={fakeItem}></ItemComponent>);
    expect(toJSON(wrapper)).toMatchSnapshot();
  });

  // it("renders and displays properly", () => {
  //   const wrapper = shallow(<ItemComponent item={fakeItem}></ItemComponent>);

  //   const PriceTag = wrapper.find("PriceTag");
  //   console.log(PriceTag.children().debug());
  //   expect(PriceTag.children().text()).toBe("$50");

  //   expect(wrapper.find("Title a").text()).toBe(fakeItem.title);

  //   const img = wrapper.find("img");
  //   expect(img.props().src).toBe(fakeItem.image);
  //   expect(img.props().alt).toBe(fakeItem.title);
  // });
  // it("renders out the buttons properly", () => {
  //   const wrapper = shallow(<ItemComponent item={fakeItem}></ItemComponent>);
  //   console.log(wrapper.debug());
  //   const buttonList = wrapper.find(".buttonList");
  //   expect(buttonList.children()).toHaveLength(3);
  //   expect(buttonList.find("Link")).toHaveLength(1);
  //   expect(buttonList.find("AddToCart").exists()).toBe(true);
  //   expect(buttonList.find("DeleteItem").exists()).toBe(true);
  // });
});
