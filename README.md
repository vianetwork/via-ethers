# 🚀 via-ethers JavaScript SDK 🚀

[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE-MIT)
[![License: Apache 2.0](https://img.shields.io/badge/license-Apache%202.0-orange)](LICENSE-APACHE)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](https://www.contributor-covenant.org/)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-orange)](.github/CONTRIBUTING.md)
[![Code Style: Google](https://img.shields.io/badge/code%20style-google-blueviolet.svg)](https://github.com/google/gts)

[![Banner](logo.png)](https://onvia.org/)

In order to provide easy access to all the features of Via network, the `via-ethers` JavaScript SDK was created,
which is made in a way that has an interface very similar to those of [ethers](https://docs.ethers.io/v6/). In
fact, `ethers` is a peer dependency of our library and most of the objects exported by `via-ethers` (
e.g. `Wallet`, `Provider` etc.) inherit from the corresponding `ethers` objects and override only the fields that need
to be changed.

While most of the existing SDKs should work out of the box, deploying smart contracts or using unique Via features,
like account abstraction, requires providing additional fields to those that Ethereum transactions have by default.

The library is made in such a way that after replacing `ethers` with `via-ethers` most client apps will work out of
box.

[//]: # (🔗 For a detailed walkthrough, refer to the [official documentation]&#40;&#41;.)

## 📌 Overview

To begin, it is useful to have a basic understanding of the types of objects available and what they are responsible for, at a high level:

-   `Provider` provides connection to the ZKsync blockchain, which allows querying the blockchain state, such as account, block or transaction details,
    querying event logs or evaluating read-only code using call. Additionally, the client facilitates writing to the blockchain by sending
    transactions.
-   `Wallet` wraps all operations that interact with an account. An account generally has a private key, which can be used to sign a variety of
    types of payloads. It provides easy usage of the most common features.

## 🛠 Prerequisites

-   `node: >= 18` ([installation guide](https://nodejs.org/en/download/package-manager))
-   `ethers: ^6.7.1`

## 📥 Installation & Setup

```bash
yarn add via-ethers
yarn add ethers@6 # ethers is a peer dependency of via-ethers
```

## 🤝 Contributing

We welcome contributions from the community! If you're interested in contributing to the `via-ethers` JavaScript SDK,
please take a look at our [CONTRIBUTING.md](./.github/CONTRIBUTING.md) for guidelines and details on the process.

Thank you for making `via-ethers` JavaScript SDK better! 🙌
