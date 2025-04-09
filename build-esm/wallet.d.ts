import { EIP712Signer } from './signer';
import { Provider } from './provider';
import { BigNumberish, BlockTag, ethers, SigningKey, Overrides, ProgressCallback } from 'ethers';
import { Address, BalancesMap, PaymasterParams, TransactionLike, TransactionRequest, TransactionResponse } from './types';
import { AdapterL1, AdapterL2 } from './adapters';
import BitcoinClient from 'bitcoin-core';
import { SelectionStrategy } from '@scure/btc-signer/utxo';
import { BTC_NETWORK } from '@scure/btc-signer/utils';
/**
 * A `WalletL1` provides actions for L1 network.
 */
export declare class WalletL1 extends AdapterL1 {
    /** The private key of the L1 account in WIF format. */
    readonly signingKey: string;
    /** The address of the associated L1 account. Supported types: `tr`, `sh`, `wpkh`, `pkh`. */
    readonly address: string;
    /** The provider instance for connecting to a L1 network. */
    readonly provider?: BitcoinClient;
    /** The L1 network configuration. */
    readonly network: BTC_NETWORK;
    /**
     * @param privateKey The private key of the L1 account in WIF format.
     * @param address The address of the associated L1 account. Supported types: `tr`, `sh`, `wpkh`, `pkh`.
     * @param [provider] The provider instance for connecting to a L1 network.
     * @param [network] The L1 network configuration.
     * @param [providerL2] The provider instance for connecting to a L2 network.
     *
     * @example
     *
     * import { WalletL1 } from 'via-ethers';
     * import BitcoinClient from 'bitcoin-core';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY_IN_WIF_FORMAT>';
     * const ADDRESS = '<WALLET_ADDRESS: tr|sh|wpkh|pkh>';
     *
     * const providerL1 = new BitcoinClient({
     *     host: 'http://127.0.0.1:18443',
     *     username: 'rpc-user',
     *     password: 'rpc-password',
     *     wallet: 'Personal',
     * });
     * const wallet = new Wallet(PRIVATE_KEY, ADDRESS providerL1, utils.REGTEST_NETWORK);
     */
    constructor(privateKey: string, address: string, provider?: BitcoinClient | null, network?: BTC_NETWORK, providerL2?: Provider | null);
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { WalletL1, Provider, utils } from 'via-ethers';
     * import BitcoinClient from 'bitcoin-core';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY_IN_WIF_FORMAT>';
     * const ADDRESS = '<WALLET_ADDRESS: tr|sh|wpkh|pkh>';
     *
     * const provider = new BitcoinClient({
     *     host: 'http://127.0.0.1:18443',
     *     username: 'rpc-user',
     *     password: 'rpc-password',
     *     wallet: 'Personal',
     * });
     * const wallet = new WalletL1(PRIVATE_KEY, ADDRESS, provider, utils.REGTEST_NETWORK);
     *
     * const l2Recipient = '<L2_ACCOUNT_ADDRESS>';
     * const tx = await wallet.deposit({
     *   to: l2Recipient,
     *   amount: 70_000_000n
     * });
     */
    deposit(transaction: {
        to: Address;
        amount: BigNumberish;
        strategy?: SelectionStrategy;
    }): Promise<string>;
    /**
     * Connects to the L1 network using `provider` and `network` configuration.
     *
     * @param provider The provider instance for connecting to a L1 network.
     * @param network The L1 network configuration.
     *
     * @example
     *
     * import { WalletL1, utils } from 'via-ethers';
     * import BitcoinClient from 'bitcoin-core';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY_IN_WIF_FORMAT>';
     * const ADDRESS = '<WALLET_ADDRESS: tr|sh|wpkh|pkh>';
     *
     * const provider = new BitcoinClient({
     *     host: 'http://127.0.0.1:18443',
     *     username: 'rpc-user',
     *     password: 'rpc-password',
     *     wallet: 'Personal',
     * });
     *
     * const unconnectedWallet = new WalletL1(PRIVATE_KEY, ADDRESS, provider);
     * const wallet = unconnectedWallet.connect(providerL1, utils.REGTEST_NETWORK);
     */
    connect(provider: BitcoinClient, network: BTC_NETWORK): WalletL1;
}
/**
 * A `Wallet` is an extension {@link WalletL2} providing actions for L2 network.
 */
export declare class WalletL2 extends AdapterL2 {
    /** The EIP712 signer for signing EIP712 transaction. */
    protected _eip712Signer?: EIP712Signer;
    /** The signing key used for signing payloads. */
    readonly signingKey: SigningKey;
    /** The provider instance for connecting to a L2 network. */
    readonly provider: Provider | null;
    /** Returns the address of the associated account. */
    readonly address: string;
    /**
     * @param privateKey The private key of the account.
     * @param [provider] The provider instance for connecting to a L2 network.
     *
     * @example
     *
     * import { WalletL2, Provider, types } from 'via-ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = new WalletL2(PRIVATE_KEY, provider);
     */
    constructor(privateKey: string | SigningKey, provider?: Provider | null);
    /**
     * Creates a new `WalletL2` with the `provider` as L2 provider and a private key that is built from the mnemonic passphrase.
     *
     * @param mnemonic The mnemonic of the private key.
     * @param [provider] The provider instance for connecting to a L2 network.
     *
     * @example
     *
     * import { WalletL2, Provider } from 'via-ethers';
     *
     * const MNEMONIC = 'stuff slice staff easily soup parent arm payment cotton hammer scatter struggle';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = WalletL2.fromMnemonic(MNEMONIC, provider);
     */
    static fromMnemonic(mnemonic: string, provider?: Provider): WalletL2;
    /**
     * Creates a new `WalletL2` from encrypted json file using provided `password`.
     *
     * @param json The encrypted json file.
     * @param password The password for the encrypted json file.
     * @param [callback] If provided, it is called periodically during decryption so that any UI can be updated.
     *
     * @example
     *
     * import { WalletL2 } from 'via-ethers';
     * import * as fs from 'fs';
     *
     * const wallet = await WalletL2.fromEncryptedJson(fs.readFileSync('wallet.json', 'utf8'), 'password');
     */
    static fromEncryptedJson(json: string, password: string | Uint8Array, callback?: ProgressCallback): Promise<WalletL2>;
    /**
     * Creates a new `WalletL2` from encrypted json file using provided `password`.
     *
     * @param json The encrypted json file.
     * @param password The password for the encrypted json file.
     *
     * @example
     *
     * import { WalletL2 } from 'via-ethers';
     * import * as fs from 'fs';
     *
     * const wallet = WalletL2.fromEncryptedJsonSync(fs.readFileSync('wallet.json', 'utf8'), 'password');
     */
    static fromEncryptedJsonSync(json: string, password: string | Uint8Array): WalletL2;
    /**
     * Creates a new random `WalletL2` with the `provider` as L2 provider.
     *
     * @param [provider] The provider instance for connecting to a L2 network.
     *
     * @example
     *
     * import { WalletL2, Provider } from 'via-ethers';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = WalletL2.createRandom(provider);
     */
    static createRandom(provider?: Provider): WalletL2;
    /**
     * Connects to the L2 network using `provider`.
     *
     * @param provider The provider instance for connecting to an L2 network.
     *
     * @example
     *
     * import { WalletL2, Provider, types } from 'via-ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     * const unconnectedWallet = new Wallet(PRIVATE_KEY);
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = unconnectedWallet.connect(provider);
     */
    connect(provider: Provider | null): WalletL2;
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { WalletL2, Provider, types } from 'via-ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = new WalletL2(PRIVATE_KEY, provider);
     * const address = await wallet.getAddress();
     */
    getAddress(): Promise<Address>;
    /**
     * Gets the next nonce required for account to send a transaction.
     *
     * @param [blockTag] The block tag for getting the balance on. Latest committed block is the default.
     */
    getNonce(blockTag?: BlockTag | undefined): Promise<number>;
    /**
     * Resolves an ENS Name to an address.
     *
     * @param name ENS Name that needs to be resolved.
     */
    resolveName(name: string): Promise<string | null>;
    /**
     * Returns the gas estimation for a transaction.
     *
     * @param tx Transaction request that needs to be estimated.
     *
     * @example
     *
     * import { WalletL2, Provider, types, utils } from 'via-ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = new Wallet(PRIVATE_KEY, provider);
     *
     * const tx = await wallet.estimateGas({
     *   type: utils.EIP712_TX_TYPE,
     *   to: WalletL2.createRandom().address,
     *   value: 7_000_000_000n,
     * });
     */
    estimateGas(tx: TransactionRequest): Promise<bigint>;
    /**
     * Prepares a {@link TransactionRequest} for calling:
     * - Resolves `to` and `from` addresses.
     * - If from is specified, check that it matches this account.
     *
     * @param tx The call to prepare.
     *
     * @example
     *
     * import { WalletL2, Provider, types, utils } from 'via-ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = new Wallet(PRIVATE_KEY, provider);
     *
     * const tx = await wallet.populateCall({
     *   type: utils.EIP712_TX_TYPE,
     *   to: WalletL2.createRandom().address,
     *   value: 7_000_000_000n,
     * });
     */
    populateCall(tx: TransactionRequest): Promise<TransactionLike>;
    /**
     * Evaluates the `tx` by running it against the current Blockchain state.
     * This cannot change state and has no cost, as it is effectively simulating execution.
     *
     * @param tx The call to evaluate.
     *
     * @example
     *
     * import { WalletL2, Provider, types, utils } from 'via-ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = new Wallet(PRIVATE_KEY, provider);
     *
     * const tx = await wallet.call({
     *   type: utils.EIP712_TX_TYPE,
     *   to: WalletL2.createRandom().address,
     *   value: 7_000_000_000n,
     * });
     */
    call(tx: TransactionRequest): Promise<string>;
    /**
     * Designed for users who prefer a simplified approach by providing only the necessary data to create a valid transaction.
     * The only required fields are `transaction.to` and either `transaction.data` or `transaction.value` (or both, if the method is payable).
     * Any other fields that are not set will be prepared by this method.
     *
     * @param tx The transaction request that needs to be populated.
     *
     * @example
     *
     * import { WalletL2, Provider, types, utils } from 'via-ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = new WalletL2(PRIVATE_KEY, provider);
     *
     * const populatedTx = await wallet.populateTransaction({
     *   type: utils.EIP712_TX_TYPE,
     *   to: WalletL2.createRandom().address,
     *   value: 7_000_000_000n,
     * });
     */
    populateTransaction(tx: TransactionRequest): Promise<TransactionLike>;
    /**
     * @inheritDoc
     *
     * @example Withdraw BTC.
     *
     * import { WalletL2, Provider, types, utils } from 'via-ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = new WalletL2(PRIVATE_KEY, provider);
     *
     * const l1Recipient = '<L1_ACCOUNT_ADDRESS>';
     * const withdrawTx = await wallet.withdraw({
     *   to: l1Recipient
     *   amount: 10_000_000n,
     * });
     *
     * @example Withdraw BTC using paymaster to facilitate fee payment with an ERC20 token.
     *
     * import { Wallet, Provider, types, utils } from 'via-ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     * const token = '0x927488F48ffbc32112F1fF721759649A89721F8F'; // Crown token which can be minted for free
     * const paymaster = '0x13D0D8550769f59aa241a41897D4859c87f7Dd46'; // Paymaster for Crown token
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = new Wallet(PRIVATE_KEY, provider);
     *
     * const l1Recipient = '<L1_ACCOUNT_ADDRESS>';
     * const withdrawTx = await wallet.withdraw({
     *   to: l1Recipient,
     *   amount: 10_000_000n,
     *   paymasterParams: utils.getPaymasterParams(paymaster, {
     *     type: 'ApprovalBased',
     *     token: token,
     *     minimalAllowance: 1,
     *     innerInput: new Uint8Array(),
     *   }),
     * });
     */
    withdraw(transaction: {
        amount: BigNumberish;
        to: Address;
        paymasterParams?: PaymasterParams;
        overrides?: Overrides;
    }): Promise<TransactionResponse>;
    /**
     * @inheritDoc
     *
     * @example Transfer BTC.
     *
     * import { WalletL2, Provider, types } from 'via-ethers';
     * import { ethers } from 'ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = new Wallet(PRIVATE_KEY, provider);
     *
     * const transferTx = await wallet.transfer({
     *   to: WalletL2.createRandom().address,
     *   amount: ethers.parseEther('0.01'),
     * });
     *
     * const receipt = await transferTx.wait();
     *
     * console.log(`The sum of ${receipt.value} BTC was transferred to ${receipt.to}`);
     *
     * @example Transfer BTC using paymaster to facilitate fee payment with an ERC20 token.
     *
     * import { WalletL2, Provider, types, utils } from 'via-ethers';
     * import { ethers } from 'ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     * const token = '0x927488F48ffbc32112F1fF721759649A89721F8F'; // Crown token which can be minted for free
     * const paymaster = '0x13D0D8550769f59aa241a41897D4859c87f7Dd46'; // Paymaster for Crown token
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = new WalletL2(PRIVATE_KEY, provider);
     *
     * const transferTx = await wallet.transfer({
     *   to: WalletL2.createRandom().address,
     *   amount: ethers.parseEther('0.01'),
     *   paymasterParams: utils.getPaymasterParams(paymaster, {
     *     type: 'ApprovalBased',
     *     token: token,
     *     minimalAllowance: 1,
     *     innerInput: new Uint8Array(),
     *   }),
     * });
     *
     * const receipt = await transferTx.wait();
     *
     * console.log(`The sum of ${receipt.value} BTC was transferred to ${receipt.to}`);
     *
     * @example Transfer token.
     *
     * import { WalletL2, Provider, types } from 'via-ethers';
     * import { ethers } from 'ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = new WalletL2(PRIVATE_KEY, provider);
     *
     * const tokenL2 = '0x6a4Fb925583F7D4dF82de62d98107468aE846FD1';
     * const transferTx = await wallet.transfer({
     *   token: tokenL2,
     *   to: WalletL2.createRandom().address,
     *   amount: ethers.parseEther('0.01'),
     * });
     *
     * const receipt = await transferTx.wait();
     *
     * console.log(`The sum of ${receipt.value} token was transferred to ${receipt.to}`);
     *
     * @example Transfer token using paymaster to facilitate fee payment with an ERC20 token.
     *
     * import { WalletL2, Provider, types, utils } from 'via-ethers';
     * import { ethers } from 'ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     * const token = '0x927488F48ffbc32112F1fF721759649A89721F8F'; // Crown token which can be minted for free
     * const paymaster = '0x13D0D8550769f59aa241a41897D4859c87f7Dd46'; // Paymaster for Crown token
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = new WalletL2(PRIVATE_KEY, provider);
     *
     * const tokenL2 = '0x6a4Fb925583F7D4dF82de62d98107468aE846FD1';
     * const transferTx = await wallet.transfer({
     *   token: tokenL2,
     *   to: WalletL2.createRandom().address,
     *   amount: ethers.parseEther('0.01'),
     *   paymasterParams: utils.getPaymasterParams(paymaster, {
     *     type: 'ApprovalBased',
     *     token: token,
     *     minimalAllowance: 1,
     *     innerInput: new Uint8Array(),
     *   }),
     * });
     *
     * const receipt = await transferTx.wait();
     *
     * console.log(`The sum of ${receipt.value} token was transferred to ${receipt.to}`);
     */
    transfer(transaction: {
        to: Address;
        amount: BigNumberish;
        token?: Address;
        paymasterParams?: PaymasterParams;
        overrides?: Overrides;
    }): Promise<TransactionResponse>;
    /***
     * Signs the transaction and serializes it to be ready to be broadcast to the network.
     *
     * @param tx The transaction request that needs to be signed.
     *
     * @throws {Error} If `transaction.from` is mismatched from the private key.
     *
     * @example
     *
     * import { WalletL2, Provider, types, utils } from 'via-ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = new Wallet(PRIVATE_KEY, provider);
     *
     * const tx = await wallet.signTransaction({
     *   type: utils.EIP712_TX_TYPE,
     *   to: WalletL2.createRandom().address,
     *   value: 7_000_000_000n,
     * });
     */
    signTransaction(tx: TransactionRequest): Promise<string>;
    /**
     * Signs an arbitrary message.
     *
     * @param message The message that needs to be signed.
     *
     * @example
     *
     * import { WalletL2, Provider, types } from 'via-ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = new Wallet(PRIVATE_KEY, provider);
     *
     * const signedMessage = await account.signMessage('Hello World!');
     */
    signMessage(message: string | Uint8Array): Promise<string>;
    /**
     * Signs an EIP-712 typed data.
     *
     * @param domain The domain data.
     * @param types A map of records pointing from field name to field type.
     * @param value A single record value.
     *
     * @example
     *
     * import { WalletL2, Provider, types } from 'via-ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = new Wallet(PRIVATE_KEY, provider);
     *
     * const signedTypedData = await wallet.signTypedData(
     *   {name: 'Example', version: '1', chainId: 270},
     *   {
     *     Person: [
     *       {name: 'name', type: 'string'},
     *       {name: 'age', type: 'uint8'},
     *     ],
     *   },
     *   {name: 'John', age: 30}
     * );
     */
    signTypedData(domain: ethers.TypedDataDomain, types: Record<string, ethers.TypedDataField[]>, value: Record<string, any>): Promise<string>;
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { WalletL2, Provider, types, utils } from 'via-ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = new WalletL2(PRIVATE_KEY, provider);
     *
     * const tx = await wallet.sendTransaction({
     *   to: WalletL2.createRandom().address,
     *   value: 7_000_000_000n,
     *   maxFeePerGas: 3_500_000_000n,
     *   maxPriorityFeePerGas: 2_000_000_000n,
     *   customData: {
     *     gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
     *   },
     * });
     * await tx.wait();
     */
    sendTransaction(transaction: TransactionRequest): Promise<TransactionResponse>;
}
/**
 * A `Wallet` is a composition of {@link WalletL1} and {@link WalletL2} providing actions across networks.
 * It facilitates bridging assets between different networks through a unified API.
 * Methods and properties that interact with the L1 network have an `L1` suffix.
 */
export declare class Wallet {
    protected _walletL1?: WalletL1;
    protected _walletL2: WalletL2;
    /**
     * @param privateKeyL2 The private key of the L2 account.
     * @param [providerL2] The provider instance for connecting to a L2 network.
     * @param [privateKeyL1] The private key of the L1 account in WIF format.
     * @param [addressL1] The address of the associated L1 account. Supported types: `tr`, `sh`, `wpkh`, `pkh`.
     * @param [providerL1] The provider instance for connecting to a L1 network.
     * @param [networkL1] The L1 network configuration.
     *
     * @example
     *
     * import { Wallet, Provider, types, utils } from 'via-ethers';
     * import BitcoinClient from 'bitcoin-core';
     *
     * const PRIVATE_KEY_L2 = '<L2_WALLET_PRIVATE_KEY>';
     * const PRIVATE_KEY_L1 = '<L1_WALLET_PRIVATE_KEY_IN_WIF_FORMAT>';
     * const ADDRESS_L1 = '<L1_WALLET_ADDRESS: tr|sh|wpkh|pkh>';
     *
     * const providerL2 = Provider.getDefaultProvider(types.Network.Localhost);
     * const providerL1 = new BitcoinClient({
     *     host: 'http://127.0.0.1:18443',
     *     username: 'rpc-user',
     *     password: 'rpc-password',
     *     wallet: 'Personal',
     * });
     * const wallet = new Wallet(PRIVATE_KEY_L2, providerL2, PRIVATE_KEY_L1, ADDRESS_L1, providerL1, utils.REGTEST_NETWORK);
     */
    constructor(privateKeyL2: string | ethers.SigningKey, providerL2?: Provider | null, privateKeyL1?: string, addressL1?: string, providerL1?: BitcoinClient | null, networkL1?: BTC_NETWORK);
    /**
     * The provider instance for connecting to a L2 network.
     */
    get provider(): Provider | null;
    /**
     * The provider instance for connecting to a L1 network.
     */
    get providerL1(): BitcoinClient | undefined;
    /**
     * The L2 signing key used for signing payloads.
     */
    get signingKey(): SigningKey;
    /**
     * The L1 signing key used for signing payloads.
     */
    get signingKeyL1(): string | undefined;
    /**
     * Returns the address of the associated L2 account.
     */
    get address(): string;
    /**
     * Returns the address of the associated L1 account.
     */
    get addressL1(): string | undefined;
    /**
     * Connects to the L2 network using `provider`.
     *
     * @param provider The provider instance for connecting to an L2 network.
     *
     * @see {@link connectToL1} in order to connect to L1 network.
     *
     * @example
     *
     * import { Wallet, Provider, types } from 'via-ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     * const unconnectedWallet = new Wallet(PRIVATE_KEY);
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = unconnectedWallet.connect(provider);
     */
    connect(provider: Provider): Wallet;
    /**
     * Connects to the L1 network using `provider` and `network` configuration.
     *
     * @param provider The provider instance for connecting to a L1 network.
     * @param network The L1 network configuration.
     *
     * @see {@link connect} in order to connect to L2 network.
     *
     * @example
     *
     * import { Wallet, Provider, types, utils } from 'via-ethers';
     * import BitcoinClient from 'bitcoin-core';
     *
     * const PRIVATE_KEY_L2 = '<L2_WALLET_PRIVATE_KEY>';
     * const PRIVATE_KEY_L1 = '<L1_WALLET_PRIVATE_KEY_IN_WIF_FORMAT>';
     * const ADDRESS_L1 = '<L1_WALLET_ADDRESS: tr|sh|wpkh|pkh>';
     *
     * const providerL2 = Provider.getDefaultProvider(types.Network.Localhost);
     * const providerL1 = new BitcoinClient({
     *     host: 'http://127.0.0.1:18443',
     *     username: 'rpc-user',
     *     password: 'rpc-password',
     *     wallet: 'Personal',
     * });
     *
     * const unconnectedWallet = new Wallet(PRIVATE_KEY_L2, providerL2, PRIVATE_KEY_L1, ADDRESS_L1);
     * const wallet = unconnectedWallet.connectToL1(providerL1, utils.REGTEST_NETWORK);
     */
    connectToL1(provider: BitcoinClient, network: BTC_NETWORK): Wallet;
    /**
     * Creates a new `Wallet` with the L2 and L1 providers, L1 private key and
     * a private key that is built from the mnemonic passphrase.
     *
     * @param mnemonic The mnemonic of the L2 private key.
     * @param [providerL2] The provider instance for connecting to a L2 network.
     * @param [privateKeyL1] The private key of the L1 account in WIF format.
     * @param [addressL1] The address of the associated L1 account. Supported types: `tr`, `sh`, `wpkh`, `pkh`.
     * @param [providerL1] The provider instance for connecting to a L1 network.
     * @param [networkL1] The L1 network configuration.
     *
     * @example
     *
     * import { Wallet, Provider, types, utils } from 'via-ethers';
     * import BitcoinClient from 'bitcoin-core';
     *
     * const MNEMONIC = 'stuff slice staff easily soup parent arm payment cotton hammer scatter struggle';
     * const PRIVATE_KEY_L1 = '<L1_WALLET_PRIVATE_KEY_IN_WIF_FORMAT>';
     * const ADDRESS = '<WALLET_ADDRESS: tr|sh|wpkh|pkh>';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const providerL2 = Provider.getDefaultProvider(types.Network.Localhost);
     * const providerL1 = new BitcoinClient({
     *     host: 'http://127.0.0.1:18443',
     *     username: 'rpc-user',
     *     password: 'rpc-password',
     *     wallet: 'Personal',
     * });
     * const wallet = Wallet.fromMnemonic(MNEMONIC, providerL2, PRIVATE_KEY_L1, ADDRESS_L1, providerL2, utils.REGTEST_NETWORK);
     */
    static fromMnemonic(mnemonic: string, providerL2?: Provider, privateKeyL1?: string, addressL1?: string, providerL1?: BitcoinClient, networkL1?: BTC_NETWORK): Wallet;
    /**
     * Creates a new `Wallet` from encrypted json file using provided `password`.
     *
     * @param json The encrypted json file.
     * @param password The password for the encrypted json file.
     * @param [callback] If provided, it is called periodically during decryption so that any UI can be updated.
     * @param [privateKeyL1] The private key of the L1 account in WIF format.
     * @param [addressL1] The address of the associated L1 account. Supported types: `tr`, `sh`, `wpkh`, `pkh`.
     *
     * @example
     *
     * import { Wallet } from 'via-ethers';
     * import * as fs from 'fs';
     *
     * const PRIVATE_KEY_L1 = '<L1_WALLET_PRIVATE_KEY_IN_WIF_FORMAT>';
     * const ADDRESS_L1 = '<WALLET_ADDRESS: tr|sh|wpkh|pkh>';
     *
     * const wallet = await Wallet.fromEncryptedJson(
     *   fs.readFileSync('wallet.json', 'utf8'),
     *   'password',
     *   undefined,
     *   PRIVATE_KEY_L1,
     *   ADDRESS_L1
     * );
     */
    static fromEncryptedJson(json: string, password: string | Uint8Array, callback?: ProgressCallback, privateKeyL1?: string, addressL1?: string): Promise<Wallet>;
    /**
     * Creates a new `Wallet` from encrypted json file using provided `password`.
     *
     * @param json The encrypted json file.
     * @param password The password for the encrypted json file.
     * @param [privateKeyL1] The private key of the L1 account in WIF format.
     * @param [addressL1] The address of the associated L1 account. Supported types: `tr`, `sh`, `wpkh`, `pkh`.
     *
     * @example
     *
     * import { Wallet } from 'via-ethers';
     * import * as fs from 'fs';
     *
     * const PRIVATE_KEY_L1 = '<L1_WALLET_PRIVATE_KEY_IN_WIF_FORMAT>';
     * const ADDRESS_L1 = '<WALLET_ADDRESS: tr|sh|wpkh|pkh>';
     *
     * const wallet = Wallet.fromEncryptedJsonSync(
     *   fs.readFileSync('wallet.json', 'utf8'),
     *   'password',
     *   PRIVATE_KEY_L1
     * );
     */
    static fromEncryptedJsonSync(json: string, password: string | Uint8Array, privateKeyL1?: string, addressL1?: string): Wallet;
    /**
     * Creates a new `Wallet` with random L2 account.
     *
     * @param privateKeyL1 The private key of the L1 account in WIF format.
     * @param [providerL2] The provider instance for connecting to a L2 network.
     * @param [providerL1] The provider instance for connecting to a L1 network.
     * @param [addressL1] The address of the associated L1 account. Supported types: `tr`, `sh`, `wpkh`, `pkh`.
     * @param [networkL1] The L1 network configuration.
     *
     * @example
     *
     * import { Wallet, Provider, types, utils } from 'via-ethers';
     * import BitcoinClient from 'bitcoin-core';
     *
     * const PRIVATE_KEY_L1 = '<L1_WALLET_PRIVATE_KEY_IN_WIF_FORMAT>';
     * const ADDRESS_L1 = '<WALLET_ADDRESS: tr|sh|wpkh|pkh>';
     *
     * const providerL2 = Provider.getDefaultProvider(types.Network.Localhost);
     * const providerL1 = new BitcoinClient({
     *     host: 'http://127.0.0.1:18443',
     *     username: 'rpc-user',
     *     password: 'rpc-password',
     *     wallet: 'Personal',
     * });
     * const wallet = Wallet.createRandom(providerL2, PRIVATE_KEY_L1, providerL1, utils.REGTEST_NETWORK);
     */
    static createRandom(providerL2?: Provider, privateKeyL1?: string, addressL1?: string, providerL1?: BitcoinClient, networkL1?: BTC_NETWORK): Wallet;
    /**
     * Returns the address of the associated L2 account.
     *
     * @example
     *
     * import { Wallet, Provider, types } from 'via-ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = new Wallet(PRIVATE_KEY, provider);
     * const address = await wallet.getAddress();
     */
    getAddress(): Promise<Address>;
    /**
     * Returns the balance of the account.
     *
     * @example Get BTC balance.
     *
     * import { Wallet, Provider, types, utils } from 'via-ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = new Wallet(PRIVATE_KEY, provider);
     *
     * console.log(`ETH balance: ${await wallet.getBalance()}`);
     *
     * @example Get token balance.
     *
     * import { Wallet, Provider, utils } from 'via-ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = new Wallet(PRIVATE_KEY, provider);
     *
     * const token = '0x6a4Fb925583F7D4dF82de62d98107468aE846FD1';
     *
     * console.log(`Token balance: ${await wallet.getBalance(token)}`);
     */
    getBalance(token?: Address, blockTag?: BlockTag): Promise<bigint>;
    /**
     * Returns all token balances of the account.
     *
     * @example
     *
     * import { Wallet, Provider, types, utils } from 'via-ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = new Wallet(PRIVATE_KEY, provider);
     *
     * const allBalances = await wallet.getAllBalances();
     */
    getAllBalances(): Promise<BalancesMap>;
    /**
     * Returns the deployment nonce of the account.
     *
     * @example
     *
     * import { Wallet, Provider, types, utils } from 'via-ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = new Wallet(PRIVATE_KEY, provider);
     *
     * console.log(`Nonce: ${await wallet.getDeploymentNonce()}`);
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
     *
     * @example Withdraw BTC.
     *
     * import { Wallet, Provider, types, utils } from 'via-ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = new Wallet(PRIVATE_KEY, provider);
     *
     * const l1Recipient = '<L1_ACCOUNT_ADDRESS>';
     * const withdrawTx = await wallet.withdraw({
     *   to: l1Recipient
     *   amount: 10_000_000n,
     * });
     *
     * @example Withdraw BTC using paymaster to facilitate fee payment with an ERC20 token.
     *
     * import { Wallet, Provider, types, utils } from 'via-ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     * const token = '0x927488F48ffbc32112F1fF721759649A89721F8F'; // Crown token which can be minted for free
     * const paymaster = '0x13D0D8550769f59aa241a41897D4859c87f7Dd46'; // Paymaster for Crown token
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = new Wallet(PRIVATE_KEY, provider);
     *
     * const l1Recipient = '<L1_ACCOUNT_ADDRESS>';
     * const withdrawTx = await wallet.withdraw({
     *   to: l1Recipient,
     *   amount: 10_000_000n,
     *   paymasterParams: utils.getPaymasterParams(paymaster, {
     *     type: 'ApprovalBased',
     *     token: token,
     *     minimalAllowance: 1,
     *     innerInput: new Uint8Array(),
     *   }),
     * });
     */
    withdraw(transaction: {
        amount: BigNumberish;
        to: Address;
        paymasterParams?: PaymasterParams;
        overrides?: Overrides;
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
     *
     * @example Transfer BTC.
     *
     * import { Wallet, Provider, types } from 'via-ethers';
     * import { ethers } from 'ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = new Wallet(PRIVATE_KEY, provider);
     *
     * const transferTx = await wallet.transfer({
     *   to: Wallet.createRandom().address,
     *   amount: ethers.parseEther('0.01'),
     * });
     *
     * const receipt = await transferTx.wait();
     *
     * console.log(`The sum of ${receipt.value} BTC was transferred to ${receipt.to}`);
     *
     * @example Transfer BTC using paymaster to facilitate fee payment with an ERC20 token.
     *
     * import { Wallet, Provider, types, utils } from 'via-ethers';
     * import { ethers } from 'ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     * const token = '0x927488F48ffbc32112F1fF721759649A89721F8F'; // Crown token which can be minted for free
     * const paymaster = '0x13D0D8550769f59aa241a41897D4859c87f7Dd46'; // Paymaster for Crown token
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = new Wallet(PRIVATE_KEY, provider);
     *
     * const transferTx = await wallet.transfer({
     *   to: Wallet.createRandom().address,
     *   amount: ethers.parseEther('0.01'),
     *   paymasterParams: utils.getPaymasterParams(paymaster, {
     *     type: 'ApprovalBased',
     *     token: token,
     *     minimalAllowance: 1,
     *     innerInput: new Uint8Array(),
     *   }),
     * });
     *
     * const receipt = await transferTx.wait();
     *
     * console.log(`The sum of ${receipt.value} BTC was transferred to ${receipt.to}`);
     *
     * @example Transfer token.
     *
     * import { Wallet, Provider, types } from 'via-ethers';
     * import { ethers } from 'ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = new Wallet(PRIVATE_KEY, provider);
     *
     * const tokenL2 = '0x6a4Fb925583F7D4dF82de62d98107468aE846FD1';
     * const transferTx = await wallet.transfer({
     *   token: tokenL2,
     *   to: Wallet.createRandom().address,
     *   amount: ethers.parseEther('0.01'),
     * });
     *
     * const receipt = await transferTx.wait();
     *
     * console.log(`The sum of ${receipt.value} token was transferred to ${receipt.to}`);
     *
     * @example Transfer token using paymaster to facilitate fee payment with an ERC20 token.
     *
     * import { Wallet, Provider, types, utils } from 'via-ethers';
     * import { ethers } from 'ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     * const token = '0x927488F48ffbc32112F1fF721759649A89721F8F'; // Crown token which can be minted for free
     * const paymaster = '0x13D0D8550769f59aa241a41897D4859c87f7Dd46'; // Paymaster for Crown token
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = new Wallet(PRIVATE_KEY, provider);
     *
     * const tokenL2 = '0x6a4Fb925583F7D4dF82de62d98107468aE846FD1';
     * const transferTx = await wallet.transfer({
     *   token: tokenL2,
     *   to: Wallet.createRandom().address,
     *   amount: ethers.parseEther('0.01'),
     *   paymasterParams: utils.getPaymasterParams(paymaster, {
     *     type: 'ApprovalBased',
     *     token: token,
     *     minimalAllowance: 1,
     *     innerInput: new Uint8Array(),
     *   }),
     * });
     *
     * const receipt = await transferTx.wait();
     *
     * console.log(`The sum of ${receipt.value} token was transferred to ${receipt.to}`);
     */
    transfer(transaction: {
        to: Address;
        amount: BigNumberish;
        token?: Address;
        paymasterParams?: PaymasterParams;
        overrides?: Overrides;
    }): Promise<TransactionResponse>;
    /**
     * Transfers the specified token from the associated account on the L1 network to the target account on the L2 network.
     *
     * @param transaction The deposit transaction request.
     * @param transaction.to The address that will receive the deposited tokens on L2.
     * @param transaction.amount The amount of the token to deposit.
     * @param [transaction.strategy] The UTXO selection strategy. For more details visit
     * [this link](https://github.com/paulmillr/scure-btc-signer/tree/1.7.0?tab=readme-ov-file#utxo-selection).
     *
     * @example
     *
     * import { Wallet, Provider, types, utils } from 'via-ethers';
     * import BitcoinClient from 'bitcoin-core';
     *
     * const PRIVATE_KEY_L2 = '<L2_WALLET_PRIVATE_KEY>';
     * const PRIVATE_KEY_L1 = '<L1_WALLET_PRIVATE_KEY_IN_WIF_FORMAT>';
     * const ADDRESS_L1 = '<WALLET_ADDRESS: tr|sh|wpkh|pkh>';
     *
     * const providerL2 = Provider.getDefaultProvider(types.Network.Localhost);
     * const providerL1 = new BitcoinClient({
     *     host: 'http://127.0.0.1:18443',
     *     username: 'rpc-user',
     *     password: 'rpc-password',
     *     wallet: 'Personal',
     * });
     * const wallet = new Wallet(PRIVATE_KEY_L2, providerL2, PRIVATE_KEY_L1, ADDRESS_L1, providerL1, utils.REGTEST_NETWORK);
     *
     * const l2Recipient = '<L2_ACCOUNT_ADDRESS>';
     * const tx = await wallet.deposit({
     *   to: l2Recipient,
     *   amount: 70_000_000n
     * });
     */
    deposit(transaction: {
        to: Address;
        amount: BigNumberish;
        strategy?: SelectionStrategy;
    }): Promise<string>;
    /**
     * Gets the next nonce required for account to send a transaction.
     *
     * @param [blockTag] The block tag for getting the balance on. Latest committed block is the default.
     */
    getNonce(blockTag?: BlockTag | undefined): Promise<number>;
    /**
     * Resolves an ENS Name to an address.
     *
     * @param name ENS Name that needs to be resolved.
     */
    resolveName(name: string): Promise<string | null>;
    /**
     * Returns the gas estimation for a transaction.
     *
     * @param tx Transaction request that needs to be estimated.
     *
     * @example
     *
     * import { WalletL2, Provider, types, utils } from 'via-ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = new Wallet(PRIVATE_KEY, provider);
     *
     * const tx = await wallet.estimateGas({
     *   type: utils.EIP712_TX_TYPE,
     *   to: WalletL2.createRandom().address,
     *   value: 7_000_000_000n,
     * });
     */
    estimateGas(tx: TransactionRequest): Promise<bigint>;
    /**
     * Prepares a {@link TransactionRequest} for calling:
     * - Resolves `to` and `from` addresses.
     * - If from is specified, check that it matches this account.
     *
     * @param tx The call to prepare.
     *
     * @example
     *
     * import { WalletL2, Provider, types, utils } from 'via-ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = new Wallet(PRIVATE_KEY, provider);
     *
     * const tx = await wallet.populateCall({
     *   type: utils.EIP712_TX_TYPE,
     *   to: WalletL2.createRandom().address,
     *   value: 7_000_000_000n,
     * });
     */
    populateCall(tx: TransactionRequest): Promise<TransactionLike>;
    /**
     * Evaluates the `tx` by running it against the current Blockchain state.
     * This cannot change state and has no cost, as it is effectively simulating execution.
     *
     * @param tx The call to evaluate.
     *
     * @example
     *
     * import { WalletL2, Provider, types, utils } from 'via-ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = new Wallet(PRIVATE_KEY, provider);
     *
     * const tx = await wallet.call({
     *   type: utils.EIP712_TX_TYPE,
     *   to: WalletL2.createRandom().address,
     *   value: 7_000_000_000n,
     * });
     */
    call(tx: TransactionRequest): Promise<string>;
    /**
     * Designed for users who prefer a simplified approach by providing only the necessary data to create a valid transaction.
     * The only required fields are `transaction.to` and either `transaction.data` or `transaction.value` (or both, if the method is payable).
     * Any other fields that are not set will be prepared by this method.
     *
     * @param tx The transaction request that needs to be populated.
     *
     * @example
     *
     * import { Wallet, Provider, types, utils } from 'via-ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = new Wallet(PRIVATE_KEY, provider);
     *
     * const populatedTx = await wallet.populateTransaction({
     *   type: utils.EIP712_TX_TYPE,
     *   to: RECEIVER,
     *   value: 7_000_000_000n,
     * });
     */
    populateTransaction(tx: TransactionRequest): Promise<TransactionLike>;
    /***
     * Signs the transaction and serializes it to be ready to be broadcast to the network.
     *
     * @param tx The transaction request that needs to be signed.
     *
     * @throws {Error} If `transaction.from` is mismatched from the private key.
     *
     * @example
     *
     * import { Wallet, Provider, types, utils } from 'via-ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = new Wallet(PRIVATE_KEY, provider);
     *
     * const tx = await wallet.signTransaction({
     *   type: utils.EIP712_TX_TYPE,
     *   to: Wallet.createRandom().address,
     *   value: ethers.parseEther('1'),
     * });
     */
    signTransaction(tx: TransactionRequest): Promise<string>;
    /**
     * Signs an arbitrary message.
     *
     * @param message The message that needs to be signed.
     *
     * @example
     *
     * import { Wallet, Provider, types } from 'via-ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = new Wallet(PRIVATE_KEY, provider);
     *
     * const signedMessage = await account.signMessage('Hello World!');
     */
    signMessage(message: string | Uint8Array): Promise<string>;
    /**
     * Signs an EIP-712 typed data.
     *
     * @param domain The domain data.
     * @param types A map of records pointing from field name to field type.
     * @param value A single record value.
     *
     * @example
     *
     * import { Wallet, Provider, types } from 'via-ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = new Wallet(PRIVATE_KEY, provider);
     *
     * const signedTypedData = await wallet.signTypedData(
     *   {name: 'Example', version: '1', chainId: 270},
     *   {
     *     Person: [
     *       {name: 'name', type: 'string'},
     *       {name: 'age', type: 'uint8'},
     *     ],
     *   },
     *   {name: 'John', age: 30}
     * );
     */
    signTypedData(domain: ethers.TypedDataDomain, types: Record<string, ethers.TypedDataField[]>, value: Record<string, any>): Promise<string>;
    /**
     * Broadcast the transaction to the network.
     *
     * @param transaction The transaction request that needs to be broadcast to the network.
     *
     * @example
     *
     * import { Wallet, Provider, types, utils } from 'via-ethers';
     *
     * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const wallet = new Wallet(PRIVATE_KEY, provider);
     *
     * const tx = await wallet.sendTransaction({
     *   to: Wallet.createRandom().address,
     *   value: 7_000_000n,
     *   maxFeePerGas: 3_500_000_000n,
     *   maxPriorityFeePerGas: 2_000_000_000n,
     *   customData: {
     *     gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
     *   },
     * });
     * await tx.wait();
     */
    sendTransaction(transaction: TransactionRequest): Promise<TransactionResponse>;
}
