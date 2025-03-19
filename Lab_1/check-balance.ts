import "dotenv/config";

import { airdropIfRequired,getKeypairFromEnvironment } from "@solana-developers/helpers";
import { Connection, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";



async function checkBalanceAndAirdrop() {
    try {
        const keypair = getKeypairFromEnvironment("SECRET_KEY");
        const pubKey = keypair.publicKey;
        console.log("Public Key: ", pubKey);

        const connection = new Connection(clusterApiUrl("devnet"));
        const balanceInLamports = await connection.getBalance(pubKey);
        console.log(pubKey.toString() + " has balance " + balanceInLamports / LAMPORTS_PER_SOL + " SOL");

        if (balanceInLamports < 5 * LAMPORTS_PER_SOL) {
            console.log("Wallet balance below 5 SOL, initiating airdrop");

            try {
                await airdropIfRequired(
                    connection,
                    pubKey,
                    LAMPORTS_PER_SOL,
                    5 * LAMPORTS_PER_SOL
                );

                console.log("Airdrop successful!");

                const newBalance = await connection.getBalance(pubKey);
                console.log("New balance: ", newBalance / LAMPORTS_PER_SOL);
            } catch(e) {
                console.error("Error during airdrop: ", e);
            }
        }
    } catch (e) {
        console.error("Error checking balance: ", e);
    }
}

console.log("Initiating check balance...");
checkBalanceAndAirdrop();