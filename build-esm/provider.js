var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Provider_connect, _BrowserProvider_request;
import { ethers, Contract, resolveProperties, FetchRequest, toUtf8Bytes, } from 'ethers';
import { IBaseToken__factory, IERC20__factory } from './typechain';
import { TransactionResponse, TransactionStatus, TransactionReceipt, Block, Log, Network as ZkSyncNetwork, Transaction, } from './types';
import { getL2HashFromPriorityOp, CONTRACT_DEPLOYER_ADDRESS, CONTRACT_DEPLOYER, sleep, EIP712_TX_TYPE, BOOTLOADER_FORMAL_ADDRESS, L2_BASE_TOKEN_ADDRESS, isAddressEq, } from './utils';
import { Signer } from './signer';
import { formatLog, formatBlock, formatTransactionResponse, formatTransactionReceipt, formatFee, } from './format';
import { makeError } from 'ethers';
export function JsonRpcApiProvider(ProviderType) {
    return class Provider extends ProviderType {
        /**
         * Sends a JSON-RPC `_payload` (or a batch) to the underlying channel.
         *
         * @param _payload The JSON-RPC payload or batch of payloads to send.
         * @returns A promise that resolves to the result of the JSON-RPC request(s).
         */
        _send(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _payload) {
            throw new Error('Must be implemented by the derived class!');
        }
        /**
         * Returns the addresses of the main contract and default ZKsync Era bridge contracts on both L1 and L2.
         */
        contractAddresses() {
            throw new Error('Must be implemented by the derived class!');
        }
        _getBlockTag(blockTag) {
            if (blockTag === 'committed') {
                return 'committed';
            }
            else if (blockTag === 'l1_committed') {
                return 'l1_committed';
            }
            return super._getBlockTag(blockTag);
        }
        _wrapLog(value) {
            return new Log(formatLog(value), this);
        }
        _wrapBlock(value) {
            return new Block(formatBlock(value), this);
        }
        _wrapTransactionResponse(value) {
            const tx = formatTransactionResponse(value);
            return new TransactionResponse(tx, this);
        }
        _wrapTransactionReceipt(value) {
            const receipt = formatTransactionReceipt(value);
            return new TransactionReceipt(receipt, this);
        }
        /**
         * Resolves to the transaction receipt for `txHash`, if mined.
         * If the transaction has not been mined, is unknown or on pruning nodes which discard old transactions
         * this resolves to `null`.
         *
         * @param txHash The hash of the transaction.
         */
        async getTransactionReceipt(txHash) {
            return (await super.getTransactionReceipt(txHash));
        }
        /**
         * Resolves to the transaction for `txHash`.
         * If the transaction is unknown or on pruning nodes which discard old transactions this resolves to `null`.
         *
         * @param txHash The hash of the transaction.
         */
        async getTransaction(txHash) {
            return (await super.getTransaction(txHash));
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
        async getBlock(blockHashOrBlockTag, includeTxs) {
            return (await super.getBlock(blockHashOrBlockTag, includeTxs));
        }
        /**
         * Resolves to the list of Logs that match `filter`.
         *
         * @param filter The filter criteria to apply.
         */
        async getLogs(filter) {
            return (await super.getLogs(filter));
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
        async getBalance(address, blockTag, token) {
            if (!token || isAddressEq(token, L2_BASE_TOKEN_ADDRESS))
                return await super.getBalance(address, blockTag);
            try {
                return await IERC20__factory.connect(token, this).balanceOf(address, {
                    blockTag,
                });
            }
            catch {
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
        async getProtocolVersion(id) {
            return await this.send('zks_getProtocolVersion', [id]);
        }
        /**
         * Returns an estimate of the amount of gas required to submit a transaction from L1 to L2 as a bigint object.
         *
         * Calls the {@link https://docs.zksync.io/build/api.html#zks-estimategasl1tol2 zks_estimateL1ToL2} JSON-RPC method.
         *
         * @param transaction The transaction request.
         */
        async estimateGasL1(transaction) {
            return await this.send('zks_estimateGasL1ToL2', [
                this.getRpcTransaction(transaction),
            ]);
        }
        /**
         * Returns an estimated {@link Fee} for requested transaction.
         *
         * @param transaction The transaction request.
         */
        async estimateFee(transaction) {
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
        async getFeeParams() {
            return await this.send('zks_getFeeParams', []);
        }
        /**
         * Returns an estimate (best guess) of the gas price to use in a transaction.
         */
        async getGasPrice() {
            const feeData = await this.getFeeData();
            return feeData.gasPrice;
        }
        /**
         * Returns the proof for a transaction's L2 to L1 log sent via the `L1Messenger` system contract.
         *
         * Calls the {@link https://docs.zksync.io/build/api.html#zks-getl2tol1logproof zks_getL2ToL1LogProof} JSON-RPC method.
         *
         * @param txHash The hash of the L2 transaction the L2 to L1 log was produced within.
         * @param [index] The index of the L2 to L1 log in the transaction.
         */
        async getLogProof(txHash, index) {
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
        async getL1BatchBlockRange(l1BatchNumber) {
            const range = await this.send('zks_getL1BatchBlockRange', [
                l1BatchNumber,
            ]);
            if (!range) {
                return null;
            }
            return [parseInt(range[0], 16), parseInt(range[1], 16)];
        }
        /**
         * Returns the Bridgehub smart contract address.
         *
         * Calls the {@link https://docs.zksync.io/build/api.html#zks-getbridgehubcontract zks_getBridgehubContract} JSON-RPC method.
         */
        async getBridgehubContractAddress() {
            if (!this.contractAddresses().bridgehubContract) {
                this.contractAddresses().bridgehubContract = await this.send('zks_getBridgehubContract', []);
            }
            return this.contractAddresses().bridgehubContract;
        }
        /**
         * Returns the main ZKsync Era smart contract address.
         *
         * Calls the {@link https://docs.zksync.io/build/api.html#zks-getmaincontract zks_getMainContract} JSON-RPC method.
         */
        async getMainContractAddress() {
            if (!this.contractAddresses().mainContract) {
                this.contractAddresses().mainContract = await this.send('zks_getMainContract', []);
            }
            return this.contractAddresses().mainContract;
        }
        /**
         * Returns the L1 base token address.
         */
        async getBaseTokenContractAddress() {
            if (!this.contractAddresses().baseToken) {
                this.contractAddresses().baseToken = await this.send('zks_getBaseTokenL1Address', []);
            }
            return ethers.getAddress(this.contractAddresses().baseToken);
        }
        /**
         * Returns the testnet {@link https://docs.zksync.io/build/developer-reference/account-abstraction.html#paymasters paymaster address}
         * if available, or `null`.
         *
         * Calls the {@link https://docs.zksync.io/build/api.html#zks-gettestnetpaymaster zks_getTestnetPaymaster} JSON-RPC method.
         */
        async getTestnetPaymasterAddress() {
            // Unlike contract's addresses, the testnet paymaster is not cached, since it can be trivially changed
            // on the fly by the server and should not be relied on to be constant
            return await this.send('zks_getTestnetPaymaster', []);
        }
        /**
         * Returns the addresses of the default ZKsync Era bridge contracts on both L1 and L2.
         *
         * Calls the {@link https://docs.zksync.io/build/api.html#zks-getbridgecontracts zks_getBridgeContracts} JSON-RPC method.
         */
        async getDefaultBridgeAddresses() {
            if (!this.contractAddresses().erc20BridgeL1) {
                const addresses = await this.send('zks_getBridgeContracts', []);
                this.contractAddresses().erc20BridgeL1 = addresses.l1Erc20DefaultBridge;
                this.contractAddresses().erc20BridgeL2 = addresses.l2Erc20DefaultBridge;
                this.contractAddresses().wethBridgeL1 = addresses.l1WethBridge;
                this.contractAddresses().wethBridgeL2 = addresses.l2WethBridge;
                this.contractAddresses().sharedBridgeL1 =
                    addresses.l1SharedDefaultBridge;
                this.contractAddresses().sharedBridgeL2 =
                    addresses.l2SharedDefaultBridge;
            }
            return {
                erc20L1: this.contractAddresses().erc20BridgeL1,
                erc20L2: this.contractAddresses().erc20BridgeL2,
                wethL1: this.contractAddresses().wethBridgeL1,
                wethL2: this.contractAddresses().wethBridgeL2,
                sharedL1: this.contractAddresses().sharedBridgeL1,
                sharedL2: this.contractAddresses().sharedBridgeL2,
            };
        }
        /**
         * Returns all balances for confirmed tokens given by an account address.
         *
         * Calls the {@link https://docs.zksync.io/build/api.html#zks-getallaccountbalances zks_getAllAccountBalances} JSON-RPC method.
         *
         * @param address The account address.
         */
        async getAllAccountBalances(address) {
            const balances = await this.send('zks_getAllAccountBalances', [address]);
            for (const token in balances) {
                balances[token] = BigInt(balances[token]);
            }
            return balances;
        }
        /**
         * Returns confirmed tokens. Confirmed token is any token bridged to ZKsync Era via the official bridge.
         *
         * Calls the {@link https://docs.zksync.io/build/api.html#zks_getconfirmedtokens zks_getConfirmedTokens} JSON-RPC method.
         *
         * @param start The token id from which to start.
         * @param limit The maximum number of tokens to list.
         */
        async getConfirmedTokens(start = 0, limit = 255) {
            const tokens = await this.send('zks_getConfirmedTokens', [
                start,
                limit,
            ]);
            return tokens.map(token => ({ address: token.l2Address, ...token }));
        }
        /**
         * @deprecated In favor of {@link getL1ChainId}
         *
         * Returns the L1 chain ID.
         *
         * Calls the {@link https://docs.zksync.io/build/api.html#zks-l1chainid zks_L1ChainId} JSON-RPC method.
         */
        async l1ChainId() {
            const res = await this.send('zks_L1ChainId', []);
            return Number(res);
        }
        /**
         * Returns the L1 chain ID.
         *
         * Calls the {@link https://docs.zksync.io/build/api.html#zks-l1chainid zks_L1ChainId} JSON-RPC method.
         */
        async getL1ChainId() {
            const res = await this.send('zks_L1ChainId', []);
            return Number(res);
        }
        /**
         * Returns the latest L1 batch number.
         *
         * Calls the {@link https://docs.zksync.io/build/api.html#zks-l1batchnumber zks_L1BatchNumber}  JSON-RPC method.
         */
        async getL1BatchNumber() {
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
        async getL1BatchDetails(number) {
            return await this.send('zks_getL1BatchDetails', [number]);
        }
        /**
         * Returns additional zkSync-specific information about the L2 block.
         *
         * Calls the {@link https://docs.zksync.io/build/api.html#zks-getblockdetails zks_getBlockDetails}  JSON-RPC method.
         *
         * @param number The block number.
         */
        async getBlockDetails(number) {
            return await this.send('zks_getBlockDetails', [number]);
        }
        /**
         * Returns data from a specific transaction given by the transaction hash.
         *
         * Calls the {@link https://docs.zksync.io/build/api.html#zks-gettransactiondetails zks_getTransactionDetails} JSON-RPC method.
         *
         * @param txHash The transaction hash.
         */
        async getTransactionDetails(txHash) {
            return await this.send('zks_getTransactionDetails', [txHash]);
        }
        /**
         * Returns bytecode of a contract given by its hash.
         *
         * Calls the {@link https://docs.zksync.io/build/api.html#zks-getbytecodebyhash zks_getBytecodeByHash} JSON-RPC method.
         *
         * @param bytecodeHash The bytecode hash.
         */
        async getBytecodeByHash(bytecodeHash) {
            return await this.send('zks_getBytecodeByHash', [bytecodeHash]);
        }
        /**
         * Returns data of transactions in a block.
         *
         * Calls the {@link https://docs.zksync.io/build/api.html#zks-getrawblocktransactions zks_getRawBlockTransactions}  JSON-RPC method.
         *
         * @param number The block number.
         */
        async getRawBlockTransactions(number) {
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
        async getProof(address, keys, l1BatchNumber) {
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
        async sendRawTransactionWithDetailedOutput(signedTx) {
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
        async getWithdrawTx(transaction) {
            var _a;
            const { ...tx } = transaction;
            tx.overrides ?? (tx.overrides = {});
            tx.overrides.from = tx.from;
            tx.overrides.value = tx.amount;
            (_a = tx.overrides).type ?? (_a.type = EIP712_TX_TYPE);
            const baseToken = IBaseToken__factory.connect(L2_BASE_TOKEN_ADDRESS, this);
            const populatedTx = await baseToken.withdraw.populateTransaction(toUtf8Bytes(tx.to), tx.overrides);
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
        async estimateGasWithdraw(transaction) {
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
        async getTransferTx(transaction) {
            var _a, _b;
            const { ...tx } = transaction;
            if (!tx.token)
                tx.token = L2_BASE_TOKEN_ADDRESS;
            tx.overrides ?? (tx.overrides = {});
            (_a = tx.overrides).from ?? (_a.from = tx.from);
            (_b = tx.overrides).type ?? (_b.type = EIP712_TX_TYPE);
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
            }
            else {
                const token = IERC20__factory.connect(tx.token, this);
                const populatedTx = await token.transfer.populateTransaction(tx.to, tx.amount, tx.overrides);
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
        async estimateGasTransfer(transaction) {
            const transferTx = await this.getTransferTx(transaction);
            return await this.estimateGas(transferTx);
        }
        /**
         * Returns a new filter by calling {@link https://ethereum.github.io/execution-apis/api-documentation/ eth_newFilter}
         * and passing a filter object.
         *
         * @param filter The filter query to apply.
         */
        async newFilter(filter) {
            const id = await this.send('eth_newFilter', [
                await this._getFilter(filter),
            ]);
            return BigInt(id);
        }
        /**
         * Returns a new block filter by calling {@link https://ethereum.github.io/execution-apis/api-documentation/ eth_newBlockFilter}.
         */
        async newBlockFilter() {
            const id = await this.send('eth_newBlockFilter', []);
            return BigInt(id);
        }
        /**
         * Returns a new pending transaction filter by calling {@link https://ethereum.github.io/execution-apis/api-documentation/ eth_newPendingTransactionFilter}.
         */
        async newPendingTransactionsFilter() {
            const id = await this.send('eth_newPendingTransactionFilter', []);
            return BigInt(id);
        }
        /**
         * Returns an array of logs by calling {@link https://ethereum.github.io/execution-apis/api-documentation/ eth_getFilterChanges}.
         *
         * @param idx The filter index.
         */
        async getFilterChanges(idx) {
            const logs = await this.send('eth_getFilterChanges', [
                ethers.toBeHex(idx),
            ]);
            return typeof logs[0] === 'string'
                ? logs
                : logs.map((log) => this._wrapLog(log));
        }
        /**
         * Returns the status of a specified transaction.
         *
         * @param txHash The hash of the transaction.
         */
        // This is inefficient. Status should probably be indicated in the transaction receipt.
        async getTransactionStatus(txHash) {
            const tx = await this.getTransaction(txHash);
            if (!tx) {
                return TransactionStatus.NotFound;
            }
            if (!tx.blockNumber) {
                return TransactionStatus.Processing;
            }
            const verifiedBlock = (await this.getBlock('finalized'));
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
        async broadcastTransaction(signedTx) {
            const { blockNumber, hash } = await resolveProperties({
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
            return this._wrapTransactionResponse(tx).replaceableTransaction(blockNumber);
        }
        /**
         * Returns a L2 transaction response from L1 transaction response.
         *
         * @param l1TxResponse The L1 transaction response.
         */
        async getL2TransactionFromPriorityOp(l1TxResponse) {
            const receipt = await l1TxResponse.wait();
            const l2Hash = getL2HashFromPriorityOp(receipt, await this.getMainContractAddress());
            let status = null;
            do {
                status = await this.getTransactionStatus(l2Hash);
                await sleep(this.pollingInterval);
            } while (status === TransactionStatus.NotFound);
            return await this.getTransaction(l2Hash);
        }
        /**
         * Returns a {@link PriorityOpResponse} from L1 transaction response.
         *
         * @param l1TxResponse The L1 transaction response.
         */
        async getPriorityOpResponse(l1TxResponse) {
            const l2Response = { ...l1TxResponse };
            l2Response.waitL1Commit = l1TxResponse.wait.bind(l1TxResponse);
            l2Response.wait = async () => {
                const l2Tx = await this.getL2TransactionFromPriorityOp(l1TxResponse);
                return await l2Tx.wait();
            };
            l2Response.waitFinalize = async () => {
                const l2Tx = await this.getL2TransactionFromPriorityOp(l1TxResponse);
                return await l2Tx.waitFinalize();
            };
            return l2Response;
        }
        async _getPriorityOpConfirmationL2ToL1Log(txHash, index = 0) {
            const hash = ethers.hexlify(txHash);
            const receipt = await this.getTransactionReceipt(hash);
            if (!receipt) {
                throw new Error('Transaction is not mined!');
            }
            const messages = Array.from(receipt.l2ToL1Logs.entries()).filter(([, log]) => isAddressEq(log.sender, BOOTLOADER_FORMAL_ADDRESS));
            const [l2ToL1LogIndex, l2ToL1Log] = messages[index];
            return {
                l2ToL1LogIndex,
                l2ToL1Log,
                l1BatchTxId: receipt.l1BatchTxIndex,
            };
        }
        /**
         * Returns the transaction confirmation data that is part of `L2->L1` message.
         *
         * @param txHash The hash of the L2 transaction where the message was initiated.
         * @param [index=0] In case there were multiple transactions in one message, you may pass an index of the
         * transaction which confirmation data should be fetched.
         * @throws {Error} If log proof can not be found.
         */
        async getPriorityOpConfirmation(txHash, index = 0) {
            const { l2ToL1LogIndex, l2ToL1Log, l1BatchTxId } = await this._getPriorityOpConfirmationL2ToL1Log(txHash, index);
            const proof = await this.getLogProof(txHash, l2ToL1LogIndex);
            return {
                l1BatchNumber: l2ToL1Log.l1BatchNumber,
                l2MessageIndex: proof.id,
                l2TxNumberInBlock: l1BatchTxId,
                proof: proof.proof,
            };
        }
        /**
         * Returns the version of the supported account abstraction and nonce ordering from a given contract address.
         *
         * @param address The contract address.
         */
        async getContractAccountInfo(address) {
            const deployerContract = new Contract(CONTRACT_DEPLOYER_ADDRESS, CONTRACT_DEPLOYER.fragments, this);
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
        getRpcTransaction(tx) {
            const result = super.getRpcTransaction(tx);
            if (!tx.customData) {
                return result;
            }
            result.type = ethers.toBeHex(EIP712_TX_TYPE);
            result.eip712Meta = {
                gasPerPubdata: ethers.toBeHex(tx.customData.gasPerPubdata ?? 0),
            };
            if (tx.customData.factoryDeps) {
                result.eip712Meta.factoryDeps = tx.customData.factoryDeps.map((dep) => Array.from(ethers.getBytes(dep)));
            }
            if (tx.customData.customSignature) {
                result.eip712Meta.customSignature = Array.from(ethers.getBytes(tx.customData.customSignature));
            }
            if (tx.customData.paymasterParams) {
                result.eip712Meta.paymasterParams = {
                    paymaster: ethers.hexlify(tx.customData.paymasterParams.paymaster),
                    paymasterInput: Array.from(ethers.getBytes(tx.customData.paymasterParams.paymasterInput)),
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
    contractAddresses() {
        return this._contractAddresses;
    }
    /**
     * Creates a new `Provider` instance for connecting to an L2 network.
     * Caching is disabled for local networks.
     * @param [url] The network RPC URL. Defaults to the local network.
     * @param [network] The network name, chain ID, or object with network details.
     * @param [options] Additional options for the provider.
     */
    constructor(url, network, options) {
        if (!url) {
            url = 'http://127.0.0.1:3050';
        }
        const isLocalNetwork = typeof url === 'string'
            ? url.includes('localhost') ||
                url.includes('127.0.0.1') ||
                url.includes('0.0.0.0')
            : url.url.includes('localhost') ||
                url.url.includes('127.0.0.1') ||
                url.url.includes('0.0.0.0');
        const optionsWithDisabledCache = isLocalNetwork
            ? { ...options, cacheTimeout: -1 }
            : options;
        super(url, network, optionsWithDisabledCache);
        _Provider_connect.set(this, void 0);
        typeof url === 'string'
            ? (__classPrivateFieldSet(this, _Provider_connect, new FetchRequest(url), "f"))
            : (__classPrivateFieldSet(this, _Provider_connect, url.clone(), "f"));
        this.pollingInterval = 500;
        this._contractAddresses = {};
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Provider, types, utils } from 'via-ethers';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const TX_HASH = '<YOUR_TX_HASH_ADDRESS>';
     * console.log(`Transaction receipt: ${utils.toJSON(await provider.getTransactionReceipt(TX_HASH))}`);
     */
    async getTransactionReceipt(txHash) {
        return super.getTransactionReceipt(txHash);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Provider, types } from 'via-ethers';
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
    async getTransaction(txHash) {
        return super.getTransaction(txHash);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Provider, types, utils } from 'via-ethers';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * console.log(`Block: ${utils.toJSON(await provider.getBlock('latest', true))}`);
     */
    async getBlock(blockHashOrBlockTag, includeTxs) {
        return super.getBlock(blockHashOrBlockTag, includeTxs);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Provider, types, utils } from 'via-ethers';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * console.log(`Logs: ${utils.toJSON(await provider.getLogs({ fromBlock: 0, toBlock: 5, address: utils.L2_BASE_TOKEN_ADDRESS }))}`);
     */
    async getLogs(filter) {
        return super.getLogs(filter);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Provider, types } from 'via-ethers';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const account = '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049';
     * const tokenAddress = '0x927488F48ffbc32112F1fF721759649A89721F8F'; // Crown token which can be minted for free
     * console.log(`BTC balance: ${await provider.getBalance(account)}`);
     * console.log(`Token balance: ${await provider.getBalance(account, 'latest', tokenAddress)}`);
     */
    async getBalance(address, blockTag, tokenAddress) {
        return super.getBalance(address, blockTag, tokenAddress);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Provider, types } from 'via-ethers';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * console.log(`Protocol version: ${await provider.getProtocolVersion()}`);
     */
    async getProtocolVersion(id) {
        return super.getProtocolVersion(id);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Provider, types } from 'via-ethers';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const gasL1 = await provider.estimateGasL1({
     *   from: '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049',
     *   to: await provider.getMainContractAddress(),
     *   value: 7_000_000_000,
     *   customData: {
     *     gasPerPubdata: 800,
     *   },
     * });
     * console.log(`L1 gas: ${BigInt(gasL1)}`);
     */
    async estimateGasL1(transaction) {
        return super.estimateGasL1(transaction);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Provider, types, utils } from 'via-ethers';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const fee = await provider.estimateFee({
     *   from: '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049',
     *   to: '0xa61464658AfeAf65CccaaFD3a512b69A83B77618',
     *   value: `0x${BigInt(7_000_000_000).toString(16)}`,
     * });
     * console.log(`Fee: ${utils.toJSON(fee)}`);
     */
    async estimateFee(transaction) {
        return super.estimateFee(transaction);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Provider, types, utils } from 'via-ethers';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const feeParams = await provider.getFeeParams();
     * console.log(`Fee: ${utils.toJSON(feeParams)}`);
     */
    async getFeeParams() {
        return super.getFeeParams();
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Provider, types } from 'via-ethers';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * console.log(`Gas price: ${await provider.getGasPrice()}`);
     */
    async getGasPrice() {
        return super.getGasPrice();
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
    async getLogProof(txHash, index) {
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
    async getL1BatchBlockRange(l1BatchNumber) {
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
     * console.log(`Main contract: ${await provider.getMainContractAddress()}`);
     */
    async getMainContractAddress() {
        return super.getMainContractAddress();
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Provider, types } from 'via-ethers';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * console.log(`Bridgehub: ${await provider.getBridgehubContractAddress()}`);
     */
    async getBridgehubContractAddress() {
        return super.getBridgehubContractAddress();
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Provider, types } from 'via-ethers';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * console.log(`Base token: ${await provider.getBaseTokenContractAddress()}`);
     */
    async getBaseTokenContractAddress() {
        return super.getBaseTokenContractAddress();
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
    async getTestnetPaymasterAddress() {
        return super.getTestnetPaymasterAddress();
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Provider, types, utils } from 'via-ethers';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * console.log(`Default bridges: ${utils.toJSON(await provider.getDefaultBridgeAddresses())}`);
     */
    async getDefaultBridgeAddresses() {
        return super.getDefaultBridgeAddresses();
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Provider, types, utils } from 'via-ethers';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const balances = await provider.getAllAccountBalances('0x36615Cf349d7F6344891B1e7CA7C72883F5dc049');
     * console.log(`All balances: ${utils.toJSON(balances)}`);
     */
    async getAllAccountBalances(address) {
        return super.getAllAccountBalances(address);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Provider, types, utils } from 'via-ethers';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const tokens = await provider.getConfirmedTokens();
     * console.log(`Confirmed tokens: ${utils.toJSON(tokens)}`);
     */
    async getConfirmedTokens(start = 0, limit = 255) {
        return super.getConfirmedTokens(start, limit);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Provider, types} from 'via-ethers';
     *
     * const provider = Provider.getDefaultProvider(types.Network.Localhost);
     * const l1ChainId = await provider.l1ChainId();
     * console.log(`All balances: ${l1ChainId}`);
     */
    async getL1ChainId() {
        return super.getL1ChainId();
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
    async getL1BatchNumber() {
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
    async getL1BatchDetails(number) {
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
    async getBlockDetails(number) {
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
    async getTransactionDetails(txHash) {
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
    async getBytecodeByHash(bytecodeHash) {
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
    async getRawBlockTransactions(number) {
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
    async getProof(address, keys, l1BatchNumber) {
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
    async sendRawTransactionWithDetailedOutput(signedTx) {
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
    async getWithdrawTx(transaction) {
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
    async estimateGasWithdraw(transaction) {
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
    async getTransferTx(transaction) {
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
    async estimateGasTransfer(transaction) {
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
    async newFilter(filter) {
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
    async newBlockFilter() {
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
    async newPendingTransactionsFilter() {
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
    async getFilterChanges(idx) {
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
    async getTransactionStatus(txHash) {
        return super.getTransactionStatus(txHash);
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
     * const ethProvider = ethers.getDefaultProvider('Localhost');
     * const l1Tx = '0xcca5411f3e514052f4a4ae1c2020badec6e0998adb52c09959c5f5ff15fba3a8';
     * const l1TxResponse = await ethProvider.getTransaction(l1Tx);
     * if (l1TxResponse) {
     *   console.log(`Tx: ${utils.toJSON(await provider.getL2TransactionFromPriorityOp(l1TxResponse))}`);
     * }
     */
    async getL2TransactionFromPriorityOp(l1TxResponse) {
        return super.getL2TransactionFromPriorityOp(l1TxResponse);
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
     * const ethProvider = ethers.getDefaultProvider('Localhost');
     * const l1Tx = '0xcca5411f3e514052f4a4ae1c2020badec6e0998adb52c09959c5f5ff15fba3a8';
     * const l1TxResponse = await ethProvider.getTransaction(l1Tx);
     * if (l1TxResponse) {
     *   console.log(`Tx: ${utils.toJSON(await provider.getPriorityOpResponse(l1TxResponse))}`);
     * }
     */
    async getPriorityOpResponse(l1TxResponse) {
        return super.getPriorityOpResponse(l1TxResponse);
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
     * console.log(`Confirmation data: ${utils.toJSON(await provider.getPriorityOpConfirmation(tx, 0))}`);
     */
    async getPriorityOpConfirmation(txHash, index = 0) {
        return super.getPriorityOpConfirmation(txHash, index);
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
    async getContractAccountInfo(address) {
        return super.getContractAccountInfo(address);
    }
    getRpcError(payload, _error) {
        const { error } = _error;
        const message = _error.error.message ?? 'Execution reverted';
        const code = _error.error.code ?? 0;
        // @ts-ignore
        return makeError(message, code, { payload, error });
    }
    async _send(payload) {
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
    static getDefaultProvider(zksyncNetwork = ZkSyncNetwork.Localhost) {
        switch (zksyncNetwork) {
            case ZkSyncNetwork.Localhost:
                return new Provider('http://127.0.0.1:3050');
            case ZkSyncNetwork.EraTestNode:
                return new Provider('http://127.0.0.1:8011');
            default:
                return new Provider('http://127.0.0.1:3050');
        }
    }
}
_Provider_connect = new WeakMap();
/* c8 ignore start */
/**
 * A `BrowserProvider` extends {@link ethers.BrowserProvider} and includes additional features for interacting with ZKsync Era.
 * It supports RPC endpoints within the `zks` namespace.
 * This provider is designed for frontend use in a browser environment and integration for browser wallets
 * (e.g., MetaMask, WalletConnect).
 */
export class BrowserProvider extends JsonRpcApiProvider(ethers.BrowserProvider) {
    contractAddresses() {
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
    constructor(ethereum, network) {
        super(ethereum, network);
        _BrowserProvider_request.set(this, void 0);
        this._contractAddresses = {};
        __classPrivateFieldSet(this, _BrowserProvider_request, async (method, params) => {
            const payload = { method, params };
            this.emit('debug', { action: 'sendEip1193Request', payload });
            try {
                const result = await ethereum.request(payload);
                this.emit('debug', { action: 'receiveEip1193Result', result });
                return result;
            }
            catch (e) {
                const error = new Error(e.message);
                error.code = e.code;
                error.data = e.data;
                error.payload = payload;
                this.emit('debug', { action: 'receiveEip1193Error', error });
                throw error;
            }
        }, "f");
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
    async getTransactionReceipt(txHash) {
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
    async getTransaction(txHash) {
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
    async getBlock(blockHashOrBlockTag, includeTxs) {
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
    async getLogs(filter) {
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
    async getBalance(address, blockTag, tokenAddress) {
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
    async getProtocolVersion(id) {
        return super.getProtocolVersion(id);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { BrowserProvider } from 'via-ethers';
     *
     * const provider = new BrowserProvider(window.ethereum);
     * const gasL1 = await provider.estimateGasL1({
     *   from: '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049',
     *   to: await provider.getMainContractAddress(),
     *   value: 7_000_000_000,
     *   customData: {
     *     gasPerPubdata: 800,
     *   },
     * });
     * console.log(`L1 gas: ${BigInt(gasL1)}`);
     */
    async estimateGasL1(transaction) {
        return super.estimateGasL1(transaction);
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
    async estimateFee(transaction) {
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
    async getFeeParams() {
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
    async getGasPrice() {
        return super.getGasPrice();
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
    async getLogProof(txHash, index) {
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
    async getL1BatchBlockRange(l1BatchNumber) {
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
     * console.log(`Main contract: ${await provider.getMainContractAddress()}`);
     */
    async getMainContractAddress() {
        return super.getMainContractAddress();
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { BrowserProvider } from 'via-ethers';
     *
     * const provider = new BrowserProvider(window.ethereum);
     * console.log(`Bridgehub: ${await provider.getBridgehubContractAddress()}`);
     */
    async getBridgehubContractAddress() {
        return super.getBridgehubContractAddress();
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { BrowserProvider } from 'via-ethers';
     *
     * const provider = new BrowserProvider(window.ethereum);
     * console.log(`Base token: ${await provider.getBaseTokenContractAddress()}`);
     */
    async getBaseTokenContractAddress() {
        return super.getBaseTokenContractAddress();
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
    async getTestnetPaymasterAddress() {
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
     * console.log(`Default bridges: ${utils.toJSON(await provider.getDefaultBridgeAddresses())}`);
     */
    async getDefaultBridgeAddresses() {
        return super.getDefaultBridgeAddresses();
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { BrowserProvider, utils } from 'via-ethers';
     *
     * const provider = new BrowserProvider(window.ethereum);
     * const balances = await provider.getAllAccountBalances('0x36615Cf349d7F6344891B1e7CA7C72883F5dc049');
     * console.log(`All balances: ${utils.toJSON(balances)}`);
     */
    async getAllAccountBalances(address) {
        return super.getAllAccountBalances(address);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { BrowserProvider, utils } from 'via-ethers';
     *
     * const provider = new BrowserProvider(window.ethereum);
     * const tokens = await provider.getConfirmedTokens();
     * console.log(`Confirmed tokens: ${utils.toJSON(tokens)}`);
     */
    async getConfirmedTokens(start = 0, limit = 255) {
        return super.getConfirmedTokens(start, limit);
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
    async getL1BatchNumber() {
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
    async getL1BatchDetails(number) {
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
    async getBlockDetails(number) {
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
    async getTransactionDetails(txHash) {
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
    async getBytecodeByHash(bytecodeHash) {
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
    async getRawBlockTransactions(number) {
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
    async getProof(address, keys, l1BatchNumber) {
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
    async sendRawTransactionWithDetailedOutput(signedTx) {
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
    async getWithdrawTx(transaction) {
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
    async estimateGasWithdraw(transaction) {
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
    async getTransferTx(transaction) {
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
    async estimateGasTransfer(transaction) {
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
    async newFilter(filter) {
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
    async newBlockFilter() {
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
    async newPendingTransactionsFilter() {
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
    async getFilterChanges(idx) {
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
    async getTransactionStatus(txHash) {
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
     * const ethProvider = ethers.getDefaultProvider('Localhost');
     * const l1Tx = '0xcca5411f3e514052f4a4ae1c2020badec6e0998adb52c09959c5f5ff15fba3a8';
     * const l1TxResponse = await ethProvider.getTransaction(l1Tx);
     * if (l1TxResponse) {
     *   console.log(`Tx: ${utils.toJSON(await provider.getL2TransactionFromPriorityOp(l1TxResponse))}`);
     * }
     */
    async getL2TransactionFromPriorityOp(l1TxResponse) {
        return super.getL2TransactionFromPriorityOp(l1TxResponse);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { BrowserProvider, utils } from 'via-ethers';
     *
     * const provider = new BrowserProvider(window.ethereum);
     * const ethProvider = ethers.getDefaultProvider('Localhost');
     * const l1Tx = '0xcca5411f3e514052f4a4ae1c2020badec6e0998adb52c09959c5f5ff15fba3a8';
     * const l1TxResponse = await ethProvider.getTransaction(l1Tx);
     * if (l1TxResponse) {
     *   console.log(`Tx: ${utils.toJSON(await provider.getPriorityOpResponse(l1TxResponse))}`);
     * }
     */
    async getPriorityOpResponse(l1TxResponse) {
        return super.getPriorityOpResponse(l1TxResponse);
    }
    /**
     *
     * @example
     *
     * import { BrowserProvider, utils } from 'via-ethers';
     *
     * const provider = new BrowserProvider(window.ethereum);
     * // Any L2 -> L1 transaction can be used.
     * // In this case, withdrawal transaction is used.
     * const tx = '0x2a1c6c74b184965c0cb015aae9ea134fd96215d2e4f4979cfec12563295f610e';
     * console.log(`Confirmation data: ${utils.toJSON(await provider.getPriorityOpConfirmation(tx, 0))}`);
     */
    async getPriorityOpConfirmation(txHash, index = 0) {
        return super.getPriorityOpConfirmation(txHash, index);
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
    async getContractAccountInfo(address) {
        return super.getContractAccountInfo(address);
    }
    async _send(payload) {
        ethers.assertArgument(!Array.isArray(payload), 'EIP-1193 does not support batch request', 'payload', payload);
        try {
            const result = await __classPrivateFieldGet(this, _BrowserProvider_request, "f").call(this, payload.method, payload.params || []);
            return [{ id: payload.id, result }];
        }
        catch (e) {
            return [
                {
                    id: payload.id,
                    error: { code: e.code, data: e.data, message: e.message },
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
    getRpcError(payload, error) {
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
    async hasSigner(address) {
        if (!address)
            address = 0;
        const accounts = await this.send('eth_accounts', []);
        if (typeof address === 'number')
            return accounts.length > address;
        return (accounts.filter((a) => isAddressEq(a, address))
            .length !== 0);
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
    async getSigner(address) {
        if (!address)
            address = 0;
        if (!(await this.hasSigner(address))) {
            try {
                await __classPrivateFieldGet(this, _BrowserProvider_request, "f").call(this, 'eth_requestAccounts', []);
            }
            catch (error) {
                const payload = error.payload;
                throw this.getRpcError(payload, { id: payload.id, error });
            }
        }
        return Signer.from((await super.getSigner(address)), Number((await this.getNetwork()).chainId));
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
    async estimateGas(transaction) {
        const gas = await super.estimateGas(transaction);
        const metamaskMinimum = 21000n;
        const isEIP712 = transaction.customData || transaction.type === EIP712_TX_TYPE;
        return gas > metamaskMinimum || isEIP712 ? gas : metamaskMinimum;
    }
}
_BrowserProvider_request = new WeakMap();
/* c8 ignore stop */
//# sourceMappingURL=provider.js.map