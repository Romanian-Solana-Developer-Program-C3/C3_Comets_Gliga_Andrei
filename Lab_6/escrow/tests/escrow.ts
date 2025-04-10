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
  let tokenA: Keypair;
  let tokenB: Keypair;
  let makerAtaTokenA: PublicKey;
  let vault: PublicKey;
  let offerPda: PublicKey;
  let mintA: PublicKey;
  let mintB: PublicKey;
  let mintAmount: number;

  const accounts: Record<string, PublicKey> = {
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  };

  const tokenAOfferedAmount = new BN(1000);
  const tokenBWantedAmount = new BN(1000);

  before(async () => {
    maker = Keypair.generate();

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
    console.log("Got the maker AtA for token A: ", makerAtaTokenA)
    mintAmount = 10000;
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

    accounts.maker = maker.publicKey;
    accounts.makerTokenAccountA = makerAtaTokenA;
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
    
});
