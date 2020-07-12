import React, { Component } from "react";
import StripeCheckout from "react-stripe-checkout";
import Router from "next/router";
import NProgress from "nprogress";
import PropTypes from "prop-types";
import gql from "graphql-tag";
import { Mutation } from "react-apollo";

import calcTotalPrice from "../lib/calcTotalPrice";
import Error from "./ErrorMessage";
import User, { CURRENT_USER_QUERY } from "./User";

const CREATE_ORDER_MUTATION = gql`
  mutation createOrder($token: String!) {
    createOrder(token: $token) {
      id
      charge
      total
      items {
        id
        title
      }
    }
  }
`;

function totalItems(cart) {
  return cart.reduce((tally, cartItem) => tally + cartItem.quantity, 0);
}

class TakeMyMoney extends Component {
  onToken = async (res, createOrder) => {
    NProgress.start();
    const order = await createOrder({
      variables: {
        token: res.id,
      },
    }).catch((err) => alert(err.message));

    Router.push({
      pathname: "/order",
      query: { id: order.data.createOrder.id },
    });
  };

  render() {
    return (
      <User>
        {({ data: { me } }) => (
          <Mutation
            mutation={CREATE_ORDER_MUTATION}
            refetchQueries={[{ query: CURRENT_USER_QUERY }]}
          >
            {(createOrder) => (
              <StripeCheckout
                name="Sick Fits"
                amount={calcTotalPrice(me.cart)}
                description={`Order of ${totalItems(me.cart)}
            items`}
                image={
                  me.cart.length && me.cart[0].item && me.cart[0].item.image
                }
                stripeKey="pk_test_51H3xNqLTocC6IrUvQmPAMn9hmbTXEjHYRG1W2QmYAKpQtFh5CwaKZ0JAa1v2fb9bnx3GxHlhwgDpUFnqjxy96W1k00SQFc1S67"
                currency="INR"
                billingAddress={true}
                shippingAddress={true}
                email={me.email}
                token={(res) => this.onToken(res, createOrder)}
              >
                {this.props.children}
              </StripeCheckout>
            )}
          </Mutation>
        )}
      </User>
    );
  }
}

export default TakeMyMoney;
