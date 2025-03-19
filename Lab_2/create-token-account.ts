import "dotenv/config";

import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { getKeypairFromEnvironment, getExplorerLink } from "@solana-developers/helpers";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";

const MINT = new PublicKey("EibYBrdnUusQ8sJ7vdffmVW596hGStbs9sWV4k3EV6KD");

async function mintToken(amount: number, mint: PublicKey) {
    console.log("Minting token to account...");

    const connection = new Connection(clusterApiUrl("devnet"));
    const keypair = getKeypairFromEnvironment("SECRET_KEY");

    const ata = await getOrCreateAssociatedTokenAccount(
        connection,
        keypair,
        mint,
        keypair.publicKey,
    );

    const sig = await mintTo(connection, keypair, mint, ata.address, keypair, amount);

    const link = getExplorerLink("tx",sig, "devnet");
    console.log("Mint completed here: ", link);
}

mintToken(10 * 10 ** 9, MINT);