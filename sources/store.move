module suiJumpJump::skin_store;
use sui::package;
use sui::display;
use std::string::String;
use sui::coin::{Coin};
use sui::sui::SUI;


// error:
const ESuiAmountMustBeEqualWithPrice: u64 = 11;
const EMintIsDontMatch: u64 = 22;

/// The Skin - an outstanding collection of digital art.
public struct Skin has key, store {
    id: UID,
    name: String,
    image_url: String,
}

public struct StoreCap has key, store {
    id: UID
}

/// One-Time-Witness for the module.
public struct SKIN_STORE has drop {}

// now skins:
public struct SKIN_INFO has key, store {
    id: UID,
    skin_list: vector<String>,
    name_list: vector<String>,
    price_list: vector<u64>,
    gm: address
}

/// Claim the `Publisher` object in the module initializer 
/// to then create a `Display`. The `Display` is initialized with
/// a set of fields (but can be modified later) and published via
/// the `update_version` call.
///
/// Keys and values are set in the initializer but could also be
/// set after publishing if a `Publisher` object was created.
fun init(otw: SKIN_STORE, ctx: &mut TxContext) {
    let keys = vector[
        b"name".to_string(),
        b"link".to_string(),
        b"image_url".to_string(),
        b"description".to_string(),
        b"project_url".to_string(),
        b"creator".to_string(),
    ];

    let values = vector[
        // For `name` one can use the `Skin.name` property
        b"{name}".to_string(),
        // For `link` one can build a URL using an `id` property
        b"https://testnet.suivision.xyz/object/{id}".to_string(),
        // For `image_url`
        b"{image_url}".to_string(),
        // Description is static for all `Skin` objects.
        b"Sui jump jump skin: {name} .".to_string(),
        // Project URL is usually static
        b"https://sui-jump-jump.vercel.app/".to_string(),
        // Creator field can be any
        b"Sui jump jump".to_string(),
    ];

    // Claim the `Publisher` for the package!
    let publisher = package::claim(otw, ctx);

    // Get a new `Display` object for the `Skin` type.
    let mut display = display::new_with_fields<Skin>(
        &publisher, keys, values, ctx
    );

    // Commit first version of `Display` to apply changes.
    display.update_version();

    // init Skin list
    let skin_info = SKIN_INFO {
        id: object::new(ctx),
        skin_list: vector[
            b"https://aggregator.walrus-mainnet.walrus.space/v1/blobs/QkMMz8Nvl8Nj48U0LKHdqlRC6SxflNDP_VBEHnz3yTM".to_string(), 
            b"https://aggregator.walrus-mainnet.walrus.space/v1/blobs/jg4plW6I0Dvhnd00IFgQYiEEItFH0P4OlWO8yfMjiLE".to_string(),
            b"https://aggregator.walrus-mainnet.walrus.space/v1/blobs/9SryNhWHNxm2oCJccNXpQEMvh67A1D198jKOVmOpNy0".to_string()
        ],
        name_list: vector[b"recycleBottleJumper".to_string(),b"catJumper".to_string(),b"springJumper".to_string()],
        price_list: vector[0,1_000_000_000,2_000_000_000],
        gm: ctx.sender()
    };

    let storeCap = StoreCap {
        id: object::new(ctx)
    };

    transfer::public_share_object(skin_info);
    transfer::public_transfer(publisher, ctx.sender());
    transfer::public_transfer(display, ctx.sender());
    transfer::public_transfer(storeCap, ctx.sender());
}

/// Anyone can mint
public entry fun mint(name: String, image_url: String, pay: Coin<SUI>, _skins: &SKIN_INFO,ctx: &mut TxContext) {
    let mut index = 0;
    let mut _image_url = b"".to_string();
    let mut _name = b"".to_string();
    let mut _price = 0;
    let len = vector::length(&(_skins.name_list));
    while (index < len) {
        if (vector::borrow(&(_skins.name_list), index) == &name) {
            _name = name;
            if (vector::borrow(&(_skins.skin_list), index) == &image_url) {
                // name and image_url verify success:
                _image_url = image_url;
            };
            if (vector::borrow(&(_skins.price_list), index) == &pay.value()) {
                // name and image_url verify success:
                _price = pay.value();
            }
        };
        index = index + 1;
    };
    assert!(_image_url != b"".to_string(), EMintIsDontMatch);
    assert!(_name != b"".to_string(), EMintIsDontMatch);
    assert!(pay.value() == _price, ESuiAmountMustBeEqualWithPrice);
    let skin = Skin {
        id: object::new(ctx),
        name,
        image_url
    };
    transfer::public_transfer(pay, _skins.gm);
    transfer::public_transfer(skin, ctx.sender());
}

public fun modifySkins (_: &StoreCap, _skins: &mut SKIN_INFO, skin_list: vector<String>, name_list: vector<String>, price_list: vector<u64>) {
    _skins.name_list = name_list;
    _skins.price_list = price_list;
    _skins.skin_list = skin_list;
}

public entry fun adminMint (_: &StoreCap, name: String, image_url: String,ctx: &mut TxContext) {
    let skin = Skin {
        id: object::new(ctx),
        name,
        image_url
    };
    transfer::public_transfer(skin, ctx.sender());
}




