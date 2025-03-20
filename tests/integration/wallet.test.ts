import * as chai from 'chai';
import '../custom-matchers';
import {Provider, utils, Wallet} from '../../src';
import {ethers} from 'ethers';
import * as fs from 'fs';
import {
  ADDRESS1,
  PRIVATE_KEY1,
  MNEMONIC1,
  ADDRESS2,
  APPROVAL_TOKEN,
  PAYMASTER,
  L1_CHAIN_URL,
  L2_CHAIN_URL,
  DAI,
} from '../utils';

const {expect} = chai;

describe('Wallet', () => {
  const provider = new Provider(L2_CHAIN_URL);
  const ethProvider = ethers.getDefaultProvider(L1_CHAIN_URL);
  const wallet = new Wallet(PRIVATE_KEY1, provider, ethProvider);

  describe('#constructor()', () => {
    it('`Wallet(privateKey, provider)` should return a `Wallet` with L2 provider', async () => {
      const wallet = new Wallet(PRIVATE_KEY1, provider);

      expect(wallet.signingKey.privateKey).to.be.equal(PRIVATE_KEY1);
      expect(wallet.provider).to.be.equal(provider);
    });

    it('`Wallet(privateKey, provider, ethProvider)` should return a `Wallet` with L1 and L2 provider', async () => {
      const wallet = new Wallet(PRIVATE_KEY1, provider, ethProvider);

      expect(wallet.signingKey.privateKey).to.be.equal(PRIVATE_KEY1);
      expect(wallet.provider).to.be.equal(provider);
      expect(wallet.providerL1).to.be.equal(ethProvider);
    });
  });

  // describe('#getBaseCost()', () => {
  //   it('should return a base cost of L1 transaction', async () => {
  //     const result = await wallet.getBaseCost({gasLimit: 100_000});
  //     expect(result).not.to.be.null;
  //   });
  // });

  describe('#getBalance()', () => {
    it('should return a `Wallet` balance', async () => {
      const result = await wallet.getBalance();
      expect(result > 0n).to.be.true;
    });
  });

  describe('#getAllBalances()', () => {
    it('should return the all balances', async () => {
      const result = await wallet.getAllBalances();
      const expected = 2;
      expect(Object.keys(result)).to.have.lengthOf(expected);
    });
  });

  describe('#getL2BridgeContracts()', () => {
    it('should return a L2 bridge contracts', async () => {
      const result = await wallet.getL2BridgeContracts();
      expect(result).not.to.be.null;
    });
  });

  describe('#getAddress()', () => {
    it('should return the `Wallet` address', async () => {
      const result = await wallet.getAddress();
      expect(result).to.be.equal(ADDRESS1);
    });
  });

  // describe('#ethWallet()', () => {
  //   it('should return a L1 `Wallet`', async () => {
  //     const wallet = new Wallet(PRIVATE_KEY1, provider, ethProvider);
  //     const ethWallet = wallet.ethWallet();
  //     expect(ethWallet.signingKey.privateKey).to.be.equal(PRIVATE_KEY1);
  //     expect(ethWallet.provider).to.be.equal(ethProvider);
  //   });
  //
  //   it('should throw  an error when L1 `Provider` is not specified in constructor', async () => {
  //     const wallet = new Wallet(PRIVATE_KEY1, provider);
  //     try {
  //       wallet.ethWallet();
  //     } catch (e) {
  //       expect((e as Error).message).to.be.equal(
  //         'L1 provider is missing! Specify an L1 provider using `Wallet.connectToL1()`.'
  //       );
  //     }
  //   });
  // });

  describe('#connect()', () => {
    it('should return a `Wallet` with provided `provider` as L2 provider', async () => {
      let wallet = new Wallet(PRIVATE_KEY1);
      wallet = wallet.connect(provider);
      expect(wallet.signingKey.privateKey).to.be.equal(PRIVATE_KEY1);
      expect(wallet.provider).to.be.equal(provider);
    });
  });

  describe('#connectL1()', () => {
    it('should return a `Wallet` with provided `provider` as L1 provider', async () => {
      let wallet = new Wallet(PRIVATE_KEY1);
      wallet = wallet.connectToL1(ethProvider);
      expect(wallet.signingKey.privateKey).to.be.equal(PRIVATE_KEY1);
      expect(wallet.providerL1).to.be.equal(ethProvider);
    });
  });

  describe('#getDeploymentNonce()', () => {
    it('should return a deployment nonce', async () => {
      const result = await wallet.getDeploymentNonce();
      expect(result).not.to.be.null;
    });
  });

  describe('#populateTransaction()', () => {
    it('should return a populated transaction', async () => {
      const tx = {
        to: ADDRESS2,
        value: 7_000_000_000n,
        type: utils.EIP712_TX_TYPE,
        from: ADDRESS1,
        nonce: await wallet.getNonce('pending'),
        gasLimit: 154_379n,
        chainId: 270n,
        data: '0x',
        customData: {gasPerPubdata: 50_000, factoryDeps: []},
        maxPriorityFeePerGas: 0n,
        maxFeePerGas: 10_250_000n,
      };

      const result = await wallet.populateTransaction({
        type: utils.EIP712_TX_TYPE,
        to: ADDRESS2,
        value: 7_000_000_000,
      });
      expect(result).to.be.deepEqualExcluding(tx, [
        'gasLimit',
        'chainId',
        'chainId',
        'customData',
      ]);
      expect(BigInt(result.gasLimit!) > 0n).to.be.true;
    }).timeout(25_000);

    it('should return a populated transaction with default values if are omitted', async () => {
      const tx = {
        to: ADDRESS2,
        value: 7_000_000n,
        type: 113,
        data: '0x',
        from: ADDRESS1,
        nonce: await wallet.getNonce('pending'),
        chainId: 270n,
        customData: {gasPerPubdata: 50_000, factoryDeps: []},
        maxFeePerGas: 1_200_000_000n,
        maxPriorityFeePerGas: 1_000_000_000n,
      };
      const result = await wallet.populateTransaction({
        to: ADDRESS2,
        value: 7_000_000,
      });
      expect(result).to.be.deepEqualExcluding(tx, [
        'gasLimit',
        'chainId',
        'maxFeePerGas',
        'maxPriorityFeePerGas',
        'chainId',
        'customData',
      ]);
      expect(BigInt(result.gasLimit!) > 0n).to.be.true;
      expect(BigInt(result.maxFeePerGas!) > 0n).to.be.true;
      expect(BigInt(result.maxPriorityFeePerGas!) >= 0n).to.be.true;
    });

    it('should return populated transaction when `maxFeePerGas` and `maxPriorityFeePerGas` and `customData` are provided', async () => {
      const tx = {
        to: ADDRESS2,
        value: 7_000_000n,
        type: 113,
        from: ADDRESS1,
        nonce: await wallet.getNonce('pending'),
        data: '0x',
        chainId: 270n,
        maxFeePerGas: 3_500_000_000n,
        maxPriorityFeePerGas: 2_000_000_000n,
        customData: {
          gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
          factoryDeps: [],
        },
      };
      const result = await wallet.populateTransaction({
        to: ADDRESS2,
        value: 7_000_000,
        maxFeePerGas: 3_500_000_000n,
        maxPriorityFeePerGas: 2_000_000_000n,
        customData: {
          gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
          factoryDeps: [],
        },
      });
      expect(result).to.be.deepEqualExcluding(tx, ['gasLimit', 'chainId']);
      expect(BigInt(result.gasLimit!) > 0n).to.be.true;
    });

    it('should return populated transaction when `maxPriorityFeePerGas` and `customData` are provided', async () => {
      const tx = {
        to: ADDRESS2,
        value: 7_000_000n,
        type: 113,
        from: ADDRESS1,
        nonce: await wallet.getNonce('pending'),
        data: '0x',
        chainId: 270n,
        maxPriorityFeePerGas: 2_000_000_000n,
        customData: {
          gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
          factoryDeps: [],
        },
      };
      const result = await wallet.populateTransaction({
        to: ADDRESS2,
        value: 7_000_000,
        maxPriorityFeePerGas: 2_000_000_000n,
        customData: {
          gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        },
      });
      expect(result).to.be.deepEqualExcluding(tx, [
        'gasLimit',
        'chainId',
        'maxFeePerGas',
      ]);
      expect(BigInt(result.gasLimit!) > 0n).to.be.true;
      expect(BigInt(result.maxFeePerGas!) > 0n).to.be.true;
    });

    it('should return populated transaction when `maxFeePerGas` and `customData` are provided', async () => {
      const tx = {
        to: ADDRESS2,
        value: 7_000_000n,
        type: 113,
        from: ADDRESS1,
        nonce: await wallet.getNonce('pending'),
        data: '0x',
        chainId: 270n,
        maxFeePerGas: 3_500_000_000n,
        customData: {
          gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
          factoryDeps: [],
        },
      };
      const result = await wallet.populateTransaction({
        to: ADDRESS2,
        value: 7_000_000,
        maxFeePerGas: 3_500_000_000n,
        customData: {
          gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        },
      });
      expect(result).to.be.deepEqualExcluding(tx, [
        'gasLimit',
        'chainId',
        'maxPriorityFeePerGas',
      ]);
      expect(BigInt(result.gasLimit!) > 0n).to.be.true;
      expect(BigInt(result.maxPriorityFeePerGas!) >= 0n).to.be.true;
    });

    it('should return populated EIP1559 transaction when `maxFeePerGas` and `maxPriorityFeePerGas` are provided', async () => {
      const tx = {
        to: ADDRESS2,
        value: 7_000_000n,
        type: 2,
        from: ADDRESS1,
        nonce: await wallet.getNonce('pending'),
        chainId: 270n,
        maxFeePerGas: 3_500_000_000n,
        maxPriorityFeePerGas: 2_000_000_000n,
      };
      const result = await wallet.populateTransaction({
        to: ADDRESS2,
        type: 2,
        value: 7_000_000,
        maxFeePerGas: 3_500_000_000n,
        maxPriorityFeePerGas: 2_000_000_000n,
      });
      expect(result).to.be.deepEqualExcluding(tx, ['gasLimit', 'chainId']);
      expect(BigInt(result.gasLimit!) > 0n).to.be.true;
    });

    it('should return populated EIP1559 transaction with `maxFeePerGas` and `maxPriorityFeePerGas` same as provided `gasPrice`', async () => {
      const tx = {
        to: ADDRESS2,
        value: 7_000_000n,
        type: 2,
        from: ADDRESS1,
        nonce: await wallet.getNonce('pending'),
        chainId: 270n,
        maxFeePerGas: 3_500_000_000n,
        maxPriorityFeePerGas: 0n,
      };
      const result = await wallet.populateTransaction({
        to: ADDRESS2,
        type: 2,
        value: 7_000_000,
        maxFeePerGas: 3_500_000_000n,
      });
      expect(result).to.be.deepEqualExcluding(tx, ['gasLimit', 'chainId']);
      expect(BigInt(result.gasLimit!) > 0n).to.be.true;
    });

    it('should return populated legacy transaction when `type = 0`', async () => {
      const tx = {
        to: ADDRESS2,
        value: 7_000_000n,
        type: 0,
        from: ADDRESS1,
        nonce: await wallet.getNonce('pending'),
        chainId: 270n,
        gasPrice: 100_000_000n,
      };
      const result = await wallet.populateTransaction({
        type: 0,
        to: ADDRESS2,
        value: 7_000_000,
      });
      expect(result).to.be.deepEqualExcluding(tx, [
        'gasLimit',
        'gasPrice',
        'chainId',
      ]);
      expect(BigInt(result.gasLimit!) > 0n).to.be.true;
      expect(BigInt(result.gasPrice!) > 0n).to.be.true;
    });
  });

  describe('#sendTransaction()', () => {
    it('should send already populated transaction with provided `maxFeePerGas` and `maxPriorityFeePerGas` and `customData` fields', async () => {
      const populatedTx = await wallet.populateTransaction({
        to: ADDRESS2,
        value: 7_000_000,
        maxFeePerGas: 3_500_000_000n,
        maxPriorityFeePerGas: 2_000_000_000n,
        customData: {
          gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        },
      });
      const tx = await wallet.sendTransaction(populatedTx);
      const result = await tx.wait();
      expect(result).not.to.be.null;
    }).timeout(25_000);

    it('should send EIP712 transaction when `maxFeePerGas` and `maxPriorityFeePerGas` are provided and type is empty', async () => {
      const tx = await wallet.sendTransaction({
        to: ADDRESS2,
        value: 7_000_000,
        maxFeePerGas: 3_500_000_000n,
        maxPriorityFeePerGas: 2_000_000_000n,
      });
      const result = await tx.wait();
      expect(result).not.to.be.null;
      expect(result.type).to.be.equal(113);
    }).timeout(25_000);

    it('should send already populated EIP712 transaction with `maxFeePerGas` and `maxPriorityFeePerGas`', async () => {
      const populatedTx = await wallet.populateTransaction({
        to: ADDRESS2,
        value: 7_000_000,
        maxFeePerGas: 3_500_000_000n,
        maxPriorityFeePerGas: 2_000_000_000n,
      });

      const tx = await wallet.sendTransaction(populatedTx);
      const result = await tx.wait();
      expect(result).not.to.be.null;
      expect(result.type).to.be.equal(113);
    }).timeout(25_000);

    it('should send EIP712 transaction with `maxFeePerGas` and `maxPriorityFeePerGas` same as provided `gasPrice`', async () => {
      const tx = await wallet.sendTransaction({
        to: ADDRESS2,
        value: 7_000_000,
        gasPrice: 3_500_000_000n,
      });
      const result = await tx.wait();
      expect(result).not.to.be.null;
      expect(result.type).to.be.equal(113);
    }).timeout(25_000);

    it('should send legacy transaction when `type = 0`', async () => {
      const tx = await wallet.sendTransaction({
        type: 0,
        to: ADDRESS2,
        value: 7_000_000,
      });
      const result = await tx.wait();
      expect(result).not.to.be.null;
      expect(result.type).to.be.equal(0);
    }).timeout(25_000);
  });

  describe('#fromMnemonic()', () => {
    it('should return a `Wallet` with the `provider` as L1 provider and a private key that is built from the `mnemonic` passphrase', async () => {
      const wallet = Wallet.fromMnemonic(MNEMONIC1, provider, ethProvider);
      expect(wallet.signingKey.privateKey).to.be.equal(PRIVATE_KEY1);
      expect(wallet.provider).to.be.equal(provider);
      expect(wallet.providerL1).to.be.equal(ethProvider);
    });
  });

  describe('#fromEncryptedJson()', () => {
    it('should return a `Wallet` from encrypted `json` file using provided `password`', async () => {
      const wallet = await Wallet.fromEncryptedJson(
        fs.readFileSync('tests/files/wallet.json', 'utf8'),
        'password'
      );
      expect(wallet.signingKey.privateKey).to.be.equal(PRIVATE_KEY1);
    });
  });

  describe('#fromEncryptedJsonSync()', () => {
    it('should return a `Wallet` from encrypted `json` file using provided `password`', async () => {
      const wallet = Wallet.fromEncryptedJsonSync(
        fs.readFileSync('tests/files/wallet.json', 'utf8'),
        'password'
      );
      expect(wallet.signingKey.privateKey).to.be.equal(PRIVATE_KEY1);
    });
  });

  describe('#createRandom()', () => {
    it('should return a random `Wallet` with L2 provider', async () => {
      const wallet = Wallet.createRandom(provider, ethProvider);
      expect(wallet.signingKey.privateKey).not.to.be.null;
      expect(wallet.provider).to.be.equal(provider);
      expect(wallet.providerL1).to.be.equal(ethProvider);
    });
  });

  // describe('#getDepositTx()', () => {
  //   if (IS_ETH_BASED) {
  //     it('should return ETH deposit transaction', async () => {
  //       const tx = {
  //         contractAddress: ADDRESS1,
  //         calldata: '0x',
  //         l2Value: 7_000_000,
  //         l2GasLimit: 415_035n,
  //         mintValue: 111_540_663_250_000n,
  //         token: utils.ETH_ADDRESS_IN_CONTRACTS,
  //         to: ADDRESS1,
  //         amount: 7_000_000,
  //         refundRecipient: ADDRESS1,
  //         operatorTip: 0,
  //         overrides: {
  //           from: ADDRESS1,
  //           maxFeePerGas: 1_000_000_001n,
  //           maxPriorityFeePerGas: 1_000_000_000n,
  //           value: 111_540_663_250_000n,
  //         },
  //         gasPerPubdataByte: 800,
  //       };
  //       const result = await wallet.getDepositTx({
  //         token: utils.LEGACY_ETH_ADDRESS,
  //         to: await wallet.getAddress(),
  //         amount: 7_000_000,
  //         refundRecipient: await wallet.getAddress(),
  //       });
  //       expect(result).to.be.deepEqualExcluding(tx, [
  //         'l2GasLimit',
  //         'mintValue',
  //         'overrides',
  //       ]);
  //       expect(result.l2GasLimit > 0n).to.be.true;
  //       expect(result.mintValue > 0n).to.be.true;
  //       expect(utils.isAddressEq(result.overrides.from, ADDRESS1)).to.be.true;
  //       expect(result.overrides.maxFeePerGas > 0n).to.be.true;
  //       expect(result.overrides.maxPriorityFeePerGas > 0n).to.be.true;
  //       expect(result.overrides.value > 0n).to.be.true;
  //     });
  //
  //     it('should return a deposit transaction with `tx.to == Wallet.getAddress()` when `tx.to` is not specified', async () => {
  //       const tx = {
  //         contractAddress: ADDRESS1,
  //         calldata: '0x',
  //         l2Value: 7_000_000,
  //         l2GasLimit: 415_035n,
  //         mintValue: 111_540_663_250_000n,
  //         token: utils.ETH_ADDRESS_IN_CONTRACTS,
  //         to: ADDRESS1,
  //         amount: 7_000_000,
  //         refundRecipient: ADDRESS1,
  //         operatorTip: 0,
  //         overrides: {
  //           from: ADDRESS1,
  //           maxFeePerGas: 1_000_000_001n,
  //           maxPriorityFeePerGas: 1_000_000_000n,
  //           value: 111_540_663_250_000n,
  //         },
  //         gasPerPubdataByte: 800,
  //       };
  //       const result = await wallet.getDepositTx({
  //         token: utils.LEGACY_ETH_ADDRESS,
  //         amount: 7_000_000,
  //         refundRecipient: await wallet.getAddress(),
  //       });
  //       expect(result).to.be.deepEqualExcluding(tx, [
  //         'l2GasLimit',
  //         'mintValue',
  //         'overrides',
  //       ]);
  //       expect(result.l2GasLimit > 0n).to.be.true;
  //       expect(result.mintValue > 0n).to.be.true;
  //       expect(utils.isAddressEq(result.overrides.from, ADDRESS1)).to.be.true;
  //       expect(result.overrides.maxFeePerGas > 0n).to.be.true;
  //       expect(result.overrides.maxPriorityFeePerGas > 0n).to.be.true;
  //       expect(result.overrides.value > 0n).to.be.true;
  //     });
  //
  //     it('should return DAI deposit transaction', async () => {
  //       const transaction = {
  //         maxFeePerGas: 1_000_000_001n,
  //         maxPriorityFeePerGas: 1_000_000_000n,
  //         value: 105_100_275_000_000n,
  //         from: ADDRESS1,
  //         to: await provider.getBridgehubContractAddress(),
  //       };
  //       const result = await wallet.getDepositTx({
  //         token: DAI_L1,
  //         to: await wallet.getAddress(),
  //         amount: 5,
  //         refundRecipient: await wallet.getAddress(),
  //       });
  //       result.to = result.to.toLowerCase();
  //       expect(result).to.be.deepEqualExcluding(transaction, [
  //         'data',
  //         'maxFeePerGas',
  //         'maxPriorityFeePerGas',
  //         'value',
  //       ]);
  //       expect(result.maxFeePerGas > 0n).to.be.true;
  //       expect(result.maxPriorityFeePerGas > 0n).to.be.true;
  //       expect(result.value > 0n).to.be.true;
  //     });
  //   } else {
  //     it('should return ETH deposit transaction', async () => {
  //       const tx = {
  //         from: ADDRESS1,
  //         to: (await provider.getBridgehubContractAddress()).toLowerCase(),
  //         value: 7_000_000n,
  //         data: '0x24fd57fb0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000010e0000000000000000000000000000000000000000000000000000bf1aaa17ee7000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000062e3d000000000000000000000000000000000000000000000000000000000000032000000000000000000000000036615cf349d7f6344891b1e7ca7c72883f5dc049000000000000000000000000842deab39809094bf5e4b77a7f97ae308adc5e5500000000000000000000000000000000000000000000000000000000006acfc0000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000036615cf349d7f6344891b1e7ca7c72883f5dc049',
  //         maxFeePerGas: 1_000_000_001n,
  //         maxPriorityFeePerGas: 1_000_000_000n,
  //       };
  //       const result = await wallet.getDepositTx({
  //         token: utils.LEGACY_ETH_ADDRESS,
  //         to: await wallet.getAddress(),
  //         amount: 7_000_000,
  //         refundRecipient: await wallet.getAddress(),
  //       });
  //       result.to = result.to.toLowerCase();
  //       expect(result).to.be.deepEqualExcluding(tx, [
  //         'data',
  //         'maxFeePerGas',
  //         'maxPriorityFeePerGas',
  //       ]);
  //       expect(BigInt(result.maxPriorityFeePerGas) > 0n).to.be.true;
  //       expect(BigInt(result.maxFeePerGas) > 0n).to.be.true;
  //     });
  //
  //     it('should return a deposit transaction with `tx.to == Wallet.getAddress()` when `tx.to` is not specified', async () => {
  //       const tx = {
  //         from: ADDRESS1,
  //         to: (await provider.getBridgehubContractAddress()).toLowerCase(),
  //         value: 7_000_000n,
  //         maxFeePerGas: 1_000_000_001n,
  //         maxPriorityFeePerGas: 1000_000_000n,
  //       };
  //       const result = await wallet.getDepositTx({
  //         token: utils.LEGACY_ETH_ADDRESS,
  //         amount: 7_000_000,
  //         refundRecipient: await wallet.getAddress(),
  //       });
  //       result.to = result.to.toLowerCase();
  //       expect(result).to.be.deepEqualExcluding(tx, [
  //         'data',
  //         'maxFeePerGas',
  //         'maxPriorityFeePerGas',
  //       ]);
  //       expect(BigInt(result.maxPriorityFeePerGas) > 0n).to.be.true;
  //       expect(BigInt(result.maxFeePerGas) > 0n).to.be.true;
  //     });
  //
  //     it('should return DAI deposit transaction', async () => {
  //       const tx = {
  //         maxFeePerGas: 1_000_000_001n,
  //         maxPriorityFeePerGas: 1_000_000_000n,
  //         value: 0n,
  //         from: ADDRESS1,
  //         to: (await provider.getBridgehubContractAddress()).toLowerCase(),
  //       };
  //       const result = await wallet.getDepositTx({
  //         token: DAI_L1,
  //         to: await wallet.getAddress(),
  //         amount: 5,
  //         refundRecipient: await wallet.getAddress(),
  //       });
  //       result.to = result.to.toLowerCase();
  //       expect(result).to.be.deepEqualExcluding(tx, [
  //         'data',
  //         'maxFeePerGas',
  //         'maxPriorityFeePerGas',
  //       ]);
  //       expect(BigInt(result.maxPriorityFeePerGas) > 0n).to.be.true;
  //       expect(BigInt(result.maxFeePerGas) > 0n).to.be.true;
  //     });
  //   }
  // });

  describe('#deposit()', () => {
    // it('should deposit ETH to L2 network', async () => {
    //   const amount = 7_000_000_000;
    //   const l2BalanceBeforeDeposit = await wallet.getBalance();
    //   const l1BalanceBeforeDeposit = await wallet.getBalanceL1();
    //   const tx = await wallet.deposit({
    //     token: utils.LEGACY_ETH_ADDRESS,
    //     to: await wallet.getAddress(),
    //     amount: amount,
    //     refundRecipient: await wallet.getAddress(),
    //   });
    //   const result = await tx.wait();
    //   const l2BalanceAfterDeposit = await wallet.getBalance();
    //   const l1BalanceAfterDeposit = await wallet.getBalanceL1();
    //   expect(result).not.to.be.null;
    //   expect(l2BalanceAfterDeposit - l2BalanceBeforeDeposit >= amount).to.be
    //     .true;
    //   expect(l1BalanceBeforeDeposit - l1BalanceAfterDeposit >= amount).to.be
    //     .true;
    // });
  });

  // describe('#claimFailedDeposit()', () => {
  //   it('should claim failed deposit', async () => {
  //     const response = await wallet.deposit({
  //       token: DAI_L1,
  //       to: await wallet.getAddress(),
  //       amount: 5,
  //       approveERC20: true,
  //       refundRecipient: await wallet.getAddress(),
  //       l2GasLimit: 300_000, // make it fail because of low gas
  //     });
  //     try {
  //       await response.waitFinalize();
  //     } catch (error) {
  //       const blockNumber = (
  //         await wallet
  //           ._providerL2()
  //           .getTransaction((error as any).receipt.hash)
  //       ).blockNumber!;
  //       // Now wait for block number to be executed.
  //       let blockDetails: types.BlockDetails;
  //       do {
  //         // still not executed.
  //         await utils.sleep(500);
  //         blockDetails = await wallet
  //           ._providerL2()
  //           .getBlockDetails(blockNumber);
  //       } while (!blockDetails || !blockDetails.executeTxHash);
  //       const tx = await wallet.claimFailedDeposit(
  //         (error as any).receipt.hash
  //       );
  //       const result = await tx.wait();
  //       expect(result?.blockHash).to.be.not.null;
  //     }
  //   }).timeout(40_000);
  //
  //   it('should throw an error when trying to claim successful deposit', async () => {
  //     const response = await wallet.deposit({
  //       token: utils.LEGACY_ETH_ADDRESS,
  //       to: await wallet.getAddress(),
  //       amount: 7_000_000_000,
  //       refundRecipient: await wallet.getAddress(),
  //     });
  //     const tx = await response.waitFinalize();
  //     try {
  //       await wallet.claimFailedDeposit(tx.hash);
  //     } catch (e) {
  //       expect((e as Error).message).to.be.equal(
  //         'Cannot claim successful deposit!'
  //       );
  //     }
  //   }).timeout(90_000);
  // });

  // describe('#getFullRequiredDepositFee()', () => {
  //   it('should return a fee for ETH token deposit', async () => {
  //     const result = await wallet.getFullRequiredDepositFee({
  //       token: utils.LEGACY_ETH_ADDRESS,
  //       to: await wallet.getAddress(),
  //     });
  //     expect(result.baseCost > 0n).to.be.true;
  //     expect(result.l1GasLimit > 0n).to.be.true;
  //     expect(result.l2GasLimit > 0n).to.be.true;
  //     expect(result.maxPriorityFeePerGas! > 0n).to.be.true;
  //     expect(result.maxFeePerGas! > 0n).to.be.true;
  //   });
  //
  //   it('should throw an error when there is not enough allowance to cover the deposit', async () => {
  //     try {
  //       await wallet.getFullRequiredDepositFee({
  //         token: DAI_L1,
  //         to: await wallet.getAddress(),
  //       });
  //     } catch (e) {
  //       expect((e as Error).message).to.be.equal(
  //         'Not enough allowance to cover the deposit!'
  //       );
  //     }
  //   });
  // });

  describe('#withdraw()', () => {
    it('should withdraw BTC to the L1 network', async () => {
      const amount = 7_000_000_000n;
      const l2BalanceBeforeWithdrawal = await wallet.getBalance();
      const withdrawTx = await wallet.withdraw({
        to: await wallet.getAddress(),
        amount: amount,
      });
      await withdrawTx.waitFinalize();

      const l2BalanceAfterWithdrawal = await wallet.getBalance();
      expect(l2BalanceBeforeWithdrawal - l2BalanceAfterWithdrawal >= amount).to
        .be.true;
    }).timeout(90_000);

    it('should withdraw BTC to the L1 network using paymaster to cover fee', async () => {
      const amount = 7_000_000_000n;
      const minimalAllowance = 1n;

      const paymasterBalanceBeforeWithdrawal =
        await provider.getBalance(PAYMASTER);
      const paymasterTokenBalanceBeforeWithdrawal = await provider.getBalance(
        PAYMASTER,
        'latest',
        APPROVAL_TOKEN
      );
      const l2BalanceBeforeWithdrawal = await wallet.getBalance();
      const l2ApprovalTokenBalanceBeforeWithdrawal =
        await wallet.getBalance(APPROVAL_TOKEN);

      const withdrawTx = await wallet.withdraw({
        to: await wallet.getAddress(),
        amount: amount,
        paymasterParams: utils.getPaymasterParams(PAYMASTER, {
          type: 'ApprovalBased',
          token: APPROVAL_TOKEN,
          minimalAllowance: minimalAllowance,
          innerInput: new Uint8Array(),
        }),
      });
      await withdrawTx.waitFinalize();

      const paymasterBalanceAfterWithdrawal =
        await provider.getBalance(PAYMASTER);
      const paymasterTokenBalanceAfterWithdrawal = await provider.getBalance(
        PAYMASTER,
        'latest',
        APPROVAL_TOKEN
      );
      const l2BalanceAfterWithdrawal = await wallet.getBalance();
      const l2ApprovalTokenBalanceAfterWithdrawal =
        await wallet.getBalance(APPROVAL_TOKEN);

      expect(
        paymasterBalanceBeforeWithdrawal - paymasterBalanceAfterWithdrawal >= 0n
      ).to.be.true;
      expect(
        paymasterTokenBalanceAfterWithdrawal -
          paymasterTokenBalanceBeforeWithdrawal
      ).to.be.equal(minimalAllowance);

      expect(l2BalanceBeforeWithdrawal - l2BalanceAfterWithdrawal).to.be.equal(
        amount
      );
      expect(
        l2ApprovalTokenBalanceAfterWithdrawal ===
          l2ApprovalTokenBalanceBeforeWithdrawal - minimalAllowance
      ).to.be.true;
    }).timeout(90_000);
  });

  describe('#transfer()', () => {
    it('should transfer BTC', async () => {
      const amount = 7_000_000_000n;
      const balanceBeforeTransfer = await provider.getBalance(ADDRESS2);
      const tx = await wallet.transfer({
        to: ADDRESS2,
        amount: amount,
      });
      const result = await tx.wait();
      const balanceAfterTransfer = await provider.getBalance(ADDRESS2);
      expect(result).not.to.be.null;
      expect(balanceAfterTransfer - balanceBeforeTransfer).to.be.equal(amount);
    }).timeout(25_000);

    it('should transfer BTC using paymaster to cover fee', async () => {
      const amount = 7_000_000_000n;
      const minimalAllowance = 1n;

      const paymasterBalanceBeforeTransfer =
        await provider.getBalance(PAYMASTER);
      const paymasterTokenBalanceBeforeTransfer = await provider.getBalance(
        PAYMASTER,
        'latest',
        APPROVAL_TOKEN
      );
      const senderBalanceBeforeTransfer = await wallet.getBalance();
      const senderApprovalTokenBalanceBeforeTransfer =
        await wallet.getBalance(APPROVAL_TOKEN);
      const receiverBalanceBeforeTransfer = await provider.getBalance(
        ADDRESS2,
        'latest'
      );

      const tx = await wallet.transfer({
        to: ADDRESS2,
        amount: amount,
        paymasterParams: utils.getPaymasterParams(PAYMASTER, {
          type: 'ApprovalBased',
          token: APPROVAL_TOKEN,
          minimalAllowance: minimalAllowance,
          innerInput: new Uint8Array(),
        }),
      });
      const result = await tx.wait();

      const paymasterBalanceAfterTransfer =
        await provider.getBalance(PAYMASTER);
      const paymasterTokenBalanceAfterTransfer = await provider.getBalance(
        PAYMASTER,
        'latest',
        APPROVAL_TOKEN
      );
      const senderBalanceAfterTransfer = await wallet.getBalance();
      const senderApprovalTokenBalanceAfterTransfer =
        await wallet.getBalance(APPROVAL_TOKEN);
      const receiverBalanceAfterTransfer = await provider.getBalance(ADDRESS2);

      expect(
        paymasterBalanceBeforeTransfer - paymasterBalanceAfterTransfer >= 0n
      ).to.be.true;
      expect(
        paymasterTokenBalanceAfterTransfer - paymasterTokenBalanceBeforeTransfer
      ).to.be.equal(minimalAllowance);

      expect(
        senderBalanceBeforeTransfer - senderBalanceAfterTransfer
      ).to.be.equal(amount);
      expect(
        senderApprovalTokenBalanceAfterTransfer ===
          senderApprovalTokenBalanceBeforeTransfer - minimalAllowance
      ).to.be.true;

      expect(result).not.to.be.null;
      expect(
        receiverBalanceAfterTransfer - receiverBalanceBeforeTransfer
      ).to.be.equal(amount);
    }).timeout(25_000);

    it('should transfer DAI', async () => {
      const amount = 5n;
      const balanceBeforeTransfer = await provider.getBalance(
        ADDRESS2,
        'latest',
        DAI
      );
      const tx = await wallet.transfer({
        token: DAI,
        to: ADDRESS2,
        amount: amount,
      });
      const result = await tx.wait();
      const balanceAfterTransfer = await provider.getBalance(
        ADDRESS2,
        'latest',
        DAI
      );
      expect(result).not.to.be.null;
      expect(balanceAfterTransfer - balanceBeforeTransfer).to.be.equal(amount);
    }).timeout(25_000);

    it('should transfer DAI using paymaster to cover fee', async () => {
      const amount = 5n;
      const minimalAllowance = 1n;

      const paymasterBalanceBeforeTransfer =
        await provider.getBalance(PAYMASTER);
      const paymasterTokenBalanceBeforeTransfer = await provider.getBalance(
        PAYMASTER,
        'latest',
        APPROVAL_TOKEN
      );
      const senderBalanceBeforeTransfer = await wallet.getBalance(DAI);
      const senderApprovalTokenBalanceBeforeTransfer =
        await wallet.getBalance(APPROVAL_TOKEN);
      const receiverBalanceBeforeTransfer = await provider.getBalance(
        ADDRESS2,
        'latest',
        DAI
      );

      const tx = await wallet.transfer({
        token: DAI,
        to: ADDRESS2,
        amount: amount,
        paymasterParams: utils.getPaymasterParams(PAYMASTER, {
          type: 'ApprovalBased',
          token: APPROVAL_TOKEN,
          minimalAllowance: minimalAllowance,
          innerInput: new Uint8Array(),
        }),
      });
      const result = await tx.wait();

      const paymasterBalanceAfterTransfer =
        await provider.getBalance(PAYMASTER);
      const paymasterTokenBalanceAfterTransfer = await provider.getBalance(
        PAYMASTER,
        'latest',
        APPROVAL_TOKEN
      );
      const senderBalanceAfterTransfer = await wallet.getBalance(DAI);
      const senderApprovalTokenBalanceAfterTransfer =
        await wallet.getBalance(APPROVAL_TOKEN);
      const receiverBalanceAfterTransfer = await provider.getBalance(
        ADDRESS2,
        'latest',
        DAI
      );

      expect(
        paymasterBalanceBeforeTransfer - paymasterBalanceAfterTransfer >= 0n
      ).to.be.true;
      expect(
        paymasterTokenBalanceAfterTransfer - paymasterTokenBalanceBeforeTransfer
      ).to.be.equal(minimalAllowance);

      expect(
        senderBalanceBeforeTransfer - senderBalanceAfterTransfer
      ).to.be.equal(amount);
      expect(
        senderApprovalTokenBalanceAfterTransfer ===
          senderApprovalTokenBalanceBeforeTransfer - minimalAllowance
      ).to.be.true;

      expect(result).not.to.be.null;
      expect(
        receiverBalanceAfterTransfer - receiverBalanceBeforeTransfer
      ).to.be.equal(amount);
    }).timeout(25_000);
  });

  describe('#signTransaction()', () => {
    it('should return a signed type EIP1559 transaction', async () => {
      const result = await wallet.signTransaction({
        type: 2,
        to: ADDRESS2,
        value: 7_000_000_000n,
      });
      expect(result).not.to.be.null;
    }).timeout(25_000);

    it('should return a signed EIP712 transaction', async () => {
      const result = await wallet.signTransaction({
        type: utils.EIP712_TX_TYPE,
        to: ADDRESS2,
        value: ethers.parseEther('1'),
      });
      expect(result).not.to.be.null;
    }).timeout(25_000);

    it('should throw an error when `tx.from` is mismatched from private key', async () => {
      try {
        await wallet.signTransaction({
          type: utils.EIP712_TX_TYPE,
          from: ADDRESS2,
          to: ADDRESS2,
          value: 7_000_000_000n,
        });
      } catch (e) {
        expect((e as Error).message).to.contain('transaction from mismatch');
      }
    }).timeout(25_000);
  });
});
