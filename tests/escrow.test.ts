import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Connection,Keypair,PublicKey} from '@solana/web3.js';
import {initializeIx,actionIx,send,decode,SHARE} from '../src/chain.js';
const c=new Connection(process.env.RPC_URL||'http://127.0.0.1:8899','confirmed');
const program=new PublicKey(JSON.parse(readFileSync('.secrets/config.json','utf8')).programId);
let nonce=BigInt(Date.now());
async function fund(k:Keypair){const s=await c.requestAirdrop(k.publicKey,100_000_000);const b=await c.getLatestBlockhash();await c.confirmTransaction({...b,signature:s},'confirmed');}
async function fixture(seconds=60){
 const members=[Keypair.generate(),Keypair.generate(),Keypair.generate()];const hotel=Keypair.generate(); const stranger=Keypair.generate();
 for(const k of [...members,hotel,stranger]) await fund(k);
 const slot=await c.getSlot();const now=(await c.getBlockTime(slot))!;
 const {escrow,ix}=initializeIx(program,members[0].publicKey,hotel.publicKey,members.map(k=>k.publicKey),now+seconds,nonce++);
 await send(c,members[0],ix);
 return {members,hotel,stranger,escrow,init:ix,action:(k:Keypair,op:1|2|3)=>send(c,k,actionIx(program,k.publicKey,escrow,op)),state:async()=>decode((await c.getAccountInfo(escrow))!.data)};
}
async function rejected(f:()=>Promise<unknown>,code:number){await assert.rejects(f,new RegExp(`custom program error: 0x${code.toString(16)}`));}
async function expired(f:Awaited<ReturnType<typeof fixture>>){while((await c.getBlockTime(await c.getSlot()))!<(await f.state()).deadline)await new Promise(r=>setTimeout(r,400));}
test('fully funded escrow: only fixed hotel receives exactly 0.03 SOL; refund and repeat payout blocked',async()=>{
 const f=await fixture();for(const k of f.members)await f.action(k,1);
 await rejected(()=>f.action(f.stranger,2),1);await rejected(()=>f.action(f.members[0],2),1);
 const balance=await c.getBalance(f.hotel.publicKey);const escrowBefore=await c.getBalance(f.escrow);
 const signature=await f.action(f.hotel,2);const tx=await c.getTransaction(signature,{commitment:'confirmed',maxSupportedTransactionVersion:0});assert(tx?.meta);
 assert.equal(await c.getBalance(f.hotel.publicKey),balance+SHARE*3-tx.meta.fee);
 assert.equal(await c.getBalance(f.escrow),escrowBefore-SHARE*3);assert.equal((await f.state()).paid,true);
 await rejected(()=>f.action(f.hotel,2),5);await rejected(()=>f.action(f.members[0],3),5);
 console.log('LOCAL VALIDATOR payout signature:',signature);
});
test('failed funding: deadline enforced, each depositor refunds own share once, payout excluded',async()=>{
 const f=await fixture(12);await f.action(f.members[0],1);await f.action(f.members[1],1);
 await rejected(()=>f.action(f.hotel,2),4);await rejected(()=>f.action(f.members[0],3),2);
 await expired(f);await rejected(()=>f.action(f.members[2],1),2);await rejected(()=>f.action(f.hotel,2),2);
 await rejected(()=>f.action(f.stranger,3),1);await rejected(()=>f.action(f.members[2],3),6);
 for(const k of f.members.slice(0,2)){
  const before=await c.getBalance(k.publicKey);const signature=await f.action(k,3);const tx=await c.getTransaction(signature,{commitment:'confirmed',maxSupportedTransactionVersion:0});assert(tx?.meta);
  assert.equal(await c.getBalance(k.publicKey),before+SHARE-tx.meta.fee);await rejected(()=>f.action(k,3),6);
  console.log('LOCAL VALIDATOR refund signature:',signature);
 }
 assert.equal((await f.state()).refunds,3);assert.equal((await f.state()).paid,false);
});
test('duplicate/unauthorized deposits rejected; terms cannot be reinitialized',async()=>{
 const f=await fixture();await rejected(()=>f.action(f.stranger,1),1);await f.action(f.members[0],1);await rejected(()=>f.action(f.members[0],1),3);
 await rejected(()=>send(c,f.members[0],f.init),7);
 const ix=actionIx(program,f.members[0].publicKey,f.escrow,1);ix.data=Buffer.from([4]);await assert.rejects(()=>send(c,f.members[0],ix));
 const state=await f.state();assert.equal(state.share,SHARE);assert.deepEqual(state.participants.map(p=>p.toBase58()),f.members.map(k=>k.publicKey.toBase58()));assert.equal(state.hotel.toBase58(),f.hotel.publicKey.toBase58());
});
test('fully funded but unconfirmed booking: all three can refund after deadline; no provider payout',async()=>{
 const f=await fixture(12);for(const k of f.members)await f.action(k,1);await expired(f);
 await rejected(()=>f.action(f.hotel,2),2);for(const k of f.members)await f.action(k,3);
 assert.equal((await f.state()).refunds,7);assert.equal((await f.state()).paid,false);
 assert.equal(await c.getBalance(f.escrow),await c.getMinimumBalanceForRentExemption(148));
});
test('hotel cannot substitute an arbitrary recipient account for escrow',async()=>{
 const f=await fixture();for(const k of f.members)await f.action(k,1);
 const spoof=actionIx(program,f.hotel.publicKey,f.stranger.publicKey,2);
 await rejected(()=>send(c,f.hotel,spoof),7);assert.equal((await f.state()).paid,false);
});
