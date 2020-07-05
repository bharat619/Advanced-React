import UpdateItem from "../components/UpdateItem";

const Sell = (props) => {
  console.log(props.query);
  return (
    <div>
      <UpdateItem id={props.query.id} />
    </div>
  );
};

export default Sell;
