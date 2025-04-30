import {expect} from 'chai';
import '../custom-matchers';
import {Provider, types, utils, Wallet} from '../../src';
import {ethers} from 'ethers';
import {
  ADDRESS1,
  ADDRESS2,
  APPROVAL_TOKEN,
  DAI,
  L1_ADDRESS1_NATIVE_SEGWIT,
  L2_CHAIN_URL,
  PAYMASTER,
  PRIVATE_KEY1,
} from '../utils';

describe('Provider', () => {
  const provider = new Provider(L2_CHAIN_URL);
  const wallet = new Wallet(PRIVATE_KEY1, provider);

  let receipt: types.TransactionReceipt;

  before('setup', async function () {
    this.timeout(25_000);
    const tx = await wallet.transfer({
      token: utils.L2_BASE_TOKEN_ADDRESS,
      to: ADDRESS2,
      amount: 1_000_000,
    });
    receipt = await tx.wait();
  });

  describe('#getDefaultProvider()', () => {
    it('should return a provider connected to Localhost network', async () => {
      const provider = Provider.getDefaultProvider(types.Network.Localhost);
      const network = await provider.getNetwork();
      expect(network.chainId).to.be.equal(25223n);
    });
  });

  describe('#getProtocolVersion()', () => {
    it('should return the latest protocol version', async () => {
      const result = await provider.getProtocolVersion();
      expect(result).not.to.be.null;
    });
  });

  describe('#getFeeParams()', () => {
    it('should return the current fee parameters', async () => {
      const result = await provider.getFeeParams();
      expect(result).not.to.be.null;
    });
  });

  describe('#getTestnetPaymasterAddress()', () => {
    it('should return the address of testnet paymaster', async () => {
      const result = await provider.getTestnetPaymasterAddress();
      expect(result).not.to.be.null;
    });
  });

  describe('getBlockNumber()', () => {
    it('should return a block number', async () => {
      const result = await provider.getBlockNumber();
      expect(result).to.be.greaterThan(0);
    });
  });

  describe('#getGasPrice()', () => {
    it('should return a gas price', async () => {
      const result = await provider.getGasPrice();
      expect(result > 0n).to.be.true;
    });
  });

  describe('#getL1BatchNumber()', () => {
    it('should return a L1 batch number', async () => {
      const result = await provider.getL1BatchNumber();
      expect(result).to.be.greaterThan(0);
    });
  });

  describe('#getBalance()', () => {
    it('should return a BTC balance of the account at `address`', async () => {
      const result = await provider.getBalance(ADDRESS1);
      expect(result > 0n).to.be.true;
    });

    it('should return a DAI balance of the account at `address`', async () => {
      const result = await provider.getBalance(ADDRESS1, 'latest', DAI);
      expect(result > 0n).to.be.true;
    });
  });

  describe('#getBlockDetails()', () => {
    it('should return a block details', async () => {
      const result = await provider.getBlockDetails(1);
      expect(result).not.to.be.null;
    });
  });

  describe('#getTransactionDetails()', () => {
    it('should return a transaction details', async () => {
      const result = await provider.getTransactionDetails(receipt.hash);
      expect(result).not.to.be.null;
    });
  });

  describe('#getBytecodeByHash()', () => {
    it('should return the bytecode of a contract', async () => {
      const paymasterBytecode = await provider.getCode(PAYMASTER);
      const paymasterBytecodeHash = ethers.hexlify(
        utils.hashBytecode(paymasterBytecode)
      );
      const result = await provider.getBytecodeByHash(paymasterBytecodeHash);
      expect(result).to.be.deep.equal(
        Array.from(ethers.getBytes(paymasterBytecode))
      );
    });
  });

  describe('#getRawBlockTransactions()', () => {
    it('should return a raw transactions', async () => {
      const blockNumber = await provider.getBlockNumber();
      const result = await provider.getRawBlockTransactions(blockNumber);
      expect(result).not.to.be.null;
    });
  });

  describe('#getProof()', () => {
    it('should return a storage proof', async () => {
      // fetching the storage proof for rawNonce storage slot in NonceHolder system contract
      // mapping(uint256 => uint256) internal rawNonces;

      // Ensure the address is a 256-bit number by padding it
      // because rawNonces uses uint256 for mapping addresses and their nonces
      const addressPadded = ethers.zeroPadValue(wallet.address, 32);

      // Convert the slot number to a hex string and pad it to 32 bytes
      const slotPadded = ethers.zeroPadValue(ethers.toBeHex(0), 32);

      // Concatenate the padded address and slot number
      const concatenated = addressPadded + slotPadded.slice(2); // slice to remove '0x' from the slotPadded

      // Hash the concatenated string using Keccak-256
      const storageKey = ethers.keccak256(concatenated);

      const l1BatchNumber = await provider.getL1BatchNumber();
      try {
        const result = await provider.getProof(
          utils.NONCE_HOLDER_ADDRESS,
          [storageKey],
          l1BatchNumber
        );
        expect(result).not.to.be.null;
      } catch (error) {
        //
      }
    });
  });

  describe('#getTransactionStatus()', () => {
    it('should return the `Committed` status for a mined transaction', async () => {
      const result = await provider.getTransactionStatus(receipt.hash);
      expect(result).not.to.be.null;
    });

    it('should return the `NotFound` status for a non-existing transaction', async () => {
      const tx =
        '0x0000000000000000000000000000000000000000000000000000000000000000';
      const result = await provider.getTransactionStatus(tx);
      expect(result).to.be.equal(types.TransactionStatus.NotFound);
    });
  });

  describe('#getTransaction()', () => {
    it('should return a transaction', async () => {
      const result = await provider.getTransaction(receipt.hash);
      expect(result).not.to.be.null;
    });
  });

  describe('#getTransactionReceipt()', () => {
    it('should return a transaction receipt', async () => {
      const result = await provider.getTransaction(receipt.hash);
      expect(result).not.to.be.null;
    });
  });

  describe('#newBlockFilter()', () => {
    it('should return a new block filter', async () => {
      const result = await provider.newBlockFilter();
      expect(result).not.to.be.null;
    });
  });

  describe('#newPendingTransactionsFilter()', () => {
    it('should return a new pending block filter', async () => {
      const result = await provider.newPendingTransactionsFilter();
      expect(result).not.to.be.null;
    });
  });

  describe('#newFilter()', () => {
    it('should return a new filter', async () => {
      const result = await provider.newFilter({
        fromBlock: 0,
        toBlock: 5,
        address: utils.L2_BASE_TOKEN_ADDRESS,
      });
      expect(result).not.to.be.null;
    });
  });

  describe('#getContractAccountInfo()', () => {
    it('should return the contract account info', async () => {
      const TESTNET_PAYMASTER = '0x0f9acdb01827403765458b4685de6d9007580d15';
      const result = await provider.getContractAccountInfo(TESTNET_PAYMASTER);
      expect(result).not.to.be.null;
    });
  });

  describe('#getBlock()', () => {
    it('should return a block', async () => {
      const result = await provider.getBlock(receipt.blockNumber!, false);
      expect(result).not.to.be.null;
      expect(result.transactions).not.to.be.empty;
    });

    it('should return a block with prefetch transactions', async () => {
      const result = await provider.getBlock(receipt.blockNumber!, true);
      expect(result).not.to.be.null;
      expect(result.transactions).not.to.be.empty;
      expect(result.prefetchedTransactions).not.to.be.empty;
    });

    it('should return a latest block', async () => {
      const result = await provider.getBlock('latest');
      expect(result).not.to.be.null;
    });

    it('should return the earliest block', async () => {
      const result = await provider.getBlock('earliest');
      expect(result).not.to.be.null;
    });

    it('should return a committed block', async () => {
      const result = await provider.getBlock('committed');
      expect(result).not.to.be.null;
    });

    it('should return a finalized block', async () => {
      const result = await provider.getBlock('finalized');
      expect(result).not.to.be.null;
    });
  });

  describe('#getBlockDetails()', () => {
    it('should return the block details', async () => {
      const result = await provider.getBlockDetails(
        await provider.getBlockNumber()
      );
      expect(result).not.to.be.null;
    });
  });

  describe('#getL1BatchBlockRange()', () => {
    it('should return the L1 batch block range', async () => {
      const l1BatchNumber = await provider.getL1BatchNumber();
      const result = await provider.getL1BatchBlockRange(l1BatchNumber);
      expect(result).not.to.be.null;
    });
  });

  describe('#getL1BatchDetails()', () => {
    it('should return the L1 batch details', async () => {
      const l1BatchNumber = await provider.getL1BatchNumber();
      const result = await provider.getL1BatchDetails(l1BatchNumber);
      expect(result).not.to.be.null;
    });
  });

  describe('#getLogs()', () => {
    it('should return the logs', async () => {
      const result = await provider.getLogs({
        fromBlock: 0,
        toBlock: 5,
        address: utils.L2_BASE_TOKEN_ADDRESS,
      });
      expect(result).not.to.be.null;
    });
  });

  describe('#getWithdrawTx()', () => {
    it('should return an BTC withdraw transaction', async () => {
      const tx = {
        type: 113,
        from: ADDRESS1,
        value: 10_000_000_000n,
        to: utils.L2_BASE_TOKEN_ADDRESS,
        data: '0x0968f2640000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002c62637274317178326c6b30756e756b6d3830716d65706a703439687766397a36786e7a307337336b396a35360000000000000000000000000000000000000000',
      };
      const result = await provider.getWithdrawTx({
        amount: 10_000_000_000n,
        from: ADDRESS1,
        to: L1_ADDRESS1_NATIVE_SEGWIT,
      });
      expect(result).to.be.deep.equal(tx);
    });

    it('should return an BTC withdraw transaction with paymaster parameters', async () => {
      const tx = {
        from: ADDRESS1,
        value: 10_000_000_000n,
        to: utils.L2_BASE_TOKEN_ADDRESS,
        data: '0x0968f2640000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002c62637274317178326c6b30756e756b6d3830716d65706a703439687766397a36786e7a307337336b396a35360000000000000000000000000000000000000000',
        type: 113,
        customData: {
          paymasterParams: {
            paymaster: '0x0EEc6f45108B4b806e27B81d9002e162BD910670',
            paymasterInput:
              '0x949431dc0000000000000000000000002dc3685ca34163952cf4a5395b0039c00dfa851d000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000',
          },
        },
      };
      const result = await provider.getWithdrawTx({
        amount: 10_000_000_000n,
        from: ADDRESS1,
        to: L1_ADDRESS1_NATIVE_SEGWIT,
        paymasterParams: utils.getPaymasterParams(PAYMASTER, {
          type: 'ApprovalBased',
          token: APPROVAL_TOKEN,
          minimalAllowance: 1,
          innerInput: new Uint8Array(),
        }),
      });
      expect(result).to.be.deep.equal(tx);
    });
  });

  describe('#getTransferTx()', () => {
    it('should return a BTC transfer transaction', async () => {
      const tx = {
        type: 113,
        from: ADDRESS1,
        to: ADDRESS2,
        value: 7_000_000_000n,
      };
      const result = await provider.getTransferTx({
        token: utils.L2_BASE_TOKEN_ADDRESS,
        amount: 7_000_000_000n,
        to: ADDRESS2,
        from: ADDRESS1,
      });
      expect(result).to.be.deep.equal(tx);
    });

    it('should return an BTC transfer transaction with paymaster parameters', async () => {
      const tx = {
        type: utils.EIP712_TX_TYPE,
        from: ADDRESS1,
        to: ADDRESS2,
        value: 7_000_000_000n,
        customData: {
          paymasterParams: {
            paymaster: '0x0EEc6f45108B4b806e27B81d9002e162BD910670',
            paymasterInput:
              '0x949431dc0000000000000000000000002dc3685ca34163952cf4a5395b0039c00dfa851d000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000',
          },
        },
      };
      const result = await provider.getTransferTx({
        token: utils.L2_BASE_TOKEN_ADDRESS,
        amount: 7_000_000_000n,
        to: ADDRESS2,
        from: ADDRESS1,
        paymasterParams: utils.getPaymasterParams(PAYMASTER, {
          type: 'ApprovalBased',
          token: APPROVAL_TOKEN,
          minimalAllowance: 1,
          innerInput: new Uint8Array(),
        }),
      });
      expect(result).to.be.deep.equal(tx);
    });

    it('should return a DAI transfer transaction', async () => {
      const tx = {
        type: 113,
        from: ADDRESS1,
        to: DAI,
        data: '0xa9059cbb000000000000000000000000a61464658afeaf65cccaafd3a512b69a83b776180000000000000000000000000000000000000000000000000000000000000005',
      };
      const result = await provider.getTransferTx({
        token: DAI,
        amount: 5,
        to: ADDRESS2,
        from: ADDRESS1,
      });
      expect(result).to.be.deep.equal(tx);
    });

    it('should return a DAI transfer transaction with paymaster parameters', async () => {
      const tx = {
        type: 113,
        from: ADDRESS1,
        to: DAI,
        data: '0xa9059cbb000000000000000000000000a61464658afeaf65cccaafd3a512b69a83b776180000000000000000000000000000000000000000000000000000000000000005',
        customData: {
          paymasterParams: {
            paymaster: '0x0EEc6f45108B4b806e27B81d9002e162BD910670',
            paymasterInput:
              '0x949431dc0000000000000000000000002dc3685ca34163952cf4a5395b0039c00dfa851d000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000',
          },
        },
      };
      const result = await provider.getTransferTx({
        token: DAI,
        amount: 5,
        to: ADDRESS2,
        from: ADDRESS1,
        paymasterParams: utils.getPaymasterParams(PAYMASTER, {
          type: 'ApprovalBased',
          token: APPROVAL_TOKEN,
          minimalAllowance: 1,
          innerInput: new Uint8Array(),
        }),
      });
      expect(result).to.be.deep.equal(tx);
    });
  });

  describe('#estimateGasWithdraw()', () => {
    it('should return a gas estimation of the withdraw transaction', async () => {
      const result = await provider.estimateGasWithdraw({
        amount: 10_000_000_000n,
        from: ADDRESS1,
        to: L1_ADDRESS1_NATIVE_SEGWIT,
      });
      expect(result > 0n).to.be.true;
    });

    it('should return a gas estimation of the withdraw transaction with paymaster', async () => {
      const result = await provider.estimateGasWithdraw({
        amount: 10_000_000_000n,
        from: ADDRESS1,
        to: L1_ADDRESS1_NATIVE_SEGWIT,
        paymasterParams: utils.getPaymasterParams(PAYMASTER, {
          type: 'ApprovalBased',
          token: APPROVAL_TOKEN,
          minimalAllowance: 1,
          innerInput: new Uint8Array(),
        }),
      });
      expect(result > 0n).to.be.true;
    });
  });

  describe('#estimateGasTransfer()', () => {
    it('should return a gas estimation of the transfer transaction', async () => {
      const result = await provider.estimateGasTransfer({
        token: utils.L2_BASE_TOKEN_ADDRESS,
        amount: 7_000_000_000,
        to: ADDRESS2,
        from: ADDRESS1,
      });
      expect(result > 0n).to.be.be.true;
    });

    it('should return a gas estimation of the transfer transaction with paymaster', async () => {
      const result = await provider.estimateGasTransfer({
        token: utils.L2_BASE_TOKEN_ADDRESS,
        amount: 7_000_000_000,
        to: ADDRESS2,
        from: ADDRESS1,
        paymasterParams: utils.getPaymasterParams(PAYMASTER, {
          type: 'ApprovalBased',
          token: APPROVAL_TOKEN,
          minimalAllowance: 1,
          innerInput: new Uint8Array(),
        }),
      });
      expect(result > 0n).to.be.be.true;
    });
  });

  describe('#estimateFee()', () => {
    it('should return a gas estimation of the transaction', async () => {
      const result = await provider.estimateFee({
        from: ADDRESS1,
        to: ADDRESS2,
        value: 7_000_000_000n,
      });
      expect(result).not.to.be.null;
    });
  });

  describe('#estimateGas()', () => {
    it('should return a gas estimation of the transaction', async () => {
      const result = await provider.estimateGas({
        from: ADDRESS1,
        to: DAI,
        data: utils.IERC20.encodeFunctionData('approve', [ADDRESS2, 1]),
      });
      expect(result > 0n).to.be.true;
    });

    it('should return a gas estimation of the EIP712 transaction', async () => {
      const result = await provider.estimateGas({
        from: ADDRESS1,
        to: DAI,
        data: utils.IERC20.encodeFunctionData('approve', [ADDRESS2, 1]),
        customData: {
          gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        },
      });
      expect(result > 0n).to.be.true;
    });
  });

  describe('#getFilterChanges()', () => {
    it('should return the filtered logs', async () => {
      const filter = await provider.newFilter({
        address: utils.L2_BASE_TOKEN_ADDRESS,
        topics: [ethers.id('Transfer(address,address,uint256)')],
      });
      const result = await provider.getFilterChanges(filter);
      expect(result).not.to.be.null;
    });
  });

  describe('#sendRawTransactionWithDetailedOutput()', () => {
    it('should return the transaction with detailed output', async () => {
      const result = await provider.sendRawTransactionWithDetailedOutput(
        await wallet.signTransaction({
          to: ADDRESS2,
          value: 7_000_000_000n,
        })
      );
      expect(result).not.to.be.null;
    });
  });
  describe('#error()', () => {
    it('Should not allow invalid contract bytecode', async () => {
      const address = wallet.getAddress();

      try {
        await provider.estimateGas({
          to: address,
          from: address,
          customData: {
            gasPerPubdata: 50_000,
            factoryDeps: new Array(17).fill('0x1234567890abcdef'),
            customSignature: new Uint8Array(17),
          },
        });
      } catch (e) {
        expect(
          (e as Error).message
            .toString()
            .includes('Bytecode length is not divisible by 32')
        ).to.be.true;
      }
    });

    it('Not enough balance should revert', async () => {
      try {
        await provider.estimateGasTransfer({
          token: utils.L2_BASE_TOKEN_ADDRESS,
          amount: 7_000_000_000_000_000_000_000_000n,
          to: ADDRESS2,
          from: ADDRESS1,
        });
      } catch (e) {
        expect(
          (e as Error).message
            .toString()
            .includes('insufficient balance for transfer')
        ).to.be.true;
      }
    });
  });
});
