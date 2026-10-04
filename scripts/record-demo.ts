import {readFileSync,writeFileSync} from 'node:fs';
import {Keypair,Connection,PublicKey} from '@solana/web3.js';
import {actionIx,send} from '../src/chain.js';
const config=JSON.parse(readFileSync('public-demo.json','utf8'));
if(!config.rpc.includes('127.0.0.1')&&!config.rpc.includes('localhost')&&!config.rpc.includes('devnet'))throw Error('Test clusters only');
const c=new Connection(config.rpc,'confirmed');
const program=new PublicKey(config.programId);const escrow=new PublicKey(config.escrow);
const signatures=[];
for(const name of ['alex','sam','jordan']){const k=Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(`.secrets/${name}.json`,'utf8'))));signatures.push({action:`${name} deposit`,signature:await send(c,k,actionIx(program,k.publicKey,escrow,1))});}
const hotel=Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync('.secrets/hotel.json','utf8'))));
const signature=await send(c,hotel,actionIx(program,hotel.publicKey,escrow,2));signatures.push({action:'hotel confirmation',signature});
const tx=await c.getTransaction(signature,{commitment:'confirmed',maxSupportedTransactionVersion:0});if(!tx?.meta||tx.meta.err)throw Error('No confirmed successful payout metadata');
writeFileSync('demo-transaction-transcript.json',JSON.stringify({network:config.rpc.includes('devnet')?'Devnet':'Localnet',rpc:config.rpc,escrow:config.escrow,signatures,payoutTransaction:tx},null,2));
console.log(signature);
