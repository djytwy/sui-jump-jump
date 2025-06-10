import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from '@mysten/sui/transactions'
import { manageKeyPair, packageID, testerKeyPair, skinInfo } from '../config'

const client = new SuiClient({
    url: getFullnodeUrl("mainnet"),
});

const run: () => Promise<Array<String | undefined> | null> = async () => {
    type data = {
        name: string,
        image_url: string
    }
    const SKIN_LIST = ["Cat jumper", "Spring jumper"]
    const res = await client.getOwnedObjects({
        owner: testerKeyPair.toSuiAddress(),
        options: {
            showContent: true
        },
        filter: {
            StructType: `${packageID}::skin_store::Skin`
        }
    })
    const skin_list = res.data.map(e => {
        if (e.data?.content && e.data?.content.dataType === "moveObject") {
            const fields = e.data?.content.fields as data
            return fields.name
        }
    })
    if (skin_list.length > 0)
        return skin_list
    else
        return null
}

run()