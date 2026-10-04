import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {Connection,Keypair} from '@solana/web3.js';
import {initializeIx,send} from '../src/chain.js';
const rpc=process.env.RPC_URL||'http://127.0.0.1:8899';
if(!rpc.includes('127.0.0.1') && !rpc.includes('localhost') && !rpc.includes('devnet'))throw Error('Test clusters only');
const c=new Connection(rpc,'confirmed');mkdirSync('.secrets',{recursive:true});
function wallet(name:string){const path=`.secrets/${name}.json`;if(existsSync(path))return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(path,'utf8'))));const k=Keypair.generate();writeFileSync(path,JSON.stringify([...k.secretKey]),{mode:0o600});return k;}
const program=wallet('program');const members=['alex','sam','jordan'].map(wallet);const hotel=wallet('hotel');
const config={programId:program.publicKey.toBase58(),rpc,members:members.map(k=>k.publicKey.toBase58()),hotel:hotel.publicKey.toBase58()};
writeFileSync('.secrets/config.json',JSON.stringify(config,null,2));
writeFileSync('.env.local',`VITE_PROGRAM_ID=${config.programId}\nVITE_RPC_URL=${rpc}\n`);
if(process.argv.includes('--wallets-only')){console.log('Wallets ready. Program ID:',config.programId);process.exit(0);}
const account=await c.getAccountInfo(program.publicKey);if(!account?.executable)throw Error('Deploy the program first. See README.');
for(const k of [...members,hotel]){
 if(await c.getBalance(k.publicKey)<50_000_000){const sig=await c.requestAirdrop(k.publicKey,100_000_000);const b=await c.getLatestBlockhash();await c.confirmTransaction({...b,signature:sig},'confirmed');}
}
const slot=await c.getSlot();const now=(await c.getBlockTime(slot))!;
const {escrow,ix}=initializeIx(program.publicKey,members[0].publicKey,hotel.publicKey,members.map(k=>k.publicKey),now+Number(process.env.DEMO_SECONDS||900),BigInt(Date.now()));
const signature=await send(c,members[0],ix);
// Only public configuration leaves .secrets. Wallets are imported explicitly in the browser.
writeFileSync('public-demo.json',JSON.stringify({...config,escrow:escrow.toBase58(),creationSignature:signature},null,2));
console.log('Booking created on',rpc,'\nEscrow:',escrow.toBase58(),'\nSignature:',signature);
