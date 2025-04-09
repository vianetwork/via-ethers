import { BigNumberish, BlockTag, ethers, Overrides } from 'ethers';
import { Provider } from './provider';
import { Address, BalancesMap, PaymasterParams, Signature, TransactionLike, TransactionRequest, TransactionResponse } from './types';
import { AdapterL2 } from './adapters';
/**
 * All typed data conforming to the EIP712 standard within ZKsync Era.
 */
export declare const EIP712_TYPES: {
    Transaction: {
        name: string;
        type: string;
    }[];
};
/**
 * A `EIP712Signer` provides support for signing EIP712-typed ZKsync Era transactions.
 */
export declare class EIP712Signer {
    private ethSigner;
    private readonly eip712Domain;
    /**
     * @example
     *
     * import { Provider, types, EIP712Signer } from 'via-ethers';
     * import { ethers } from 'ethers';
     *
     * const PRIVATE_KEY = '<PRIVATE_KEY>';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const signer = new EIP712Signer(new ethers.Wallet(PRIVATE_KEY), Number((await provider.getNetwork()).chainId));
     */
    constructor(ethSigner: ethers.Signer, chainId: number | Promise<number>);
    /**
     * Generates the EIP712 typed data from provided transaction. Optional fields are populated by zero values.
     *
     * @param transaction The transaction request that needs to be populated.
     *
     * @example
     *
     * import { EIP712Signer } from 'via-ethers';
     *
     * const tx = EIP712Signer.getSignInput({
     *   type: utils.EIP712_TX_TYPE,
     *   to: '0xa61464658AfeAf65CccaaFD3a512b69A83B77618',
     *   value: 7_000_000n,
     *   from: '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049',
     *   nonce: 0n,
     *   chainId: 270n,
     *   gasPrice: 250_000_000n,
     *   gasLimit: 21_000n,
     *   customData: {},
     * });
     */
    static getSignInput(transaction: TransactionRequest): {
        txType: number;
        from: ethers.AddressLike | null | undefined;
        to: ethers.AddressLike | null | undefined;
        gasLimit: BigNumberish;
        gasPerPubdataByteLimit: BigNumberish;
        maxFeePerGas: BigNumberish;
        maxPriorityFeePerGas: BigNumberish;
        paymaster: string;
        nonce: number;
        value: BigNumberish;
        data: string;
        factoryDeps: Uint8Array[];
        paymasterInput: ethers.BytesLike;
    };
    /**
     * Signs a transaction request using EIP712.
     *
     * @param transaction The transaction request that needs to be signed.
     * @returns A promise that resolves to the signature of the transaction.
     *
     * @example
     *
     * import { Provider, types, EIP712Signer } from 'via-ethers';
     * import { ethers } from 'ethers';
     *
     * const PRIVATE_KEY = '<PRIVATE_KEY>';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const signer = new EIP712Signer(new ethers.Wallet(PRIVATE_KEY, Number(await provider.getNetwork()));
     * const signature = signer.sign({
     *   type: utils.EIP712_TX_TYPE,
     *   to: '0xa61464658AfeAf65CccaaFD3a512b69A83B77618',
     *   value: 7_000_000n,
     *   nonce: 0n,
     *   chainId: 270n,
     *   gasPrice: 250_000_000n,
     *   gasLimit: 21_000n,
     * })
     */
    sign(transaction: TransactionRequest): Promise<Signature>;
    /**
     * Hashes the transaction request using EIP712.
     *
     * @param transaction The transaction request that needs to be hashed.
     * @returns A hash (digest) of the transaction request.
     *
     * @throws {Error} If `transaction.chainId` is not set.
     *
     * @example
     *
     * import { EIP712Signer } from 'via-ethers';
     *
     * const hash = EIP712Signer.getSignedDigest({
     *   type: utils.EIP712_TX_TYPE,
     *   to: '0xa61464658AfeAf65CccaaFD3a512b69A83B77618',
     *   value: 7_000_000n,
     *   from: '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049',
     *   nonce: 0n,
     *   chainId: 270n,
     *   gasPrice: 250_000_000n,
     *   gasLimit: 21_000n,
     *   customData: {},
     * });
     */
    static getSignedDigest(transaction: TransactionRequest): ethers.BytesLike;
    /**
     * Returns ZKsync Era EIP712 domain.
     *
     * @example
     *
     * import { Provider, types, EIP712Signer } from 'via-ethers';
     * import { ethers } from 'ethers';
     *
     * const PRIVATE_KEY = '<PRIVATE_KEY>';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const signer = new EIP712Signer(new ethers.Wallet(PRIVATE_KEY, Number(await provider.getNetwork()));
     * const domain = await signer.getDomain();
     */
    getDomain(): Promise<ethers.TypedDataDomain>;
}
/**
 * A `Signer` is designed for frontend use with browser wallet injection (e.g., MetaMask),
 * providing only L2 operations.
 */
export declare class Signer extends AdapterL2 implements ethers.Signer {
    /**
     * The provider instance for connecting to a L2 network.
     * Provides support to RPC methods from `zks` namespace.
     */
    provider: Provider;
    /** The signer responsible for interacting with injected browser wallet. */
    signer: ethers.JsonRpcSigner;
    /** The EIP712 signer for signing EIP712 transaction. */
    eip712Signer: EIP712Signer;
    /** Returns the address of the associated account. */
    address: string;
    /**
     * Creates a new Singer with provided `signer` and `chainId`.
     *
     * @param signer  The signer from browser wallet.
     * @param chainId The chain ID of the network.
     * @param [provider] The provider instance for connecting to a L2 network. If not provided,
     * the methods from the `zks` namespace are not supported, and interaction with them will result in an error.
     *
     * @example
     *
     * import { BrowserProvider, Signer, Provider, types } from 'via-ethers';
     *
     * const browserProvider = new BrowserProvider(window.ethereum);
     * const signer = new Signer(
     *     await browserProvider.getSigner(),
     *     Number((await browserProvider.getNetwork()).chainId),
     *     Provider.getDefaultProvider(types.Network.Localhost)
     * );
     */
    constructor(signer: ethers.JsonRpcSigner & {
        provider: Provider;
    }, chainId: number, provider?: Provider);
    /**
     * Creates a new Singer with provided `signer` and `chainId`.
     *
     * @param signer  The signer from browser wallet.
     * @param chainId The chain ID of the network.
     * @param [provider] The provider instance for connecting to a L2 network. If not provided,
     * the methods from the `zks` namespace are not supported, and interaction with them will result in an error.
     *
     * @example
     *
     * import { BrowserProvider, Signer, Provider, types } from 'via-ethers';
     *
     * const browserProvider = new BrowserProvider(window.ethereum);
     * const signer = Signer.from(
     *     await browserProvider.getSigner(),
     *     Number((await browserProvider.getNetwork()).chainId),
     *     Provider.getDefaultProvider(types.Network.Localhost)
     * );
     */
    static from(signer: ethers.JsonRpcSigner & {
        provider: Provider;
    }, chainId: number, provider?: Provider): Signer;
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { BrowserProvider, Signer, Provider, types } from 'via-ethers';
     *
     * const browserProvider = new BrowserProvider(window.ethereum);
     * const signer = Signer.from(
     *     await browserProvider.getSigner(),
     *     Number((await browserProvider.getNetwork()).chainId),
     *     Provider.getDefaultProvider(types.Network.Localhost)
     * );
     * const address = await signer.getAddress();
     */
    getAddress(): Promise<Address>;
    /**
     * @inheritDoc
     *
     * @example Get BTC balance.
     *
     * import { BrowserProvider, Signer, Provider, types } from 'via-ethers';
     *
     * const browserProvider = new BrowserProvider(window.ethereum);
     * const signer = Signer.from(
     *     await browserProvider.getSigner(),
     *     Number((await browserProvider.getNetwork()).chainId),
     *     Provider.getDefaultProvider(types.Network.Localhost)
     * );
     * const balance = await signer.getBalance();
     *
     * @example Get token balance.
     *
     * import { BrowserProvider, Signer, Provider, types } from 'via-ethers';
     *
     * const browserProvider = new BrowserProvider(window.ethereum);
     * const signer = Signer.from(
     *     await browserProvider.getSigner(),
     *     Number((await browserProvider.getNetwork()).chainId),
     *     Provider.getDefaultProvider(types.Network.Localhost)
     * );
     *
     * const token = '0x6a4Fb925583F7D4dF82de62d98107468aE846FD1';
     * const balance = await signer.getBalance(token);
     */
    getBalance(token?: Address, blockTag?: BlockTag): Promise<bigint>;
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { BrowserProvider, Signer, Provider, types } from 'via-ethers';
     *
     * const browserProvider = new BrowserProvider(window.ethereum);
     * const signer = Signer.from(
     *     await browserProvider.getSigner(),
     *     Number((await browserProvider.getNetwork()).chainId),
     *     Provider.getDefaultProvider(types.Network.Localhost)
     * );
     *
     * const allBalances = await signer.getAllBalances();
     */
    getAllBalances(): Promise<BalancesMap>;
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { BrowserProvider, Signer, Provider, types } from 'via-ethers';
     *
     * const browserProvider = new BrowserProvider(window.ethereum);
     * const signer = Signer.from(
     *     await browserProvider.getSigner(),
     *     Number((await browserProvider.getNetwork()).chainId),
     *     Provider.getDefaultProvider(types.Network.Localhost)
     * );
     * const deploymentNonce = await signer.getDeploymentNonce();
     */
    getDeploymentNonce(): Promise<bigint>;
    /**
     * @inheritDoc
     *
     * @example Withdraw BTC.
     *
     * import { BrowserProvider, Signer, Provider, types, utils } from 'via-ethers';
     * import { ethers } from 'ethers';
     *
     * const browserProvider = new BrowserProvider(window.ethereum);
     * const signer = Signer.from(
     *     await browserProvider.getSigner(),
     *     Number((await browserProvider.getNetwork()).chainId),
     *     Provider.getDefaultProvider(types.Network.Localhost)
     * );
     *
     * const l1Recipient = '<L1_ACCOUNT_ADDRESS>';
     * const withdrawTx = await signer.withdraw({
     *   to: l1Recipient,
     *   amount: 10_000_000n,
     * });
     *
     * @example Withdraw BTC using paymaster to facilitate fee payment with an ERC20 token.
     *
     * import { BrowserProvider, Signer, Provider, types, utils } from 'via-ethers';
     *
     * const token = '0x927488F48ffbc32112F1fF721759649A89721F8F'; // Crown token which can be minted for free
     * const paymaster = '0x13D0D8550769f59aa241a41897D4859c87f7Dd46'; // Paymaster for Crown token
     *
     * const browserProvider = new BrowserProvider(window.ethereum);
     * const signer = Signer.from(
     *     await browserProvider.getSigner(),
     *     Number((await browserProvider.getNetwork()).chainId),
     *     Provider.getDefaultProvider(types.Network.Localhost)
     * );
     *
     * const l1Recipient = '<L1_ACCOUNT_ADDRESS>';
     * const withdrawTx = await signer.withdraw({
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
     * import { BrowserProvider, Signer, Provider, Wallet, types } from 'via-ethers';
     * import { ethers } from 'ethers';
     *
     * const browserProvider = new BrowserProvider(window.ethereum);
     * const signer = Signer.from(
     *     await browserProvider.getSigner(),
     *     Number((await browserProvider.getNetwork()).chainId),
     *     Provider.getDefaultProvider(types.Network.Localhost)
     * );
     *
     * const transferTx = await signer.transfer({
     *   to: Wallet.createRandom().address,
     *   amount: ethers.parseEther('0.01'),
     * });
     *
     * const receipt = await transferTx.wait();
     *
     * console.log(`The sum of ${receipt.value} ETH was transferred to ${receipt.to}`);
     *
     * @example Transfer BTC using paymaster to facilitate fee payment with an ERC20 token.
     *
     * import { BrowserProvider, Signer, Provider, Wallet, types } from 'via-ethers';
     * import { ethers } from 'ethers';
     *
     * const token = '0x927488F48ffbc32112F1fF721759649A89721F8F'; // Crown token which can be minted for free
     * const paymaster = '0x13D0D8550769f59aa241a41897D4859c87f7Dd46'; // Paymaster for Crown token
     *
     * const browserProvider = new BrowserProvider(window.ethereum);
     * const signer = await Signer.from(
     *     await browserProvider.getSigner(),
     *     Number((await browserProvider.getNetwork()).chainId),
     *     Provider.getDefaultProvider(types.Network.Localhost)
     * );
     *
     * const transferTx = signer.transfer({
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
     * console.log(`The sum of ${receipt.value} ETH was transferred to ${receipt.to}`);
     *
     * @example Transfer token.
     *
     * import { BrowserProvider, Signer, Provider, Wallet, types } from 'via-ethers';
     * import { ethers } from 'ethers';
     *
     * const browserProvider = new BrowserProvider(window.ethereum);
     * const signer = Signer.from(
     *     await browserProvider.getSigner(),
     *     Number((await browserProvider.getNetwork()).chainId),
     *     Provider.getDefaultProvider(types.Network.Localhost)
     * );
     *
     * const tokenL2 = '0x6a4Fb925583F7D4dF82de62d98107468aE846FD1';
     * const transferTx = await signer.transfer({
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
     * import { BrowserProvider, Signer, Provider, Wallet, types } from 'via-ethers';
     * import { ethers } from 'ethers';
     *
     * const token = '0x927488F48ffbc32112F1fF721759649A89721F8F'; // Crown token which can be minted for free
     * const paymaster = '0x13D0D8550769f59aa241a41897D4859c87f7Dd46'; // Paymaster for Crown token
     *
     * const browserProvider = new BrowserProvider(window.ethereum);
     * const signer = await Signer.from(
     *     await browserProvider.getSigner(),
     *     Number((await browserProvider.getNetwork()).chainId),
     *     Provider.getDefaultProvider(types.Network.Localhost)
     * );
     *
     * const tokenL2 = '0x6a4Fb925583F7D4dF82de62d98107468aE846FD1';
     * const transferTx = signer.transfer({
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
     * Get the number of transactions ever sent for account, which is used as the `nonce` when sending a transaction.
     *
     * @param [blockTag] The block tag to query. If provided, the transaction count is as of that block.
     *
     * import { BrowserProvider, Signer, Provider, types } from 'via-ethers';
     *
     * const browserProvider = new BrowserProvider(window.ethereum);
     * const signer = Signer.from(
     *     await browserProvider.getSigner(),
     *     Number((await browserProvider.getNetwork()).chainId),
     *     Provider.getDefaultProvider(types.Network.Localhost)
     * );
     *
     * const nonce = await signer.getNonce();
     */
    getNonce(blockTag?: BlockTag): Promise<number>;
    /**
     * Broadcast the transaction to the network.
     *
     * @param transaction The transaction request that needs to be broadcast to the network.
     *
     * @throws {Error} If `transaction.from` is mismatched from the private key.
     *
     * @example
     *
     * import { BrowserProvider, Signer, Provider, Wallet, types } from 'via-ethers';
     *
     * const browserProvider = new BrowserProvider(window.ethereum);
     * const signer = Signer.from(
     *     await browserProvider.getSigner(),
     *     Number((await browserProvider.getNetwork()).chainId),
     *     Provider.getDefaultProvider(types.Network.Localhost)
     * );
     *
     * signer.sendTransaction({
     *     to: Wallet.createRandom().address,
     *     value: 10_000_000n
     * });
     */
    sendTransaction(transaction: TransactionRequest): Promise<TransactionResponse>;
    protected populateFeeData(transaction: TransactionRequest): Promise<ethers.PreparedTransactionRequest>;
    sendUncheckedTransaction(_tx: TransactionRequest): Promise<string>;
    unlock(password: string): Promise<boolean>;
    _legacySignMessage(_message: string | Uint8Array): Promise<string>;
    connect(provider: ethers.Provider | null): ethers.Signer;
    populateCall(tx: ethers.TransactionRequest): Promise<ethers.TransactionLike<string>>;
    populateTransaction(tx: ethers.TransactionRequest): Promise<ethers.TransactionLike<string>>;
    estimateGas(tx: ethers.TransactionRequest): Promise<bigint>;
    call(tx: ethers.TransactionRequest): Promise<string>;
    resolveName(name: string): Promise<string | null>;
    signTransaction(tx: ethers.TransactionRequest): Promise<string>;
    signMessage(message: string | Uint8Array): Promise<string>;
    signTypedData(domain: ethers.TypedDataDomain, types: Record<string, ethers.TypedDataField[]>, value: Record<string, any>): Promise<string>;
}
/**
 * A `VoidSigner` is an extension of {@link ethers.VoidSigner} class providing only L2 operations.
 */
export declare class VoidSigner extends AdapterL2 implements ethers.Signer {
    /** The provider instance for connecting to a L2 network. */
    provider: Provider | null;
    /** Returns the address of the associated account. */
    address: string;
    constructor(address: string, provider?: Provider);
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { VoidSigner, Provider, types } from 'via-ethers';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const signer = new VoidSigner('<ADDRESS>', provider);
     *
     * const address = await signer.getAddress();
     */
    getAddress(): Promise<Address>;
    /**
     * @inheritDoc
     *
     * @example Get BTC balance.
     *
     * import { VoidSigner, Provider, types } from 'via-ethers';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const signer = new VoidSigner('<ADDRESS>', provider);
     * const balance = await signer.getBalance();
     *
     * @example Get token balance.
     *
     * import { VoidSigner, Provider, types } from 'via-ethers';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const signer = new VoidSigner('<ADDRESS>', provider);
     *
     * const token = '0x6a4Fb925583F7D4dF82de62d98107468aE846FD1';
     * const balance = await signer.getBalance(token);
     */
    getBalance(token?: Address, blockTag?: BlockTag): Promise<bigint>;
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { VoidSigner, Provider, types } from 'via-ethers';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const signer = new VoidSigner('<ADDRESS>', provider);
     *
     * const allBalances = await signer.getAllBalances();
     */
    getAllBalances(): Promise<BalancesMap>;
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { VoidSigner, Provider, types } from 'via-ethers';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const signer = new VoidSigner('<ADDRESS>', provider);
     *
     * const deploymentNonce = await signer.getDeploymentNonce();
     */
    getDeploymentNonce(): Promise<bigint>;
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { VoidSigner, Provider, types } from 'via-ethers';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const signer = new VoidSigner('<ADDRESS>', provider);
     *
     * const nonce = await signer.getNonce();
     */
    getNonce(blockTag?: BlockTag): Promise<number>;
    /**
     * Designed for users who prefer a simplified approach by providing only the necessary data to create a valid transaction.
     * The only required fields are `transaction.to` and either `transaction.data` or `transaction.value` (or both, if the method is payable).
     * Any other fields that are not set will be prepared by this method.
     *
     * @param tx The transaction request that needs to be populated.
     *
     * @example
     *
     * import { Provider, VoidSigner, Wallet, types } from 'via-ethers';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const signer = new VoidSigner('<ADDRESS>', provider);
     *
     * const populatedTx = await signer.populateTransaction({
     *   to: Wallet.createRandom().address,
     *   value: 7_000_000n,
     *   maxFeePerGas: 3_500_000_000n,
     *   maxPriorityFeePerGas: 2_000_000_000n,
     *   customData: {
     *     gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
     *     factoryDeps: [],
     *   },
     * });
     */
    populateTransaction(tx: TransactionRequest): Promise<TransactionLike>;
    sendTransaction(tx: TransactionRequest): Promise<TransactionResponse>;
    connect(provider: Provider | null): VoidSigner;
    populateCall(tx: TransactionRequest): Promise<TransactionLike>;
    estimateGas(tx: TransactionRequest): Promise<bigint>;
    call(tx: TransactionRequest): Promise<string>;
    resolveName(name: string): Promise<string | null>;
    signTransaction(tx: TransactionRequest): Promise<string>;
    signMessage(message: string | Uint8Array): Promise<string>;
    signTypedData(domain: ethers.TypedDataDomain, types: Record<string, ethers.TypedDataField[]>, value: Record<string, any>): Promise<string>;
}
