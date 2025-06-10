import { rankRecords, rankTableAuth, manageKeyPair, privateKey, packageID, publicKey } from '../config'
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from '@mysten/sui/transactions'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

const client = new SuiClient({
    url: getFullnodeUrl("mainnet"),
});

const run = async () => {
    const txb = new Transaction();
    for (let index = 0; index < 12; index++) {
        const _key = generateNewKeyPair()
        console.log(_key);
        txb.moveCall({
            target: `${packageID}::rank::addToTable`,
            arguments: [
                txb.object(rankTableAuth),
                txb.object(rankRecords),
                txb.pure.address(`${_key.address}`),
                // 合约里面的格式:2025-01-01-sliver
                txb.pure.string(`2025-05-24-bronze`),
                txb.pure.string(`:${index + 18},`)
            ]
        })
    }
    txb.setGasBudget(2e8)
    const _res = await client.signAndExecuteTransaction({
        transaction: txb,
        signer: manageKeyPair,
        options: {
            showEffects: true
        }
    })
    if (_res.effects?.status.status === "success") {
        console.log(_res.digest);
        return _res
    } else {
        // const now = new Date()
        // const key = `${now.getFullYear()}_${now.getMonth() + 1}_${now.getDate()}`
        // redisClient.hSet(key, _res.digest, `${now.getTime()}`)
    }
}

function generateNewKeyPair() {
    const keypair = new Ed25519Keypair();
    const privateKey = keypair.getSecretKey()
    const publicKey = keypair.getPublicKey().toBase64();
    const address = keypair.getPublicKey().toSuiAddress();

    console.log('私钥:', privateKey);
    console.log('公钥:', publicKey);
    console.log('地址:', address);

    return {
        privateKey,
        publicKey,
        address
    };
}

const writeOne = async () => {
    const txb = new Transaction();
    txb.moveCall({
        target: `${packageID}::rank::addToTable`,
        arguments: [
            txb.object(rankTableAuth),
            txb.object(rankRecords),
            txb.pure.address(`0xd8812f6b90e382096476211366155790147fc6defd59b87b85645e8f675a8af3`),
            // 合约里面的格式:2025-01-01-sliver
            txb.pure.string(`2025-05-23-bronze`),
            txb.pure.string(`:${60 + 18},`)
        ]
    })
    txb.setGasBudget(2e8)
    const _res = await client.signAndExecuteTransaction({
        transaction: txb,
        signer: manageKeyPair,
        options: {
            showEffects: true
        }
    })
    console.log(_res.digest);
}

// writeOne()
run()