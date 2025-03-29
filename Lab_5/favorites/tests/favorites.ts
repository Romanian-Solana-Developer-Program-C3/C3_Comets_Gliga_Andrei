import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Favorites } from "../target/types/favorites";
import { assert } from "chai";

const web3 = anchor.web3;

describe("favorites", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const user = (anchor.getProvider().wallet as anchor.Wallet).payer;
  const program = anchor.workspace.favorites as Program<Favorites>;

  before(async () => {
    const balance = await anchor.getProvider().connection.getBalance(user.publicKey);
    const balanceInSol = balance / web3.LAMPORTS_PER_SOL;
    const formattedBalance = new Intl.NumberFormat().format(balanceInSol);
    console.log(`User's balance: ${formattedBalance} SOL`);
  });

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });

  it("Saves a favorite!", async () => {
    const favoriteColor = "blue";
    const favoriteNumber = 42;
    const favoriteName = "joe";

    await program.methods
    .setFavorite(favoriteColor, favoriteNumber, favoriteName)
    .signers([user])
    .rpc();

    const favoritesPdaAndBump = await web3.PublicKey.findProgramAddressSync(
      [Buffer.from("favorites"), user.publicKey.toBuffer()],
      program.programId
    );

    const favoritesPda = favoritesPdaAndBump[0];
    const dataFromPda = await program.account.favorite.fetch(favoritesPda);
    assert.equal(dataFromPda.color, favoriteColor);
    assert.equal(dataFromPda.number, favoriteNumber);
    assert.equal(dataFromPda.name, favoriteName);
  });

  it("Doesn't let people write to favorites for other users!", async () => {
    const someRandomGuy = web3.Keypair.generate();
    try {
      await program.methods
      .setFavorite("red", 100, "bob")
      .signers([someRandomGuy])
      .rpc();
    } catch (err) {
      const errorMessage = (err as Error).message;
      assert.isTrue(errorMessage.includes("unknown signer"));
    }
  });
});
