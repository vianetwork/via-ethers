import * as chai from 'chai';
import '../custom-matchers';
import {Provider, utils, Wallet} from '../../src';
import {ethers} from 'ethers';
import * as fs from 'fs';
import {
  ADDRESS1,
  ADDRESS2,
  APPROVAL_TOKEN,
  DAI,
  L1_ADDRESS1,
  L1_CHAIN_PASSWORD,
  L1_CHAIN_URL,
  L1_CHAIN_USER,
  L1_CHAIN_WALLET,
  L1_PRIVATE_KEY1,
  L2_CHAIN_URL,
  MNEMONIC1,
  PAYMASTER,
  PRIVATE_KEY1,
} from '../utils';
import BitcoinClient from 'bitcoin-core';
import {REGTEST_NETWORK} from '../../src/utils';
import {sleep} from '../../build/utils';

const {expect} = chai;

describe('Wallet', () => {
  const providerL2 = new Provider(L2_CHAIN_URL);
  const providerL1 = new BitcoinClient({
    host: L1_CHAIN_URL,
    username: L1_CHAIN_USER,
    password: L1_CHAIN_PASSWORD,
    wallet: L1_CHAIN_WALLET,
  });
  const wallet = new Wallet(
    PRIVATE_KEY1,
    providerL2,
    L1_PRIVATE_KEY1,
    L1_ADDRESS1,
    providerL1,
    REGTEST_NETWORK
  );

  describe('#constructor()', () => {
    it('`Wallet(privateKeyL2, providerL2)` should return a `Wallet` with L2 provider', async () => {
      const wallet = new Wallet(PRIVATE_KEY1, providerL2);

      expect(wallet.signingKey.privateKey).to.be.equal(PRIVATE_KEY1);
      expect(wallet.provider).to.be.equal(providerL2);
      expect(wallet.signingKeyL1).to.be.undefined;
      expect(wallet.addressL1).to.be.undefined;
      expect(wallet.providerL1).to.be.undefined;
    });

    it('`Wallet(privateKey, provider, privateKeyL1, addressL1, providerL2, REGTEST_NETWORK)` should return a `Wallet` with L1 and L2 provider', async () => {
      const wallet = new Wallet(
        PRIVATE_KEY1,
        providerL2,
        L1_PRIVATE_KEY1,
        L1_ADDRESS1,
        providerL1,
        REGTEST_NETWORK
      );

      expect(wallet.signingKey.privateKey).to.be.equal(PRIVATE_KEY1);
      expect(wallet.provider).to.be.equal(providerL2);
      expect(wallet.signingKeyL1).to.be.equal(L1_PRIVATE_KEY1);
      expect(wallet.addressL1).to.be.equal(L1_ADDRESS1);
      expect(wallet.providerL1).to.be.equal(providerL1);
    });
  });

  describe('#getBalance()', () => {
    it('should return a `Wallet` balance', async () => {
      const result = await wallet.getBalance();
      expect(result > 0n).to.be.true;
    });
  });

  describe('#getAllBalances()', () => {
    it('should return the all balances', async () => {
      const result = await wallet.getAllBalances();
      const expected = 1;
      expect(Object.keys(result)).to.have.lengthOf(expected);
    });
  });

  describe('#getAddress()', () => {
    it('should return the `Wallet` address', async () => {
      const result = await wallet.getAddress();
      expect(result).to.be.equal(ADDRESS1);
    });
  });

  describe('#connect()', () => {
    it('should return a `Wallet` with provided `provider` as L2 provider', async () => {
      let wallet = new Wallet(PRIVATE_KEY1);
      wallet = wallet.connect(providerL2);
      expect(wallet.signingKey.privateKey).to.be.equal(PRIVATE_KEY1);
      expect(wallet.provider).to.be.equal(providerL2);
    });
  });

  describe('#connectL1()', () => {
    it('should return a `Wallet` with provided `provider` as L1 provider', async () => {
      let wallet = new Wallet(PRIVATE_KEY1, null, L1_PRIVATE_KEY1, L1_ADDRESS1);
      wallet = wallet.connectToL1(providerL1, REGTEST_NETWORK);
      expect(wallet.signingKey.privateKey).to.be.equal(PRIVATE_KEY1);
      expect(wallet.provider).to.be.null;
      expect(wallet.signingKeyL1).to.be.equal(L1_PRIVATE_KEY1);
      expect(wallet.addressL1).to.be.equal(L1_ADDRESS1);
      expect(wallet.providerL1).to.be.equal(providerL1);
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
    it('should return a `Wallet` with the `provider` as L2 provider and a private key that is built from the `mnemonic` passphrase', async () => {
      const wallet = Wallet.fromMnemonic(MNEMONIC1, providerL2);
      expect(wallet.signingKey.privateKey).to.be.equal(PRIVATE_KEY1);
      expect(wallet.provider).to.be.equal(providerL2);
      expect(wallet.signingKeyL1).to.be.undefined;
      expect(wallet.addressL1).to.be.undefined;
      expect(wallet.providerL1).to.be.undefined;
    });

    it('should return a `Wallet` connected to L1 and L2 networks', async () => {
      const wallet = Wallet.fromMnemonic(
        MNEMONIC1,
        providerL2,
        L1_PRIVATE_KEY1,
        L1_ADDRESS1,
        providerL1,
        REGTEST_NETWORK
      );
      expect(wallet.signingKey.privateKey).to.be.equal(PRIVATE_KEY1);
      expect(wallet.provider).to.be.equal(providerL2);
      expect(wallet.signingKeyL1).to.be.equal(L1_PRIVATE_KEY1);
      expect(wallet.addressL1).to.be.equal(L1_ADDRESS1);
      expect(wallet.providerL1).to.be.equal(providerL1);
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
    it('should return a random `Wallet` with L1 and L2 provider', async () => {
      const wallet = Wallet.createRandom(
        providerL2,
        L1_PRIVATE_KEY1,
        L1_ADDRESS1,
        providerL1,
        REGTEST_NETWORK
      );
      expect(wallet.signingKey.privateKey).not.to.be.null;
      expect(wallet.provider).to.be.equal(providerL2);
      expect(wallet.signingKeyL1).to.be.equal(L1_PRIVATE_KEY1);
      expect(wallet.addressL1).to.be.equal(L1_ADDRESS1);
      expect(wallet.providerL1).to.be.equal(providerL1);
    });
  });

  describe('#deposit()', () => {
    it('should deposit BTC to L2 network', async () => {
      const amount = 70_000_000n;
      const l2BalanceBeforeDeposit = await wallet.getBalance();

      const tx = await wallet.deposit(wallet.address, amount);
      expect(tx).not.to.be.null;
      await sleep(10_000)

      const l2BalanceAfterDeposit = await wallet.getBalance();
      expect(l2BalanceAfterDeposit - l2BalanceBeforeDeposit >= amount).to.be
        .true;
    }).timeout(20_000);
  });

  describe('#withdraw()', () => {
    it('should withdraw BTC to the L1 network', async () => {
      const amount = 10_000_000_000n;
      const l2BalanceBeforeWithdrawal = await wallet.getBalance();
      const withdrawTx = await wallet.withdraw({
        to: L1_ADDRESS1,
        amount: amount,
      });
      await withdrawTx.wait();

      const l2BalanceAfterWithdrawal = await wallet.getBalance();
      expect(l2BalanceBeforeWithdrawal - l2BalanceAfterWithdrawal >= amount).to
        .be.true;
    }).timeout(90_000);

    it('should withdraw BTC to the L1 network using paymaster to cover fee', async () => {
      const amount = 10_000_000_000n;
      const minimalAllowance = 1n;

      const paymasterBalanceBeforeWithdrawal =
        await providerL2.getBalance(PAYMASTER);
      const paymasterTokenBalanceBeforeWithdrawal = await providerL2.getBalance(
        PAYMASTER,
        'latest',
        APPROVAL_TOKEN
      );
      const l2BalanceBeforeWithdrawal = await wallet.getBalance();
      const l2ApprovalTokenBalanceBeforeWithdrawal =
        await wallet.getBalance(APPROVAL_TOKEN);

      const withdrawTx = await wallet.withdraw({
        to: L1_ADDRESS1,
        amount: amount,
        paymasterParams: utils.getPaymasterParams(PAYMASTER, {
          type: 'ApprovalBased',
          token: APPROVAL_TOKEN,
          minimalAllowance: minimalAllowance,
          innerInput: new Uint8Array(),
        }),
      });
      await withdrawTx.wait();

      const paymasterBalanceAfterWithdrawal =
        await providerL2.getBalance(PAYMASTER);
      const paymasterTokenBalanceAfterWithdrawal = await providerL2.getBalance(
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
      const balanceBeforeTransfer = await providerL2.getBalance(ADDRESS2);
      const tx = await wallet.transfer({
        to: ADDRESS2,
        amount: amount,
      });
      const result = await tx.wait();
      const balanceAfterTransfer = await providerL2.getBalance(ADDRESS2);
      expect(result).not.to.be.null;
      expect(balanceAfterTransfer - balanceBeforeTransfer).to.be.equal(amount);
    }).timeout(25_000);

    it('should transfer BTC using paymaster to cover fee', async () => {
      const amount = 7_000_000_000n;
      const minimalAllowance = 1n;

      const paymasterBalanceBeforeTransfer =
        await providerL2.getBalance(PAYMASTER);
      const paymasterTokenBalanceBeforeTransfer = await providerL2.getBalance(
        PAYMASTER,
        'latest',
        APPROVAL_TOKEN
      );
      const senderBalanceBeforeTransfer = await wallet.getBalance();
      const senderApprovalTokenBalanceBeforeTransfer =
        await wallet.getBalance(APPROVAL_TOKEN);
      const receiverBalanceBeforeTransfer = await providerL2.getBalance(
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
        await providerL2.getBalance(PAYMASTER);
      const paymasterTokenBalanceAfterTransfer = await providerL2.getBalance(
        PAYMASTER,
        'latest',
        APPROVAL_TOKEN
      );
      const senderBalanceAfterTransfer = await wallet.getBalance();
      const senderApprovalTokenBalanceAfterTransfer =
        await wallet.getBalance(APPROVAL_TOKEN);
      const receiverBalanceAfterTransfer =
        await providerL2.getBalance(ADDRESS2);

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
      const balanceBeforeTransfer = await providerL2.getBalance(
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
      const balanceAfterTransfer = await providerL2.getBalance(
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
        await providerL2.getBalance(PAYMASTER);
      const paymasterTokenBalanceBeforeTransfer = await providerL2.getBalance(
        PAYMASTER,
        'latest',
        APPROVAL_TOKEN
      );
      const senderBalanceBeforeTransfer = await wallet.getBalance(DAI);
      const senderApprovalTokenBalanceBeforeTransfer =
        await wallet.getBalance(APPROVAL_TOKEN);
      const receiverBalanceBeforeTransfer = await providerL2.getBalance(
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
        await providerL2.getBalance(PAYMASTER);
      const paymasterTokenBalanceAfterTransfer = await providerL2.getBalance(
        PAYMASTER,
        'latest',
        APPROVAL_TOKEN
      );
      const senderBalanceAfterTransfer = await wallet.getBalance(DAI);
      const senderApprovalTokenBalanceAfterTransfer =
        await wallet.getBalance(APPROVAL_TOKEN);
      const receiverBalanceAfterTransfer = await providerL2.getBalance(
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
