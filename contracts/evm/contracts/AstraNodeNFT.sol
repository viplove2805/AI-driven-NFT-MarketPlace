// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AstraNodeNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    
    struct Listing {
        uint256 price;
        address seller;
        bool isListed;
    }
    
    mapping(uint256 => Listing) public listings;

    event NFTMinted(uint256 indexed tokenId, address indexed owner, string tokenURI, uint256 price);
    event NFTSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event NFTPriceUpdated(uint256 indexed tokenId, uint256 newPrice);
    event NFTDelisted(uint256 indexed tokenId);

    constructor() ERC721("AstraNode Art", "ASTRA") Ownable(msg.sender) {}

    function mintNFT(string memory tokenURI, uint256 price) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        listings[tokenId] = Listing(price, msg.sender, true);
        
        emit NFTMinted(tokenId, msg.sender, tokenURI, price);
        return tokenId;
    }

    function buyNFT(uint256 tokenId) public payable {
        Listing memory listing = listings[tokenId];
        require(listing.isListed, "NFT not for sale");
        require(msg.value >= listing.price, "Insufficient funds");
        require(msg.sender != listing.seller, "Seller cannot buy their own NFT");

        address seller = listing.seller;
        listings[tokenId].isListed = false;
        listings[tokenId].seller = msg.sender;

        _transfer(seller, msg.sender, tokenId);
        payable(seller).transfer(msg.value);

        emit NFTSold(tokenId, seller, msg.sender, listing.price);
    }

    function updatePrice(uint256 tokenId, uint256 newPrice) public {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        listings[tokenId].price = newPrice;
        listings[tokenId].isListed = true;
        emit NFTPriceUpdated(tokenId, newPrice);
    }

    function delistNFT(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        listings[tokenId].isListed = false;
        emit NFTDelisted(tokenId);
    }
}
