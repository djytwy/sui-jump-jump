module suiJumpJump::distribute;

use sui::random::{ new_generator, generate_u64_in_range, Random};
use suiJumpJump::Ticket::{ Ticket, getTicketLevel, getTicketPrice, delTicket };
use suiJumpJump::prizePool::{ PrizePool, getBonus, getPoolLevel, distributeEvery, distributeRank};
use sui::clock::{ Clock, timestamp_ms};

// errors:
const TicketAndPoolIsNotMathch: u64 = 5;
const TicketIsExpired: u64 =  6;

public struct Rewards_Config has key, store {
    id: UID,
    rewards_percent_list_gold: vector<u64>,
    rewards_percent_list_silver: vector<u64>,
    rewards_percent_list_bronze: vector<u64>
}

public struct DistributeCap has key, store {
    id: UID
}

fun init(ctx: &mut TxContext) {
    let _rewards_config = Rewards_Config {
        id: object::new(ctx),
        rewards_percent_list_gold: vector[300,200,100,75,45,36,36,36,36,36], // need / 1000 300 mean: 30%
        rewards_percent_list_silver: vector[300,200,100,75,45,36,36,36,36,36],
        rewards_percent_list_bronze: vector[300,200,100,75,45,36,36,36,36,36]
    };
    transfer::public_share_object(_rewards_config);
    let cap = DistributeCap {
        id: object::new(ctx)
    };
    transfer::public_transfer(cap, ctx.sender());
}


// random: 0x8
// #[allow(lint(unnecessary_math))]
entry fun distributeBonus (points: u64, _ticket: Ticket, pool: &mut PrizePool ,random: &Random , clock: &Clock, ctx: &mut TxContext) {
    // let ticketLevel = getTicketLevel(ticket);
    let now = timestamp_ms(clock);
    let ticketLevel = _ticket.getTicketLevel();
    let poolLevel = getPoolLevel(pool);
    // ticket expire in 72 hours
    assert!(now - _ticket.getTicketTime() < 1000 * 60 * 60 * 72, TicketIsExpired);
    assert!(ticketLevel == poolLevel, TicketAndPoolIsNotMathch);
    // let ticketPrice = getTicketPrice(ticket);
    let ticketPrice = _ticket.getTicketPrice();
    let mut _points = 0;
    // 200 is max
    if (points > 200) {
        _points = 200;
    } else {
        _points = points;
    };
    // bonus = 0.2 * ticketPrice * random / 100 + 0.3 * ticketPrice * points / 200 = 2/10 * ticketPrice * random / 100 + 3/10 * ticketPrice * points / 200 = (2 * ticketPrice * r) / 1000 + 3 * ticketPrice * points / 2000
    let mut random_generator = new_generator(random, ctx);
    let r = generate_u64_in_range(&mut random_generator, 10, 100);
    let bonusAmount = (2 * ticketPrice * r) / 1000 + 3 * ticketPrice * points / 2000;
    let sui = getBonus(pool, bonusAmount, ctx);
    transfer::public_transfer(sui, ctx.sender());
    delTicket(_ticket);
}

entry fun distributeMoreThan10 (
    _: &DistributeCap, 
    rewardsConfig: &Rewards_Config, 
    goldPlayerList: vector<address>,  
    silverPlayerList: vector<address>, 
    bronzePlayerList: vector<address>, 
    goldPool: &mut PrizePool,
    sliverPool: &mut PrizePool,
    bronzePool: &mut PrizePool,
    ctx: &mut TxContext
) {
    if (goldPlayerList.length() >= 10) {
        distributeRank( goldPlayerList, rewardsConfig.rewards_percent_list_gold, goldPool, ctx)
    };
    if (silverPlayerList.length() > 10) {
        distributeRank( silverPlayerList, rewardsConfig.rewards_percent_list_silver, sliverPool, ctx)
    };
    if (bronzePlayerList.length() > 10) {
        distributeRank( bronzePlayerList, rewardsConfig.rewards_percent_list_bronze, bronzePool, ctx)
    }
}


entry fun distributeLessThan10 (
    _: &DistributeCap, 
    goldPlayerList: vector<address>,  
    silverPlayerList: vector<address>, 
    bronzePlayerList: vector<address>, 
    goldPool: &mut PrizePool,
    sliverPool: &mut PrizePool,
    bronzePool: &mut PrizePool,
    ctx: &mut TxContext
) {
    if (goldPlayerList.length() > 0) {
        distributeEvery( goldPlayerList, goldPool, ctx)
    };
    if (silverPlayerList.length() > 0) {
        distributeEvery( silverPlayerList, sliverPool, ctx)
    };
    if (bronzePlayerList.length() > 0) {
        distributeEvery( bronzePlayerList, bronzePool, ctx)
    }  
}
