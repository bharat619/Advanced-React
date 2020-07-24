import Link from "next/link";
import gql from "graphql-tag";
import { Mutation } from "react-apollo";

import User from "./User";
import NavStyles from "./styles/NavStyles";
import CartCount from "./CartCount";
import { CURRENT_USER_QUERY } from "./User";
import { TOGGLE_CART_MUTATION } from "./Cart";

const SIGNOOUT_MUTATION = gql`
  mutation {
    signout
  }
`;

const onSignout = async (e, signout) => {
  await signout();
};

const Nav = () => {
  return (
    <User>
      {({ data: { me } }) => (
        <NavStyles data-test="nav">
          <Link href="/items">
            <a>Shop</a>
          </Link>
          {me && (
            <>
              <Link href="/orders">
                <a>Orders</a>
              </Link>
              <Link href="/sell">
                <a>Sell</a>
              </Link>

              <Link href="/me">
                <a>Account</a>
              </Link>

              <Mutation
                refetchQueries={[{ query: CURRENT_USER_QUERY }]}
                mutation={SIGNOOUT_MUTATION}
              >
                {(signout, { loading, error, data }) => (
                  <button onClick={(e) => onSignout(e, signout)}>
                    Signout
                  </button>
                )}
              </Mutation>
              <Mutation mutation={TOGGLE_CART_MUTATION}>
                {(toggleCart) => (
                  <button onClick={toggleCart}>
                    My Cart
                    <CartCount
                      count={me.cart.reduce(
                        (tally, cartItem) => tally + cartItem.quantity,
                        0
                      )}
                    ></CartCount>
                  </button>
                )}
              </Mutation>
            </>
          )}
          {!me && (
            <Link href="/signup">
              <a>Sign In</a>
            </Link>
          )}
        </NavStyles>
      )}
    </User>
  );
};

export default Nav;
