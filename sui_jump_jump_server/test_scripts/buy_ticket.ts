import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from '@mysten/sui/transactions'
import { manageKeyPair, testerKeyPair } from '../config'
import {
    packageID,
    rankRecords,
    rankTableAuth,
    bronzePool,
    ticketPrice
} from '../config'


const client = new SuiClient({
    url: getFullnodeUrl("mainnet"),
});

const buyTicketOne = async () => {
    const txb = new Transaction();
    const [coin] = txb.splitCoins(txb.gas, [100_000_000]);
    txb.moveCall({
        target: `${packageID}::Ticket::buyTicket`,
        arguments: [coin, txb.object(ticketPrice), txb.object(bronzePool), txb.object('0x6')]
    })
    txb.setGasBudget(3e6);
    const executeRes = await client.signAndExecuteTransaction({
        transaction: txb,
        signer: testerKeyPair,
        options: {
            showEffects: true,
            showObjectChanges: true
        }
    })
    console.log(executeRes.digest);
}

buyTicketOne()