import BitcoinClient from 'bitcoin-core';
import * as btc from '@scure/btc-signer';
import { hex } from '@scure/base';
import { secp256k1 } from '@noble/curves/secp256k1';
const client = new BitcoinClient({
    host: 'http://127.0.0.1:18443',
    username: 'rpcuser',
    password: 'rpcpassword',
    wallet: 'Watcher',
});
const PUBLIC_KEY = 'bcrt1qx2lk0unukm80qmepjp49hwf9z6xnz0s73k9j56';
const PRIVATE_KEY = 'cVZduZu265sWeAqFYygoDEE1FZ7wV9rpW5qdqjRkUehjaUMWLT1R';
const L2_RECEIVER = '36615Cf349d7F6344891B1e7CA7C72883F5dc049';
// Function to get UTXOs for a specific address
async function deposit(amount) {
    const utxos = await client.command('listunspent', 1, null, [PUBLIC_KEY]);
    console.log(utxos);
    const regtest = {
        bech32: 'bcrt',
        pubKeyHash: 0x6f,
        scriptHash: 0xc4,
        wif: 0xef,
    };
    const privateKey = btc.WIF(regtest).decode(PRIVATE_KEY);
    const pubKey = secp256k1.getPublicKey(privateKey, true);
    const spend = btc.p2wpkh(pubKey, regtest);
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
            address: 'bcrt1pw53jtgez0wf69n06fchp0ctk48620zdscnrj8heh86wykp9mv20q7vd3gm',
            amount, // amount in satoshi
        },
        {
            script: btc.Script.encode(['RETURN', hex.decode(L2_RECEIVER)]),
            amount: 0n
        },
    ];
    console.log(inputs);
    const selected = btc.selectUTXO(inputs, outputs, 'default', {
        changeAddress: PUBLIC_KEY, // required, address to send change
        // TODO: check the gas from the seqvencer
        feePerByte: 2n, // require, fee per vbyte in satoshi
        bip69: true, // lexicographical Indexing of Transaction Inputs and Outputs
        createTx: true, // create tx with selected inputs/outputs
        network: regtest,
        allowUnknownOutputs: true, // required for OP_RETURN
    });
    console.log(selected);
    if (!selected || !selected.tx)
        throw new Error('UTXO selection strategy failed');
    const { tx } = selected;
    tx.sign(privateKey);
    tx.finalize();
    const rawTx = hex.encode(tx.extract());
    const txid = await client.command('sendrawtransaction', rawTx);
    console.log('Transaction successfully broadcasted. TXID:', txid);
    return txid;
}
deposit(70000000n)
    .then(txid => console.log('Success! Transaction ID:', txid))
    .catch(err => console.error('Transaction failed:', err));
//# sourceMappingURL=deposit.js.map