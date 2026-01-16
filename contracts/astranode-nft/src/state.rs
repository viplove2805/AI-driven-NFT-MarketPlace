use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Addr, Uint128};
use cw_storage_plus::{Item, Map};

#[cw_serde]
pub struct NftData {
    pub owner: Addr,
    pub token_uri: String,
    pub price: Uint128,
}

pub const CONFIG: Item<Config> = Item::new("config");
pub const NFTS: Map<&str, NftData> = Map::new("nfts");

#[cw_serde]
pub struct Config {
    pub name: String,
    pub symbol: String,
}
