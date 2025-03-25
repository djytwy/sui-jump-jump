module suiJumpJump::Ticket;

use sui::sui::SUI;
use sui::event;
use sui::coin::Coin;
use sui::url::{ new_unsafe_from_bytes };
use std::string::{ String, utf8};
use sui::clock::{ Clock, timestamp_ms};
use suiJumpJump::prizePool::{ PrizePool, updateBalance, getPoolLevel };

// error:
const EAmountMustBeGreaterThanZero: u64 = 1;
const EAmountMustBeGreaterThanGoldTicketPrice: u64 = 2;
const EAmountMustBeGreaterThanSliverTicketPrice: u64 = 3;
const EAmountMustBeGreaterThanbronzeTicketPrice: u64 = 4;

// objects
public struct TicketPrice has key, store {
    id: UID,
    goldPrice: u64,
    sliverPrice: u64,
    bronzePrice: u64
}

public struct Ticket has key, store {
    id: UID,
    price: u64,
    buyTime: u64,
    level: String
}

public struct TicketAdminCap has key, store {
    id: UID
}

// events:
public struct BuyTicket has copy, drop {
    buyer: address,
    time: u64,
    level: String
}

entry public fun getPrice (ticketPrice: &TicketPrice): vector<u64> {
  let priceList: vector<u64> = vector[ticketPrice.goldPrice, ticketPrice.sliverPrice, ticketPrice.bronzePrice];
  priceList
}


fun init(ctx: &mut TxContext) {
    let ticketPrice = TicketPrice {
        id: object::new(ctx),
        // init price
        goldPrice: 1000_000_000,
        sliverPrice: 400_000_000,
        bronzePrice: 100_000_000
    };
    transfer::public_share_object(ticketPrice);
    let ticketAdmin = TicketAdminCap {
        id: object::new(ctx)
    };
    transfer::public_transfer(ticketAdmin, ctx.sender());
}


entry public fun updatePrice (_: &TicketAdminCap, ticketPrice: &mut TicketPrice, newGoldPrice: u64, newSliverPrice: u64, newBronzePrice: u64) {
    ticketPrice.goldPrice = newGoldPrice;
    ticketPrice.sliverPrice = newSliverPrice;
    ticketPrice.bronzePrice = newBronzePrice;
}

// clock: 0x6
entry fun buyTicket (money: Coin<SUI>, ticketPrice: &TicketPrice, pool: &mut PrizePool,clock: &Clock,ctx: &mut TxContext) {
    assert!(money.value() > 0, EAmountMustBeGreaterThanZero);
    let poolLevel = getPoolLevel(pool);
    if (poolLevel == utf8(b"gold")) {
        assert!(money.value() == ticketPrice.goldPrice, EAmountMustBeGreaterThanGoldTicketPrice);
        let ticket = Ticket {
            id: object::new(ctx),
            price: money.value(),
            buyTime: timestamp_ms(clock),
            level: b"gold".to_string()
        };
        transfer::public_transfer(ticket, ctx.sender())
    } else if (poolLevel == utf8(b"sliver")) {
        assert!(money.value() == ticketPrice.sliverPrice, EAmountMustBeGreaterThanSliverTicketPrice);
        let ticket = Ticket {
            id: object::new(ctx),
            price: money.value(),
            buyTime: timestamp_ms(clock),
            level: b"sliver".to_string()
        };
        transfer::public_transfer(ticket, ctx.sender())
    } else if (poolLevel == utf8(b"bronze")) {
        assert!(money.value() == ticketPrice.bronzePrice, EAmountMustBeGreaterThanbronzeTicketPrice);
        let ticket = Ticket {
            id: object::new(ctx),
            price: money.value(),
            buyTime: timestamp_ms(clock),
            level: b"bronze".to_string()
        };
        transfer::public_transfer(ticket, ctx.sender())
    };
    updateBalance(pool, money);
    event::emit(BuyTicket{
        buyer: ctx.sender(),
        time: timestamp_ms(clock),
        level: poolLevel
    });
}


public fun getTicketLevel ( ticket: &Ticket ): String {
    ticket.level
}

public fun getTicketPrice (ticket: &Ticket): u64 {
    ticket.price
}

public fun getTicketTime (ticket: &Ticket): u64 {
    ticket.buyTime
}

#[allow(unused_variable)]
public fun delTicket (ticket: Ticket) {
    let Ticket { id, buyTime, price, level } = ticket;
    object::delete(id);
}


