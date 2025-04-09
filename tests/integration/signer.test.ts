import * as chai from 'chai';
import '../custom-matchers';
import {Provider, utils} from '../../src';
import {ADDRESS1, ADDRESS2, L2_CHAIN_URL, L1_ADDRESS1} from '../utils';

const {expect} = chai;

import {VoidSigner} from '../../src/signer';

describe('VoidSigner', () => {
  const provider = new Provider(L2_CHAIN_URL);
  const signer = new VoidSigner(ADDRESS1, provider);

  describe('#constructor()', () => {
    it('`VoidSigner(address, provider)` should return a `VoidSigner` with L2 provider', async () => {
      const signer = new VoidSigner(ADDRESS1, provider);

      expect(signer.address).to.be.equal(ADDRESS1);
      expect(signer.provider).to.be.equal(provider);
    });

    it('`VoidSigner(address)` should return a `VoidSigner` without L2 provider', async () => {
      const signer = new VoidSigner(ADDRESS1);

      expect(signer.address).to.be.equal(ADDRESS1);
      expect(signer.provider).to.be.null;
    });
  });

  describe('#getBalance()', () => {
    it('should return the `VoidSigner` balance', async () => {
      const result = await signer.getBalance();
      expect(result > 0n).to.be.true;
    });
  });

  describe('#getAllBalances()', () => {
    it('should return all balances', async () => {
      const result = await signer.getAllBalances();
      const expected = 1;
      expect(Object.keys(result)).to.have.lengthOf(expected);
    });
  });

  describe('#getAddress()', () => {
    it('should return a `VoidSigner` address', async () => {
      const result = await signer.getAddress();
      expect(result).to.be.equal(ADDRESS1);
    });
  });

  describe('#connect()', () => {
    it('should return a `VoidSigner` with provided `provider` as L2 provider', async () => {
      let signer = new VoidSigner(ADDRESS1);
      signer = signer.connect(provider);

      expect(signer.address).to.be.equal(ADDRESS1);
      expect(signer.provider).to.be.equal(provider);
    });
  });

  describe('#getDeploymentNonce()', () => {
    it('should return a deployment nonce', async () => {
      const result = await signer.getDeploymentNonce();
      expect(result).not.to.be.null;
    });
  });

  describe('#populateTransaction()', () => {
    it('should return populated transaction with default values if are omitted', async () => {
      const tx = {
        to: ADDRESS2,
        value: 7_000_000n,
        type: 2,
        from: ADDRESS1,
        nonce: await signer.getNonce('pending'),
        chainId: 270n,
        maxFeePerGas: 1_200_000_000n,
        maxPriorityFeePerGas: 1_000_000_000n,
      };
      const result = await signer.populateTransaction({
        to: ADDRESS2,
        value: 7_000_000,
      });
      expect(result).to.be.deepEqualExcluding(tx, [
        'gasLimit',
        'maxFeePerGas',
        'maxPriorityFeePerGas',
        'chainId',
      ]);
      expect(BigInt(result.gasLimit!) > 0n).to.be.true;
      expect(BigInt(result.maxFeePerGas!) > 0n).to.be.true;
      expect(BigInt(result.maxPriorityFeePerGas!) > 0n).to.be.true;
    });

    it('should return populated transaction when `maxFeePerGas` and `maxPriorityFeePerGas` and `customData` are provided', async () => {
      const tx = {
        to: ADDRESS2,
        value: 7_000_000n,
        type: 113,
        from: ADDRESS1,
        nonce: await signer.getNonce('pending'),
        data: '0x',
        chainId: 270n,
        maxFeePerGas: 3_500_000_000n,
        maxPriorityFeePerGas: 2_000_000_000n,
        customData: {
          gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
          factoryDeps: [],
        },
      };
      const result = await signer.populateTransaction({
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
        nonce: await signer.getNonce('pending'),
        data: '0x',
        chainId: 270n,
        maxPriorityFeePerGas: 2_000_000_000n,
        maxFeePerGas: 1_020_500_000n,
        customData: {
          gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
          factoryDeps: [],
        },
      };
      const result = await signer.populateTransaction({
        to: ADDRESS2,
        value: 7_000_000,
        maxPriorityFeePerGas: 2_000_000_000n,
        customData: {
          gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        },
      });
      expect(result).to.be.deepEqualExcluding(tx, ['gasLimit', 'chainId']);
      expect(BigInt(result.gasLimit!) > 0n).to.be.true;
    });

    it('should return populated transaction when `maxFeePerGas` and `customData` are provided', async () => {
      const tx = {
        to: ADDRESS2,
        value: 7_000_000n,
        type: 113,
        from: ADDRESS1,
        nonce: await signer.getNonce('pending'),
        data: '0x',
        chainId: 270n,
        maxFeePerGas: 3_500_000_000n,
        maxPriorityFeePerGas: 1_000_000_000n,
        customData: {
          gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
          factoryDeps: [],
        },
      };
      const result = await signer.populateTransaction({
        to: ADDRESS2,
        value: 7_000_000,
        maxFeePerGas: 3_500_000_000n,
        customData: {
          gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        },
      });
      expect(result).to.be.deepEqualExcluding(tx, ['gasLimit', 'chainId']);
      expect(BigInt(result.gasLimit!) > 0n).to.be.true;
    });

    it('should return populated EIP1559 transaction when `maxFeePerGas` and `maxPriorityFeePerGas` are provided', async () => {
      const tx = {
        to: ADDRESS2,
        value: 7_000_000n,
        type: 2,
        from: ADDRESS1,
        nonce: await signer.getNonce('pending'),
        chainId: 270n,
        maxFeePerGas: 3_500_000_000n,
        maxPriorityFeePerGas: 2_000_000_000n,
      };
      const result = await signer.populateTransaction({
        to: ADDRESS2,
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
        nonce: await signer.getNonce('pending'),
        chainId: 270n,
        maxFeePerGas: 3_500_000_000n,
        maxPriorityFeePerGas: 3_500_000_000n,
      };
      const result = await signer.populateTransaction({
        to: ADDRESS2,
        value: 7_000_000,
        gasPrice: 3_500_000_000n,
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
        nonce: await signer.getNonce('pending'),
        chainId: 270n,
        gasPrice: 10_250_000n,
      };
      const result = await signer.populateTransaction({
        type: 0,
        to: ADDRESS2,
        value: 7_000_000,
      });
      expect(result).to.be.deepEqualExcluding(tx, ['gasLimit', 'chainId']);
      expect(BigInt(result.gasLimit!) > 0n).to.be.true;
    });
  });

  describe('#sendTransaction()', () => {
    it('should throw an error when trying to send transaction', async () => {
      try {
        await signer.sendTransaction({
          to: ADDRESS2,
          value: 7_000_000,
          maxFeePerGas: 3_500_000_000n,
          maxPriorityFeePerGas: 2_000_000_000n,
        });
      } catch (e) {
        expect((e as Error).message).to.contain(
          'VoidSigner cannot sign transactions'
        );
      }
    });
  });

  describe('#withdraw()', () => {
    it('should throw an error when tyring to withdraw assets', async () => {
      try {
        await signer.withdraw({
          to: L1_ADDRESS1,
          amount: 70_000_000_000,
        });
      } catch (e) {
        expect((e as Error).message).to.contain(
          'VoidSigner cannot sign transactions'
        );
      }
    }).timeout(25_000);
  });

  describe('#transfer()', () => {
    it('should throw an error when tyring to transfer assets', async () => {
      try {
        await signer.transfer({
          token: utils.L2_BASE_TOKEN_ADDRESS,
          to: ADDRESS2,
          amount: 7_000_000_000,
        });
      } catch (e) {
        expect((e as Error).message).to.contain(
          'VoidSigner cannot sign transactions'
        );
      }
    }).timeout(25_000);
  });

  describe('#signTransaction()', () => {
    it('should throw an error when trying to sign transaction', async () => {
      try {
        await signer.signTransaction({
          type: 2,
          to: ADDRESS2,
          value: 7_000_000_000n,
        });
      } catch (e) {
        expect((e as Error).message).to.contain(
          'VoidSigner cannot sign transactions'
        );
      }
    }).timeout(25_000);
  });
});
