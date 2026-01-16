use cosmwasm_std::{
    entry_point, to_json_binary, BankMsg, Binary, Coin, Deps, DepsMut, Env, MessageInfo, Response,
    StdResult, Uint128,
};
use cw2::set_contract_version;

use crate::msg::{AllNftsResponse, ExecuteMsg, InstantiateMsg, NftInfoResponse, QueryMsg};
use crate::state::{Config, NftData, CONFIG, NFTS};

const CONTRACT_NAME: &str = "crates.io:astranode-nft";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: InstantiateMsg,
) -> StdResult<Response> {
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    let config = Config {
        name: msg.name,
        symbol: msg.symbol,
    };
    CONFIG.save(deps.storage, &config)?;
    Ok(Response::new().add_attribute("method", "instantiate"))
}

#[entry_point]
pub fn execute(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> StdResult<Response> {
    match msg {
        ExecuteMsg::Mint {
            token_id,
            owner,
            token_uri,
            price,
        } => execute_mint(deps, info, token_id, owner, token_uri, price),
        ExecuteMsg::Buy { token_id } => execute_buy(deps, info, token_id),
        ExecuteMsg::UpdatePrice {
            token_id,
            new_price,
        } => execute_update_price(deps, info, token_id, new_price),
    }
}

pub fn execute_mint(
    deps: DepsMut,
    _info: MessageInfo,
    token_id: String,
    owner: String,
    token_uri: String,
    price: Uint128,
) -> StdResult<Response> {
    let nft = NftData {
        owner: deps.api.addr_validate(&owner)?,
        token_uri,
        price,
    };
    NFTS.save(deps.storage, &token_id, &nft)?;
    Ok(Response::new()
        .add_attribute("action", "mint")
        .add_attribute("token_id", token_id))
}

pub fn execute_buy(deps: DepsMut, info: MessageInfo, token_id: String) -> StdResult<Response> {
    let nft = NFTS.load(deps.storage, &token_id)?;

    // Check if enough funds were sent
    let payment = info
        .funds
        .iter()
        .find(|c| c.denom == "uastra")
        .ok_or_else(|| cosmwasm_std::StdError::generic_err("No uastra sent"))?;

    if payment.amount < nft.price {
        return Err(cosmwasm_std::StdError::generic_err("Insufficient funds"));
    }

    // Transfer funds to the previous owner
    let transfer_msg = BankMsg::Send {
        to_address: nft.owner.to_string(),
        amount: vec![Coin {
            denom: "uastra".to_string(),
            amount: nft.price,
        }],
    };

    // Update owner
    let mut new_nft = nft;
    new_nft.owner = info.sender.clone();
    NFTS.save(deps.storage, &token_id, &new_nft)?;

    Ok(Response::new()
        .add_message(transfer_msg)
        .add_attribute("action", "buy")
        .add_attribute("token_id", token_id)
        .add_attribute("new_owner", info.sender))
}

pub fn execute_update_price(
    deps: DepsMut,
    info: MessageInfo,
    token_id: String,
    new_price: Uint128,
) -> StdResult<Response> {
    let mut nft = NFTS.load(deps.storage, &token_id)?;
    if nft.owner != info.sender {
        return Err(cosmwasm_std::StdError::generic_err("Not the owner"));
    }

    nft.price = new_price;
    NFTS.save(deps.storage, &token_id, &nft)?;

    Ok(Response::new()
        .add_attribute("action", "update_price")
        .add_attribute("token_id", token_id))
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetNft { token_id } => to_json_binary(&query_nft(deps, token_id)?),
        QueryMsg::GetAllNfts {} => to_json_binary(&query_all_nfts(deps)?),
    }
}

fn query_nft(deps: Deps, token_id: String) -> StdResult<NftInfoResponse> {
    let nft = NFTS.load(deps.storage, &token_id)?;
    Ok(NftInfoResponse {
        token_id,
        owner: nft.owner,
        token_uri: nft.token_uri,
        price: nft.price,
    })
}

fn query_all_nfts(deps: Deps) -> StdResult<AllNftsResponse> {
    let nfts: StdResult<Vec<_>> = NFTS
        .range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
        .map(|item| {
            let (token_id, nft) = item?;
            Ok(NftInfoResponse {
                token_id,
                owner: nft.owner,
                token_uri: nft.token_uri,
                price: nft.price,
            })
        })
        .collect();

    Ok(AllNftsResponse { nfts: nfts? })
}
