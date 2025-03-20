import {EIP712Signer} from './signer';
import {Provider} from './provider';
import {EIP712_TX_TYPE, serializeEip712} from './utils';
import {
  BigNumberish,
  BlockTag,
  ethers,
  SigningKey,
  Overrides,
  ProgressCallback,
} from 'ethers';
import {
  Address,
  BalancesMap,
  Fee,
  PaymasterParams,
  TransactionLike,
  TransactionRequest,
  TransactionResponse,
} from './types';
import {AdapterL1, AdapterL2} from './adapters';
import {IL2Bridge, IL2SharedBridge} from './typechain';

export class WalletL1 extends AdapterL1 {
  readonly provider: ethers.Provider | null;

  constructor(
    privateKey: string | SigningKey,
    provider?: ethers.Provider | null
  ) {
    super();
    this.provider = provider ?? null;
    this._providerL1 = provider ?? undefined;
  }
}

export class WalletL2 extends AdapterL2 {
  readonly #eip712Signer?: EIP712Signer;
  readonly #signingKey: SigningKey;
  readonly provider: Provider | null;
  readonly address: string;

  /**
   *
   * @param privateKey The private key of the account.
   * @param [provider] The provider instance for connecting to a L2 network.
   *
   * @example
   *
   * import { WalletL2, Provider, types } from 'via-ethers';
   *
   * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
   * const wallet = new WalletL2(PRIVATE_KEY, provider);
   */
  constructor(privateKey: string | SigningKey, provider?: Provider | null) {
    super();
    this.provider = provider ?? null;
    this._providerL2 = provider ?? undefined;
    const wallet = new ethers.Wallet(privateKey, provider);
    this.#signingKey = wallet.signingKey;
    this._signerL2 = wallet;
    this.address = wallet.address;
    if (this._providerL2) {
      const network = this._providerL2.getNetwork();
      this.#eip712Signer = new EIP712Signer(
        this._signerL2,
        network.then(n => Number(n.chainId))
      );
    }
  }

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
   * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
   * const wallet = WalletL2.fromMnemonic(MNEMONIC, provider);
   */
  static fromMnemonic(mnemonic: string, provider?: Provider): WalletL2 {
    const wallet = ethers.Wallet.fromPhrase(mnemonic, provider);
    return new WalletL2(wallet.privateKey, provider);
  }

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
  static async fromEncryptedJson(
    json: string,
    password: string | Uint8Array,
    callback?: ProgressCallback
  ): Promise<WalletL2> {
    const wallet = await ethers.Wallet.fromEncryptedJson(
      json,
      password,
      callback
    );
    return new WalletL2(wallet.privateKey);
  }

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
   * const wallet = WalletL2.fromEncryptedJsonSync(fs.readFileSync('tests/files/wallet.json', 'utf8'), 'password');
   */
  static fromEncryptedJsonSync(
    json: string,
    password: string | Uint8Array
  ): WalletL2 {
    const wallet = ethers.Wallet.fromEncryptedJsonSync(json, password);
    return new WalletL2(wallet.privateKey);
  }

  /**
   * Creates a new random `WalletL2` with the `provider` as L2 provider.
   *
   * @param [provider] The provider instance for connecting to a L2 network.
   *
   * @example
   *
   * import { WalletL2, Provider } from 'via-ethers';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
   * const wallet = WalletL2.createRandom(provider);
   */
  static createRandom(provider?: Provider): WalletL2 {
    const wallet = ethers.Wallet.createRandom();
    return new WalletL2(wallet.privateKey, provider);
  }

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
   * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
   * const wallet = unconnectedWallet.connect(provider);
   */
  connect(provider: Provider | null): WalletL2 {
    return new WalletL2(this.#signingKey, provider);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { WalletL2, Provider, types } from 'via-ethers';
   *
   * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
   * const wallet = new WalletL2(PRIVATE_KEY, provider);
   * const address = await wallet.getAddress();
   */
  override async getAddress(): Promise<Address> {
    return await this._signerL2.getAddress();
  }

  /**
   * The signing key used for signing payloads.
   */
  get signingKey(): SigningKey {
    return this.#signingKey;
  }

  /**
   * Gets the next nonce required for account to send a transaction.
   *
   * @param [blockTag] The block tag for getting the balance on. Latest committed block is the default.
   */
  async getNonce(blockTag?: BlockTag | undefined): Promise<number> {
    return await this._signerL2.getNonce(blockTag);
  }

  /**
   * Resolves an ENS Name to an address.
   *
   * @param name ENS Name that needs to be resolved.
   */
  async resolveName(name: string): Promise<string | null> {
    return await this._signerL2.resolveName(name);
  }

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
   * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
   * const wallet = new Wallet(PRIVATE_KEY, provider);
   *
   * const tx = await wallet.estimateGas({
   *   type: utils.EIP712_TX_TYPE,
   *   to: WalletL2.createRandom().address,
   *   value: 7_000_000_000n,
   * });
   */
  async estimateGas(tx: TransactionRequest): Promise<bigint> {
    return await this._signerL2.estimateGas(tx);
  }

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
   * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
   * const wallet = new Wallet(PRIVATE_KEY, provider);
   *
   * const tx = await wallet.populateCall({
   *   type: utils.EIP712_TX_TYPE,
   *   to: WalletL2.createRandom().address,
   *   value: 7_000_000_000n,
   * });
   */
  async populateCall(tx: TransactionRequest): Promise<TransactionLike> {
    return await this._signerL2.populateCall(tx);
  }

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
   * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
   * const wallet = new Wallet(PRIVATE_KEY, provider);
   *
   * const tx = await wallet.call({
   *   type: utils.EIP712_TX_TYPE,
   *   to: WalletL2.createRandom().address,
   *   value: 7_000_000_000n,
   * });
   */
  async call(tx: TransactionRequest): Promise<string> {
    return await this._signerL2.call(tx);
  }

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
   * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
   * const wallet = new WalletL2(PRIVATE_KEY, provider);
   *
   * const populatedTx = await wallet.populateTransaction({
   *   type: utils.EIP712_TX_TYPE,
   *   to: RECEIVER,
   *   value: 7_000_000_000n,
   * });
   */
  async populateTransaction(tx: TransactionRequest): Promise<TransactionLike> {
    if (!this._providerL2) throw new Error('Provider is not initialized');
    const populated = (await this._signerL2.populateCall(
      tx
    )) as TransactionLike;
    if (
      populated.gasPrice &&
      (populated.maxFeePerGas || populated.maxPriorityFeePerGas)
    ) {
      throw new Error(
        'Provide combination of maxFeePerGas and maxPriorityFeePerGas or provide gasPrice. Not both!'
      );
    }
    let fee: Fee;
    if (
      !populated.gasLimit ||
      !tx.customData ||
      !tx.customData.gasPerPubdata ||
      (!populated.gasPrice &&
        (!populated.maxFeePerGas ||
          populated.maxPriorityFeePerGas === null ||
          populated.maxPriorityFeePerGas === undefined))
    ) {
      fee = await this._providerL2.estimateFee(populated);
      populated.gasLimit ??= fee.gasLimit;
      if (!populated.gasPrice && populated.type === 0) {
        populated.gasPrice = fee.maxFeePerGas;
      } else if (!populated.gasPrice && populated.type !== 0) {
        populated.maxFeePerGas ??= fee.maxFeePerGas;
        populated.maxPriorityFeePerGas ??= fee.maxPriorityFeePerGas;
      }
    }
    if (
      tx.type === null ||
      tx.type === undefined ||
      tx.type === EIP712_TX_TYPE ||
      tx.customData
    ) {
      tx.customData ??= {};
      tx.customData.gasPerPubdata ??= fee!.gasPerPubdataLimit;
      populated.type = EIP712_TX_TYPE;
      populated.value ??= 0;
      populated.data ??= '0x';
      populated.customData = this._fillCustomData(tx.customData);
      populated.nonce =
        populated.nonce ?? (await this._signerL2.getNonce('pending'));
      populated.chainId =
        populated.chainId ?? (await this._providerL2.getNetwork()).chainId;

      return populated;
    }

    return this._signerL2.populateTransaction(populated);
  }

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
   * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
   * const wallet = new Wallet(PRIVATE_KEY, provider);
   *
   * const tx = await wallet.signTransaction({
   *   type: utils.EIP712_TX_TYPE,
   *   to: WalletL2.createRandom().address,
   *   value: 7_000_000_000n,
   * });
   */
  async signTransaction(tx: TransactionRequest): Promise<string> {
    const populated = await this.populateTransaction(tx);
    if (populated.type !== EIP712_TX_TYPE) {
      return await this._signerL2.signTransaction(populated);
    }

    if (!this.#eip712Signer)
      throw new Error('EIP712 signer is not initialized');
    populated.customData!.customSignature =
      await this.#eip712Signer.sign(populated);
    return serializeEip712(populated);
  }

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
   * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
   * const wallet = new Wallet(PRIVATE_KEY, provider);
   *
   * const signedMessage = await account.signMessage('Hello World!');
   */
  async signMessage(message: string | Uint8Array): Promise<string> {
    return await this._signerL2.signMessage(message);
  }

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
   * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
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
  async signTypedData(
    domain: ethers.TypedDataDomain,
    types: Record<string, ethers.TypedDataField[]>,
    value: Record<string, any>
  ): Promise<string> {
    return await this._signerL2.signTypedData(domain, types, value);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { WalletL2, Provider, types, utils } from 'via-ethers';
   *
   * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
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
  override async sendTransaction(
    transaction: TransactionRequest
  ): Promise<TransactionResponse> {
    if (!this._providerL2) throw new Error('Provider is not initialized');
    return await this._providerL2.broadcastTransaction(
      await this.signTransaction(transaction)
    );
  }
}

export class Wallet extends WalletL2 {
  readonly #walletL1;
  readonly providerL1: ethers.Provider | null;

  /**
   *
   * @param privateKey The private key of the account.
   * @param [providerL2] The provider instance for connecting to a L2 network.
   * @param [providerL1] The provider instance for connecting to a L1 network.
   *
   * @example
   *
   * import { Wallet, Provider, types } from 'via-ethers';
   * import { ethers } from 'ethers';
   *
   * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
   * const ethProvider = ethers.getDefaultProvider('sepolia');
   * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
   */
  constructor(
    privateKey: string | ethers.SigningKey,
    providerL2?: Provider | null,
    providerL1?: ethers.Provider | null
  ) {
    super(privateKey, providerL2);
    this.providerL1 = providerL1 ?? null;
    this.#walletL1 = new WalletL1(privateKey, providerL1);
  }

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
   * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
   * const wallet = unconnectedWallet.connect(provider);
   */
  override connect(provider: Provider): Wallet {
    return new Wallet(this.signingKey, provider, this.#walletL1.provider);
  }

  /**
   * Connects to the L1 network using `provider`.
   *
   * @param provider The provider instance for connecting to a L1 network.
   *
   * @see {@link connect} in order to connect to L2 network.
   *
   * @example
   *
   * import { Wallet } from 'via-ethers';
   * import { ethers } from 'ethers';
   *
   * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
   * const unconnectedWallet = new Wallet(PRIVATE_KEY);
   *
   * const ethProvider = ethers.getDefaultProvider('sepolia');
   * const wallet = unconnectedWallet.connectToL1(ethProvider);
   */
  connectToL1(provider: ethers.Provider): Wallet {
    return new Wallet(this.signingKey, this.provider, provider);
  }

  /**
   * Creates a new `Wallet` with the L2 and L1 providers and a private key that is built from the mnemonic passphrase.
   *
   * @param mnemonic The mnemonic of the private key.
   * @param [providerL2] The provider instance for connecting to a L2 network.
   * @param [providerL1] The provider instance for connecting to a L1 network.
   *
   * @example
   *
   * import { Wallet, Provider, types } from 'via-ethers';
   * import { ethers } from 'ethers';
   *
   * const MNEMONIC = 'stuff slice staff easily soup parent arm payment cotton hammer scatter struggle';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
   * const ethProvider = ethers.getDefaultProvider('sepolia');
   * const wallet = Wallet.fromMnemonic(MNEMONIC, provider, ethProvider);
   */
  static override fromMnemonic(
    mnemonic: string,
    providerL2?: Provider,
    providerL1?: ethers.Provider
  ): Wallet {
    const wallet = super.fromMnemonic(mnemonic, providerL2);
    return new Wallet(
      wallet.signingKey,
      wallet.provider ?? undefined,
      providerL1
    );
  }

  /**
   * Creates a new `Wallet` from encrypted json file using provided `password`.
   *
   * @param json The encrypted json file.
   * @param password The password for the encrypted json file.
   * @param [callback] If provided, it is called periodically during decryption so that any UI can be updated.
   *
   * @example
   *
   * import { Wallet } from 'via-ethers';
   * import * as fs from 'fs';
   *
   * const wallet = await Wallet.fromEncryptedJson(fs.readFileSync('wallet.json', 'utf8'), 'password');
   */
  static override async fromEncryptedJson(
    json: string,
    password: string | Uint8Array,
    callback?: ProgressCallback
  ): Promise<Wallet> {
    const wallet = await super.fromEncryptedJson(json, password, callback);
    return new Wallet(wallet.signingKey);
  }

  /**
   * Creates a new `Wallet` from encrypted json file using provided `password`.
   *
   * @param json The encrypted json file.
   * @param password The password for the encrypted json file.
   *
   * @example
   *
   * import { Wallet } from 'via-ethers';
   * import * as fs from 'fs';
   *
   * const wallet = Wallet.fromEncryptedJsonSync(fs.readFileSync('tests/files/wallet.json', 'utf8'), 'password');
   */
  static override fromEncryptedJsonSync(
    json: string,
    password: string | Uint8Array
  ): Wallet {
    const wallet = super.fromEncryptedJsonSync(json, password);
    return new Wallet(wallet.signingKey);
  }

  /**
   * Creates a new random `Wallet` with the `provider` as L2 provider.
   *
   * @param [providerL2] The provider instance for connecting to a L2 network.
   * @param [providerL1] The provider instance for connecting to a L1 network.
   *
   * @example
   *
   * import { Wallet, Provider } from 'via-ethers';
   * import { ethers } from 'ethers';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
   * const ethProvider = ethers.getDefaultProvider('sepolia');
   * const wallet = Wallet.createRandom(provider, ethProvider);
   */
  static override createRandom(
    providerL2?: Provider,
    providerL1?: ethers.Provider
  ): Wallet {
    const wallet = ethers.Wallet.createRandom();
    return new Wallet(wallet.privateKey, providerL2, providerL1);
  }

  // TODO rename to WalletL1 or btcWallet
  /**
   * Returns `ethers.Wallet` object with the same private key.
   *
   * @example
   *
   * import { Wallet, Provider, types, utils } from 'zksync-ethers';
   * import { ethers } from 'ethers';
   *
   * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
   * const ethProvider = ethers.getDefaultProvider('sepolia');
   * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
   *
   * const ethWallet = wallet.ethWallet();
   */
  // ethWallet(): ethers.Wallet {
  //   return new ethers.Wallet(this.signingKey, this._providerL1());
  // }

  /**
   * @inheritDoc
   *
   * @example Get BTC balance.
   *
   * import { Wallet, Provider, types, utils } from 'via-ethers';
   * import { ethers } from 'ethers';
   *
   * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
   * const ethProvider = ethers.getDefaultProvider('sepolia');
   * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
   *
   * console.log(`ETH balance: ${await wallet.getBalance()}`);
   *
   * @example Get token balance.
   *
   * import { Wallet, Provider, utils } from 'via-ethers';
   * import { ethers } from 'ethers';
   *
   * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
   * const ethProvider = ethers.getDefaultProvider('sepolia');
   * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
   *
   * const token = '0x6a4Fb925583F7D4dF82de62d98107468aE846FD1';
   *
   * console.log(`Token balance: ${await wallet.getBalance(token)}`);
   */
  override async getBalance(
    token?: Address,
    blockTag: BlockTag = 'committed'
  ): Promise<bigint> {
    return super.getBalance(token, blockTag);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { Wallet, Provider, types, utils } from 'via-ethers';
   * import { ethers } from 'ethers';
   *
   * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
   * const ethProvider = ethers.getDefaultProvider('sepolia');
   * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
   *
   * const allBalances = await wallet.getAllBalances();
   */
  override async getAllBalances(): Promise<BalancesMap> {
    return super.getAllBalances();
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { Wallet, Provider, types, utils } from 'via-ethers';
   * import { ethers } from 'ethers';
   *
   * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
   * const ethProvider = ethers.getDefaultProvider('sepolia');
   * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
   *
   * console.log(`Nonce: ${await wallet.getDeploymentNonce()}`);
   */
  override async getDeploymentNonce(): Promise<bigint> {
    return super.getDeploymentNonce();
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { Wallet, Provider, types, utils } from 'via-ethers';
   * import { ethers } from 'ethers';
   *
   * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
   * const ethProvider = ethers.getDefaultProvider('sepolia');
   * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
   *
   * const l2BridgeContracts = await wallet.getL2BridgeContracts();
   */
  override async getL2BridgeContracts(): Promise<{
    erc20: IL2Bridge;
    weth: IL2Bridge;
    shared: IL2SharedBridge;
  }> {
    return super.getL2BridgeContracts();
  }

  /**
   * @inheritDoc
   *
   * @example Withdraw BTC.
   *
   * import { Wallet, Provider, types, utils } from 'via-ethers';
   *
   * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
   * const wallet = new Wallet(PRIVATE_KEY, provider);
   *
   * const withdrawTx = await wallet.withdraw({
   *   token: utils.ETH_ADDRESS,
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
   * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
   * const wallet = new Wallet(PRIVATE_KEY, provider);
   *
   * const withdrawTx = await wallet.withdraw({
   *   token: utils.ETH_ADDRESS,
   *   amount: 10_000_000n,
   *   paymasterParams: utils.getPaymasterParams(paymaster, {
   *     type: 'ApprovalBased',
   *     token: token,
   *     minimalAllowance: 1,
   *     innerInput: new Uint8Array(),
   *   }),
   * });
   *
   * @example Withdraw token.
   *
   * import { Wallet, Provider, types } from 'via-ethers';
   *
   * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
   * const wallet = new Wallet(PRIVATE_KEY, provider);
   *
   * const tokenL2 = '0x6a4Fb925583F7D4dF82de62d98107468aE846FD1';
   * const withdrawTx = await wallet.withdraw({
   *   token: tokenL2,
   *   amount: 10_000_000,
   * });
   *
   * @example Withdraw token using paymaster to facilitate fee payment with an ERC20 token.
   *
   * import { Wallet, Provider, types, utils } from 'via-ethers';
   *
   * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
   * const token = '0x927488F48ffbc32112F1fF721759649A89721F8F'; // Crown token which can be minted for free
   * const paymaster = '0x13D0D8550769f59aa241a41897D4859c87f7Dd46'; // Paymaster for Crown token
   *
   * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
   * const wallet = new Wallet(PRIVATE_KEY, provider);
   *
   * const tokenL2 = '0x6a4Fb925583F7D4dF82de62d98107468aE846FD1';
   * const withdrawTx = await wallet.withdraw({
   *   token: tokenL2,
   *   amount: 10_000_000n,
   *   paymasterParams: utils.getPaymasterParams(paymaster, {
   *     type: 'ApprovalBased',
   *     token: token,
   *     minimalAllowance: 1,
   *     innerInput: new Uint8Array(),
   *   }),
   * });
   */
  override async withdraw(transaction: {
    amount: BigNumberish;
    to: Address;
    paymasterParams?: PaymasterParams;
    overrides?: Overrides;
  }): Promise<TransactionResponse> {
    return super.withdraw(transaction);
  }

  /**
   * @inheritDoc
   *
   * @example Transfer BTC.
   *
   * import { Wallet, Provider, types } from 'via-ethers';
   * import { ethers } from 'ethers';
   *
   * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
   * const wallet = new Wallet(PRIVATE_KEY, provider);
   *
   * const transferTx = await wallet.transfer({
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
   * import { Wallet, Provider, types } from 'via-ethers';
   * import { ethers } from 'ethers';
   *
   * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
   * const token = '0x927488F48ffbc32112F1fF721759649A89721F8F'; // Crown token which can be minted for free
   * const paymaster = '0x13D0D8550769f59aa241a41897D4859c87f7Dd46'; // Paymaster for Crown token
   *
   * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
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
   * console.log(`The sum of ${receipt.value} ETH was transferred to ${receipt.to}`);
   *
   * @example Transfer token.
   *
   * import { Wallet, Provider, types } from 'via-ethers';
   * import { ethers } from 'ethers';
   *
   * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
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
   * import { Wallet, Provider, types } from 'via-ethers';
   * import { ethers } from 'ethers';
   *
   * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
   * const token = '0x927488F48ffbc32112F1fF721759649A89721F8F'; // Crown token which can be minted for free
   * const paymaster = '0x13D0D8550769f59aa241a41897D4859c87f7Dd46'; // Paymaster for Crown token
   *
   * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
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
  override async transfer(transaction: {
    to: Address;
    amount: BigNumberish;
    token?: Address;
    paymasterParams?: PaymasterParams;
    overrides?: Overrides;
  }): Promise<TransactionResponse> {
    return super.transfer(transaction);
  }

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
   * import { ethers } from 'ethers';
   *
   * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
   * const ethProvider = ethers.getDefaultProvider('sepolia');
   * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
   *
   * const populatedTx = await wallet.populateTransaction({
   *   type: utils.EIP712_TX_TYPE,
   *   to: RECEIVER,
   *   value: 7_000_000_000n,
   * });
   */
  override async populateTransaction(
    tx: TransactionRequest
  ): Promise<TransactionLike> {
    return await super.populateTransaction(tx);
  }

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
   * import { ethers } from 'ethers';
   *
   * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
   * const ethProvider = ethers.getDefaultProvider('sepolia');
   * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
   *
   * const tx = await wallet.signTransaction({
   *   type: utils.EIP712_TX_TYPE,
   *   to: Wallet.createRandom().address,
   *   value: ethers.parseEther('1'),
   * });
   */
  override async signTransaction(tx: TransactionRequest): Promise<string> {
    return await super.signTransaction(tx);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { Wallet, Provider, types, utils } from 'via-ethers';
   * import { ethers } from 'ethers';
   *
   * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
   * const ethProvider = ethers.getDefaultProvider('sepolia');
   * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
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
  override async sendTransaction(
    transaction: TransactionRequest
  ): Promise<TransactionResponse> {
    return await super.sendTransaction(transaction);
  }
}
