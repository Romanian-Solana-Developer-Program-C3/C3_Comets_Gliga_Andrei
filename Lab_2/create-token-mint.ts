import "dotenv/config";

import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, clusterApiUrl, sendAndConfirmTransaction } from "@solana/web3.js";
import { getKeypairFromEnvironment, getExplorerLink } from "@solana-developers/helpers";
import { createMint } from "@solana/spl-token";

async function createTokenMint() {
    console.log("Creating token mint...");

    const connection = new Connection(clusterApiUrl("devnet"));
    const keypair = getKeypairFromEnvironment("SECRET_KEY");

    const mint = await createMint(connection, keypair, keypair.publicKey, null, 9);

    const link = getExplorerLink("address", mint.toBase58(), "devnet");
    console.log("Mint created here: ", link);
}
createTokenMint();