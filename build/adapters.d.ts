import { BigNumberish, BlockTag, ethers } from 'ethers';
import { Provider } from './provider';
import { Address, BalancesMap, Eip712Meta, PaymasterParams, TransactionRequest, TransactionResponse } from './types';
import BitcoinClient from 'bitcoin-core';
import { SelectionStrategy } from '@scure/btc-signer/utxo';
import { BTC_NETWORK } from '@scure/btc-signer/utils';
export declare abstract class AdapterL1 {
    /** The private key of the L1 account in WIF format. */
    protected _signingKey: string;
    /** The address of the L1 account. Supported types: `tr`, `sh`, `wpkh`, `pkh`. */
    protected _address: string;
    /** The L1 network configuration. */
    protected _network: BTC_NETWORK;
    /** The provider instance for connecting to a L1 network. */
    protected _providerL1?: BitcoinClient;
    /** The provider instance for connecting to a L2 network. */
    protected _providerL2?: Provider;
    /**
     * Transfers the specified token from the associated account on the L1 network to the target account on the L2 network.
     *
     * @param transaction The deposit transaction request.
     * @param transaction.to The address that will receive the deposited tokens on L2.
     * @param transaction.amount The amount of the token to deposit.
     * @param [transaction.strategy] The UTXO selection strategy. For more details visit
     * [this link](https://github.com/paulmillr/scure-btc-signer/tree/1.7.0?tab=readme-ov-file#utxo-selection).
     */
    deposit(transaction: {
        to: Address;
        amount: BigNumberish;
        strategy?: SelectionStrategy;
    }): Promise<string>;
}
export declare abstract class AdapterL2 {
    protected _providerL2?: Provider;
    protected _signerL2: ethers.Signer;
    /**
     * Returns the address of the associated account.
     */
    abstract getAddress(): Promise<Address>;
    /**
     * Broadcast the transaction to the network.
     *
     * @param transaction The transaction request that needs to be broadcast to the network.
     */
    abstract sendTransaction(transaction: TransactionRequest): Promise<TransactionResponse>;
    /**
     * Returns the balance of the account.
     *
     * @param [token] The token address to query balance for. Defaults to the native token.
     * @param [blockTag='committed'] The block tag to get the balance at.
     */
    getBalance(token?: Address, blockTag?: BlockTag): Promise<bigint>;
    /**
     * Returns all token balances of the account.
     */
    getAllBalances(): Promise<BalancesMap>;
    /**
     * Returns the deployment nonce of the account.
     */
    getDeploymentNonce(): Promise<bigint>;
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
    withdraw(transaction: {
        amount: BigNumberish;
        to: Address;
        paymasterParams?: PaymasterParams;
        overrides?: ethers.Overrides;
    }): Promise<TransactionResponse>;
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
    transfer(transaction: {
        to: Address;
        amount: BigNumberish;
        token?: Address;
        paymasterParams?: PaymasterParams;
        overrides?: ethers.Overrides;
    }): Promise<TransactionResponse>;
    protected _fillCustomData(data: Eip712Meta): Eip712Meta;
}
