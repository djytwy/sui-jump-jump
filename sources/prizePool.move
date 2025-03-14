/*
/// Module: prizePool
/// PvP mode play to earn
*/

module suiJumpJump::prizePool;
use sui::balance::{Balance, zero};
use sui::balance;
use sui::sui::SUI;
use std::string::{ String,};
use sui::coin::Coin;
use sui::coin;
// use sui::event;

// error:
const EAmountMustBeGreaterThanZero: u64 = 1;
const PoolBalanceIsNotEnough: u64 = 2;

// object:
public struct PrizePool has key, store {
    id: UID,
    level: String,
    balance: Balance<SUI>,
}

public struct AutherizeCap has key, store {
    id: UID,
}

// methods:
fun init (_ctx: &mut TxContext) {
    let gold_prize_pool = PrizePool {
        id: object::new(_ctx),
        balance: zero(),
        level: b"gold".to_string()
    };
    let sliver_prize_pool = PrizePool {
        id: object::new(_ctx),
        balance: zero(),
        level: b"sliver".to_string()
    };
    let bronze_prize_pool = PrizePool {
        id: object::new(_ctx),
        balance: zero(),
        level: b"bronze".to_string()
    };
    transfer::public_share_object(gold_prize_pool);
    transfer::public_share_object(sliver_prize_pool);
    transfer::public_share_object(bronze_prize_pool);
    transfer::public_transfer(AutherizeCap {
        id: object::new(_ctx)
    }, _ctx.sender())
}

public entry fun withdraw(_: &AutherizeCap, pool: &mut PrizePool, amount: u64, ctx: &mut TxContext){
    assert!(amount <= balance::value(&pool.balance), EAmountMustBeGreaterThanZero);
    let withdral_amount = balance::split(&mut pool.balance, amount);
    transfer::public_transfer(coin::from_balance<SUI>(withdral_amount, ctx), tx_context::sender(ctx));
}

public fun getPoolLevel (pool: &PrizePool): String {
    pool.level
}

public fun updateBalance (pool: &mut PrizePool, _coin : Coin<SUI>) {
    pool.balance.join(_coin.into_balance());
}

public(package) fun getBonus (pool: &mut PrizePool, amount: u64, ctx: &mut TxContext): Coin<SUI> {
    assert!(amount < pool.balance.value(), PoolBalanceIsNotEnough);
    let _bonusAmount = balance::split(&mut pool.balance, amount);
    let _sui = coin::from_balance<SUI>(_bonusAmount, ctx);
    _sui
}

// distributePrizeList: the percet list of every player.
// distributeList: the address of every player.

public(package) fun distributeRank ( distributeList: vector<address>, distributePrizeList: vector<u64>, _prizePool: &mut PrizePool, ctx: &mut TxContext) {
    let mut distributeIndex = 0;
    let distributeLength = distributeList.length();
    let mut distributeAmount: vector<u64> = vector[];
    while (distributeIndex < distributeLength) {
        let _amount = *vector::borrow(&distributePrizeList, distributeIndex);
        let _poolBalance = _prizePool.balance.value();
        distributeAmount.push_back( _poolBalance * _amount / 1000 );
        distributeIndex = distributeIndex + 1;
    };
    distributeIndex = 0;
    while (distributeIndex < distributeLength) {
        let _amount = *vector::borrow(&distributeAmount, distributeIndex);
        let _distrbuteAmount = balance::split(&mut _prizePool.balance, _amount);
        let _coin = coin::from_balance<SUI>(_distrbuteAmount, ctx);
        let recipient = *vector::borrow(&distributeList, distributeIndex);
        transfer::public_transfer(_coin, recipient);
        distributeIndex = distributeIndex + 1;
    }
}

// if player is not enough 10 distribute average 10% is revenue
public(package) fun distributeEvery (distributeList: vector<address>, _prizePool: &mut PrizePool, ctx: &mut TxContext) {
    let mut distributeIndex = 0;
    let distributeLength = distributeList.length();
    let _sumBalance = _prizePool.balance.value();
    let _distributeAmount = (_sumBalance / distributeLength) * 90 / 100;
    while (distributeIndex < distributeLength) {
        let __distrbuteAmount = _prizePool.balance.split(_distributeAmount);
        let _coin = coin::from_balance<SUI>(__distrbuteAmount, ctx);
        let recipient = *vector::borrow(&distributeList, distributeIndex);
        transfer::public_transfer(_coin, recipient);
        distributeIndex = distributeIndex + 1;
    }
}

