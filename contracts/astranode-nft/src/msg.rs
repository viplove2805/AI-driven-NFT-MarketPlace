use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::{Addr, Uint128};

#[cw_serde]
pub struct InstantiateMsg {
    pub name: String,
    pub symbol: String,
}

#[cw_serde]
pub enum ExecuteMsg {
    Mint {
        token_id: String,
        owner: String,
        token_uri: String,
        price: Uint128,
    },
    Buy {
        token_id: String,
    },
    UpdatePrice {
        token_id: String,
        new_price: Uint128,
    },
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(NftInfoResponse)]
    GetNft { token_id: String },
    #[returns(AllNftsResponse)]
    GetAllNfts {},
}

#[cw_serde]
pub struct NftInfoResponse {
    pub token_id: String,
    pub owner: Addr,
    pub token_uri: String,
    pub price: Uint128,
}

#[cw_serde]
pub struct AllNftsResponse {
    pub nfts: Vec<NftInfoResponse>,
}
