import { BigNumberish, BytesLike, ethers, SignatureLike } from 'ethers';
import { Address, DeploymentInfo, EthereumSignature, PriorityOpTree, PriorityQueueType, Transaction, TransactionLike, TransactionReceipt, TransactionRequest } from './types';
import { Provider } from './provider';
import { BTC_NETWORK } from '@scure/btc-signer/src/utils';
export * from './paymaster-utils';
export * from './smart-account-utils';
export { EIP712_TYPES } from './signer';
/**
 * The ABI for the `ZKsync` interface.
 * @readonly
 */
export declare const ZKSYNC_MAIN_ABI: ethers.Interface;
/**
 * The ABI of the `Bridgehub` interface.
 * @readonly
 */
export declare const BRIDGEHUB_ABI: ethers.Interface;
/**
 * The ABI for the `IContractDeployer` interface, which is utilized for deploying smart contracts.
 * @readonly
 */
export declare const CONTRACT_DEPLOYER: ethers.Interface;
/**
 * The ABI for the `Contract2Factory` interface, which is utilized for deploying smart contracts using CREATE2 and CREATE2ACCOUNT.
 * @readonly
 */
export declare const CONTRACT_2_FACTORY: ethers.Interface;
/**
 * The ABI for the `IERC20` interface, which is utilized for interacting with ERC20 tokens.
 * @readonly
 */
export declare const IERC20: ethers.Interface;
/**
 * The ABI for the `IERC1271` interface, which is utilized for signature validation by contracts.
 * @readonly
 */
export declare const IERC1271: ethers.Interface;
/**
 * The ABI for the `INonceHolder` interface, which is utilized for managing deployment nonces.
 * @readonly
 */
export declare const NONCE_HOLDER_ABI: ethers.Interface;
/**
 * The address of the L1 bridge.
 * @readonly
 */
export declare const L1_BRIDGE_ADDRESS = "bcrt1p3s7m76wp5seprjy4gdxuxrr8pjgd47q5s8lu9vefxmp0my2p4t9qh6s8kq";
export declare const REGTEST_NETWORK: BTC_NETWORK;
/**
 * The formal address for the `Bootloader`.
 * @readonly
 */
export declare const BOOTLOADER_FORMAL_ADDRESS: Address;
/**
 * The address of the Contract deployer.
 * @readonly
 */
export declare const CONTRACT_DEPLOYER_ADDRESS: Address;
/**
 * The address of the Contract2Factory.
 * @readonly
 */
export declare const CONTRACT_2_FACTORY_ADDRESS: Address;
/**
 * The address of the L1 messenger.
 * @readonly
 */
export declare const L1_MESSENGER_ADDRESS: Address;
/**
 * The address of the base token.
 * @readonly
 */
export declare const L2_BASE_TOKEN_ADDRESS = "0x000000000000000000000000000000000000800a";
/**
 * The address of the Nonce holder.
 * @readonly
 */
export declare const NONCE_HOLDER_ADDRESS: Address;
/**
 * Used for applying and undoing aliases on addresses during bridging from L1 to L2.
 * @readonly
 */
export declare const L1_TO_L2_ALIAS_OFFSET: Address;
/**
 * The EIP1271 magic value used for signature validation in smart contracts.
 * This predefined constant serves as a standardized indicator to signal successful
 * signature validation by the contract.
 *
 * @readonly
 */
export declare const EIP1271_MAGIC_VALUE = "0x1626ba7e";
/**
 * Represents an EIP712 transaction type.
 *
 * @readonly
 */
export declare const EIP712_TX_TYPE = 113;
/**
 * Represents a priority transaction operation on L2.
 *
 * @readonly
 */
export declare const PRIORITY_OPERATION_L2_TX_TYPE = 255;
/**
 * The maximum bytecode length in bytes that can be deployed.
 *
 * @readonly
 */
export declare const MAX_BYTECODE_LEN_BYTES: number;
/**
 * Default gas per pubdata byte for L2 transactions.
 * This value is utilized when inserting a default value for type 2
 * and EIP712 type transactions.
 *
 * @readonly
 */
export declare const DEFAULT_GAS_PER_PUBDATA_LIMIT = 50000;
/**
 * The `L1->L2` transactions are required to have the following gas per pubdata byte.
 *
 * @readonly
 */
export declare const REQUIRED_L1_TO_L2_GAS_PER_PUBDATA_LIMIT = 800;
/**
 * Pauses execution for a specified number of milliseconds.
 *
 * @param millis The number of milliseconds to pause execution.
 *
 * @example
 *
 * import { utils } from 'via-ethers';
 *
 * await utils.sleep(1_000);
 */
export declare function sleep(millis: number): Promise<unknown>;
/**
 * Returns the default settings for L1 transactions.
 */
export declare function layer1TxDefaults(): {
    queueType: PriorityQueueType.Deque;
    opTree: PriorityOpTree.Full;
};
/**
 * Returns a `keccak` encoded message with a given sender address and block number from the L1 messenger contract.
 *
 * @param sender The sender of the message on L2.
 * @param msg The encoded message.
 * @param txNumberInBlock The index of the transaction in the block.
 * @returns The hashed `L2->L1` message.
 *
 * @example
 *
 * import { utils } from 'via-ethers';
 *
 * const withdrawETHMessage = '0x6c0960f936615cf349d7f6344891b1e7ca7c72883f5dc04900000000000000000000000000000000000000000000000000000001a13b8600';
 * const withdrawETHMessageHash = utils.getHashedL2ToL1Msg('0x36615Cf349d7F6344891B1e7CA7C72883F5dc049', withdrawETHMessage, 0);
 * // withdrawETHMessageHash = '0xd8c80ecb64619e343f57c3b133c6c6d8dd0572dd3488f1ca3276c5b7fd3a938d'
 */
export declare function getHashedL2ToL1Msg(sender: Address, msg: BytesLike, txNumberInBlock: number): string;
/**
 * Returns a log containing details of all deployed contracts related to a transaction receipt.
 *
 * @param receipt The transaction receipt containing deployment information.
 *
 * @example
 *
 * import { Provider, types, utils } from 'via-ethers';
 *
 * const provider = Provider.getDefaultProvider(types.Network.Localhost);
 *
 * const deployTx = '<DEPLOY TRANSACTION>';
 * const receipt = await provider.getTransactionReceipt(deployTx);
 * const deploymentInfo = utils.getDeployedContracts(receipt as ethers.TransactionReceipt);
 */
export declare function getDeployedContracts(receipt: TransactionReceipt): DeploymentInfo[];
/**
 * Generates a future-proof contract address using a salt plus bytecode, allowing the determination of an address before deployment.
 *
 * @param sender The sender's address.
 * @param bytecodeHash The hash of the bytecode, typically the output from `zkSolc`.
 * @param salt A randomization element used to create the contract address.
 * @param input The ABI-encoded constructor arguments, if any.
 *
 * @remarks The implementation of `create2Address` in ZKsync Era may differ slightly from Ethereum.
 *
 * @example
 *
 * import { utils } from 'via-ethers';
 *
 * const address = utils.create2Address('0x36615Cf349d7F6344891B1e7CA7C72883F5dc049', '0x010001cb6a6e8d5f6829522f19fa9568660e0a9cd53b2e8be4deb0a679452e41', '0x01', '0x01');
 * // address = '0x29bac3E5E8FFE7415F97C956BFA106D70316ad50'
 */
export declare function create2Address(sender: Address, bytecodeHash: BytesLike, salt: BytesLike, input?: BytesLike): string;
/**
 * Generates a contract address from the deployer's account and nonce.
 *
 * @param sender The address of the deployer's account.
 * @param senderNonce The nonce of the deployer's account.
 *
 * @example
 *
 * import { utils } from 'via-ethers';
 *
 * const address = utils.createAddress('0x36615Cf349d7F6344891B1e7CA7C72883F5dc049', 1);
 * // address = '0x4B5DF730c2e6b28E17013A1485E5d9BC41Efe021'
 */
export declare function createAddress(sender: Address, senderNonce: BigNumberish): string;
/**
 * Checks if the transaction's base cost is greater than the provided value, which covers the transaction's cost.
 *
 * @param baseCost The base cost of the transaction.
 * @param value The value covering the transaction's cost.
 * @throws {Error} The base cost must be greater than the provided value.
 *
 * @example
 *
 * import { utils } from 'via-ethers';
 *
 * const baseCost = 100;
 * const value = 99;
 * try {
 *   await utils.checkBaseCost(baseCost, value);
 * } catch (e) {
 *   // e.message = `The base cost of performing the priority operation is higher than the provided value parameter for the transaction: baseCost: ${baseCost}, provided value: ${value}`,
 * }
 */
export declare function checkBaseCost(baseCost: ethers.BigNumberish, value: ethers.BigNumberish | Promise<ethers.BigNumberish>): Promise<void>;
/**
 * Serializes an EIP712 transaction and includes a signature if provided.
 *
 * @param transaction The transaction that needs to be serialized.
 * @param [signature] Ethers signature to be included in the transaction.
 * @throws {Error} Throws an error if:
 * - `transaction.customData.customSignature` is an empty string. The transaction should be signed, and the `transaction.customData.customSignature` field should be populated with the signature. It should not be specified if the transaction is not signed.
 * - `transaction.chainId` is not provided.
 * - `transaction.from` is not provided.
 *
 * @example Serialize EIP712 transaction without signature.
 *
 * import { utils } from 'via-ethers';
 *
 * const serializedTx = utils.serializeEip712({ chainId: 270, from: '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049' }, null);
 *
 * // serializedTx = '0x71ea8080808080808082010e808082010e9436615cf349d7f6344891b1e7ca7c72883f5dc04982c350c080c0'
 *
 * @example Serialize EIP712 transaction with signature.
 *
 * import { utils } from 'via-ethers';
 * import { ethers } from 'ethers';
 *
 * const signature = ethers.Signature.from('0x73a20167b8d23b610b058c05368174495adf7da3a4ed4a57eb6dbdeb1fafc24aaf87530d663a0d061f69bb564d2c6fb46ae5ae776bbd4bd2a2a4478b9cd1b42a');
 *
 * const serializedTx = utils.serializeEip712(
 *   {
 *     chainId: 270,
 *     from: '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049',
 *     to: '0xa61464658AfeAf65CccaaFD3a512b69A83B77618',
 *     value: 1_000_000,
 *   },
 *   signature
 * );
 * // serializedTx = '0x71f87f8080808094a61464658afeaf65cccaafd3a512b69a83b77618830f42408001a073a20167b8d23b610b058c05368174495adf7da3a4ed4a57eb6dbdeb1fafc24aa02f87530d663a0d061f69bb564d2c6fb46ae5ae776bbd4bd2a2a4478b9cd1b42a82010e9436615cf349d7f6344891b1e7ca7c72883f5dc04982c350c080c0'
 */
export declare function serializeEip712(transaction: TransactionLike, signature?: ethers.SignatureLike): string;
/**
 * Returns the hash of the given bytecode.
 *
 * @param bytecode The bytecode to hash.
 *
 * @example
 *
 * import { utils } from 'via-ethers';
 *
 * const bytecode =
 *   '0x000200000000000200010000000103550000006001100270000000130010019d0000008001000039000000400010043f0000000101200190000000290000c13d0000000001000031000000040110008c000000420000413d0000000101000367000000000101043b000000e001100270000000150210009c000000310000613d000000160110009c000000420000c13d0000000001000416000000000110004c000000420000c13d000000040100008a00000000011000310000001702000041000000200310008c000000000300001900000000030240190000001701100197000000000410004c000000000200a019000000170110009c00000000010300190000000001026019000000000110004c000000420000c13d00000004010000390000000101100367000000000101043b000000000010041b0000000001000019000000490001042e0000000001000416000000000110004c000000420000c13d0000002001000039000001000010044300000120000004430000001401000041000000490001042e0000000001000416000000000110004c000000420000c13d000000040100008a00000000011000310000001702000041000000000310004c000000000300001900000000030240190000001701100197000000000410004c000000000200a019000000170110009c00000000010300190000000001026019000000000110004c000000440000613d00000000010000190000004a00010430000000000100041a000000800010043f0000001801000041000000490001042e0000004800000432000000490001042e0000004a00010430000000000000000000000000000000000000000000000000000000000000000000000000ffffffff0000000200000000000000000000000000000040000001000000000000000000000000000000000000000000000000000000000000000000000000006d4ce63c0000000000000000000000000000000000000000000000000000000060fe47b18000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000080000000000000000000000000000000000000000000000000000000000000000000000000000000009c8c8fa789967eb514f3ec9def748480945cc9b10fcbd1a19597d924eb201083';
 * const hashedBytecode = utils.hashBytecode(bytecode);
 * /*
 * hashedBytecode =  new Uint8Array([
 *     1, 0, 0, 27, 57, 231, 154, 55, 0, 164, 201, 96, 244, 120, 23, 112, 54, 34, 224, 133,
 *     160, 122, 88, 164, 112, 80, 0, 134, 48, 138, 74, 16,
 *   ]),
 * );
 * *\/
 */
export declare function hashBytecode(bytecode: ethers.BytesLike): Uint8Array;
/**
 * Parses an EIP712 transaction from a payload.
 *
 * @param payload The payload to parse.
 *
 * @example
 *
 * import { utils, types } from 'via-ethers';
 *
 * const serializedTx =
 *   '0x71f87f8080808094a61464658afeaf65cccaafd3a512b69a83b77618830f42408001a073a20167b8d23b610b058c05368174495adf7da3a4ed4a57eb6dbdeb1fafc24aa02f87530d663a0d061f69bb564d2c6fb46ae5ae776bbd4bd2a2a4478b9cd1b42a82010e9436615cf349d7f6344891b1e7ca7c72883f5dc04982c350c080c0';
 * const tx: types.TransactionLike = utils.parseEip712(serializedTx);
 * /*
 * tx: types.TransactionLike = {
 *   type: 113,
 *   nonce: 0,
 *   maxPriorityFeePerGas: 0n,
 *   maxFeePerGas: 0n,
 *   gasLimit: 0n,
 *   to: '0xa61464658AfeAf65CccaaFD3a512b69A83B77618',
 *   value: 1000000n,
 *   data: '0x',
 *   chainId: 270n,
 *   from: '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049',
 *   customData: {
 *     gasPerPubdata: 50000n,
 *     factoryDeps: [],
 *     customSignature: '0x',
 *     paymasterParams: null,
 *   },
 *   hash: '0x9ed410ce33179ac1ff6b721060605afc72d64febfe0c08cacab5a246602131ee',
 * };
 * *\/
 */
export declare function parseEip712(payload: ethers.BytesLike): TransactionLike;
/**
 * Returns the hash of an EIP712 transaction. If a custom signature is provided in the transaction,
 * it will be used to form the transaction hash. Otherwise, the Ethereum signature specified in the
 * `ethSignature` parameter will be used.
 *
 * @param transaction The EIP712 transaction that may contain a custom signature.
 * If a custom signature is not present in the transaction, the `ethSignature` parameter will be used.
 * @param [ethSignature] The Ethereum transaction signature. This parameter is ignored if the transaction
 * object contains a custom signature.
 *
 * @example Get transaction hash using custom signature from the transaction.
 *
 * import { utils } from 'via-ethers';
 *
 * const tx: types.TransactionRequest = {
 *   type: 113,
 *   nonce: 0,
 *   maxPriorityFeePerGas: 0n,
 *   maxFeePerGas: 0n,
 *   gasLimit: 0n,
 *   to: '0xa61464658AfeAf65CccaaFD3a512b69A83B77618',
 *   value: 1_000_000n,
 *   data: '0x',
 *   chainId: 270n,
 *   from: '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049',
 *   customData: {
 *     gasPerPubdata: 50_000n,
 *     factoryDeps: [],
 *     customSignature:
 *       '0x307837373262396162343735386435636630386637643732303161646332653534383933616532376263666562323162396337643666643430393766346464653063303166376630353332323866346636643838653662663334333436343931343135363761633930363632306661653832633239333339393062353563613336363162',
 *     paymasterParams: {
 *       paymaster: '0xa222f0c183AFA73a8Bc1AFb48D34C88c9Bf7A174',
 *       paymasterInput: ethers.getBytes(
 *         '0x949431dc000000000000000000000000841c43fa5d8fffdb9efe3358906f7578d8700dd4000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000'
 *       ),
 *     },
 *   },
 * };
 *
 * const hash = utils.eip712TxHash(tx);
 * // hash = '0xc0ba55587423e1ef281b06a9d684b481365897f37a6ad611d7619b1b7e0bc908'
 *
 * @example Get transaction hash using Ethereum signature.
 *
 * import { utils } from 'via-ethers';
 * import { ethers } from 'ethers';
 *
 * const tx: types.TransactionRequest = {
 *   chainId: 270n,
 *   from: '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049',
 *   to: '0xa61464658AfeAf65CccaaFD3a512b69A83B77618',
 *   value: 1_000_000n,
 * };
 * const signature = ethers.Signature.from(
 *   '0x73a20167b8d23b610b058c05368174495adf7da3a4ed4a57eb6dbdeb1fafc24aaf87530d663a0d061f69bb564d2c6fb46ae5ae776bbd4bd2a2a4478b9cd1b42a'
 * );
 * const hash = utils.eip712TxHash(tx, signature);
 * // hash = '0x8efdc7ce5f5a75ab945976c3e2b0c2a45e9f8e15ff940d05625ac5545cd9f870'
 */
export declare function eip712TxHash(transaction: Transaction | TransactionRequest, ethSignature?: EthereumSignature): string;
/**
 * Returns the hash of the L2 priority operation from a given transaction receipt and L2 address.
 *
 * @param txReceipt The receipt of the L1 transaction.
 * @param zkSyncAddress The address of the ZKsync Era main contract.
 *
 * @example
 *
 * import { Provider, types, utils } from 'via-ethers';
 * import { ethers } from 'ethers';
 *
 * const provider = Provider.getDefaultProvider(types.Network.Localhost);
 * const ethProvider = ethers.getDefaultProvider('Localhost');
 * const l1Tx = '0xcca5411f3e514052f4a4ae1c2020badec6e0998adb52c09959c5f5ff15fba3a8';
 * const l1TxReceipt = await ethProvider.getTransactionReceipt(l1Tx);
 * if (l1TxReceipt) {
 *   const l2Hash = getL2HashFromPriorityOp(
 *     receipt as ethers.TransactionReceipt,
 *     await provider.getMainContractAddress()
 *   );
 * }
 */
export declare function getL2HashFromPriorityOp(txReceipt: ethers.TransactionReceipt, zkSyncAddress: Address): string;
/**
 * Returns whether the account abstraction message signature is correct.
 * Signature can be created using EIP1271 or ECDSA.
 *
 * @param provider The provider.
 * @param address The sender address.
 * @param message The hash of the message.
 * @param signature The Ethers signature.
 *
 * @example
 *
 * import { Wallet, utils, Provider } from 'via-ethers';
 * import { ethers } from 'ethers';
 *
 * const ADDRESS = '<WALLET_ADDRESS>';
 * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
 * const provider = Provider.getDefaultProvider(types.Network.Localhost);
 *
 * const message = 'Hello, world!';
 * const signature = await new Wallet(PRIVATE_KEY).signMessage(message);
 * // ethers.Wallet can be used as well
 * // const signature =  await new ethers.Wallet(PRIVATE_KEY).signMessage(message);
 *
 * const isValidSignature = await utils.isMessageSignatureCorrect(provider, ADDRESS, message, signature);
 * // isValidSignature = true
 */
export declare function isMessageSignatureCorrect(provider: Provider, address: string, message: Uint8Array | string, signature: SignatureLike): Promise<boolean>;
/**
 * Returns whether the account abstraction EIP712 signature is correct.
 *
 * @param provider The provider.
 * @param address The sender address.
 * @param domain The domain data.
 * @param types A map of records pointing from field name to field type.
 * @param value A single record value.
 * @param signature The Ethers signature.
 *
 * @example
 *
 * import { Wallet, utils, Provider, EIP712Signer } from 'via-ethers';
 * import { ethers } from 'ethers';
 *
 * const ADDRESS = '<WALLET_ADDRESS>';
 * const PRIVATE_KEY = '<WALLET_PRIVATE_KEY>';
 * const provider = Provider.getDefaultProvider(types.Network.Localhost);
 *
 * const tx: types.TransactionRequest = {
 *   type: 113,
 *   chainId: 270,
 *   from: ADDRESS,
 *   to: '0xa61464658AfeAf65CccaaFD3a512b69A83B77618',
 *   value: 7_000_000n,
 * };
 *
 * const eip712Signer = new EIP712Signer(
 *   new Wallet(PRIVATE_KEY), // or new ethers.Wallet(PRIVATE_KEY),
 *   Number((await provider.getNetwork()).chainId)
 * );
 *
 * const signature = await eip712Signer.sign(tx);
 *
 * const isValidSignature = await utils.isTypedDataSignatureCorrect(
 *  provider,
 *  ADDRESS,
 *  await eip712Signer.getDomain(),
 *  utils.EIP712_TYPES,
 *  EIP712Signer.getSignInput(tx),
 *  signature
 * );
 * // isValidSignature = true
 */
export declare function isTypedDataSignatureCorrect(provider: Provider, address: string, domain: ethers.TypedDataDomain, types: Record<string, Array<ethers.TypedDataField>>, value: Record<string, any>, signature: SignatureLike): Promise<boolean>;
/**
 * Creates a JSON string from an object, including support for serializing bigint types.
 *
 * @param object The object to serialize to JSON.
 *
 * @example
 *
 * import { utils } from 'via-ethers';
 *
 * const json = utils.toJSON({gasLimit: 1_000n})
 * // {'gasLimit': 1000}
 */
export declare function toJSON(object: any): string;
/**
 * Compares stringified addresses, taking into account the fact that
 * addresses might be represented in different casing.
 *
 * @param a - The first address to compare.
 * @param b - The second address to compare.
 * @returns A boolean indicating whether the addresses are equal.
 *
 * @example
 *
 * import { utils } from 'via-ethers';
 *
 * const address1 = '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049';
 * const address2 = '0x36615cf349d7f6344891b1e7ca7c72883f5dc049';
 * const isEqual = utils.isAddressEq(address1, address2);
 * // true
 */
export declare function isAddressEq(a: Address, b: Address): boolean;
