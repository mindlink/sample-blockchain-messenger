## Overview

This is a basic messaging web-app which uses an Ethereum blockchain as a model.

## Prerequisites

- [Yarn](https://yarnpkg.com/lang/en/docs/install/#windows-stable)
- [Geth](https://www.ethereum.org/cli)

## Running the web-app

To run the web-app, you'll need to follow these steps:
- Initialize the blockchain with Geth
- Initialize the Ethereum network with Geth
- Start the lazy miner
- Install packages with yarn
- Run the dev server

### Initialize the blockchain

To initialize the blockchain in the folder `blockchain`, run the following command:
```bash
geth -datadir ./blockchain init ./genesis.json
```

### Initialize the Ethereum network

To initialize the network, run the following command (replacing `<device-name>` with your device's name):
```bash
geth --datadir ./blockchain --networkid 7314 --ws --wsorigins "http://localhost:8080,http://<device name>" --wsapi="eth,web3,personal,miner" --gasprice 0
```
This needs to be running whenever you start the web-app.

### Start the lazy miner

To start the lazy miner, run the following command:
```bash
geth attach ws://localhost:8546 --preload ./lazyMine.js
```
This starts a miner which only mines when new transactions are available. This should be running in the background whenever you use the web-app, or new transactions will not be committed to the blockchain and thus won't appear on the app.

### Install packages

Use the following command to install the required packages:
```bash
yarn install
```

### Run the dev server

Use the following command to run the dev server:
```bash
yarn run start
```
