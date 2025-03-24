import "dotenv/config"
import { readFile } from 'fs/promises';
import { createGenericFile, createSignerFromKeypair, generateSigner, percentAmount, signerIdentity } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { clusterApiUrl } from '@solana/web3.js';
import { getKeypairFromEnvironment } from '@solana-developers/helpers';
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys"
import { createNft, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import { base58 } from "@metaplex-foundation/umi/serializers";

const umi = createUmi(clusterApiUrl('devnet'));
const kp = getKeypairFromEnvironment("SECRET_KEY");

let keypair = umi.eddsa.createKeypairFromSecretKey(kp.secretKey)
const signer = createSignerFromKeypair(umi, keypair)

umi.use(mplTokenMetadata())
umi.use(signerIdentity(signer))

const METADATA_URI='https://devnet.irys.xyz/ATy7RPhQ6zrFJh99nyRt94N3JALG4jtGujRvX3EVC8nw'


async function createMyNFT() {
    try {
        const mint = generateSigner(umi)

        let tx = createNft(umi, {
            name: "Star of comets",
            mint,
            authority: signer,
            isCollection: false,
            uri: METADATA_URI,
            sellerFeeBasisPoints: percentAmount(5)
        })

        let result = await tx.sendAndConfirm(umi);

        const signature = base58.deserialize(result.signature)
        console.log("Done with sig: ", signature)
    } catch(e) {
        console.error("error uploading image: ", e);
    }
}
createMyNFT();