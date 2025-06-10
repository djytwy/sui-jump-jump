import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from '@mysten/sui/transactions'
import cors from 'cors'
import { createClient } from 'redis'

const redisClient = createClient({
    url: 'redis://default:AY3kAAIjcDEzOGZlNDVjMWYxMWM0MzA3ODBjMjZkYjUwNDE2MzNhMHAxMA@enough-midge-36324.upstash.io:6379', // 根据你的 Redis 服务器地址进行修改
    socket: {
        tls: true
    }
});

// 处理 Redis 客户端的错误
redisClient.on('error', (err) => {
    console.error('Redis 连接错误:', err);
});

// 连接到 Redis
redisClient.connect().then(() => {
    console.log('已连接到 Redis');
}).catch((err) => {
    console.error('Redis 连接失败:', err);
});

const client = new SuiClient({
    url: getFullnodeUrl("mainnet"),
});

const queryFromSui = async () => {
    const functionName = `entry_deposit`
    const module = `incentive_v3`
    const packageId = `0x81c408448d0d57b3e371ea94de1d40bf852784d3e225de1e74acab3e8395c18f`
    const resp = await client.queryTransactionBlocks({
        filter: {
            MoveFunction: {
                function: functionName,
                module,
                package: packageId
            },
        },
        options: {
            showInput: true,
            showObjectChanges: true
        },
        limit: 50,
    });
    if (resp.data.length > 0) {
        resp.data.forEach(async e => {
            const t = new Date()
            if (e.transaction?.data.sender) {
                await redisClient.sAdd('uniqueSenders', e.transaction.data.sender)
            }
        })
    }
    console.log('save finish !');
}

const testForQuery = async (senderAddress: string) => {
    // 检查 sender 是否存在
    const exists = await redisClient.sIsMember('uniqueSenders', senderAddress)
    console.log('isMember:', exists);
}

const getAll = async () => {
    const allSenders = await redisClient.sMembers('uniqueSenders')
    console.log(allSenders);
}

const testRedis = async () => {
    const f = await redisClient.get('1231')
    console.log(f);
}
// queryFromSui()
// testForQuery('0x22d6bb95bc5c894e16765d4dd1f94390f1f389dbf8cf28f95576ad5b8a921213')
// getAll()

testRedis()
