# Loopback Tests

Tests are created using the [`jest`](https://facebook.github.io/jest/docs/en/getting-started.html) framework built by Facebook.

Benefits of `jest` include:

* Easy setup
* Instance feedback
* Snapshot testing

### `loopback-jest`

The Loopback Jest module adds a number of helpers for writing tests as well as an entire test suite to get you started with your Loopback application.

### `helpers`

The `test/helpers` directory contains helper functions which can be imported in your specific test files. These helpers create users of many different flavors: regular, admin, authenticated, etc. They also provide useful database helpers to clear out any records before each test is run.

### `unit`

The `test/unit` directory is where unit tests are contained. Unit tests should be self-contained and very, very fast to run.

### `e2e`

The `test/e2e` directory is where end-to-end tests are contained. End-to-end tests include full application level tests for testing entire API endpoints and all possible side effects from hitting a single endpoint.

End-to-end tests are often larger and require more setup time as an entire application is usually started for each test. This makes end-to-end tests much slower than unit tests. However, they are extremely useful given the complexity of applications and the amount of branch conditions when a single API endpoint is hit.

The folder structure of the e2e tests should follow the structure of your routes on the API. For example, if you have a `User` model and it has a `create` endpoint which is `POST /api/users`, then there should exist a file at `test/e2e/api/users/create.spec.js` which contains the tests for the `User#create` endpoint.
