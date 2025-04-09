import { ethers, copyRequest } from 'ethers';
import { DEFAULT_GAS_PER_PUBDATA_LIMIT, EIP712_TX_TYPE, hashBytecode, isAddressEq, serializeEip712, } from './utils';
import { AdapterL2 } from './adapters';
/**
 * All typed data conforming to the EIP712 standard within ZKsync Era.
 */
export const EIP712_TYPES = {
    Transaction: [
        { name: 'txType', type: 'uint256' },
        { name: 'from', type: 'uint256' },
        { name: 'to', type: 'uint256' },
        { name: 'gasLimit', type: 'uint256' },
        { name: 'gasPerPubdataByteLimit', type: 'uint256' },
        { name: 'maxFeePerGas', type: 'uint256' },
        { name: 'maxPriorityFeePerGas', type: 'uint256' },
        { name: 'paymaster', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'value', type: 'uint256' },
        { name: 'data', type: 'bytes' },
        { name: 'factoryDeps', type: 'bytes32[]' },
        { name: 'paymasterInput', type: 'bytes' },
    ],
};
/**
 * A `EIP712Signer` provides support for signing EIP712-typed ZKsync Era transactions.
 */
export class EIP712Signer {
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
    constructor(ethSigner, chainId) {
        this.ethSigner = ethSigner;
        this.eip712Domain = Promise.resolve(chainId).then(chainId => ({
            name: 'zkSync',
            version: '2',
            chainId,
        }));
    }
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
    static getSignInput(transaction) {
        const maxFeePerGas = transaction.maxFeePerGas || transaction.gasPrice || 0n;
        const maxPriorityFeePerGas = transaction.maxPriorityFeePerGas || maxFeePerGas;
        const gasPerPubdataByteLimit = transaction.customData?.gasPerPubdata || DEFAULT_GAS_PER_PUBDATA_LIMIT;
        return {
            txType: transaction.type || EIP712_TX_TYPE,
            from: transaction.from,
            to: transaction.to,
            gasLimit: transaction.gasLimit || 0n,
            gasPerPubdataByteLimit: gasPerPubdataByteLimit,
            maxFeePerGas,
            maxPriorityFeePerGas,
            paymaster: transaction.customData?.paymasterParams?.paymaster ||
                ethers.ZeroAddress,
            nonce: transaction.nonce || 0,
            value: transaction.value || 0n,
            data: transaction.data || '0x',
            factoryDeps: transaction.customData?.factoryDeps?.map((dep) => hashBytecode(dep)) || [],
            paymasterInput: transaction.customData?.paymasterParams?.paymasterInput || '0x',
        };
    }
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
    async sign(transaction) {
        return await this.ethSigner.signTypedData(await this.eip712Domain, EIP712_TYPES, EIP712Signer.getSignInput(transaction));
    }
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
    static getSignedDigest(transaction) {
        if (!transaction.chainId) {
            throw Error('Transaction chainId is not set!');
        }
        const domain = {
            name: 'zkSync',
            version: '2',
            chainId: transaction.chainId,
        };
        return ethers.TypedDataEncoder.hash(domain, EIP712_TYPES, EIP712Signer.getSignInput(transaction));
    }
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
    async getDomain() {
        return await this.eip712Domain;
    }
}
/**
 * A `Signer` is designed for frontend use with browser wallet injection (e.g., MetaMask),
 * providing only L2 operations.
 */
export class Signer extends AdapterL2 {
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
    constructor(signer, chainId, provider) {
        super();
        this._signerL2 = signer;
        this.signer = signer;
        this.eip712Signer = new EIP712Signer(signer, chainId);
        this.address = signer.address;
        // Make it compatible when singer is created with BrowserProvider.getSigner()
        this._providerL2 = provider ?? signer.provider;
        this.provider = provider ?? signer.provider;
    }
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
    static from(signer, chainId, provider) {
        return new Signer(signer, chainId, provider);
    }
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
    async getAddress() {
        return this.address;
    }
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
    async getBalance(token, blockTag = 'committed') {
        return super.getBalance(token, blockTag);
    }
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
    async getAllBalances() {
        return super.getAllBalances();
    }
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
    async getDeploymentNonce() {
        return super.getDeploymentNonce();
    }
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
    async withdraw(transaction) {
        return super.withdraw(transaction);
    }
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
    async transfer(transaction) {
        return super.transfer(transaction);
    }
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
    async getNonce(blockTag) {
        return this._signerL2.getNonce(blockTag);
    }
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
    async sendTransaction(transaction) {
        if (!transaction.type) {
            transaction.type = EIP712_TX_TYPE;
        }
        const address = await this.getAddress();
        transaction.from ?? (transaction.from = address);
        const tx = await this.populateFeeData(transaction);
        if (!isAddressEq(await ethers.resolveAddress(tx.from), address)) {
            throw new Error('Transaction `from` address mismatch!');
        }
        if (tx.type === null ||
            tx.type === undefined ||
            tx.type === EIP712_TX_TYPE ||
            tx.customData) {
            const zkTx = {
                type: tx.type ?? EIP712_TX_TYPE,
                value: tx.value ?? 0,
                data: tx.data ?? '0x',
                nonce: tx.nonce ?? (await this.getNonce('pending')),
                maxFeePerGas: tx.gasPrice ?? tx.maxFeePerGas,
                maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
                gasLimit: tx.gasLimit,
                chainId: tx.chainId ?? (await this.provider.getNetwork()).chainId,
                to: await ethers.resolveAddress(tx.to),
                customData: this._fillCustomData(tx.customData ?? {}),
                from: address,
            };
            zkTx.customData ?? (zkTx.customData = {});
            zkTx.customData.customSignature = await this.eip712Signer.sign(zkTx);
            const txBytes = serializeEip712(zkTx);
            return await this.provider.broadcastTransaction(txBytes);
        }
        return (await this._signerL2.sendTransaction(tx));
    }
    async populateFeeData(transaction) {
        const tx = copyRequest(transaction);
        if (tx.gasPrice && (tx.maxFeePerGas || tx.maxPriorityFeePerGas)) {
            throw new Error('Provide combination of maxFeePerGas and maxPriorityFeePerGas or provide gasPrice. Not both!');
        }
        if (!this._providerL2) {
            throw new Error('Initialize provider L2');
        }
        if (!tx.gasLimit ||
            (!tx.gasPrice &&
                (!tx.maxFeePerGas ||
                    tx.maxPriorityFeePerGas === null ||
                    tx.maxPriorityFeePerGas === undefined))) {
            const fee = await this._providerL2.estimateFee(tx);
            tx.gasLimit ?? (tx.gasLimit = fee.gasLimit);
            if (!tx.gasPrice && tx.type === 0) {
                tx.gasPrice = fee.maxFeePerGas;
            }
            else if (!tx.gasPrice && tx.type !== 0) {
                tx.maxFeePerGas ?? (tx.maxFeePerGas = fee.maxFeePerGas);
                tx.maxPriorityFeePerGas ?? (tx.maxPriorityFeePerGas = fee.maxPriorityFeePerGas);
            }
            if (tx.type === null ||
                tx.type === undefined ||
                tx.type === EIP712_TX_TYPE ||
                tx.customData) {
                tx.customData ?? (tx.customData = {});
                tx.customData.gasPerPubdata = fee.gasPerPubdataLimit;
            }
        }
        return tx;
    }
    async sendUncheckedTransaction(_tx) {
        return this.signer.sendUncheckedTransaction(_tx);
    }
    async unlock(password) {
        return await this.signer.unlock(password);
    }
    async _legacySignMessage(_message) {
        return await this.signer._legacySignMessage(_message);
    }
    connect(provider) {
        return this.signer.connect(provider);
    }
    async populateCall(tx) {
        return await this.signer.populateCall(tx);
    }
    async populateTransaction(tx) {
        return await this.signer.populateTransaction(tx);
    }
    async estimateGas(tx) {
        return await this.signer.estimateGas(tx);
    }
    async call(tx) {
        return await this.signer.call(tx);
    }
    async resolveName(name) {
        return await this.signer.resolveName(name);
    }
    async signTransaction(tx) {
        return await this.signer.signTransaction(tx);
    }
    async signMessage(message) {
        return await this.signer.signMessage(message);
    }
    async signTypedData(domain, types, value) {
        return await this.signer.signTypedData(domain, types, value);
    }
}
/**
 * A `VoidSigner` is an extension of {@link ethers.VoidSigner} class providing only L2 operations.
 */
export class VoidSigner extends AdapterL2 {
    constructor(address, provider) {
        super();
        this._signerL2 = new ethers.VoidSigner(address, provider);
        this.address = address;
        this.provider = provider ?? null;
        this._providerL2 = provider;
    }
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
    async getAddress() {
        return this.address;
    }
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
    async getBalance(token, blockTag = 'committed') {
        return super.getBalance(token, blockTag);
    }
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
    async getAllBalances() {
        return super.getAllBalances();
    }
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
    async getDeploymentNonce() {
        return super.getDeploymentNonce();
    }
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
    async getNonce(blockTag) {
        return this._signerL2.getNonce(blockTag);
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
    async populateTransaction(tx) {
        if (!this.provider)
            throw new Error('Provider is not initialized');
        if ((!tx.type || tx.type !== EIP712_TX_TYPE) && !tx.customData) {
            return await this._signerL2.populateTransaction(tx);
        }
        tx.type = 2;
        const populated = (await this._signerL2.populateTransaction(tx));
        populated.type = EIP712_TX_TYPE;
        populated.value ?? (populated.value = 0);
        populated.data ?? (populated.data = '0x');
        populated.customData = this._fillCustomData(tx.customData ?? {});
        if (!populated.maxFeePerGas && !populated.maxPriorityFeePerGas) {
            populated.gasPrice = await this.provider.getGasPrice();
        }
        return populated;
    }
    async sendTransaction(tx) {
        if (!this.provider)
            throw new Error('Provider is not initialized');
        const populated = await this.populateTransaction(tx);
        return this.provider.broadcastTransaction(await this.signTransaction(populated));
    }
    connect(provider) {
        return this._signerL2.connect(provider);
    }
    async populateCall(tx) {
        return await this._signerL2.populateCall(tx);
    }
    async estimateGas(tx) {
        return await this._signerL2.estimateGas(tx);
    }
    async call(tx) {
        return await this._signerL2.call(tx);
    }
    async resolveName(name) {
        return await this._signerL2.resolveName(name);
    }
    async signTransaction(tx) {
        return await this._signerL2.signTransaction(tx);
    }
    async signMessage(message) {
        return await this._signerL2.signMessage(message);
    }
    async signTypedData(domain, types, value) {
        return await this._signerL2.signTypedData(domain, types, value);
    }
}
//# sourceMappingURL=signer.js.map