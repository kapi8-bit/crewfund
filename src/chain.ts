import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import { Buffer } from 'buffer';
export const SHARE = 10_000_000;
export const RPC = import.meta.env?.VITE_RPC_URL || 'http://127.0.0.1:8899';
export const PROGRAM = import.meta.env?.VITE_PROGRAM_ID || '';
export const connection = new Connection(RPC, 'confirmed');
export type Booking = { hotel: PublicKey; participants: PublicKey[]; share: number; deadline: number; deposits: number; refunds: number; paid: boolean };
export function decode(data: Buffer): Booking {
 if (data.length !== 148 || data[0] !== 1) throw Error('Invalid CrewFund account');
 return {hotel:new PublicKey(data.subarray(1,33)),participants:[0,1,2].map(i=>new PublicKey(data.subarray(33+i*32,65+i*32))),share:Number(data.readBigUInt64LE(129)),deadline:Number(data.readBigInt64LE(137)),deposits:data[145],refunds:data[146],paid:data[147]===1};
}
export function initializeIx(program: PublicKey, creator: PublicKey, hotel: PublicKey, participants: PublicKey[], deadline:number, nonce: bigint) {
 const n=Buffer.alloc(8); n.writeBigUInt64LE(nonce);
 const [escrow]=PublicKey.findProgramAddressSync([Buffer.from('crewfund'),creator.toBuffer(),n],program);
 const d=Buffer.alloc(145);d[0]=0;n.copy(d,1);hotel.toBuffer().copy(d,9); participants.forEach((p,i)=>p.toBuffer().copy(d,41+i*32));d.writeBigInt64LE(BigInt(deadline),137);
 return {escrow,ix:new TransactionInstruction({programId:program,keys:[{pubkey:creator,isSigner:true,isWritable:true},{pubkey:escrow,isSigner:false,isWritable:true},{pubkey:SystemProgram.programId,isSigner:false,isWritable:false}],data:d})};
}
export function actionIx(program:PublicKey, actor:PublicKey, escrow:PublicKey, op:1|2|3) {
 return new TransactionInstruction({programId:program,keys:[{pubkey:actor,isSigner:true,isWritable:true},{pubkey:escrow,isSigner:false,isWritable:true},...(op===1?[{pubkey:SystemProgram.programId,isSigner:false,isWritable:false}]:[])],data:Buffer.from([op])});
}
export async function send(connection:Connection, signer:Keypair, ix:TransactionInstruction) {
 const block=await connection.getLatestBlockhash();
 const tx=new Transaction({...block,feePayer:signer.publicKey}).add(ix);tx.sign(signer);
 const signature=await connection.sendRawTransaction(tx.serialize());
 const receipt=await connection.confirmTransaction({...block,signature},'confirmed');
 if(receipt.value.err) throw Error(JSON.stringify(receipt.value.err));
 return signature;
}
