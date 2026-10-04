#![allow(unexpected_cfgs)]
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{account_info::{next_account_info, AccountInfo}, entrypoint, entrypoint::ProgramResult, program::{invoke, invoke_signed}, program_error::ProgramError, pubkey::Pubkey, system_instruction, system_program, sysvar::{clock::Clock, rent::Rent, Sysvar}};
entrypoint!(process_instruction);
const SIZE: usize = 148;
const SHARE: u64 = 10_000_000;
#[derive(BorshSerialize, BorshDeserialize)]
struct Booking { version: u8, hotel: Pubkey, participants: [Pubkey;3], share: u64, deadline: i64, deposits: u8, refunds: u8, paid: bool }
fn check(ok: bool, code: u32) -> ProgramResult { if ok {Ok(())} else {Err(ProgramError::Custom(code))} }
// 1 unauthorized, 2 deadline, 3 already deposited, 4 not fully funded,
// 5 terminal booking, 6 refund unavailable, 7 invalid configuration.
pub fn process_instruction(id: &Pubkey, accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
 let iter = &mut accounts.iter();
 let actor = next_account_info(iter)?;
 let escrow = next_account_info(iter)?;
 check(actor.is_signer && actor.is_writable && escrow.is_writable, 1)?;
 let now = Clock::get()?.unix_timestamp;
 match data.first().copied() {
 Some(0) => {
  check(data.len() == 145, 7)?;
  let nonce = &data[1..9];
  let hotel = Pubkey::new_from_array(data[9..41].try_into().unwrap());
  let participants: [Pubkey;3] = std::array::from_fn(|i| Pubkey::new_from_array(data[41+i*32..73+i*32].try_into().unwrap()));
  let deadline = i64::from_le_bytes(data[137..145].try_into().unwrap());
  check(deadline > now && deadline <= now + 86400 && hotel != Pubkey::default() && participants.contains(actor.key), 7)?;
  for i in 0..3 { check(participants[i] != Pubkey::default() && participants[i] != hotel && participants[i] != *escrow.key,7)?; for j in 0..i {check(participants[i]!=participants[j],7)?;} }
  check(hotel != *escrow.key,7)?;
  let (pda,bump) = Pubkey::find_program_address(&[b"crewfund",actor.key.as_ref(),nonce],id);
  check(pda == *escrow.key && escrow.owner == &system_program::ID && escrow.data_is_empty(),7)?;
  let system = next_account_info(iter)?; check(*system.key == system_program::ID,7)?;
  invoke_signed(&system_instruction::create_account(actor.key,escrow.key,Rent::get()?.minimum_balance(SIZE),SIZE as u64,id), &[actor.clone(),escrow.clone(),system.clone()], &[&[b"crewfund",actor.key.as_ref(),nonce,&[bump]]])?;
  let state = Booking {version:1,hotel,participants,share:SHARE,deadline,deposits:0,refunds:0,paid:false};
  state.serialize(&mut &mut escrow.try_borrow_mut_data()?[..])?;
 },
 Some(op @ 1..=3) => {
  check(data.len()==1 && escrow.owner==id && escrow.data_len()==SIZE,7)?;
  let mut state = Booking::try_from_slice(&escrow.try_borrow_data()?).map_err(|_|ProgramError::InvalidAccountData)?;
  check(state.version==1 && !state.paid,5)?;
  match op {
   1 => {
    check(now < state.deadline,2)?;
    let index = state.participants.iter().position(|p|p==actor.key).ok_or(ProgramError::Custom(1))?;
    let bit=1<<index; check(state.deposits & bit == 0,3)?;
    let system=next_account_info(iter)?; check(*system.key==system_program::ID,7)?;
    invoke(&system_instruction::transfer(actor.key,escrow.key,state.share), &[actor.clone(),escrow.clone(),system.clone()])?;
    state.deposits |= bit;
   },
   2 => {
    check(*actor.key==state.hotel,1)?; check(now<state.deadline,2)?;
    check(state.deposits==7 && state.refunds==0,4)?;
    move_lamports(escrow,actor,state.share.checked_mul(3).ok_or(ProgramError::ArithmeticOverflow)?)?;
    state.paid=true;
   },
   3 => {
    check(now>=state.deadline,2)?;
    let index=state.participants.iter().position(|p|p==actor.key).ok_or(ProgramError::Custom(1))?;
    let bit=1<<index; check(state.deposits & bit !=0 && state.refunds & bit ==0,6)?;
    move_lamports(escrow,actor,state.share)?; state.refunds |=bit;
   }, _=>unreachable!()
  }
  state.serialize(&mut &mut escrow.try_borrow_mut_data()?[..])?;
 }, _=>return Err(ProgramError::InvalidInstructionData)
 }
 Ok(())
}
fn move_lamports(from: &AccountInfo, to: &AccountInfo, amount:u64)->ProgramResult {
 let remaining=from.lamports().checked_sub(amount).ok_or(ProgramError::InsufficientFunds)?;
 check(remaining>=Rent::get()?.minimum_balance(SIZE),7)?;
 let receiving=to.lamports().checked_add(amount).ok_or(ProgramError::ArithmeticOverflow)?;
 **from.try_borrow_mut_lamports()?=remaining; **to.try_borrow_mut_lamports()?=receiving; Ok(())
}
