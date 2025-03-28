import {
  BigNumberish,
  BlockTag,
  BytesLike,
  ethers,
  FetchUrlFeeDataNetworkPlugin,
} from 'ethers';
import {Provider} from './provider';
import {DEFAULT_GAS_PER_PUBDATA_LIMIT, NONCE_HOLDER_ADDRESS} from './utils';
import {
  IL2Bridge,
  IL2Bridge__factory,
  INonceHolder__factory,
  IL2SharedBridge__factory,
  IL2SharedBridge,
} from './typechain';
import {
  Address,
  BalancesMap,
  Eip712Meta,
  PaymasterParams,
  PriorityOpResponse,
  TransactionRequest,
  TransactionResponse,
} from './types';

export abstract class AdapterL1 {
  protected _providerL1?: ethers.Provider;
  protected _providerL2!: Provider;

  /**
   * Transfers the specified token from the associated account on the L1 network to the target account on the L2 network.
   * The token can be either ETH or any ERC20 token. For ERC20 tokens, enough approved tokens must be associated with
   * the specified L1 bridge (default one or the one defined in `transaction.bridgeAddress`).
   * In this case, depending on is the chain ETH-based or not `transaction.approveERC20` or `transaction.approveBaseERC20`
   * can be enabled to perform token approval. If there are already enough approved tokens for the L1 bridge,
   * token approval will be skipped. To check the amount of approved tokens for a specific bridge,
   * use the {@link getAllowanceL1} method.
   *
   * @param transaction The transaction object containing deposit details.
   * @param transaction.token The address of the token to deposit.
   * @param transaction.amount The amount of the token to deposit.
   * @param [transaction.to] The address that will receive the deposited tokens on L2.
   * @param [transaction.operatorTip] (currently not used) If the ETH value passed with the transaction is not
   * explicitly stated in the overrides, this field will be equal to the tip the operator will receive on top of
   * the base cost of the transaction.
   * @param [transaction.bridgeAddress] The address of the bridge contract to be used.
   * Defaults to the default ZKsync Era bridge (either `L1EthBridge` or `L1Erc20Bridge`).
   * @param [transaction.approveERC20] Whether or not token approval should be performed under the hood.
   * Set this flag to true if you bridge an ERC20 token and didn't call the {@link approveERC20} function beforehand.
   * @param [transaction.approveBaseERC20] Whether or not base token approval should be performed under the hood.
   * Set this flag to true if you bridge a base token and didn't call the {@link approveERC20} function beforehand.
   * @param [transaction.l2GasLimit] Maximum amount of L2 gas that the transaction can consume during execution on L2.
   * @param [transaction.gasPerPubdataByte] The L2 gas price for each published L1 calldata byte.
   * @param [transaction.refundRecipient] The address on L2 that will receive the refund for the transaction.
   * If the transaction fails, it will also be the address to receive `l2Value`.
   * @param [transaction.overrides] Transaction's overrides for deposit which may be used to pass
   * L1 `gasLimit`, `gasPrice`, `value`, etc.
   * @param [transaction.approveOverrides] Transaction's overrides for approval of an ERC20 token which may be used
   * to pass L1 `gasLimit`, `gasPrice`, `value`, etc.
   * @param [transaction.approveBaseOverrides] Transaction's overrides for approval of a base token which may be used
   * to pass L1 `gasLimit`, `gasPrice`, `value`, etc.
   * @param [transaction.customBridgeData] Additional data that can be sent to a bridge.
   */
  async deposit(transaction: {
    token: Address;
    amount: BigNumberish;
    to?: Address;
    operatorTip?: BigNumberish;
    bridgeAddress?: Address;
    approveERC20?: boolean;
    approveBaseERC20?: boolean;
    l2GasLimit?: BigNumberish;
    gasPerPubdataByte?: BigNumberish;
    refundRecipient?: Address;
    overrides?: ethers.Overrides;
    approveOverrides?: ethers.Overrides;
    approveBaseOverrides?: ethers.Overrides;
    customBridgeData?: BytesLike;
  }): Promise<PriorityOpResponse> {
    return {} as any;
  }

  /**
   * Returns the base cost for an L2 transaction.
   *
   * @param params The parameters for calculating the base cost.
   * @param params.gasLimit The gasLimit for the L2 contract call.
   * @param [params.gasPerPubdataByte] The L2 gas price for each published L1 calldata byte.
   * @param [params.gasPrice] The L1 gas price of the L1 transaction that will send the request for an execute call.
   */
  async getBaseCost(params: {
    gasLimit: BigNumberish;
    gasPerPubdataByte?: BigNumberish;
    gasPrice?: BigNumberish;
  }): Promise<bigint> {
    return 0n;
  }

  /**
   * Withdraws funds from the initiated deposit, which failed when finalizing on L2.
   * If the deposit L2 transaction has failed, it sends an L1 transaction calling `claimFailedDeposit` method of the
   * L1 bridge, which results in returning L1 tokens back to the depositor.
   *
   * @param depositHash The L2 transaction hash of the failed deposit.
   * @param [overrides] Transaction's overrides which may be used to pass L1 `gasLimit`, `gasPrice`, `value`, etc.
   * @returns A promise that resolves to the response of the `claimFailedDeposit` transaction.
   * @throws {Error} If attempting to claim successful deposit.
   */
  async claimFailedDeposit(
    depositHash: BytesLike,
    overrides?: ethers.Overrides
  ): Promise<null> {
    return null;
  }
}

export abstract class AdapterL2 {
  protected _providerL2?: Provider;
  protected _signerL2!: ethers.Signer;

  /**
   * Returns the address of the associated account.
   */
  abstract getAddress(): Promise<Address>;

  /**
   * Broadcast the transaction to the network.
   *
   * @param transaction The transaction request that needs to be broadcast to the network.
   */
  abstract sendTransaction(
    transaction: TransactionRequest
  ): Promise<TransactionResponse>;

  /**
   * Returns the balance of the account.
   *
   * @param [token] The token address to query balance for. Defaults to the native token.
   * @param [blockTag='committed'] The block tag to get the balance at.
   */
  async getBalance(
    token?: Address,
    blockTag: BlockTag = 'committed'
  ): Promise<bigint> {
    if (!this._providerL2) throw new Error('Provider is not initialized');
    return await this._providerL2.getBalance(
      await this.getAddress(),
      blockTag,
      token
    );
  }

  /**
   * Returns all token balances of the account.
   */
  async getAllBalances(): Promise<BalancesMap> {
    if (!this._providerL2) throw new Error('Provider is not initialized');
    return await this._providerL2.getAllAccountBalances(
      await this.getAddress()
    );
  }

  /**
   * Returns the deployment nonce of the account.
   */
  async getDeploymentNonce(): Promise<bigint> {
    return await INonceHolder__factory.connect(
      NONCE_HOLDER_ADDRESS,
      this._signerL2
    ).getDeploymentNonce(await this.getAddress());
  }

  /**
   * Returns L2 bridge contracts.
   */
  async getL2BridgeContracts(): Promise<{
    erc20: IL2Bridge;
    weth: IL2Bridge;
    shared: IL2SharedBridge;
  }> {
    if (!this._providerL2) throw new Error('Provider is not initialized');
    const addresses = await this._providerL2.getDefaultBridgeAddresses();
    return {
      erc20: IL2Bridge__factory.connect(addresses.erc20L2, this._signerL2),
      weth: IL2Bridge__factory.connect(
        addresses.wethL2 || addresses.erc20L2,
        this._signerL2
      ),
      shared: IL2SharedBridge__factory.connect(
        addresses.sharedL2,
        this._signerL2
      ),
    };
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
  async withdraw(transaction: {
    amount: BigNumberish;
    to: Address;
    paymasterParams?: PaymasterParams;
    overrides?: ethers.Overrides;
  }): Promise<TransactionResponse> {
    if (!this._providerL2) throw new Error('Provider is not initialized');
    const withdrawTx = await this._providerL2.getWithdrawTx({
      from: await this.getAddress(),
      ...transaction,
    });
    return (await this.sendTransaction(withdrawTx)) as TransactionResponse;
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
  async transfer(transaction: {
    to: Address;
    amount: BigNumberish;
    token?: Address;
    paymasterParams?: PaymasterParams;
    overrides?: ethers.Overrides;
  }): Promise<TransactionResponse> {
    if (!this._providerL2) throw new Error('Provider is not initialized');
    const transferTx = await this._providerL2.getTransferTx({
      from: await this.getAddress(),
      ...transaction,
    });
    return (await this.sendTransaction(transferTx)) as TransactionResponse;
  }

  protected _fillCustomData(data: Eip712Meta): Eip712Meta {
    const customData = {...data};
    customData.gasPerPubdata ??= DEFAULT_GAS_PER_PUBDATA_LIMIT;
    customData.factoryDeps ??= [];
    return customData;
  }
}

// This method checks if the overrides contain a gasPrice (or maxFeePerGas),
// if not it will insert the maxFeePerGas
async function insertGasPrice(
  l1Provider: ethers.Provider,
  overrides: ethers.Overrides
): Promise<void> {
  if (!overrides.gasPrice && !overrides.maxFeePerGas) {
    const l1FeeData = await l1Provider.getFeeData();

    // check if plugin is used to fetch fee data
    const network = await l1Provider.getNetwork();
    const plugin = <FetchUrlFeeDataNetworkPlugin>(
      network.getPlugin('org.ethers.plugins.network.FetchUrlFeeDataPlugin')
    );
    if (plugin) {
      overrides.gasPrice = l1FeeData.gasPrice;
      overrides.maxFeePerGas = l1FeeData.maxFeePerGas;
      overrides.maxPriorityFeePerGas = l1FeeData.maxPriorityFeePerGas;
      return;
    }

    // Sometimes baseFeePerGas is not available, so we use gasPrice instead.
    const baseFee = l1FeeData.maxFeePerGas
      ? getBaseCostFromFeeData(l1FeeData)
      : l1FeeData.gasPrice;
    if (!baseFee) {
      throw new Error('Failed to calculate base fee!');
    }

    // ethers.js by default uses multiplication by 2, but since the price for the L2 part
    // will depend on the L1 part, doubling base fee is typically too much.
    overrides.maxFeePerGas =
      (baseFee * 3n) / 2n + (l1FeeData.maxPriorityFeePerGas ?? 0n);
    overrides.maxPriorityFeePerGas = l1FeeData.maxPriorityFeePerGas;
  }
}

function getBaseCostFromFeeData(feeData: ethers.FeeData): bigint {
  const maxFeePerGas = feeData.maxFeePerGas!;
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas!;

  // Reverse the logic implemented in the abstract-provider.ts (line 917)
  return (maxFeePerGas - maxPriorityFeePerGas) / 2n;
}
