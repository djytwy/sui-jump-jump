/*
/// Module: SBT
/// when user enter game first complete user can mint a SBT to the themself
*/

module suiJumpJump::sbt;

use std::string::String;
use sui::event;
use suiJumpJump::versionControl::{ GlobalConfig, assert_vaild_package_version};

public struct SBT has key, store {
    id: UID,
    name: String,
    image: String,
    records: vector<String>,
}

// event
public struct Register has copy, drop {
    id: ID,
    minted_by: address,
    name: String
}

// functions
public fun name (nft: &SBT) : String {
    nft.name
}

public fun records (nft: &SBT): vector<String> {
    nft.records
}

public fun avatar (nft: &SBT): String {
    nft.image
}

public fun set_avatar (nft: &mut SBT, image: String) {
    nft.image = image;
}

public fun destroy(nft: SBT) {
    let SBT { id, image: _, name: _, records: _ } = nft;
    id.delete()
}

public entry fun add_record(nft: &mut SBT, record: String) {
    nft.records.push_back(record);
}

// SBT
entry fun mint_sbt(
    config: &GlobalConfig,
    name: String, 
    records: vector<String>, 
    image: String,
    ctx: &mut TxContext
) {
    config.assert_vaild_package_version();
    let id = object::new(ctx);
    event::emit(Register {
        id: id.to_inner(),
        minted_by: ctx.sender(),
        name
    });

    let usr = SBT {
        id,
        name,
        image,
        records
    };
    let sender = tx_context::sender(ctx);
    transfer::public_transfer(usr, sender);
}