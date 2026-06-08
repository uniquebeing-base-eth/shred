// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Collects user payments for paid Shreds (Mystery, Alpha, Legendary).
/// @dev    Users pay in CELO or a supported stablecoin (cUSD). The contract
///         records each purchase on-chain so the backend can mint the pack
///         and the rewards contract can distribute the corresponding bundle.
interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract ShredPayments {
    address public owner;
    address public treasury;

    // packKey -> token (address(0) = native CELO) -> price in wei
    mapping(uint8 => mapping(address => uint256)) public prices;
    // packKey -> enabled
    mapping(uint8 => bool) public packEnabled;

    event OwnerTransferred(address indexed prev, address indexed next);
    event TreasuryUpdated(address indexed treasury);
    event PriceUpdated(uint8 indexed packKey, address indexed token, uint256 price);
    event PackEnabled(uint8 indexed packKey, bool enabled);
    event PackPurchased(
        address indexed buyer,
        uint8 indexed packKey,
        address indexed token,
        uint256 amount,
        bytes32 orderId
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    constructor(address treasury_) {
        require(treasury_ != address(0), "ZERO_TREASURY");
        owner = msg.sender;
        treasury = treasury_;
        emit OwnerTransferred(address(0), msg.sender);
        emit TreasuryUpdated(treasury_);
    }

    function transferOwnership(address next) external onlyOwner {
        require(next != address(0), "ZERO_ADDR");
        emit OwnerTransferred(owner, next);
        owner = next;
    }

    function setTreasury(address next) external onlyOwner {
        require(next != address(0), "ZERO_ADDR");
        treasury = next;
        emit TreasuryUpdated(next);
    }

    function setPackEnabled(uint8 packKey, bool enabled) external onlyOwner {
        packEnabled[packKey] = enabled;
        emit PackEnabled(packKey, enabled);
    }

    /// @param token address(0) means native CELO.
    function setPrice(uint8 packKey, address token, uint256 price) external onlyOwner {
        prices[packKey][token] = price;
        emit PriceUpdated(packKey, token, price);
    }

    /// @notice Pay for a pack in native CELO.
    /// @param packKey 2=Mystery, 3=Alpha, 4=Legendary (1=Starter is free, not sold here).
    /// @param orderId Off-chain order id for backend reconciliation.
    function buyWithCelo(uint8 packKey, bytes32 orderId) external payable {
        require(packEnabled[packKey], "PACK_DISABLED");
        uint256 price = prices[packKey][address(0)];
        require(price > 0, "NO_PRICE");
        require(msg.value == price, "BAD_VALUE");
        (bool ok, ) = treasury.call{value: msg.value}("");
        require(ok, "FWD_FAIL");
        emit PackPurchased(msg.sender, packKey, address(0), msg.value, orderId);
    }

    /// @notice Pay for a pack with an ERC20 (e.g. cUSD). Caller must approve first.
    function buyWithToken(uint8 packKey, address token, bytes32 orderId) external {
        require(packEnabled[packKey], "PACK_DISABLED");
        require(token != address(0), "ZERO_TOKEN");
        uint256 price = prices[packKey][token];
        require(price > 0, "NO_PRICE");
        require(IERC20(token).transferFrom(msg.sender, treasury, price), "ERC20_FAIL");
        emit PackPurchased(msg.sender, packKey, token, price, orderId);
    }
}
