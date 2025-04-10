import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { Escrow } from "../target/types/escrow";
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, SendTransactionError, SystemProgram, Transaction } from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccount, createMint, getAccount, getAssociatedTokenAddress, getAssociatedTokenAddressSync, mintTo, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { assert, expect } from "chai";

const TOKEN_PROGRAM: typeof TOKEN_2022_PROGRAM_ID | typeof TOKEN_PROGRAM_ID = TOKEN_2022_PROGRAM_ID;

describe("escrow", () => {
  // Configure the client to use the local cluster.
  const provider  = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.escrow as Program<Escrow>;

  let maker: Keypair;
  let taker: Keypair;
  let makerAtaTokenA: PublicKey;
  let makerAtaTokenB: PublicKey;
  let takerAtaTokenA: PublicKey;
  let takerAtaTokenB: PublicKey;
  let mintA: PublicKey;
  let mintB: PublicKey;

  const mintAmount: number = 10000;

  const accounts: Record<string, PublicKey> = {
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  };

  const tokenAOfferedAmount = new BN(mintAmount);
  const tokenBWantedAmount = new BN(mintAmount);

  before(async () => {
    maker = Keypair.generate();
    taker = Keypair.generate();

    const fundAmount = 1e16;
    const fundTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: provider.wallet.publicKey,
        toPubkey: maker.publicKey,
        lamports: fundAmount,
      })
    );

    const txSignature = await sendAndConfirmTransaction(
      provider.connection,
      fundTx,
      [provider.wallet.payer],
    )

    console.log("Funded maker account with 0.1 SOL:", txSignature);

    mintA = await createMint(
      provider.connection,
      provider.wallet.payer,
      provider.wallet.publicKey,
      null,
      4
    );
    mintB = await createMint(
      provider.connection,
      provider.wallet.payer,
      provider.wallet.publicKey,
      null,
      4
    );

    console.log("Created mintA: ", mintA.toBase58());

    makerAtaTokenA = await createAssociatedTokenAccount(
      provider.connection,
      provider.wallet.payer,
      mintA,
      maker.publicKey
    );

    makerAtaTokenB = await createAssociatedTokenAccount(
      provider.connection,
      provider.wallet.payer,
      mintB,
      maker.publicKey
    );

    takerAtaTokenA = await createAssociatedTokenAccount(
      provider.connection,
      provider.wallet.payer,
      mintA,
      taker.publicKey
    );

    takerAtaTokenB = await createAssociatedTokenAccount(
      provider.connection,
      provider.wallet.payer,
      mintB,
      taker.publicKey
    );
    console.log("Got the maker AtA for token A: ", makerAtaTokenA)

    await mintTo(
      provider.connection,
      provider.wallet.payer,
      mintA,
      makerAtaTokenA,
      provider.wallet.publicKey,
      mintAmount
    );
    let makerAtaBalance = await getAccount(provider.connection, makerAtaTokenA);
    console.log("Maker's token A balance: ", makerAtaBalance.amount.toString());

    await mintTo(
      provider.connection,
      provider.wallet.payer,
      mintB,
      takerAtaTokenB,
      provider.wallet.publicKey,
      mintAmount
    );

    accounts.maker = maker.publicKey;
    accounts.taker = taker.publicKey;
    accounts.makerTokenAccountA = makerAtaTokenA;
    accounts.makerTokenAccountB = makerAtaTokenB;
    accounts.takerTokenAccountA = takerAtaTokenA;
    accounts.takerTokenAccountB = takerAtaTokenB;
    accounts.tokenMintA = mintA;
    accounts.tokenMintB = mintB;
  });

  it("Makes an offer successfully", async () => {
    const offerId = new BN(1234);

    const offer = PublicKey.findProgramAddressSync(
      [Buffer.from("offer"), accounts.maker.toBuffer(), offerId.toArrayLike(Buffer, "le", 8)],
      program.programId
    )[0];

    const vault = await getAssociatedTokenAddress(accounts.tokenMintA, offer, true, TOKEN_PROGRAM_ID);

    accounts.offer = offer;
    accounts.vault = vault;

    const txSig = await program.methods
      .makeOffer(offerId, tokenAOfferedAmount, tokenBWantedAmount)
      .accounts({ ...accounts })
      .signers([maker])
      .rpc();

    const rpcSig = await provider.connection.confirmTransaction(txSig, "confirmed");
    console.log("Offer transaction signature: ", rpcSig);

     // Check our vault contains the tokens offered
     const vaultBalanceResponse = await provider.connection.getTokenAccountBalance(vault);
     const vaultBalance = new BN(vaultBalanceResponse.value.amount);
     assert(vaultBalance.eq(tokenAOfferedAmount));
 
     // Check our Offer account contains the correct data
     const offerAccount = await program.account.offer.fetch(offer);
 
     assert(offerAccount.maker.equals(maker.publicKey));
     assert(offerAccount.tokenMintA.equals(accounts.tokenMintA));
     assert(offerAccount.tokenMintB.equals(accounts.tokenMintB));
     assert(offerAccount.tokenBWantedAmount.eq(tokenBWantedAmount));
  });
  
  it("Takes an offer sucessfully", async () => {
    const txSig = await program.methods
    .takeOffer()
    .accounts({ ...accounts })
    .signers([taker])
    .rpc();

    await provider.connection.confirmTransaction(txSig, "confirmed");

    // Check the offered tokens are now in Bob's account
    // (note: there is no before balance as Bob didn't have any offered tokens before the transaction)
    const bobTokenAccountBalanceAfterResponse = await provider.connection.getTokenAccountBalance(accounts.takerTokenAccountA);
    const bobTokenAccountBalanceAfter = new BN(bobTokenAccountBalanceAfterResponse.value.amount);
    assert(bobTokenAccountBalanceAfter.eq(tokenAOfferedAmount));

    // Check the wanted tokens are now in Alice's account
    // (note: there is no before balance as Alice didn't have any wanted tokens before the transaction)
    const aliceTokenAccountBalanceAfterResponse = await provider.connection.getTokenAccountBalance(accounts.makerTokenAccountB);
    const aliceTokenAccountBalanceAfter = new BN(aliceTokenAccountBalanceAfterResponse.value.amount);
    assert(aliceTokenAccountBalanceAfter.eq(tokenBWantedAmount));
  });
});
