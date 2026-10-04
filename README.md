# CrewFund

Three students fund one fictional hotel booking using a real Solana escrow. Each share is **0.01 Test SOL**; the total is **0.03 Test SOL**. No euro payment and no real hotel reservation.

## Verified status — 4 October 2026

- **Working Localnet prototype**, using Agave 4.3.0 `solana-test-validator`.
- Native Rust program compiled with platform-tools v1.57, SBPFv3.
- Deployed program: `CsP2XV9HKm95uETQ2zY7TnETF4oxQ8GLnGYBme7isKgq`.
- Upgrade authority: **none** (deployment used `--final`).
- Five integration tests pass on the actual local validator. See [evidence-localnet.txt](evidence-localnet.txt). These signatures are local-chain records, **not Devnet Explorer proofs**.
- A separate recorded signed Localnet payment cycle includes the confirmed RPC transaction metadata in `demo-transaction-transcript.json` and its exact balance checks in `demo-payment-evidence.json`. It was driven by the recording script, separately from the exercised browser flow.
- React/TypeScript production build passed. Local preview: `http://127.0.0.1:5173`.
- Devnet RPC reachable; CLI airdrops rejected by rate limit and the web faucet rejected the new GitHub account. **No Devnet deployment claimed.**

## Contract rules

The PDA is derived from `crewfund`, the creating participant's public key, and a unique 64-bit booking nonce. It is owned by the program, has no private key, and holds both state and escrowed lamports. A system transfer to a private group wallet is not used as the escrow.

Creation fixes three distinct participants, one separate hotel wallet, a 0.01 SOL share and a future deadline (at most 24 hours). The creator must be one of the participants. There is no update, administrative withdrawal, or close instruction.

1. Before the deadline each fixed participant can deposit their fixed share exactly once. The transfer and deposit bit are atomic.
2. Only the fixed hotel can sign the confirmation, only before the deadline and only after all three deposits. Exactly 0.03 SOL goes to that same hotel account; no alternate recipient can be supplied. The paid flag permanently prevents refunds and repeated payouts.
3. At or after the deadline, if unpaid, each participant with a deposit can refund exactly their own share once. Refund and deposit bitmaps prevent repeated claims. Hotel confirmation is no longer possible. This also applies if all three deposited but the hotel did not confirm in time.
4. Rent stays in the account. Transaction fees are paid separately by the acting test wallet.

Instructions: `0` initialize, `1` deposit, `2` hotel confirm, `3` refund. State is 148 Borsh bytes. Error codes: 1 unauthorized, 2 deadline, 3 duplicate deposit, 4 incomplete funding, 5 already paid, 6 unavailable/duplicate refund, 7 invalid configuration/account.

## Start on a normal development machine

Install Node 22+ and Solana/Rust tools from the official installation instructions below. On macOS Rust normally needs Apple's Command Line Tools (`xcode-select --install`). No Anchor CLI is needed for this native Rust program.

From the project directory:

```sh
npm ci
npm run setup -- --wallets-only
cargo build-sbf --arch v3 --manifest-path program/Cargo.toml
```

The publication package also contains the **exact tested binary** at `artifacts/crewfund.so` (SHA-256 `c48476c63efe428b1c2d54d34dfdb4541f6091b4786808c34183c95bb540eab3`). If using that binary, skip the Rust build and replace `program/target/deploy/crewfund.so` with `artifacts/crewfund.so` in the deployment command. The binary uses the supplied runtime program ID, so you can deploy it under your newly generated test program keypair. Source and Cargo.lock are included for rebuilding.

In another terminal, keep the validator running:

```sh
solana-test-validator --ledger test-ledger --bind-address 127.0.0.1
```

Back in the project terminal:

```sh
solana airdrop 5 --url localhost --keypair .secrets/alex.json
solana-keygen new --no-bip39-passphrase --silent --outfile .secrets/buffer.json
solana program deploy program/target/deploy/crewfund.so \
  --url localhost --keypair .secrets/alex.json \
  --program-id .secrets/program.json --buffer .secrets/buffer.json --final
npm test
npm run setup
npm run dev
```

`--final` removes the upgrade authority. Test first with a new disposable program/validator if changing the contract. A finalized program cannot be modified; create a new program ID for a changed version.

`setup` generates four separate disposable keypairs under `.secrets/`, funds them with test SOL, and creates an empty 15-minute booking. Its printed public escrow address is also in `public-demo.json`. `.env.local` contains only the RPC URL and public program ID. `--wallets-only` generates keys/config without blockchain actions.

## This Codex workspace

Tooling is installed outside the deliverable under `../../work/toolchain/`. The machine initially had no Node/npm/Rust/Solana/Apple developer tools. The bundled Node executable and project-local npm were used. The successful Rust build used Solana's bundled LLVM with a temporary host-linker wrapper under `../../work/linker/`; no system settings were changed. For your own machine use the standard tools above.

To reopen this workspace after stopping the processes, run `bash scripts/workspace-start.sh`. It uses the existing immutable deployment and ledger. To create a fresh booking, run `bash scripts/workspace-setup.sh`. These helpers are specific to this Mac/workspace; the portable commands above are preferred elsewhere.

## Demo — about two minutes

1. Open `http://127.0.0.1:5173`. Expand **Demo setup & blockchain details** if needed.
2. Import `.secrets/alex.json`, `sam.json`, `jordan.json`, and `hotel.json` into the four matching file selectors. Finder: press **Cmd+Shift+G**, paste the full `.secrets` folder path, then choose the file. These keys remain only in page memory and are forgotten on reload. **Only disposable test wallets.**
3. Click **Create 10-minute booking** (all wallets must be funded), or paste the address from `public-demo.json` in **Open existing escrow**.
4. Acting as **Alex**, click **Deposit 0.01 Test SOL**. Repeat for Sam and Jordan. The status is read from RPC every three seconds.
5. Switch to **Hotel portal**. Click **Confirm booking & receive 0.03 Test SOL**. The hotel must sign; merely switching views is not authorization. Show the confirmed signature and the paid state.
6. For the failed-funding scenario create a short booking with `DEMO_SECONDS=30 npm run setup`, open its address and deposit only Alex's share. Wait for the on-chain deadline and click **Claim my refund**. The action becomes available when the RPC block time has reached the deadline.

All transaction receipts are shown only after RPC confirmation. Failed or rejected actions show errors rather than fake success. The browser supports Localnet and Devnet, and labels the network. Localnet signatures deliberately do not link to Devnet Explorer.

## Test evidence

`npm test` sends real signed transactions to the local validator, runs the compiled program, checks custom rejection codes, and verifies RPC account data and lamport balances **net of transaction fees**. It does not mock escrow logic.

| Scenario | Verified |
|---|---|
| Fully funded, hotel signs | Hotel receives exactly 30,000,000 lamports minus its fee; escrow decreases by 30,000,000 |
| Participant or stranger confirms | Custom unauthorized error; no payout |
| Failed funding | Early refund denied; deadline blocks deposits/payout; each depositor gets own share |
| Repeat refund / non-depositor refund | Custom refund-unavailable error |
| Repeat deposit / outsider deposit | Duplicate / unauthorized errors |
| Reinitialize same escrow / unknown instruction | Rejected; stored terms unchanged |
| Fully funded, hotel misses deadline | All three refund; only rent remains |
| Substitute account for escrow | Rejected by owner/size check |
| Payout vs refunds | Paid flag excludes refunds; deadline excludes payout after refunds |

Tests take roughly 45 seconds because deadline tests wait for real validator time. The test suite uses Localnet airdrops; do not run it against Devnet without providing separate funding.

## Devnet next step

Funding wallet: `6zeRiynm2SUqneF66UXrjzain7ntM6khBm4puW6mVyaa`. Request 2 **Devnet** SOL at the official faucet if CLI airdrops are rate limited; GitHub authentication may require your participation. No purchase of real SOL is needed.

After funding, deploy the **same tested .so** to Devnet with the same command and `--url devnet` instead of localhost. Use a fresh buffer keypair. Run `solana program show <PROGRAM_ID> --url devnet --keypair .secrets/alex.json` and verify `Authority: none`. Then:

```sh
RPC_URL=https://api.devnet.solana.com npm run setup
npm run dev
```

Devnet faucet limits may also block funding the other wallets. In that case transfer small amounts of **Devnet test SOL only** from the funded deployment wallet to the three other test wallets; these are fee/deposit top-ups, not an escrow replacement. Record the deployment and demo signatures and link them through Solana Explorer with `?cluster=devnet`. Do not describe the Localnet records as public Devnet transactions.

## Public GitHub preparation

Only publish source, manifests/lockfiles, README, public config, and evidence. `.gitignore` excludes `.secrets/`, `.env.local`, node_modules, build outputs, ledgers, and keypairs. Do not attach a folder archive containing `.secrets`. No credentials are embedded in frontend source. Public repository: [kapi8-bit/crewfund](https://github.com/kapi8-bit/crewfund).

Before committing:

```sh
git init
git add .
git diff --cached --name-only
# Ensure no .secrets, .env.local, keypairs, ledger or node_modules appear.
git commit -m "Build CrewFund test-SOL escrow prototype"
```

## Limits

- Hackathon prototype, not audited and not for Mainnet or real money.
- All four demo wallets are controlled on one machine; distinct on-chain signer checks still apply. Production requires participants and hotel to control their own wallets through a proper wallet adapter.
- A real hotel/legal booking integration is not implemented. Confirmation is the test hotel's on-chain signature.
- The fictitious offer is UI metadata; participant keys, provider, share and deadline are the enforced on-chain terms.
- Rent and unsolicited extra transfers remain locked; no account closure or excess-funds recovery.
- A third party pre-funding a predictable unused PDA can prevent creation of that nonce; use a fresh nonce. This does not let them change or withdraw an existing escrow.
- Frontend state depends on the RPC service and may lag by a few seconds. Contract checks use `Clock`, never the browser clock.
- Local validator transaction history is temporary. Older transaction lookups can return null even though the escrow account still records its paid state. The recorded transcript saves confirmed metadata immediately and the integration tests verify balances at execution time. None of these local files is a public Devnet attestation.
- Imported JSON keys are a deliberately minimal test-only demo mechanism. Never use real wallets. Do not publicly serve this development server.
- Current web3.js v1 dependency tree retains moderate npm advisory findings; this prototype uses it for the established small client API. Vite was updated to patched 7.3.6. Reassess dependencies and wallet/security integration before production.

## Official references checked

- [Solana installation](https://solana.com/docs/intro/installation)
- [Native Rust program development](https://solana.com/docs/programs/rust)
- [Program Derived Addresses](https://solana.com/docs/core/pda)
- [Solana accounts and ownership](https://solana.com/docs/core/accounts)
- [Official Devnet faucet](https://faucet.solana.com)

## WHU submission package

The listing [Build an MVP with Solana at WHU](https://superteam.fun/earn/listing/build-at-whu) requires a working Solana prototype, a pitch-deck link in the **Bounty submission link** field and a public GitHub repository. It also requires WHU Hackathon 2026 participation and following SuperteamDE on X. The user confirmed WHU participation, supplied a **4 October 2026 23:59 Europe/Berlin** deadline, and now has the GitHub account `kapi8-bit`. The public repository is [kapi8-bit/crewfund](https://github.com/kapi8-bit/crewfund). Superteam login remains pending. No submission has been sent.

The seven-slide deck is provided in `pitch/CrewFund-WHU-pitch.pptx` (editable) and `pitch/CrewFund-WHU-pitch.pdf` (fixed visual rendering). It covers the group-payment problem, enforced Solana rules, verified prototype, a proposed pilot with campus clubs and actual scope. `PITCH-AND-SUBMISSION.md` contains the short spoken pitch and submission description. Public deck link for the Bounty submission link field: [CrewFund pitch PDF](https://github.com/kapi8-bit/crewfund/blob/main/pitch/CrewFund-WHU-pitch.pdf).
