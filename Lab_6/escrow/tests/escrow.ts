import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Escrow } from "../target/types/escrow";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

describe("escrow", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.escrow as Program<Escrow>;

  let offerMaker: Keypair;
  let offerAccount: Keypair;

  beforeEach(async () => {
    // Initialize keypairs for the offer maker and escrow account
    offerMaker = Keypair.generate();
    escrowAccount = Keypair.generate();

    // Airdrop SOL to the offer maker for testing
    const provider = anchor.AnchorProvider.env();
    const signature = await provider.connection.requestAirdrop(
      offerMaker.publicKey,
      anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);
  });

  it("Makes an offer successfully", async () => {
    // Define the parameters for the offer
    const offerAmount = new anchor.BN(1_000_000); // 1 SOL in lamports
    const expectedItem = "Item123"; // Example item identifier

    // Call the make_offer instruction
    await program.methods
      .make_offer(offerAmount, expectedItem)
      .accounts({
        offerMaker: offerMaker.publicKey,
        escrowAccount: escrowAccount.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([offerMaker, escrowAccount])
      .rpc();

    console.log("Offer made successfully!");

    // Fetch the escrow account to verify the state
    const escrowState = await program.account.escrow.fetch(
      escrowAccount.publicKey
    );

    // Assert the state of the escrow account
    expect(escrowState.offerMaker.toBase58()).equal(
      offerMaker.publicKey.toBase58()
    );
    expect(escrowState.offerAmount.toNumber()).equal(offerAmount.toNumber());
    expect(escrowState.expectedItem).equal(expectedItem);
  });
});
