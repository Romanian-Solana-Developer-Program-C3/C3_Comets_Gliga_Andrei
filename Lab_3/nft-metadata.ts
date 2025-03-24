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
const METADATA_URI='https://devnet.irys.xyz/ATy7RPhQ6zrFJh99nyRt94N3JALG4jtGujRvX3EVC8nw'

async function uploadMetadata() {
    try {
        const metadata = {
            name: "Star of comets",
            symbol: "STARC",
            description: "The star of the comets!",
            image: IMG_URI,
            attributes: [
                { trait_type: "Color", value: "black"}
            ],
            properties: {
                files: [
                    {type: "image/png", uri:IMG_URI}
                ]
            }
        }
        const metadataURI = await umi.uploader.uploadJson(metadata)
        console.log("Done with metadata URI: ", metadataURI)
    } catch(e) {
        console.error("failed upload with error: ", e)
    }
}

uploadMetadata();