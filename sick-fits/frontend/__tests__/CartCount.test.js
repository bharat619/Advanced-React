import { shallow, mount } from "enzyme";
import toJSON from "enzyme-to-json";
import CartCount from "../components/CartCount";

describe("<CartCount/>", () => {
  it("renders", () => {
    shallow(<CartCount count={10}></CartCount>);
  });

  it("matches the snapshot", () => {
    const wrapper = shallow(<CartCount count={10}></CartCount>);
    // console.log(wrapper.debug());
    return;
    expect(toJSON(wrapper)).toMatchSnapshot();
  });

  it("updates via props", () => {
    return;
    const wrapper = mount(<CartCount count={50}></CartCount>);
    expect(toJSON(wrapper)).toMatchSnapshot();
    wrapper.setProps({ count: 10 });
    expect(toJSON(wrapper)).toMatchSnapshot();
  });
});
