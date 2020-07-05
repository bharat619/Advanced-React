import React, { Component } from "react";
import { Mutation } from "react-apollo";
import Router from "next/router";
import gql from "graphql-tag";

import Form from "./styles/Form";
import Error from "./ErrorMessage";
import fromatMoney from "../lib/formatMoney";

export const CREATE_ITEM_MUTATION = gql`
  mutation CREATE_ITEM_MUTATION(
    $title: String!
    $description: String!
    $price: Int!
    $image: String!
    $largeImage: String
  ) {
    createItem(
      title: $title
      description: $description
      price: $price
      image: $image
      largeImage: $largeImage
    ) {
      id
    }
  }
`;

class CreateItem extends Component {
  state = {
    title: "",
    description: "",
    image: "",
    largeImage: "",
    price: 1000,
  };
  handleChange = (e) => {
    const { name, type, value } = e.target;
    const val = type === "number" ? parseFloat(value) : value;
    this.setState({ [name]: val });
  };

  uploadFile = async (e) => {
    console.log("uploading file");
    const files = e.target.files;
    const data = new FormData();
    data.append("file", files[0]);
    data.append("upload_preset", "Sick Fits");
    const res = await fetch(
      "https://api.cloudinary.com/v1_1/drc7kholu/image/upload",
      {
        method: "POST",
        body: data,
      }
    );
    const file = await res.json();
    console.log(file);
    this.setState({
      image: file.secure_url,
      largeImage: file.eager[0].secure_url,
    });
  };

  update = (cache, payload) => {
    Object.keys(cache.data.data).forEach(
      (key) => key.match(/^Item:/) && cache.data.delete(key)
    );
  };

  render() {
    return (
      <Mutation
        update={this.update}
        mutation={CREATE_ITEM_MUTATION}
        variables={this.state}
      >
        {(createItem, { loading, error }) => (
          <Form
            autoComplete="off"
            onSubmit={async (e) => {
              e.preventDefault();
              const res = await createItem();
              Router.push({
                pathname: "/item",
                query: { id: res.data.createItem.id },
              });
            }}
          >
            <Error error={error}></Error>
            <fieldset disabled={loading} aria-busy={loading}>
              <label htmlFor="file">
                Image
                <input
                  type="file"
                  name="file"
                  id="file"
                  placeholder="Title"
                  onChange={this.uploadFile}
                />
                {this.state.image && (
                  <img src={this.state.image} alt="Upload Preview" />
                )}
              </label>

              <label htmlFor="title">
                Title
                <input
                  type="text"
                  name="title"
                  id="title"
                  placeholder="Title"
                  onChange={this.handleChange}
                  value={this.state.title}
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
                  value={this.state.price}
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
                  value={this.state.description}
                />
              </label>
              <button type="submit">Submit</button>
            </fieldset>
          </Form>
        )}
      </Mutation>
    );
  }
}

export default CreateItem;
