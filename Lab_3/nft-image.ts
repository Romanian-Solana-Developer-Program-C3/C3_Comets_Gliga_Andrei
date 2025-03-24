import "dotenv/config"
import { readFile } from 'fs/promises';
import { createGenericFile, createSignerFromKeypair, signerIdentity } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { clusterApiUrl } from '@solana/web3.js';
import { getKeypairFromEnvironment } from '@solana-developers/helpers';
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys"

const umi = createUmi(clusterApiUrl('devnet'));
const kp = getKeypairFromEnvironment("SECRET_KEY");

let keypair = umi.eddsa.createKeypairFromSecretKey(kp.secretKey)
const signer = createSignerFromKeypair(umi, keypair)

umi.use(irysUploader())
umi.use(signerIdentity(signer))

const IMG_FILE="./star.png"

const IMG_URI='https://devnet.irys.xyz/2dNTtWjp1XKhZtQMne2LLTzNuiZbShK7TuFRAce8xtFM'

export async function uploadImage() {
    try {
        console.log("Uploading image...")
        const img = await readFile(IMG_FILE);
        const imgConverted = createGenericFile(new Uint8Array(img), "image/png");
        
        const [myUri]  = await umi.uploader.upload([imgConverted])
        console.log("Done with URI: ", myUri)
    } catch(e) {
        console.error("error uploading image: ", e);
    }
}

uploadImage();