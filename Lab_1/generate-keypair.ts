import {Keypair} from "@solana/web3.js";
import "dontenv/config";

const keypair = Keypair.generate();

console.log(keypair.publicKey.toBase58());
console.log(keypair.secretKey);