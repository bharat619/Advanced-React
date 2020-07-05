import React, { Component } from "react";
import { Mutation, Query } from "react-apollo";
import Router from "next/router";
import gql from "graphql-tag";

import Form from "./styles/Form";
import Error from "./ErrorMessage";
import fromatMoney from "../lib/formatMoney";

const SINGLE_ITEM_QUERY = gql`
  query SINGLE_ITEM_QUERY($id: ID!) {
    item(where: { id: $id }) {
      id
      title
      description
      price
    }
  }
`;

export const UPDATE_ITEM_MUTATION = gql`
  mutation UPDATE_ITEM_MUTATION(
    $id: ID!
    $title: String
    $description: String
    $price: Int
  ) {
    updateItem(
      id: $id
      title: $title
      description: $description
      price: $price
    ) {
      id
      title
      description
      price
    }
  }
`;

class UpdateItem extends Component {
  state = {};
  handleChange = (e) => {
    const { name, type, value } = e.target;
    const val = type === "number" ? parseFloat(value) : value;
    this.setState({ [name]: val });
  };

  updateItem = async (e, updateItemMutation) => {
    e.preventDefault();
    console.log("updating item...");

    const res = await updateItemMutation({
      variables: { id: this.props.id, ...this.state },
    });
    console.log("updated");
  };

  render() {
    console.log(this.props.id);
    return (
      <Query query={SINGLE_ITEM_QUERY} variables={{ id: this.props.id }}>
        {({ data, loading }) => {
          if (loading) return <p>Loading...</p>;
          console.log(data);
          // if (!data) return <></>;
          if (!data.item) return <p>No Item found for {this.props.id}</p>;
          return (
            <Mutation mutation={UPDATE_ITEM_MUTATION} variables={this.state}>
              {(updateItem, { loading, error }) => (
                <Form onSubmit={(e) => this.updateItem(e, updateItem)}>
                  <Error error={error}></Error>
                  <fieldset disabled={loading} aria-busy={loading}>
                    <label htmlFor="title">
                      Title
                      <input
                        type="text"
                        name="title"
                        id="title"
                        required
                        placeholder="Title"
                        defaultValue={data.item.title}
                        onChange={this.handleChange}
                      />
                    </label>

                    <label htmlFor="price">
                      Price
                      <input
                        type="number"
                        name="price"
                        id="price"
                        placeholder="Price"
                        onChange={this.handleChange}
                        defaultValue={data.item.price}
                      />
                    </label>

                    <label htmlFor="description">
                      Description
                      <textarea
                        id="description"
                        name="description"
                        id="description"
                        placeholder="Enter a description"
                        onChange={this.handleChange}
                        defaultValue={data.item.description}
                      />
                    </label>
                    <button type="submit">Sav{loading ? "ing" : "e"}</button>
                  </fieldset>
                </Form>
              )}
            </Mutation>
          );
        }}
      </Query>
    );
  }
}

export default UpdateItem;
