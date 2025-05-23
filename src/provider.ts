import {
  ethers,
  BigNumberish,
  BytesLike,
  Contract,
  BlockTag,
  Filter,
  FilterByBlockHash,
  TransactionRequest as EthersTransactionRequest,
  JsonRpcTransactionRequest,
  Networkish,
  Eip1193Provider,
  JsonRpcError,
  JsonRpcResult,
  JsonRpcPayload,
  resolveProperties,
  FetchRequest,
  toUtf8Bytes,
} from 'ethers';
import {IBaseToken__factory, IERC20__factory} from './typechain';
import {
  Address,
  TransactionResponse,
  TransactionRequest,
  TransactionStatus,
  TransactionReceipt,
  Block,
  Log,
  TransactionDetails,
  BlockDetails,
  ContractAccountInfo,
  Network as ZkSyncNetwork,
  BatchDetails,
  Fee,
  Transaction,
  RawBlockTransaction,
  PaymasterParams,
  StorageProof,
  LogProof,
  ProtocolVersion,
  FeeParams,
  TransactionWithDetailedOutput,
} from './types';
import {
  CONTRACT_DEPLOYER_ADDRESS,
  CONTRACT_DEPLOYER,
  EIP712_TX_TYPE,
  L2_BASE_TOKEN_ADDRESS,
  isAddressEq,
} from './utils';
import {Signer} from './signer';

import {
  formatLog,
  formatBlock,
  formatTransactionResponse,
  formatTransactionReceipt,
  formatFee,
} from './format';
import {makeError} from 'ethers';

type Constructor<T = {}> = new (...args: any[]) => T;

export function JsonRpcApiProvider<
  TBase extends Constructor<ethers.JsonRpcApiProvider>,
>(ProviderType: TBase) {
  return class Provider extends ProviderType {
    /**
     * Sends a JSON-RPC `_payload` (or a batch) to the underlying channel.
     *
     * @param _payload The JSON-RPC payload or batch of payloads to send.
     * @returns A promise that resolves to the result of the JSON-RPC request(s).
     */
    override _send(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _payload: JsonRpcPayload | Array<JsonRpcPayload>
    ): Promise<Array<JsonRpcResult | JsonRpcError>> {
      throw new Error('Must be implemented by the derived class!');
    }

    /**
     * Returns the bridge addresses.
     */
    contractAddresses(): {
      bridge?: Address;
    } {
      throw new Error('Must be implemented by the derived class!');
    }

    override _getBlockTag(blockTag?: BlockTag): string | Promise<string> {
      if (blockTag === 'committed') {
        return 'committed';
      } else if (blockTag === 'l1_committed') {
        return 'l1_committed';
      }
      return super._getBlockTag(blockTag);
    }

    override _wrapLog(value: any): Log {
      return new Log(formatLog(value), this);
    }

    override _wrapBlock(value: any): Block {
      return new Block(formatBlock(value), this);
    }

    override _wrapTransactionResponse(value: any): TransactionResponse {
      const tx: any = formatTransactionResponse(value);
      return new TransactionResponse(tx, this);
    }

    override _wrapTransactionReceipt(value: any): TransactionReceipt {
      const receipt: any = formatTransactionReceipt(value);
      return new TransactionReceipt(receipt, this);
    }

    /**
     * Resolves to the transaction receipt for `txHash`, if mined.
     * If the transaction has not been mined, is unknown or on pruning nodes which discard old transactions
     * this resolves to `null`.
     *
     * @param txHash The hash of the transaction.
     */
    override async getTransactionReceipt(
      txHash: string
    ): Promise<TransactionReceipt | null> {
      return (await super.getTransactionReceipt(
        txHash
      )) as TransactionReceipt | null;
    }

    /**
     * Resolves to the transaction for `txHash`.
     * If the transaction is unknown or on pruning nodes which discard old transactions this resolves to `null`.
     *
     * @param txHash The hash of the transaction.
     */
    override async getTransaction(
      txHash: string
    ): Promise<TransactionResponse> {
      return (await super.getTransaction(txHash)) as TransactionResponse;
    }

    /**
     * Resolves to the block corresponding to the provided `blockHashOrBlockTag`.
     * If `includeTxs` is set to `true` and the backend supports including transactions with block requests,
     * all transactions will be included in the returned block object, eliminating the need for remote calls
     * to fetch transactions separately.
     *
     * @param blockHashOrBlockTag The hash or tag of the block to retrieve.
     * @param [includeTxs] A flag indicating whether to include transactions in the block.
     */
    override async getBlock(
      blockHashOrBlockTag: BlockTag,
      includeTxs?: boolean
    ): Promise<Block> {
      return (await super.getBlock(blockHashOrBlockTag, includeTxs)) as Block;
    }

    /**
     * Resolves to the list of Logs that match `filter`.
     *
     * @param filter The filter criteria to apply.
     */
    override async getLogs(filter: Filter | FilterByBlockHash): Promise<Log[]> {
      return (await super.getLogs(filter)) as Log[];
    }

    /**
     * Returns the account balance  for the specified account `address`, `blockTag`, and `tokenAddress`.
     * If `blockTag` and `tokenAddress` are not provided, the balance for the latest committed block and BTC token
     * is returned by default.
     *
     * @param address The account address for which the balance is retrieved.
     * @param [blockTag] The block tag for getting the balance on. Latest committed block is the default.
     * @param [token] The token address. BTC is the default token.
     */
    override async getBalance(
      address: Address,
      blockTag?: BlockTag,
      token?: Address
    ): Promise<bigint> {
      if (!token || isAddressEq(token, L2_BASE_TOKEN_ADDRESS))
        return await super.getBalance(address, blockTag);

      try {
        return await IERC20__factory.connect(token, this).balanceOf(address, {
          blockTag,
        });
      } catch {
        return 0n;
      }
    }

    /**
     * Return the protocol version.
     *
     * Calls the {@link https://docs.zksync.io/build/api.html#zks_getprotocolversion zks_getProtocolVersion} JSON-RPC method.
     *
     * @param [id] Specific version ID.
     */
    async getProtocolVersion(id?: number): Promise<ProtocolVersion> {
      return await this.send('zks_getProtocolVersion', [id]);
    }

    /**
     * Returns an estimated {@link Fee} for requested transaction.
     *
     * @param transaction The transaction request.
     */
    async estimateFee(transaction: TransactionRequest): Promise<Fee> {
      const fee = await this.send('zks_estimateFee', [
        await this.getRpcTransaction(transaction),
      ]);
      return formatFee(fee);
    }

    /**
     * Returns the current fee parameters.
     *
     * Calls the {@link https://docs.zksync.io/build/api.html#zks_getFeeParams zks_getFeeParams} JSON-RPC method.
     */
    async getFeeParams(): Promise<FeeParams> {
      return await this.send('zks_getFeeParams', []);
    }

    /**
     * Returns an estimate (best guess) of the gas price to use in a transaction.
     */
    async getGasPrice(): Promise<bigint> {
      const feeData = await this.getFeeData();
      return feeData.gasPrice!;
    }

    /**
     * Returns the L1 fee per byte.
     *
     * Calls the {@link https://docs.zksync.io/build/api.html#zks_getL1GasPrice zks_getL1GasPrice} JSON-RPC method.
     */
    async getL1GasPrice(): Promise<bigint> {
      return BigInt(await this.send('zks_getL1GasPrice', []));
    }

    /**
     * Returns the proof for a transaction's L2 to L1 log sent via the `L1Messenger` system contract.
     *
     * Calls the {@link https://docs.zksync.io/build/api.html#zks-getl2tol1logproof zks_getL2ToL1LogProof} JSON-RPC method.
     *
     * @param txHash The hash of the L2 transaction the L2 to L1 log was produced within.
     * @param [index] The index of the L2 to L1 log in the transaction.
     */
    async getLogProof(
      txHash: BytesLike,
      index?: number
    ): Promise<LogProof | null> {
      return await this.send('zks_getL2ToL1LogProof', [
        ethers.hexlify(txHash),
        index,
      ]);
    }

    /**
     * Returns the range of blocks contained within a batch given by batch number.
     *
     * Calls the {@link https://docs.zksync.io/build/api.html#zks-getl1batchblockrange zks_getL1BatchBlockRange} JSON-RPC method.
     *
     * @param l1BatchNumber The L1 batch number.
     */
    async getL1BatchBlockRange(
      l1BatchNumber: number
    ): Promise<[number, number] | null> {
      const range = await this.send('zks_getL1BatchBlockRange', [
        l1BatchNumber,
      ]);
      if (!range) {
        return null;
      }
      return [parseInt(range[0], 16), parseInt(range[1], 16)];
    }

    /**
     * Returns the L1 bridge address.
     */
    async getBridgeAddress(): Promise<Address> {
      if (!this.contractAddresses().bridge) {
        this.contractAddresses().bridge = await this.send(
          'via_getBridgeAddress',
          []
        );
      }
      return this.contractAddresses().bridge!;
    }

    /**
     * Returns the testnet {@link https://docs.zksync.io/build/developer-reference/account-abstraction.html#paymasters paymaster address}
     * if available, or `null`.
     *
     * Calls the {@link https://docs.zksync.io/build/api.html#zks-gettestnetpaymaster zks_getTestnetPaymaster} JSON-RPC method.
     */
    async getTestnetPaymasterAddress(): Promise<Address | null> {
      // Unlike contract's addresses, the testnet paymaster is not cached, since it can be trivially changed
      // on the fly by the server and should not be relied on to be constant
      return await this.send('zks_getTestnetPaymaster', []);
    }

    /**
     * Returns the latest L1 batch number.
     *
     * Calls the {@link https://docs.zksync.io/build/api.html#zks-l1batchnumber zks_L1BatchNumber}  JSON-RPC method.
     */
    async getL1BatchNumber(): Promise<number> {
      const number = await this.send('zks_L1BatchNumber', []);
      return Number(number);
    }

    /**
     * Returns data pertaining to a given batch.
     *
     * Calls the {@link https://docs.zksync.io/build/api.html#zks-getl1batchdetails zks_getL1BatchDetails} JSON-RPC method.
     *
     * @param number The L1 batch number.
     */
    async getL1BatchDetails(number: number): Promise<BatchDetails> {
      return await this.send('zks_getL1BatchDetails', [number]);
    }

    /**
     * Returns additional zkSync-specific information about the L2 block.
     *
     * Calls the {@link https://docs.zksync.io/build/api.html#zks-getblockdetails zks_getBlockDetails}  JSON-RPC method.
     *
     * @param number The block number.
     */
    async getBlockDetails(number: number): Promise<BlockDetails> {
      return await this.send('zks_getBlockDetails', [number]);
    }

    /**
     * Returns data from a specific transaction given by the transaction hash.
     *
     * Calls the {@link https://docs.zksync.io/build/api.html#zks-gettransactiondetails zks_getTransactionDetails} JSON-RPC method.
     *
     * @param txHash The transaction hash.
     */
    async getTransactionDetails(
      txHash: BytesLike
    ): Promise<TransactionDetails> {
      return await this.send('zks_getTransactionDetails', [txHash]);
    }

    /**
     * Returns bytecode of a contract given by its hash.
     *
     * Calls the {@link https://docs.zksync.io/build/api.html#zks-getbytecodebyhash zks_getBytecodeByHash} JSON-RPC method.
     *
     * @param bytecodeHash The bytecode hash.
     */
    async getBytecodeByHash(bytecodeHash: BytesLike): Promise<Uint8Array> {
      return await this.send('zks_getBytecodeByHash', [bytecodeHash]);
    }

    /**
     * Returns data of transactions in a block.
     *
     * Calls the {@link https://docs.zksync.io/build/api.html#zks-getrawblocktransactions zks_getRawBlockTransactions}  JSON-RPC method.
     *
     * @param number The block number.
     */
    async getRawBlockTransactions(
      number: number
    ): Promise<RawBlockTransaction[]> {
      return await this.send('zks_getRawBlockTransactions', [number]);
    }

    /**
     * Returns Merkle proofs for one or more storage values at the specified account along with a Merkle proof
     * of their authenticity.
     *
     * Calls the {@link https://docs.zksync.io/build/api.html#zks-getproof zks_getProof} JSON-RPC method.
     *
     * @param address The account to fetch storage values and proofs for.
     * @param keys The vector of storage keys in the account.
     * @param l1BatchNumber The number of the L1 batch specifying the point in time at which the requested values are returned.
     */
    async getProof(
      address: Address,
      keys: string[],
      l1BatchNumber: number
    ): Promise<StorageProof> {
      return await this.send('zks_getProof', [address, keys, l1BatchNumber]);
    }

    /**
     * Executes a transaction and returns its hash, storage logs, and events that would have been generated if the
     * transaction had already been included in the block. The API has a similar behaviour to `eth_sendRawTransaction`
     * but with some extra data returned from it.
     *
     * With this API Consumer apps can apply 'optimistic' events in their applications instantly without having to
     * wait for ZKsync block confirmation time.
     *
     * It’s expected that the optimistic logs of two uncommitted transactions that modify the same state will not
     * have causal relationships between each other.
     *
     * Calls the {@link https://docs.zksync.io/build/api.html#zks_sendRawTransactionWithDetailedOutput zks_sendRawTransactionWithDetailedOutput} JSON-RPC method.
     *
     * @param signedTx The signed transaction that needs to be broadcasted.
     */
    async sendRawTransactionWithDetailedOutput(
      signedTx: string
    ): Promise<TransactionWithDetailedOutput> {
      return await this.send('zks_sendRawTransactionWithDetailedOutput', [
        signedTx,
      ]);
    }

    /**
     * Returns the populated withdrawal transaction.
     *
     * @param transaction The transaction details.
     * @param transaction.amount The amount of BTC tokens.
     * @param transaction.to The L1 recipient's address.
     * @param transaction.from The sender's address.
     * @param [transaction.paymasterParams] Paymaster parameters.
     * @param [transaction.overrides] Transaction overrides including `gasLimit`, `gasPrice`, and `value`.
     */
    async getWithdrawTx(transaction: {
      amount: BigNumberish;
      to: Address;
      from: Address;
      paymasterParams?: PaymasterParams;
      overrides?: ethers.Overrides;
    }): Promise<EthersTransactionRequest> {
      const {...tx} = transaction;

      tx.overrides ??= {};
      tx.overrides.from = tx.from;
      tx.overrides.value = tx.amount;
      tx.overrides.type ??= EIP712_TX_TYPE;

      const baseToken = IBaseToken__factory.connect(
        L2_BASE_TOKEN_ADDRESS,
        this
      );
      const populatedTx = await baseToken.withdraw.populateTransaction(
        toUtf8Bytes(tx.to),
        tx.overrides
      );
      if (tx.paymasterParams) {
        return {
          ...populatedTx,
          customData: {
            paymasterParams: tx.paymasterParams,
          },
        };
      }
      return populatedTx;
    }

    /**
     * Returns the gas estimation for a withdrawal transaction.
     *
     * @param transaction The transaction details.
     * @param transaction.amount The amount of token.
     * @param transaction.from The sender's address.
     * @param transaction.to The L1 recipient's address.
     * @param [transaction.paymasterParams] Paymaster parameters.
     * @param [transaction.overrides] Transaction overrides including `gasLimit`, `gasPrice`, and `value`.
     */
    async estimateGasWithdraw(transaction: {
      amount: BigNumberish;
      from: Address;
      to: Address;
      paymasterParams?: PaymasterParams;
      overrides?: ethers.Overrides;
    }): Promise<bigint> {
      const withdrawTx = await this.getWithdrawTx(transaction);
      return await this.estimateGas(withdrawTx);
    }

    /**
     * Returns the populated transfer transaction.
     *
     * @param transaction Transfer transaction request.
     * @param transaction.to The address of the recipient.
     * @param transaction.amount The amount of the token to transfer.
     * @param [transaction.token] The address of the token. Defaults to ETH.
     * @param [transaction.paymasterParams] Paymaster parameters.
     * @param [transaction.overrides] Transaction's overrides which may be used to pass L2 `gasLimit`, `gasPrice`, `value`, etc.
     */
    async getTransferTx(transaction: {
      to: Address;
      amount: BigNumberish;
      from?: Address;
      token?: Address;
      paymasterParams?: PaymasterParams;
      overrides?: ethers.Overrides;
    }): Promise<EthersTransactionRequest> {
      const {...tx} = transaction;
      if (!tx.token) tx.token = L2_BASE_TOKEN_ADDRESS;

      tx.overrides ??= {};
      tx.overrides.from ??= tx.from;
      tx.overrides.type ??= EIP712_TX_TYPE;

      if (isAddressEq(tx.token, L2_BASE_TOKEN_ADDRESS)) {
        if (tx.paymasterParams)
          return {
            ...tx.overrides,
            type: EIP712_TX_TYPE,
            to: tx.to,
            value: tx.amount,
            customData: {
              paymasterParams: tx.paymasterParams,
            },
          };

        return {
          ...tx.overrides,
          to: tx.to,
          value: tx.amount,
        };
      } else {
        const token = IERC20__factory.connect(tx.token, this);
        const populatedTx = await token.transfer.populateTransaction(
          tx.to,
          tx.amount,
          tx.overrides
        );
        if (tx.paymasterParams)
          return {
            ...populatedTx,
            customData: {
              paymasterParams: tx.paymasterParams,
            },
          };
        return populatedTx;
      }
    }

    /**
     * Returns the gas estimation for a transfer transaction.
     *
     * @param transaction Transfer transaction request.
     * @param transaction.to The address of the recipient.
     * @param transaction.amount The amount of the token to transfer.
     * @param [transaction.token] The address of the token. Defaults to ETH.
     * @param [transaction.paymasterParams] Paymaster parameters.
     * @param [transaction.overrides] Transaction's overrides which may be used to pass L2 `gasLimit`, `gasPrice`, `value`, etc.
     */
    async estimateGasTransfer(transaction: {
      to: Address;
      amount: BigNumberish;
      from?: Address;
      token?: Address;
      paymasterParams?: PaymasterParams;
      overrides?: ethers.Overrides;
    }): Promise<bigint> {
      const transferTx = await this.getTransferTx(transaction);
      return await this.estimateGas(transferTx);
    }

    /**
     * Returns a new filter by calling {@link https://ethereum.github.io/execution-apis/api-documentation/ eth_newFilter}
     * and passing a filter object.
     *
     * @param filter The filter query to apply.
     */
    async newFilter(filter: FilterByBlockHash | Filter): Promise<bigint> {
      const id = await this.send('eth_newFilter', [
        await this._getFilter(filter),
      ]);
      return BigInt(id);
    }

    /**
     * Returns a new block filter by calling {@link https://ethereum.github.io/execution-apis/api-documentation/ eth_newBlockFilter}.
     */
    async newBlockFilter(): Promise<bigint> {
      const id = await this.send('eth_newBlockFilter', []);
      return BigInt(id);
    }

    /**
     * Returns a new pending transaction filter by calling {@link https://ethereum.github.io/execution-apis/api-documentation/ eth_newPendingTransactionFilter}.
     */
    async newPendingTransactionsFilter(): Promise<bigint> {
      const id = await this.send('eth_newPendingTransactionFilter', []);
      return BigInt(id);
    }

    /**
     * Returns an array of logs by calling {@link https://ethereum.github.io/execution-apis/api-documentation/ eth_getFilterChanges}.
     *
     * @param idx The filter index.
     */
    async getFilterChanges(idx: bigint): Promise<Array<Log | string>> {
      const logs = await this.send('eth_getFilterChanges', [
        ethers.toBeHex(idx),
      ]);

      return typeof logs[0] === 'string'
        ? logs
        : logs.map((log: any) => this._wrapLog(log));
    }

    /**
     * Returns the status of a specified transaction.
     *
     * @param txHash The hash of the transaction.
     */
    // This is inefficient. Status should probably be indicated in the transaction receipt.
    async getTransactionStatus(txHash: string): Promise<TransactionStatus> {
      const tx = await this.getTransaction(txHash);
      if (!tx) {
        return TransactionStatus.NotFound;
      }
      if (!tx.blockNumber) {
        return TransactionStatus.Processing;
      }
      const verifiedBlock = (await this.getBlock('finalized')) as Block;
      if (tx.blockNumber <= verifiedBlock.number) {
        return TransactionStatus.Finalized;
      }
      return TransactionStatus.Committed;
    }

    /**
     * Broadcasts the `signedTx` to the network, adding it to the memory pool of any node for which the transaction
     * meets the rebroadcast requirements.
     *
     * @param signedTx The signed transaction that needs to be broadcasted.
     * @returns A promise that resolves with the transaction response.
     */
    override async broadcastTransaction(
      signedTx: string
    ): Promise<TransactionResponse> {
      const {blockNumber, hash} = await resolveProperties({
        blockNumber: this.getBlockNumber(),
        hash: this._perform({
          method: 'broadcastTransaction',
          signedTransaction: signedTx,
        }),
        network: this.getNetwork(),
      });

      const tx = Transaction.from(signedTx);
      if (tx.hash !== hash) {
        throw new Error('@TODO: the returned hash did not match!');
      }

      return this._wrapTransactionResponse(<any>tx).replaceableTransaction(
        blockNumber
      );
    }

    /**
     * Returns the version of the supported account abstraction and nonce ordering from a given contract address.
     *
     * @param address The contract address.
     */
    async getContractAccountInfo(
      address: Address
    ): Promise<ContractAccountInfo> {
      const deployerContract = new Contract(
        CONTRACT_DEPLOYER_ADDRESS,
        CONTRACT_DEPLOYER.fragments,
        this
      );
      const data = await deployerContract.getAccountInfo(address);

      return {
        supportedAAVersion: Number(data.supportedAAVersion),
        nonceOrdering: Number(data.nonceOrdering),
      };
    }

    /**
     * Returns `tx` as a normalized JSON-RPC transaction request, which has all values `hexlified` and any numeric
     * values converted to Quantity values.
     * @param tx The transaction request that should be normalized.
     */
    override getRpcTransaction(
      tx: TransactionRequest
    ): JsonRpcTransactionRequest {
      const result: any = super.getRpcTransaction(tx);
      if (!tx.customData) {
        return result;
      }
      result.type = ethers.toBeHex(EIP712_TX_TYPE);
      result.eip712Meta = {
        gasPerPubdata: ethers.toBeHex(tx.customData.gasPerPubdata ?? 0),
      } as any;
      if (tx.customData.factoryDeps) {
        result.eip712Meta.factoryDeps = tx.customData.factoryDeps.map(
          (dep: ethers.BytesLike) => Array.from(ethers.getBytes(dep))
        );
      }
      if (tx.customData.customSignature) {
        result.eip712Meta.customSignature = Array.from(
          ethers.getBytes(tx.customData.customSignature)
        );
      }
      if (tx.customData.paymasterParams) {
        result.eip712Meta.paymasterParams = {
          paymaster: ethers.hexlify(tx.customData.paymasterParams.paymaster),
          paymasterInput: Array.from(
            ethers.getBytes(tx.customData.paymasterParams.paymasterInput)
          ),
        };
      }
      return result;
    }
  };
}

/**
 * A `Provider` extends {@link ethers.JsonRpcProvider} and includes additional features for interacting with ZKsync Era.
 * It supports RPC endpoints within the `zks` namespace.
 */
export class Provider extends JsonRpcApiProvider(ethers.JsonRpcProvider) {
  #connect: FetchRequest;
  protected _contractAddresses: {
    bridge?: Address;
  };

  override contractAddresses(): {
    bridge?: Address;
  } {
    return this._contractAddresses;
  }

  /**
   * Creates a new `Provider` instance for connecting to an L2 network.
   * Caching is disabled for local networks.
   * @param [url] The network RPC URL. Defaults to the local network.
   * @param [network] The network name, chain ID, or object with network details.
   * @param [options] Additional options for the provider.
   */
  constructor(
    url?: ethers.FetchRequest | string,
    network?: Networkish,
    options?: any
  ) {
    if (!url) {
      url = 'http://127.0.0.1:3050';
    }

    const isLocalNetwork =
      typeof url === 'string'
        ? url.includes('localhost') ||
          url.includes('127.0.0.1') ||
          url.includes('0.0.0.0')
        : url.url.includes('localhost') ||
          url.url.includes('127.0.0.1') ||
          url.url.includes('0.0.0.0');

    const optionsWithDisabledCache = isLocalNetwork
      ? {...options, cacheTimeout: -1}
      : options;

    super(url, network, optionsWithDisabledCache);
    typeof url === 'string'
      ? (this.#connect = new FetchRequest(url))
      : (this.#connect = url.clone());
    this.pollingInterval = 500;
    this._contractAddresses = {};
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { Provider, types, utils } from '@vianetwork/via-ethers';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Localhost);
   * const TX_HASH = '<YOUR_TX_HASH_ADDRESS>';
   * console.log(`Transaction receipt: ${utils.toJSON(await provider.getTransactionReceipt(TX_HASH))}`);
   */
  override async getTransactionReceipt(
    txHash: string
  ): Promise<TransactionReceipt | null> {
    return super.getTransactionReceipt(txHash);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { Provider, types } from '@vianetwork/via-ethers';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Localhost);
   *
   * const TX_HASH = '<YOUR_TX_HASH_ADDRESS>';
   * const tx = await provider.getTransaction(TX_HASH);
   *
   * // Wait until the transaction is processed by the server.
   * await tx.wait();
   * // Wait until the transaction is finalized.
   * await tx.waitFinalize();
   */
  override async getTransaction(txHash: string): Promise<TransactionResponse> {
    return super.getTransaction(txHash);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { Provider, types, utils } from '@vianetwork/via-ethers';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Localhost);
   * console.log(`Block: ${utils.toJSON(await provider.getBlock('latest', true))}`);
   */
  override async getBlock(
    blockHashOrBlockTag: BlockTag,
    includeTxs?: boolean
  ): Promise<Block> {
    return super.getBlock(blockHashOrBlockTag, includeTxs);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { Provider, types, utils } from '@vianetwork/via-ethers';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Localhost);
   * console.log(`Logs: ${utils.toJSON(await provider.getLogs({ fromBlock: 0, toBlock: 5, address: utils.L2_BASE_TOKEN_ADDRESS }))}`);
   */
  override async getLogs(filter: Filter | FilterByBlockHash): Promise<Log[]> {
    return super.getLogs(filter);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { Provider, types } from '@vianetwork/via-ethers';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Localhost);
   * const account = '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049';
   * const tokenAddress = '0x927488F48ffbc32112F1fF721759649A89721F8F'; // Crown token which can be minted for free
   * console.log(`BTC balance: ${await provider.getBalance(account)}`);
   * console.log(`Token balance: ${await provider.getBalance(account, 'latest', tokenAddress)}`);
   */
  override async getBalance(
    address: Address,
    blockTag?: BlockTag,
    tokenAddress?: Address
  ): Promise<bigint> {
    return super.getBalance(address, blockTag, tokenAddress);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { Provider, types } from '@vianetwork/via-ethers';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Localhost);
   * console.log(`Protocol version: ${await provider.getProtocolVersion()}`);
   */
  override async getProtocolVersion(id?: number): Promise<ProtocolVersion> {
    return super.getProtocolVersion(id);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { Provider, types, utils } from '@vianetwork/via-ethers';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Localhost);
   * const fee = await provider.estimateFee({
   *   from: '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049',
   *   to: '0xa61464658AfeAf65CccaaFD3a512b69A83B77618',
   *   value: `0x${BigInt(7_000_000_000).toString(16)}`,
   * });
   * console.log(`Fee: ${utils.toJSON(fee)}`);
   */
  override async estimateFee(transaction: TransactionRequest): Promise<Fee> {
    return super.estimateFee(transaction);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { Provider, types, utils } from '@vianetwork/via-ethers';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Localhost);
   * const feeParams = await provider.getFeeParams();
   * console.log(`Fee: ${utils.toJSON(feeParams)}`);
   */
  override async getFeeParams(): Promise<FeeParams> {
    return super.getFeeParams();
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { Provider, types } from '@vianetwork/via-ethers';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Localhost);
   * console.log(`Gas price: ${await provider.getGasPrice()}`);
   */
  override async getGasPrice(): Promise<bigint> {
    return super.getGasPrice();
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { Provider, types } from 'via-ethers';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Localhost);
   * console.log(`L1 fee per byte: ${await provider.getL1GasPrice()}`);
   */
  override async getL1GasPrice(): Promise<bigint> {
    return super.getL1GasPrice();
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { Provider, types, utils } from 'via-ethers';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Localhost);
   * // Any L2 -> L1 transaction can be used.
   * // In this case, withdrawal transaction is used.
   * const tx = '0x2a1c6c74b184965c0cb015aae9ea134fd96215d2e4f4979cfec12563295f610e';
   * console.log(`Log ${utils.toJSON(await provider.getLogProof(tx, 0))}`);
   */
  override async getLogProof(
    txHash: BytesLike,
    index?: number
  ): Promise<LogProof | null> {
    return super.getLogProof(txHash, index);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { Provider, types, utils } from 'via-ethers';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Localhost);
   * const l1BatchNumber = await provider.getL1BatchNumber();
   * console.log(`L1 batch block range: ${utils.toJSON(await provider.getL1BatchBlockRange(l1BatchNumber))}`);
   */
  override async getL1BatchBlockRange(
    l1BatchNumber: number
  ): Promise<[number, number] | null> {
    return super.getL1BatchBlockRange(l1BatchNumber);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { Provider, types } from 'via-ethers';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Localhost);
   * console.log(`Bridge address: ${await provider.getBridgeAddress()}`);
   */
  override async getBridgeAddress(): Promise<Address> {
    return super.getBridgeAddress();
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { Provider, types } from 'via-ethers';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Localhost);
   * console.log(`Testnet paymaster: ${await provider.getTestnetPaymasterAddress()}`);
   */
  override async getTestnetPaymasterAddress(): Promise<Address | null> {
    return super.getTestnetPaymasterAddress();
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { Provider, types } from 'via-ethers';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Localhost);
   * console.log(`L1 batch number: ${await provider.getL1BatchNumber()}`);
   */
  override async getL1BatchNumber(): Promise<number> {
    return super.getL1BatchNumber();
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { Provider, types, utils } from 'via-ethers';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Localhost);
   * const l1BatchNumber = await provider.getL1BatchNumber();
   * console.log(`L1 batch details: ${utils.toJSON(await provider.getL1BatchDetails(l1BatchNumber))}`);
   */
  override async getL1BatchDetails(number: number): Promise<BatchDetails> {
    return super.getL1BatchDetails(number);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { Provider, types, utils } from 'via-ethers';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Localhost);
   * console.log(`Block details: ${utils.toJSON(await provider.getBlockDetails(90_000))}`);
   */
  override async getBlockDetails(number: number): Promise<BlockDetails> {
    return super.getBlockDetails(number);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { Provider, types, utils } from 'via-ethers';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Localhost);
   *
   * const TX_HASH = '<YOUR_TX_HASH_ADDRESS>';
   * console.log(`Transaction details: ${utils.toJSON(await provider.getTransactionDetails(TX_HASH))}`);
   */
  override async getTransactionDetails(
    txHash: BytesLike
  ): Promise<TransactionDetails> {
    return super.getTransactionDetails(txHash);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { Provider, types, utils } from 'via-ethers';
   *
   * // Bytecode hash can be computed by following these steps:
   * // const testnetPaymasterBytecode = await provider.getCode(await provider.getTestnetPaymasterAddress());
   * // const testnetPaymasterBytecodeHash = ethers.hexlify(utils.hashBytecode(testnetPaymasterBytecode));
   *
   * const testnetPaymasterBytecodeHash = '0x010000f16d2b10ddeb1c32f2c9d222eb1aea0f638ec94a81d4e916c627720e30';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Localhost);
   * console.log(`Bytecode: ${await provider.getBytecodeByHash(testnetPaymasterBytecodeHash)}`);
   */
  override async getBytecodeByHash(
    bytecodeHash: BytesLike
  ): Promise<Uint8Array> {
    return super.getBytecodeByHash(bytecodeHash);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { Provider, types, utils } from 'via-ethers';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Localhost);
   * console.log(`Raw block transactions: ${utils.toJSON(await provider.getRawBlockTransactions(90_000))}`);
   */
  override async getRawBlockTransactions(
    number: number
  ): Promise<RawBlockTransaction[]> {
    return super.getRawBlockTransactions(number);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { Provider, types, utils } from 'via-ethers';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Localhost);
   * const address = '0x082b1BB53fE43810f646dDd71AA2AB201b4C6b04';
   *
   * // Fetching the storage proof for rawNonces storage slot in NonceHolder system contract.
   * // mapping(uint256 => uint256) internal rawNonces;
   *
   * // Ensure the address is a 256-bit number by padding it
   * // because rawNonces slot uses uint256 for mapping addresses and their nonces.
   * const addressPadded = ethers.zeroPadValue(address, 32);
   *
   * // Convert the slot number to a hex string and pad it to 32 bytes.
   * const slotPadded = ethers.zeroPadValue(ethers.toBeHex(0), 32);
   *
   * // Concatenate the padded address and slot number.
   * const concatenated = addressPadded + slotPadded.slice(2); // slice to remove '0x' from the slotPadded
   *
   * // Hash the concatenated string using Keccak-256.
   * const storageKey = ethers.keccak256(concatenated);
   *
   * const l1BatchNumber = await provider.getL1BatchNumber();
   * const storageProof = await provider.getProof(utils.NONCE_HOLDER_ADDRESS, [storageKey], l1BatchNumber);
   * console.log(`Storage proof: ${utils.toJSON(storageProof)}`);
   */
  override async getProof(
    address: Address,
    keys: string[],
    l1BatchNumber: number
  ): Promise<StorageProof> {
    return super.getProof(address, keys, l1BatchNumber);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { Provider, Wallet, types, utils } from 'via-ethers';
   * import { ethers } from 'ethers';
   *
   * const PRIVATE_KEY = '<PRIVATE_KEY>';
   * const provider = Provider.getDefaultProvider(types.Network.Localhost);
   * const wallet = new Wallet(PRIVATE_KEY, provider);
   *
   * const txWithOutputs = await provider.sendRawTransactionWithDetailedOutput(
   *  await wallet.signTransaction({
   *    to: Wallet.createRandom().address,
   *    value: ethers.parseEther('0.01'),
   *  })
   * );
   *
   * console.log(`Transaction with detailed output: ${utils.toJSON(txWithOutputs)}`);
   */
  override async sendRawTransactionWithDetailedOutput(
    signedTx: string
  ): Promise<TransactionWithDetailedOutput> {
    return super.sendRawTransactionWithDetailedOutput(signedTx);
  }

  /**
   * @inheritDoc
   *
   * @example Retrieve populated BTC withdrawal transactions.
   *
   * import { Provider, types, utils } from 'via-ethers';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Localhost);
   *
   * const tx = await provider.getWithdrawTx({
   *   amount: 7_000_000_000,
   *   to: '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049',
   *   from: '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049',
   * });
   * console.log(`Withdrawal tx: ${tx}`);
   *
   * @example Retrieve populated BTC withdrawal transaction using paymaster to facilitate fee payment with an ERC20 token.
   *
   * import { Provider, types, utils } from 'via-ethers';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Localhost);
   * const token = '0x927488F48ffbc32112F1fF721759649A89721F8F'; // Crown token which can be minted for free
   * const paymaster = '0x13D0D8550769f59aa241a41897D4859c87f7Dd46'; // Paymaster for Crown token
   *
   * const tx = await provider.getWithdrawTx({
   *   amount: 7_000_000_000,
   *   to: '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049',
   *   from: '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049',
   *   paymasterParams: utils.getPaymasterParams(paymaster, {
   *     type: 'ApprovalBased',
   *     token: token,
   *     minimalAllowance: 1,
   *     innerInput: new Uint8Array(),
   *   }),
   * });
   * console.log(`Withdrawal tx: ${tx}`);
   */
  override async getWithdrawTx(transaction: {
    amount: BigNumberish;
    from: Address;
    to: Address;
    paymasterParams?: PaymasterParams;
    overrides?: ethers.Overrides;
  }): Promise<TransactionRequest> {
    return super.getWithdrawTx(transaction);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { Provider, types, utils } from 'via-ethers';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Localhost);
   * const gasWithdraw = await provider.estimateGasWithdraw({
   *   amount: 7_000_000,
   *   to: '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049',
   *   from: '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049',
   * });
   * console.log(`Gas for withdrawal tx: ${gasWithdraw}`);
   */
  override async estimateGasWithdraw(transaction: {
    amount: BigNumberish;
    from: Address;
    to: Address;
    paymasterParams?: PaymasterParams;
    overrides?: ethers.Overrides;
  }): Promise<bigint> {
    return super.estimateGasWithdraw(transaction);
  }

  /**
   * @inheritDoc
   *
   * @example Retrieve populated BTC transfer transaction.
   *
   * import { Provider, types, utils } from 'via-ethers';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Localhost);
   *
   * const tx = await provider.getTransferTx({
   *   token: utils.L2_BASE_TOKEN_ADDRESS,
   *   amount: 7_000_000_000,
   *   to: '0xa61464658AfeAf65CccaaFD3a512b69A83B77618',
   *   from: '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049',
   * });
   * console.log(`Transfer tx: ${tx}`);
   *
   * @example Retrieve populated BTC transfer transaction using paymaster to facilitate fee payment with an ERC20 token.
   *
   * import { Provider, types, utils } from 'via-ethers';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Localhost);
   * const token = '0x927488F48ffbc32112F1fF721759649A89721F8F'; // Crown token which can be minted for free
   * const paymaster = '0x13D0D8550769f59aa241a41897D4859c87f7Dd46'; // Paymaster for Crown token
   *
   * const tx = await provider.getTransferTx({
   *   token: utils.L2_BASE_TOKEN_ADDRESS,
   *   amount: 7_000_000_000,
   *   to: '0xa61464658AfeAf65CccaaFD3a512b69A83B77618',
   *   from: '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049',
   *   paymasterParams: utils.getPaymasterParams(paymaster, {
   *     type: 'ApprovalBased',
   *     token: token,
   *     minimalAllowance: 1,
   *     innerInput: new Uint8Array(),
   *   }),
   * });
   * console.log(`Transfer tx: ${tx}`);
   */
  override async getTransferTx(transaction: {
    to: Address;
    amount: BigNumberish;
    from?: Address;
    token?: Address;
    paymasterParams?: PaymasterParams;
    overrides?: ethers.Overrides;
  }): Promise<TransactionRequest> {
    return super.getTransferTx(transaction);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { Provider, types, utils } from 'via-ethers';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Localhost);
   * const gasTransfer = await provider.estimateGasTransfer({
   *   token: utils.L2_BASE_TOKEN_ADDRESS,
   *   amount: 7_000_000_000,
   *   to: '0xa61464658AfeAf65CccaaFD3a512b69A83B77618',
   *   from: '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049',
   * });
   * console.log(`Gas for transfer tx: ${gasTransfer}`);
   */
  override async estimateGasTransfer(transaction: {
    to: Address;
    amount: BigNumberish;
    from?: Address;
    token?: Address;
    paymasterParams?: PaymasterParams;
    overrides?: ethers.Overrides;
  }): Promise<bigint> {
    return super.estimateGasTransfer(transaction);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { Provider, types, utils } from 'via-ethers';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Localhost);
   * console.log(
   *   `New filter: ${await provider.newFilter({
   *     fromBlock: 0,
   *     toBlock: 5,
   *     address: utils.L2_BASE_TOKEN_ADDRESS,
   *   })}`
   * );
   */
  override async newFilter(
    filter: FilterByBlockHash | Filter
  ): Promise<bigint> {
    return super.newFilter(filter);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { Provider, types } from 'via-ethers';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Localhost);
   * console.log(`New block filter: ${await provider.newBlockFilter()}`);
   */
  override async newBlockFilter(): Promise<bigint> {
    return super.newBlockFilter();
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { Provider, types } from 'via-ethers';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Localhost);
   * console.log(`New pending transaction filter: ${await provider.newPendingTransactionsFilter()}`);
   */
  override async newPendingTransactionsFilter(): Promise<bigint> {
    return super.newPendingTransactionsFilter();
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { Provider, types, utils } from 'via-ethers';
   * import { ethers } from 'ethers';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Localhost);
   * const filter = await provider.newFilter({
   *   address: utils.L2_BASE_TOKEN_ADDRESS,
   *   topics: [ethers.id('Transfer(address,address,uint256)')],
   * });
   * const result = await provider.getFilterChanges(filter);
   */
  override async getFilterChanges(idx: bigint): Promise<Array<Log | string>> {
    return super.getFilterChanges(idx);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { Provider, types, utils } from 'via-ethers';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Localhost);
   *
   * const TX_HASH = '<YOUR_TX_HASH_ADDRESS>';
   * console.log(`Transaction status: ${utils.toJSON(await provider.getTransactionStatus(TX_HASH))}`);
   */
  override async getTransactionStatus(
    txHash: string
  ): Promise<TransactionStatus> {
    return super.getTransactionStatus(txHash);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { Provider, types, utils } from 'via-ethers';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Localhost);
   * const tokenAddress = '0x927488F48ffbc32112F1fF721759649A89721F8F'; // Crown token which can be minted for free
   * console.log(`Contract account info: ${utils.toJSON(await provider.getContractAccountInfo(tokenAddress))}`);
   */
  override async getContractAccountInfo(
    address: Address
  ): Promise<ContractAccountInfo> {
    return super.getContractAccountInfo(address);
  }

  override getRpcError(payload: JsonRpcPayload, _error: JsonRpcError): Error {
    const {error} = _error;
    const message = _error.error.message ?? 'Execution reverted';
    const code = _error.error.code ?? 0;
    // @ts-ignore
    return makeError(message, code, {payload, error});
  }

  override async _send(
    payload: JsonRpcPayload | Array<JsonRpcPayload>
  ): Promise<Array<JsonRpcResult>> {
    const request = this._getConnection();
    request.body = JSON.stringify(payload);
    request.setHeader('content-type', 'application/json');

    const response = await request.send();
    response.assertOk();

    let resp = response.bodyJson;
    if (!Array.isArray(resp)) {
      resp = [resp];
    }

    return resp;
  }

  /**
   * Creates a new `Provider` from provided URL or network name.
   *
   * @param zksyncNetwork The type of ZKsync network.
   *
   * @example
   *
   * import { Provider, types } from 'via-ethers';
   *
   * const provider = Provider.getDefaultProvider(types.Network.Localhost);
   */
  static getDefaultProvider(
    zksyncNetwork: ZkSyncNetwork = ZkSyncNetwork.Localhost
  ): Provider {
    switch (zksyncNetwork) {
      case ZkSyncNetwork.Localhost:
        return new Provider('http://127.0.0.1:3050');
      case ZkSyncNetwork.Testnet:
        return new Provider('https://via.testnet.viablockchain.dev');
      default:
        return new Provider('http://127.0.0.1:3050');
    }
  }
}

/* c8 ignore start */
/**
 * A `BrowserProvider` extends {@link ethers.BrowserProvider} and includes additional features for interacting with ZKsync Era.
 * It supports RPC endpoints within the `zks` namespace.
 * This provider is designed for frontend use in a browser environment and integration for browser wallets
 * (e.g., MetaMask, WalletConnect).
 */
export class BrowserProvider extends JsonRpcApiProvider(
  ethers.BrowserProvider
) {
  #request: (
    method: string,
    params: Array<any> | Record<string, any>
  ) => Promise<any>;

  protected _contractAddresses: {
    bridge?: Address;
  };

  override contractAddresses(): {
    bridge?: Address;
  } {
    return this._contractAddresses;
  }

  /**
   * Connects to the `ethereum` provider, optionally forcing the `network`.
   *
   * @param ethereum The provider injected from the browser. For instance, Metamask is `window.ethereum`.
   * @param [network] The network name, chain ID, or object with network details.
   *
   * @example
   *
   * import { BrowserProvider } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   */
  constructor(ethereum: Eip1193Provider, network?: Networkish) {
    super(ethereum, network);
    this._contractAddresses = {};

    this.#request = async (
      method: string,
      params: Array<any> | Record<string, any>
    ) => {
      const payload = {method, params};
      this.emit('debug', {action: 'sendEip1193Request', payload});
      try {
        const result = await ethereum.request(payload);
        this.emit('debug', {action: 'receiveEip1193Result', result});
        return result;
      } catch (e: any) {
        const error = new Error(e.message);
        (<any>error).code = e.code;
        (<any>error).data = e.data;
        (<any>error).payload = payload;
        this.emit('debug', {action: 'receiveEip1193Error', error});
        throw error;
      }
    };
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { BrowserProvider, utils } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   * const TX_HASH = '<YOUR_TX_HASH_ADDRESS>';
   * console.log(`Transaction receipt: ${utils.toJSON(await provider.getTransactionReceipt(TX_HASH))}`);
   */
  override async getTransactionReceipt(
    txHash: string
  ): Promise<TransactionReceipt | null> {
    return super.getTransactionReceipt(txHash);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { BrowserProvider } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   *
   * const TX_HASH = '<YOUR_TX_HASH_ADDRESS>';
   * const tx = await provider.getTransaction(TX_HASH);
   *
   * // Wait until the transaction is processed by the server.
   * await tx.wait();
   * // Wait until the transaction is finalized.
   * await tx.waitFinalize();
   */
  override async getTransaction(txHash: string): Promise<TransactionResponse> {
    return super.getTransaction(txHash);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { BrowserProvider, utils } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   * console.log(`Block: ${utils.toJSON(await provider.getBlock('latest', true))}`);
   */
  override async getBlock(
    blockHashOrBlockTag: BlockTag,
    includeTxs?: boolean
  ): Promise<Block> {
    return super.getBlock(blockHashOrBlockTag, includeTxs);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { BrowserProvider, utils } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   * console.log(`Logs: ${utils.toJSON(await provider.getLogs({ fromBlock: 0, toBlock: 5, address: utils.L2_BASE_TOKEN_ADDRESS }))}`);
   */
  override async getLogs(filter: Filter | FilterByBlockHash): Promise<Log[]> {
    return super.getLogs(filter);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { BrowserProvider } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   * const account = '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049';
   * const tokenAddress = '0x927488F48ffbc32112F1fF721759649A89721F8F'; // Crown token which can be minted for free
   * console.log(`BTC balance: ${await provider.getBalance(account)}`);
   * console.log(`Token balance: ${await provider.getBalance(account, 'latest', tokenAddress)}`);
   */
  override async getBalance(
    address: Address,
    blockTag?: BlockTag,
    tokenAddress?: Address
  ): Promise<bigint> {
    return super.getBalance(address, blockTag, tokenAddress);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { BrowserProvider } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   * console.log(`Protocol version: ${await provider.getProtocolVersion()}`);
   */
  override async getProtocolVersion(id?: number): Promise<ProtocolVersion> {
    return super.getProtocolVersion(id);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { BrowserProvider, utils } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   * const fee = await provider.estimateFee({
   *   from: '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049',
   *   to: '0xa61464658AfeAf65CccaaFD3a512b69A83B77618',
   *   value: `0x${BigInt(7_000_000_000).toString(16)}`,
   * });
   * console.log(`Fee: ${utils.toJSON(fee)}`);
   */
  override async estimateFee(transaction: TransactionRequest): Promise<Fee> {
    return super.estimateFee(transaction);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { BrowserProvider, utils } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   * const feeParams = await provider.getFeeParams();
   * console.log(`Fee: ${utils.toJSON(feeParams)}`);
   */
  override async getFeeParams(): Promise<FeeParams> {
    return super.getFeeParams();
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { BrowserProvider } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   * console.log(`Gas price: ${await provider.getGasPrice()}`);
   */
  override async getGasPrice(): Promise<bigint> {
    return super.getGasPrice();
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { BrowserProvider } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   * console.log(`L1 fee per byte: ${await provider.getL1GasPrice()}`);
   */
  override async getL1GasPrice(): Promise<bigint> {
    return super.getL1GasPrice();
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { BrowserProvider, utils } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   * // Any L2 -> L1 transaction can be used.
   * // In this case, withdrawal transaction is used.
   * const tx = '0x2a1c6c74b184965c0cb015aae9ea134fd96215d2e4f4979cfec12563295f610e';
   * console.log(`Log ${utils.toJSON(await provider.getLogProof(tx, 0))}`);
   */
  override async getLogProof(
    txHash: BytesLike,
    index?: number
  ): Promise<LogProof | null> {
    return super.getLogProof(txHash, index);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { BrowserProvider, utils } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   * const l1BatchNumber = await provider.getL1BatchNumber();
   * console.log(`L1 batch block range: ${utils.toJSON(await provider.getL1BatchBlockRange(l1BatchNumber))}`);
   */
  override async getL1BatchBlockRange(
    l1BatchNumber: number
  ): Promise<[number, number] | null> {
    return super.getL1BatchBlockRange(l1BatchNumber);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { BrowserProvider } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   * console.log(`Bridge address: ${await provider.getBridgeAddress()}`);
   */
  override async getBridgeAddress(): Promise<Address> {
    return super.getBridgeAddress();
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { BrowserProvider } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   * console.log(`Testnet paymaster: ${await provider.getTestnetPaymasterAddress()}`);
   */
  override async getTestnetPaymasterAddress(): Promise<Address | null> {
    return super.getTestnetPaymasterAddress();
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { BrowserProvider } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   * console.log(`L1 batch number: ${await provider.getL1BatchNumber()}`);
   */
  override async getL1BatchNumber(): Promise<number> {
    return super.getL1BatchNumber();
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { BrowserProvider, utils } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   * const l1BatchNumber = await provider.getL1BatchNumber();
   * console.log(`L1 batch details: ${utils.toJSON(await provider.getL1BatchDetails(l1BatchNumber))}`);
   */
  override async getL1BatchDetails(number: number): Promise<BatchDetails> {
    return super.getL1BatchDetails(number);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { BrowserProvider, utils } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   * console.log(`Block details: ${utils.toJSON(await provider.getBlockDetails(90_000))}`);
   */
  override async getBlockDetails(number: number): Promise<BlockDetails> {
    return super.getBlockDetails(number);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { BrowserProvider, utils } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   *
   * const TX_HASH = '<YOUR_TX_HASH_ADDRESS>';
   * console.log(`Transaction details: ${utils.toJSON(await provider.getTransactionDetails(TX_HASH))}`);
   */
  override async getTransactionDetails(
    txHash: BytesLike
  ): Promise<TransactionDetails> {
    return super.getTransactionDetails(txHash);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { BrowserProvider, utils } from 'via-ethers';
   *
   * // Bytecode hash can be computed by following these steps:
   * // const testnetPaymasterBytecode = await provider.getCode(await provider.getTestnetPaymasterAddress());
   * // const testnetPaymasterBytecodeHash = ethers.hexlify(utils.hashBytecode(testnetPaymasterBytecode));
   *
   * const testnetPaymasterBytecodeHash = '0x010000f16d2b10ddeb1c32f2c9d222eb1aea0f638ec94a81d4e916c627720e30';
   *
   * const provider = new BrowserProvider(window.ethereum);
   * console.log(`Bytecode: ${await provider.getBytecodeByHash(testnetPaymasterBytecodeHash)}`);
   */
  override async getBytecodeByHash(
    bytecodeHash: BytesLike
  ): Promise<Uint8Array> {
    return super.getBytecodeByHash(bytecodeHash);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { BrowserProvider, utils } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   * console.log(`Raw block transactions: ${utils.toJSON(await provider.getRawBlockTransactions(90_000))}`);
   */
  override async getRawBlockTransactions(
    number: number
  ): Promise<RawBlockTransaction[]> {
    return super.getRawBlockTransactions(number);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { BrowserProvider, utils } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   * const address = '0x082b1BB53fE43810f646dDd71AA2AB201b4C6b04';
   *
   * // Fetching the storage proof for rawNonces storage slot in NonceHolder system contract.
   * // mapping(uint256 => uint256) internal rawNonces;
   *
   * // Ensure the address is a 256-bit number by padding it
   * // because rawNonces slot uses uint256 for mapping addresses and their nonces.
   * const addressPadded = ethers.zeroPadValue(address, 32);
   *
   * // Convert the slot number to a hex string and pad it to 32 bytes.
   * const slotPadded = ethers.zeroPadValue(ethers.toBeHex(0), 32);
   *
   * // Concatenate the padded address and slot number.
   * const concatenated = addressPadded + slotPadded.slice(2); // slice to remove '0x' from the slotPadded
   *
   * // Hash the concatenated string using Keccak-256.
   * const storageKey = ethers.keccak256(concatenated);
   *
   * const l1BatchNumber = await provider.getL1BatchNumber();
   * const storageProof = await provider.getProof(utils.NONCE_HOLDER_ADDRESS, [storageKey], l1BatchNumber);
   * console.log(`Storage proof: ${utils.toJSON(storageProof)}`);
   */
  override async getProof(
    address: Address,
    keys: string[],
    l1BatchNumber: number
  ): Promise<StorageProof> {
    return super.getProof(address, keys, l1BatchNumber);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { BrowserProvider, Wallet, Provider, utils, types } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   * const signer = Signer.from(
   *     await provider.getSigner(),
   *     Number((await provider.getNetwork()).chainId),
   *     Provider.getDefaultProvider(types.Network.Localhost)
   * );
   *
   * const txWithOutputs = await provider.sendRawTransactionWithDetailedOutput(
   *   await signer.signTransaction({
   *     Wallet.createRandom().address,
   *     amount: ethers.parseEther('0.01'),
   *   })
   * );
   * console.log(`Transaction with detailed output: ${utils.toJSON(txWithOutputs)}`);
   */
  override async sendRawTransactionWithDetailedOutput(
    signedTx: string
  ): Promise<TransactionWithDetailedOutput> {
    return super.sendRawTransactionWithDetailedOutput(signedTx);
  }

  /**
   * @inheritDoc
   *
   * @example Retrieve populated BTC withdrawal transactions.
   *
   * import { BrowserProvider, utils } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   *
   * const tx = await provider.getWithdrawTx({
   *   amount: 7_000_000_000,
   *   to: '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049',
   *   from: '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049',
   * });
   * console.log(`Withdrawal tx: ${tx}`);
   *
   * @example Retrieve populated BTC withdrawal transaction using paymaster to facilitate fee payment with an ERC20 token.
   *
   * import { BrowserProvider, utils } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   * const token = '0x927488F48ffbc32112F1fF721759649A89721F8F'; // Crown token which can be minted for free
   * const paymaster = '0x13D0D8550769f59aa241a41897D4859c87f7Dd46'; // Paymaster for Crown token
   *
   * const tx = await provider.getWithdrawTx({
   *   amount: 7_000_000_000,
   *   to: '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049',
   *   from: '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049',
   *   paymasterParams: utils.getPaymasterParams(paymaster, {
   *     type: 'ApprovalBased',
   *     token: token,
   *     minimalAllowance: 1,
   *     innerInput: new Uint8Array(),
   *   }),
   * });
   * console.log(`Withdrawal tx: ${tx}`);
   */
  override async getWithdrawTx(transaction: {
    amount: BigNumberish;
    from: Address;
    to: Address;
    paymasterParams?: PaymasterParams;
    overrides?: ethers.Overrides;
  }): Promise<TransactionRequest> {
    return super.getWithdrawTx(transaction);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { BrowserProvider, utils } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   * const gasWithdraw = await provider.estimateGasWithdraw({
   *   amount: 7_000_000,
   *   to: '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049',
   *   from: '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049',
   * });
   * console.log(`Gas for withdrawal tx: ${gasWithdraw}`);
   */
  override async estimateGasWithdraw(transaction: {
    amount: BigNumberish;
    from: Address;
    to: Address;
    paymasterParams?: PaymasterParams;
    overrides?: ethers.Overrides;
  }): Promise<bigint> {
    return super.estimateGasWithdraw(transaction);
  }

  /**
   * @inheritDoc
   *
   * @example Retrieve populated BTC transfer transaction.
   *
   * import { BrowserProvider, utils } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   *
   * const tx = await provider.getTransferTx({
   *   token: utils.L2_BASE_TOKEN_ADDRESS,
   *   amount: 7_000_000_000,
   *   to: '0xa61464658AfeAf65CccaaFD3a512b69A83B77618',
   *   from: '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049',
   * });
   * console.log(`Transfer tx: ${tx}`);
   *
   * @example Retrieve populated BTC transfer transaction using paymaster to facilitate fee payment with an ERC20 token.
   *
   * import { BrowserProvider, utils } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   * const token = '0x927488F48ffbc32112F1fF721759649A89721F8F'; // Crown token which can be minted for free
   * const paymaster = '0x13D0D8550769f59aa241a41897D4859c87f7Dd46'; // Paymaster for Crown token
   *
   * const tx = await provider.getTransferTx({
   *   token: utils.L2_BASE_TOKEN_ADDRESS,
   *   amount: 7_000_000_000,
   *   to: '0xa61464658AfeAf65CccaaFD3a512b69A83B77618',
   *   from: '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049',
   *   paymasterParams: utils.getPaymasterParams(paymaster, {
   *     type: 'ApprovalBased',
   *     token: token,
   *     minimalAllowance: 1,
   *     innerInput: new Uint8Array(),
   *   }),
   * });
   * console.log(`Transfer tx: ${tx}`);
   */
  override async getTransferTx(transaction: {
    to: Address;
    amount: BigNumberish;
    from?: Address;
    token?: Address;
    paymasterParams?: PaymasterParams;
    overrides?: ethers.Overrides;
  }): Promise<TransactionRequest> {
    return super.getTransferTx(transaction);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { BrowserProvider, utils } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   * const gasTransfer = await provider.estimateGasTransfer({
   *   token: utils.L2_BASE_TOKEN_ADDRESS,
   *   amount: 7_000_000_000,
   *   to: '0xa61464658AfeAf65CccaaFD3a512b69A83B77618',
   *   from: '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049',
   * });
   * console.log(`Gas for transfer tx: ${gasTransfer}`);
   */
  override async estimateGasTransfer(transaction: {
    to: Address;
    amount: BigNumberish;
    from?: Address;
    token?: Address;
    paymasterParams?: PaymasterParams;
    overrides?: ethers.Overrides;
  }): Promise<bigint> {
    return super.estimateGasTransfer(transaction);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { BrowserProvider, utils } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   * console.log(
   *   `New filter: ${await provider.newFilter({
   *     fromBlock: 0,
   *     toBlock: 5,
   *     address: utils.L2_BASE_TOKEN_ADDRESS,
   *   })}`
   * );
   */
  override async newFilter(
    filter: FilterByBlockHash | Filter
  ): Promise<bigint> {
    return super.newFilter(filter);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { BrowserProvider } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   * console.log(`New block filter: ${await provider.newBlockFilter()}`);
   */
  override async newBlockFilter(): Promise<bigint> {
    return super.newBlockFilter();
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { BrowserProvider } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   * console.log(`New pending transaction filter: ${await provider.newPendingTransactionsFilter()}`);
   */
  override async newPendingTransactionsFilter(): Promise<bigint> {
    return super.newPendingTransactionsFilter();
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { BrowserProvider, utils } from 'via-ethers';
   * import { ethers } from 'ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   * const filter = await provider.newFilter({
   *   address: utils.L2_BASE_TOKEN_ADDRESS,
   *   topics: [ethers.id('Transfer(address,address,uint256)')],
   * });
   * const result = await provider.getFilterChanges(filter);
   */
  override async getFilterChanges(idx: bigint): Promise<Array<Log | string>> {
    return super.getFilterChanges(idx);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { BrowserProvider, utils } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   *
   * const TX_HASH = '<YOUR_TX_HASH_ADDRESS>';
   * console.log(`Transaction status: ${utils.toJSON(await provider.getTransactionStatus(TX_HASH))}`);
   */
  override async getTransactionStatus(
    txHash: string
  ): Promise<TransactionStatus> {
    return super.getTransactionStatus(txHash);
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { BrowserProvider, utils } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   * const tokenAddress = '0x927488F48ffbc32112F1fF721759649A89721F8F'; // Crown token which can be minted for free
   * console.log(`Contract account info: ${utils.toJSON(await provider.getContractAccountInfo(tokenAddress))}`);
   */
  override async getContractAccountInfo(
    address: Address
  ): Promise<ContractAccountInfo> {
    return super.getContractAccountInfo(address);
  }

  override async _send(
    payload: JsonRpcPayload | Array<JsonRpcPayload>
  ): Promise<Array<JsonRpcResult | JsonRpcError>> {
    ethers.assertArgument(
      !Array.isArray(payload),
      'EIP-1193 does not support batch request',
      'payload',
      payload
    );

    try {
      const result = await this.#request(payload.method, payload.params || []);
      return [{id: payload.id, result}];
    } catch (e: any) {
      return [
        {
          id: payload.id,
          error: {code: e.code, data: e.data, message: e.message},
        },
      ];
    }
  }

  /**
   * Returns an ethers-style `Error` for the given JSON-RPC error `payload`, coalescing the various strings and error
   * shapes that different nodes return, coercing them into a machine-readable standardized error.
   *
   * @param payload The JSON-RPC payload.
   * @param error The JSON-RPC error.
   */
  override getRpcError(payload: JsonRpcPayload, error: JsonRpcError): Error {
    error = JSON.parse(JSON.stringify(error));

    // EIP-1193 gives us some machine-readable error codes, so rewrite them
    switch (error.error.code || -1) {
      case 4001:
        error.error.message = `ethers-user-denied: ${error.error.message}`;
        break;
      case 4200:
        error.error.message = `ethers-unsupported: ${error.error.message}`;
        break;
    }

    return super.getRpcError(payload, error);
  }

  /**
   * Resolves whether the provider manages the `address`.
   *
   * @param address The address to check.
   *
   * @example
   *
   * import { BrowserProvider, utils } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   * const hasSigner = await provider.hasSigner(0);
   */
  override async hasSigner(address: number | string): Promise<boolean> {
    if (!address) address = 0;

    const accounts = await this.send('eth_accounts', []);
    if (typeof address === 'number') return accounts.length > address;

    return (
      accounts.filter((a: string) => isAddressEq(a, address as string))
        .length !== 0
    );
  }

  /**
   * Resolves to the `Signer` account for `address` managed by the client.
   * If the `address` is a number, it is used as an index in the accounts from `listAccounts`.
   * This can only be used on clients which manage accounts (e.g. MetaMask).
   *
   * @param address The address or index of the account to retrieve the signer for.
   *
   * @throws {Error} If the account doesn't exist.
   *
   * @example
   *
   * import { BrowserProvider, utils } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   * const signer = await provider.getSigner();
   */
  override async getSigner(address?: number | string): Promise<Signer> {
    if (!address) address = 0;

    if (!(await this.hasSigner(address))) {
      try {
        await this.#request('eth_requestAccounts', []);
      } catch (error: any) {
        const payload = error.payload;
        throw this.getRpcError(payload, {id: payload.id, error});
      }
    }

    return Signer.from(
      (await super.getSigner(address)) as any,
      Number((await this.getNetwork()).chainId)
    );
  }

  /**
   * @inheritDoc
   *
   * @example
   *
   * import { BrowserProvider, utils } from 'via-ethers';
   *
   * const provider = new BrowserProvider(window.ethereum);
   * const gas = await provider.estimate({
   *   value: 7_000_000_000,
   *   to: '0xa61464658AfeAf65CccaaFD3a512b69A83B77618',
   *   from: '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049',
   * });
   * console.log(`Gas: ${gas}`);
   */
  override async estimateGas(transaction: TransactionRequest): Promise<bigint> {
    const gas = await super.estimateGas(transaction);
    const metamaskMinimum = 21_000n;
    const isEIP712 =
      transaction.customData || transaction.type === EIP712_TX_TYPE;
    return gas > metamaskMinimum || isEIP712 ? gas : metamaskMinimum;
  }
}

/* c8 ignore stop */
