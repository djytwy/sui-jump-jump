/*
/// Module: versionControl
*/

module suiJumpJump::versionControl {
    use sui::vec_set::{ Self, VecSet };
    const PACKAGE_VERSION: u16 = 1;

    // error:
    const EInvaildPackageVersion: u64 = 0;
    fun err_invaild_package_version() { abort EInvaildPackageVersion }

    public struct GlobalConfig has key {
        id: UID,
        versions: VecSet<u16>
    }

    public struct AdminCap has key, store {
        id: UID
    }

    // function
    public fun package_version():u16 { PACKAGE_VERSION }

    // version manage:
    public fun add_version(_:&AdminCap, config: &mut GlobalConfig, version: u16) {
        config.versions.insert(version)
    }

    public fun remove_version(_:&AdminCap, config: &mut GlobalConfig, version: u16) {
        config.versions.remove(&version)
    }

    fun init(ctx: &mut TxContext) {
        let config = GlobalConfig {
            id: object::new(ctx),
            versions: vec_set::singleton(package_version()),
        };
        transfer::share_object(config);

        let cap = AdminCap{ id: object::new(ctx)};

        transfer::transfer(cap, ctx.sender());
    }

    public fun versions (config: &GlobalConfig) : &VecSet<u16> {
        &config.versions
    }

    public fun assert_vaild_package_version(config: &GlobalConfig) {
        if (!config.versions().contains(&package_version())) {
            err_invaild_package_version();
        }
    }
}