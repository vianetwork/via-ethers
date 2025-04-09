import { DEFAULT_GAS_PER_PUBDATA_LIMIT, L1_BRIDGE_ADDRESS, NONCE_HOLDER_ADDRESS, } from './utils';
import { INonceHolder__factory } from './typechain';
import * as btc from '@scure/btc-signer';
import { secp256k1 } from '@noble/curves/secp256k1';
import { hex } from '@scure/base';
export class AdapterL1 {
    /**
     * Transfers the specified token from the associated account on the L1 network to the target account on the L2 network.
     *
     * @param transaction The deposit transaction request.
     * @param transaction.to The address that will receive the deposited tokens on L2.
     * @param transaction.amount The amount of the token to deposit.
     * @param [transaction.strategy] The UTXO selection strategy. For more details visit
     * [this link](https://github.com/paulmillr/scure-btc-signer/tree/1.7.0?tab=readme-ov-file#utxo-selection).
     */
    async deposit(transaction) {
        if (!this._providerL1)
            throw new Error('Provider is not initialized');
        const { to, amount, strategy = 'default' } = transaction;
        const privateKey = btc.WIF(this._network).decode(this._signingKey);
        const publicKey = secp256k1.getPublicKey(privateKey, true);
        const addressType = btc.Address(this._network).decode(this._address).type;
        let spend;
        switch (addressType) {
            case 'wpkh': // Native SegWit (P2WPKH)
                spend = btc.p2wpkh(publicKey, this._network);
                break;
            case 'tr': // Taproot (P2TR)
                spend = btc.p2tr(publicKey, undefined, this._network);
                break;
            case 'pkh': // Legacy (P2PKH)
                spend = btc.p2pkh(publicKey, this._network);
                break;
            case 'sh': // Nested SegWit (P2SH-P2WPKH)
                spend = btc.p2sh(btc.p2wpkh(publicKey, this._network), this._network);
                break;
            default:
                throw new Error(`Unsupported address type: ${addressType}`);
        }
        const utxos = await this._providerL1.command('listunspent', 1, null, [this._address]);
        const inputs = utxos.map(utxo => ({
            ...spend,
            txid: hex.decode(utxo.txid),
            index: utxo.vout,
            witnessUtxo: {
                script: spend.script,
                amount: btc.Decimal.decode(String(utxo.amount)),
            },
        }));
        const outputs = [
            {
                address: L1_BRIDGE_ADDRESS,
                amount: BigInt(amount),
            },
            {
                script: btc.Script.encode(['RETURN', hex.decode(to.slice(2))]),
                amount: 0n,
            },
        ];
        const selected = btc.selectUTXO(inputs, outputs, strategy, {
            changeAddress: this._address, // required, address to send change
            // TODO: check the gas from the server
            feePerByte: 2n,
            bip69: true,
            createTx: true,
            network: this._network,
            allowUnknownOutputs: true, // required for OP_RETURN
        });
        if (!selected || !selected.tx)
            throw new Error('UTXO selection strategy failed');
        const { tx } = selected;
        tx.sign(privateKey);
        tx.finalize();
        const rawTx = hex.encode(tx.extract());
        return await this._providerL1.command('sendrawtransaction', rawTx);
    }
}
export class AdapterL2 {
    /**
     * Returns the balance of the account.
     *
     * @param [token] The token address to query balance for. Defaults to the native token.
     * @param [blockTag='committed'] The block tag to get the balance at.
     */
    async getBalance(token, blockTag = 'committed') {
        if (!this._providerL2)
            throw new Error('Provider is not initialized');
        return await this._providerL2.getBalance(await this.getAddress(), blockTag, token);
    }
    /**
     * Returns all token balances of the account.
     */
    async getAllBalances() {
        if (!this._providerL2)
            throw new Error('Provider is not initialized');
        return await this._providerL2.getAllAccountBalances(await this.getAddress());
    }
    /**
     * Returns the deployment nonce of the account.
     */
    async getDeploymentNonce() {
        return await INonceHolder__factory.connect(NONCE_HOLDER_ADDRESS, this._signerL2).getDeploymentNonce(await this.getAddress());
    }
    /**
     * Initiates the withdrawal process which withdraws BTC from the
     * associated account on L2 network to the target account on L1 network.
     *
     * @param transaction Withdrawal transaction request.
     * @param transaction.amount The amount of the BTC tokens to withdraw.
     * @param transaction.to The address of the recipient on L1.
     * @param [transaction.paymasterParams] Paymaster parameters.
     * @param [transaction.overrides] Transaction's overrides which may be used to pass L2 `gasLimit`, `gasPrice`, `value`, etc.
     * @returns A Promise resolving to a withdrawal transaction response.
     */
    async withdraw(transaction) {
        if (!this._providerL2)
            throw new Error('Provider is not initialized');
        const withdrawTx = await this._providerL2.getWithdrawTx({
            from: await this.getAddress(),
            ...transaction,
        });
        return await this.sendTransaction(withdrawTx);
    }
    /**
     * Transfer BTC or any ERC20 token within the same interface.
     *
     * @param transaction Transfer transaction request.
     * @param transaction.to The address of the recipient.
     * @param transaction.amount The amount of the token to transfer.
     * @param [transaction.token] The address of the token. Defaults to BTC.
     * @param [transaction.paymasterParams] Paymaster parameters.
     * @param [transaction.overrides] Transaction's overrides which may be used to pass L2 `gasLimit`, `gasPrice`, `value`, etc.
     * @returns A Promise resolving to a transfer transaction response.
     */
    async transfer(transaction) {
        if (!this._providerL2)
            throw new Error('Provider is not initialized');
        const transferTx = await this._providerL2.getTransferTx({
            from: await this.getAddress(),
            ...transaction,
        });
        return await this.sendTransaction(transferTx);
    }
    _fillCustomData(data) {
        const customData = { ...data };
        customData.gasPerPubdata ?? (customData.gasPerPubdata = DEFAULT_GAS_PER_PUBDATA_LIMIT);
        customData.factoryDeps ?? (customData.factoryDeps = []);
        return customData;
    }
}
//# sourceMappingURL=adapters.js.map