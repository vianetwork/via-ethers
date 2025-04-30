import {Provider, Wallet, ContractFactory, Contract} from '../src';
import {ethers, Typed} from 'ethers';

import Token from './files/Token.json';
import Paymaster from './files/Paymaster.json';
import {
  L1_ADDRESS1_LEGACY,
  L1_ADDRESS1_NATIVE_SEGWIT,
  L1_ADDRESS1_NESTED_SEGWIT,
  L1_ADDRESS1_TAPROOT,
  L1_CHAIN_PASSWORD,
  L1_CHAIN_URL,
  L1_CHAIN_USER,
  L1_CHAIN_WALLET,
  L1_PRIVATE_KEY1,
  L2_CHAIN_URL,
  PRIVATE_KEY1,
} from './utils';
import * as btc from '@scure/btc-signer';
import {secp256k1} from '@noble/curves/secp256k1';
import {UnspentTransactionOutput} from '../src/types';
import {hex} from '@scure/base';
import BitcoinClient from 'bitcoin-core';
import {REGTEST_NETWORK, sleep} from '../src/utils';

const provider = new Provider(L2_CHAIN_URL);
const wallet = new Wallet(PRIVATE_KEY1, provider);
const providerL1 = new BitcoinClient({
  host: L1_CHAIN_URL,
  username: L1_CHAIN_USER,
  password: L1_CHAIN_PASSWORD,
  wallet: L1_CHAIN_WALLET,
});

const SALT =
  '0x293328ad84b118194c65a0dc0defdb6483740d3163fd99b260907e15f2e2f642';
const TOKEN = '0x2dc3685cA34163952CF4A5395b0039c00DFa851D'; // deployed by using create2 and SALT
const PAYMASTER = '0x0EEc6f45108B4b806e27B81d9002e162BD910670'; // approval based paymaster for TOKEN deployed by using create2 and SALT

// Deploys token and approval based paymaster for that token using create2 method.
// Mints tokens to wallet and sends BTC to paymaster.
async function deployPaymasterAndToken(): Promise<{
  token: string;
  paymaster: string;
}> {
  const abi = Token.abi;
  const bytecode: string = Token.bytecode;
  const factory = new ContractFactory(abi, bytecode, wallet, 'create2');
  const tokenContract = (await factory.deploy('Crown', 'Crown', 18, {
    customData: {salt: SALT},
  })) as Contract;
  const tokenAddress = await tokenContract.getAddress();

  // mint tokens to wallet
  const mintTx = (await tokenContract.mint(
    Typed.address(await wallet.getAddress()),
    Typed.uint256(50)
  )) as ethers.ContractTransactionResponse;
  await mintTx.wait();

  const paymasterAbi = Paymaster.abi;
  const paymasterBytecode = Paymaster.bytecode;

  const accountFactory = new ContractFactory(
    paymasterAbi,
    paymasterBytecode,
    wallet,
    'create2Account'
  );

  const paymasterContract = await accountFactory.deploy(tokenAddress, {
    customData: {salt: SALT},
  });
  const paymasterAddress = await paymasterContract.getAddress();
  // transfer base token to paymaster so it could pay fee
  const faucetTx = await wallet.transfer({
    to: paymasterAddress,
    amount: ethers.parseEther('5'),
  });
  await faucetTx.wait();

  if (ethers.getAddress(TOKEN) !== ethers.getAddress(tokenAddress)) {
    throw new Error('token addresses mismatch');
  }

  if (ethers.getAddress(PAYMASTER) !== ethers.getAddress(paymasterAddress)) {
    throw new Error('paymaster addresses mismatch');
  }

  return {token: tokenAddress, paymaster: paymasterAddress};
}

async function deployDaiToken() {
  const abi = Token.abi;
  const bytecode: string = Token.bytecode;
  const factory = new ContractFactory(abi, bytecode, wallet, 'create2');
  const tokenContract = (await factory.deploy('Dai', 'Dai', 18, {
    customData: {salt: SALT},
  })) as Contract;
  const tokenAddress = await tokenContract.getAddress();

  // mint tokens to wallet
  const mintTx = (await tokenContract.mint(
    await wallet.getAddress(),
    1000
  )) as ethers.ContractTransactionResponse;
  await mintTx.wait();
  return tokenAddress;
}

async function sendBtcToAllAddressTypes() {
  const privateKey = btc.WIF(REGTEST_NETWORK).decode(L1_PRIVATE_KEY1);
  const publicKey = secp256k1.getPublicKey(privateKey, true);
  const spend = btc.p2wpkh(publicKey, REGTEST_NETWORK);

  const utxos: UnspentTransactionOutput[] = await providerL1.command(
    'listunspent',
    1,
    null,
    [L1_ADDRESS1_NATIVE_SEGWIT]
  );

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
      address: L1_ADDRESS1_NESTED_SEGWIT,
      amount: 3_000_000_000n,
    },
    {
      address: L1_ADDRESS1_TAPROOT,
      amount: 3_000_000_000n,
    },
    {
      address: L1_ADDRESS1_LEGACY,
      amount: 3_000_000_000n,
    },
  ];

  const feePerByte = await provider.getL1GasPrice();

  const selected = btc.selectUTXO(inputs, outputs, 'default', {
    changeAddress: L1_ADDRESS1_NATIVE_SEGWIT, // required, address to send change
    feePerByte,
    bip69: true,
    createTx: true,
    network: REGTEST_NETWORK,
  });

  if (!selected || !selected.tx)
    throw new Error('UTXO selection strategy failed');
  const {tx} = selected;
  tx.sign(privateKey);
  tx.finalize();

  const rawTx = hex.encode(tx.extract());
  return await providerL1.command('sendrawtransaction', rawTx);
}

async function sendToL2() {
  const wallet = new Wallet(
    PRIVATE_KEY1,
    provider,
    L1_PRIVATE_KEY1,
    L1_ADDRESS1_NATIVE_SEGWIT,
    providerL1,
    REGTEST_NETWORK
  );
  await wallet.deposit({
    to: wallet.address,
    amount: 10_000_000_000n,
  });
  await sleep(5000);
}

async function main() {
  console.log(`Wallet address: ${await wallet.getAddress()}`);
  console.log(`Wallet balance: ${await wallet.getBalance()}`);

  console.log('===== Sending tokens to L2 =====');
  await sendToL2();
  console.log(`Wallet balance: ${await wallet.getBalance()}`);

  console.log('===== Deploying DAI token =====');
  const dai = await deployDaiToken();
  console.log(`DAI: ${dai}`);
  console.log(`Wallet DAI balance: ${await wallet.getBalance(dai)}`);

  console.log('===== Deploying token and paymaster =====');
  const {token, paymaster} = await deployPaymasterAndToken();
  console.log(`Token: ${token}`);
  console.log(`Paymaster: ${paymaster}`);
  console.log(`Paymaster balance: ${await provider.getBalance(paymaster)}`);
  console.log(`Wallet Crown balance: ${await wallet.getBalance(token)}`);

  console.log('===== Sending BTC to all address types =====');
  await sendBtcToAllAddressTypes();
}

main()
  .then()
  .catch(error => {
    console.log(`Error: ${error}`);
  });
