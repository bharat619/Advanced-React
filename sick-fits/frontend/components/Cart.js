import React from "react";
import { Query, Mutation } from "react-apollo";
import gql from "graphql-tag";
import { adopt } from "react-adopt";

import CartStyles from "../components/styles/CartStyles";
import Supreme from "../components/styles/Supreme";
import CloseButton from "../components/styles/CloseButton";
import SickButton from "../components/styles/SickButton";
import User from "./User";
import CartItem from "./CartItem";
import calcTotalPrice from "../lib/calcTotalPrice";
import formatMoney from "../lib/formatMoney";
import TakeMyMoney from "./TakeMyMoney";

export const LOCAL_STATE_QUERY = gql`
  query {
    cartOpen @client
  }
`;

export const TOGGLE_CART_MUTATION = gql`
  mutation {
    toggleCart @client
  }
`;

const Composed = adopt({
  user: ({ render }) => <User>{render}</User>,
  toggleCart: ({ render }) => (
    <Mutation mutation={TOGGLE_CART_MUTATION}>{render}</Mutation>
  ),
  localState: ({ render }) => <Query query={LOCAL_STATE_QUERY}>{render}</Query>,
});

const Cart = () => {
  return (
    <Composed>
      {({ user, toggleCart, localState }) => {
        const me = user.data.me;
        if (!me) return null;
        return (
          <CartStyles open={localState.data.cartOpen}>
            <header>
              <CloseButton onClick={toggleCart} title="close">
                &times;
              </CloseButton>
              <Supreme>{me.name}'s Cart</Supreme>
              <p>
                You Have {me.cart.length} Item
                {me.cart.length === 1 ? "" : "'s"} in your cart.
              </p>
            </header>
            <ul>
              {me.cart.map((cartItem) => (
                <CartItem key={cartItem.id} cartItem={cartItem}></CartItem>
              ))}
            </ul>
            <footer>
              <p>{formatMoney(calcTotalPrice(me.cart))}</p>
              {me.cart.length && (
                <TakeMyMoney>
                  <SickButton>Checkout!!</SickButton>
                </TakeMyMoney>
              )}
            </footer>
          </CartStyles>
        );
      }}
    </Composed>
  );
};

export default Cart;
