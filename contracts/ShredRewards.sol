// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Trusted server-controlled rewards distributor for Shred.
/// @dev    The Shred backend is the single REWARDER. It funds the contract
///         with CELO and any ERC20 ecosystem tokens, then atomically
///         distributes a bundle of rewards to a player when they open a
///         pack. Players never call this contract directly.
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract ShredRewards {
    address public owner;
    mapping(address => bool) public rewarders;

    // Replay protection for off-chain "open pack" tickets signed by the backend.
    mapping(bytes32 => bool) public claimed;

    event RewarderUpdated(address indexed account, bool allowed);
    event OwnerTransferred(address indexed prev, address indexed next);
    event PackRewardDistributed(
        bytes32 indexed claimId,
        address indexed player,
        uint256 packKey,
        uint256 celoAmount,
        address[] tokens,
        uint256[] amounts
    );
    event Funded(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    modifier onlyRewarder() {
        require(rewarders[msg.sender], "NOT_REWARDER");
        _;
    }

    constructor(address rewarder) {
        owner = msg.sender;
        rewarders[rewarder] = true;
        emit OwnerTransferred(address(0), msg.sender);
        emit RewarderUpdated(rewarder, true);
    }

    receive() external payable {
        emit Funded(msg.sender, msg.value);
    }

    function setRewarder(address account, bool allowed) external onlyOwner {
        rewarders[account] = allowed;
        emit RewarderUpdated(account, allowed);
    }

    function transferOwnership(address next) external onlyOwner {
        require(next != address(0), "ZERO_ADDR");
        emit OwnerTransferred(owner, next);
        owner = next;
    }

    /// @notice Atomically deliver a pack of rewards to a player.
    /// @param claimId    Unique id (e.g. keccak256(userId, nonce)) — replay-protected.
    /// @param player     Recipient wallet (the user's app-managed Shred wallet).
    /// @param packKey    1=Starter, 2=Mystery, 3=Alpha, 4=Legendary (audit/event only).
    /// @param celoAmount Native CELO to send (wei). Pass 0 to skip.
    /// @param tokens     ERC20 token addresses to distribute.
    /// @param amounts    Matching amounts (wei) for `tokens`.
    function distribute(
        bytes32 claimId,
        address player,
        uint256 packKey,
        uint256 celoAmount,
        address[] calldata tokens,
        uint256[] calldata amounts
    ) external onlyRewarder {
        require(player != address(0), "ZERO_PLAYER");
        require(!claimed[claimId], "REPLAY");
        require(tokens.length == amounts.length, "LEN");
        claimed[claimId] = true;

        if (celoAmount > 0) {
            (bool ok, ) = player.call{value: celoAmount}("");
            require(ok, "CELO_FAIL");
        }
        for (uint256 i = 0; i < tokens.length; i++) {
            if (amounts[i] > 0) {
                require(IERC20(tokens[i]).transfer(player, amounts[i]), "ERC20_FAIL");
            }
        }

        emit PackRewardDistributed(claimId, player, packKey, celoAmount, tokens, amounts);
    }

    function withdrawCelo(address to, uint256 amount) external onlyOwner {
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "WITHDRAW_FAIL");
        emit Withdrawn(to, amount);
    }

    function withdrawToken(address token, address to, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(to, amount), "ERC20_FAIL");
    }
}
