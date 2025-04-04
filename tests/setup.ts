import {Provider, Wallet, ContractFactory, Contract} from '../src';
import {ethers, Typed} from 'ethers';

import Token from './files/Token.json';
import Paymaster from './files/Paymaster.json';
import {L2_CHAIN_URL, PRIVATE_KEY1} from './utils';

const provider = new Provider(L2_CHAIN_URL);
const wallet = new Wallet(PRIVATE_KEY1, provider);

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

async function main() {
  console.log(`Wallet address: ${await wallet.getAddress()}`);
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
}

main()
  .then()
  .catch(error => {
    console.log(`Error: ${error}`);
  });
