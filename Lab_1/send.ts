import "dotenv/config";

import { getKeypairFromEnvironment } from "@solana-developers/helpers";
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, clusterApiUrl, sendAndConfirmTransaction } from "@solana/web3.js";

async function sendSol(amountSol, connection, sender, recipientPublicKey) {
    try {
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: sender.publicKey,
            toPubkey: recipientPublicKey,
            lamports: amountSol * LAMPORTS_PER_SOL, // Convert SOL to lamports
          })
        );
    
        const signature = await sendAndConfirmTransaction(connection, transaction, [sender]);
        console.log(`Transaction successful! Signature: ${signature}`);
      } catch (error) {
        console.error("Error sending SOL:", error);
    }
}

async function main() {
    try {
        const keypair = getKeypairFromEnvironment("SECRET_KEY");
        const connection = new Connection(clusterApiUrl("devnet"));

        const recipientPublicKey = new PublicKey("qbE2wbpMhPrqhTqLVU5yPCo4oNG7s9Ei5o84ZJe41p8");
        
        const originalSenderBalance = await connection.getBalance(keypair.publicKey) / LAMPORTS_PER_SOL;
        const originalRecipientBalance = await connection.getBalance(recipientPublicKey) / LAMPORTS_PER_SOL;

        console.log(`Sender with address ${keypair.publicKey} has balance ${originalSenderBalance}.`)
        console.log(`Recipient with address ${recipientPublicKey} has balance ${originalRecipientBalance}.`)

        await sendSol(0.01, connection, keypair, recipientPublicKey);
        
        console.log("Transfer was successful!");

        const newSenderBalance = await connection.getBalance(keypair.publicKey) / LAMPORTS_PER_SOL;
        const newRecipientBalance = await connection.getBalance(recipientPublicKey) / LAMPORTS_PER_SOL;

        console.log("New sender balance: ", newSenderBalance);
        console.log("New recipient balance: ", newRecipientBalance);

    } catch (e) {
        console.error("Error in main function: ", e);
    }
}

main()