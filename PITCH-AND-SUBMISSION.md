# CrewFund — pitch draft

## Slide 1 — Shared plans. Individual control.

CrewFund lets three friends fund a shared accommodation booking without putting pooled funds under one friend's control.

## Slide 2 — The group-payment problem

One student normally collects everyone's money. The group has to trust that person to pay the provider and return contributions if the plan fails. CrewFund makes the narrow payment rules explicit and enforceable.

## Slide 3 — Three steps

Each student deposits 0.01 Test SOL. The fixed hotel confirms only when all three deposits exist and before the deadline. If it does not confirm in time, each student can claim their own contribution once.

## Slide 4 — Why Solana

A program-owned PDA holds the pooled funds. Signatures enforce who can deposit, confirm and refund. Immutable booking terms and an irreversible paid state prevent private group withdrawals and double refunds. The demonstrated deployment has no upgrade authority.

## Slide 5 — What works today

English React/TypeScript group and hotel views, four separate test wallets, real program transactions and confirmed Localnet signatures. Five validator integration tests verify payout balances, deadline/refund behavior and unauthorized actions. The full browser flow was exercised successfully.

**Current honest network claim: Localnet. Devnet funding is blocked by faucet rate limits; no Devnet proof is claimed.** Update this slide only after deployment and transaction verification on Devnet.

## Slide 6 — Scope and next step

A fictional test hotel, 0.03 Test SOL total, no real booking and no real-money payment. Next: independently controlled wallets through a wallet adapter, provider booking integration, external security review and Devnet demonstration. These are future work, not existing features.

## 60-second spoken pitch

“Three students want to book one room together. Usually, one friend collects all the money, and everyone has to trust that friend. CrewFund replaces that custody problem with a small Solana escrow. Each student deposits their fixed share. No student can withdraw the pooled money. Only the hotel wallet can confirm a fully funded booking before the deadline and receive the payment. If the hotel does not confirm in time, every depositor can recover only their own share, exactly once. Our prototype includes a group view, a hotel view and real transactions on a local Solana validator. Five integration tests verify successful payment, failed funding, unauthorized actions and repeated claims. This demo uses a fictional hotel and only Test SOL.”

## Submission draft

**Name:** CrewFund

**Tagline:** Shared accommodation funding with individual refund rights.

**Description:** CrewFund is a minimal Solana escrow prototype for three students booking a fictional test hotel together. Each fixed participant deposits 0.01 Test SOL once. The pooled 0.03 Test SOL can be paid only to the predefined hotel, with its signature, before the deadline and after complete funding. Without timely confirmation, each depositor can reclaim only their own contribution once. The prototype has English React/TypeScript group and hotel views and a native Rust program. The Localnet deployment is immutable and five validator integration tests pass. Devnet deployment is pending test-SOL funding. No real reservation, euro payment or production readiness is claimed.

**Technology:** Solana native Rust, program-owned PDA, Agave local test validator, React, TypeScript, Vite, web3.js.

**Evidence:** `evidence-localnet.txt`, `README.md`, source program and integration tests. Localnet transaction IDs are not public Explorer proofs.

## WHU submission requirements

- Listing: **Build an MVP with Solana at WHU**, Superteam Germany, https://superteam.fun/earn/listing/build-at-whu.
- Deadline supplied by the participant: **4 October 2026, 23:59 Europe/Berlin**. Treat this as the hard deadline.
- Participation at WHU Hackathon 2026: confirmed by the user.
- Put a **public pitch-deck link** in the **Bounty submission link** field.
- Provide a **public GitHub repository**. The user now has the GitHub account **kapi8-bit**. Public repository: https://github.com/kapi8-bit/crewfund.
- Follow **https://x.com/SuperteamDE**. This is a listed prerequisite, not yet confirmed by the user.
- Superteam requires Google/email login before its submission form opens. The user must handle authentication and any agreement to its terms.
- Add team details and the two public URLs after publishing the sanitized source and deck.
- A short demo video would help reviewers, but the visible listing does not explicitly require one.
- If Devnet becomes available, replace the network status only after verifying deployment, no upgrade authority and real Devnet signatures.
- The seven-slide **CrewFund-WHU-pitch.pptx** and matching **CrewFund-WHU-pitch.pdf** are in the parent outputs directory and copied under `pitch/` in the publication package. They include a proposed first-user pilot through student clubs, as requested by the listing. No recruitment or partnerships are claimed.
- This submission text is a draft. No submission has been sent, no repository has been published, and the local PDF path is not a public deck link.

## Public links

Repository: https://github.com/kapi8-bit/crewfund

Bounty submission link (pitch deck): https://github.com/kapi8-bit/crewfund/blob/main/pitch/CrewFund-WHU-pitch.pdf

No submission has been sent yet.
