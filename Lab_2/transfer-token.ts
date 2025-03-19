import "dotenv/config";

import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { getKeypairFromEnvironment, getExplorerLink } from "@solana-developers/helpers";
import { getAssociatedTokenAddressSync, getOrCreateAssociatedTokenAccount, mintTo, transferChecked } from "@solana/spl-token";

const MINT = new PublicKey("EibYBrdnUusQ8sJ7vdffmVW596hGStbs9sWV4k3EV6KD");
const SRC = new PublicKey("2k9r6ADiUpDA6SyuuAVVTSqJW7KVfaYz88oipJKdqvsT");
const DST = new PublicKey("qbE2wbpMhPrqhTqLVU5yPCo4oNG7s9Ei5o84ZJe41p8");

async function transferToken(mint: PublicKey, src: PublicKey, dst: PublicKey) {
    console.log(`Transfering token ${mint} from ${src} to ${dst}`);

    const connection = new Connection(clusterApiUrl("devnet"));
    const kp = getKeypairFromEnvironment("SECRET_KEY");

    const srcAta = getAssociatedTokenAddressSync(mint, src);
    const dstAta = await getOrCreateAssociatedTokenAccount(connection, kp, mint, dst);
    
    const sig = await transferChecked(
        connection,
        kp,
        srcAta,
        mint,
        dstAta.address,
        kp,
        1,
        9
    )

    const link = getExplorerLink("tx",sig, "devnet");
    console.log("Transfer completed here: ", link);
}

transferToken(MINT, SRC, DST);