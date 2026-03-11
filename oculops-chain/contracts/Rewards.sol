// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title Rewards
 * @notice Distributes OCUL rewards using a Merkle Distributor pattern.
 * @dev
 *   Each "epoch" (roughly 1 week), the off-chain system:
 *     1. Computes all eligible rewards
 *     2. Builds a Merkle tree of (address, amount) leaves
 *     3. Publishes the root on-chain via updateMerkleRoot()
 *   Users then claim their rewards by providing a Merkle proof.
 *
 *   This pattern is extremely gas-efficient:
 *     - Publishing root: ~50K gas (once per epoch)
 *     - Each claim: ~80K gas (paid by claimer)
 *     - vs push-based: ~50K * N recipients per epoch
 *
 * Roles:
 *   DEFAULT_ADMIN_ROLE — full control
 *   UPDATER_ROLE       — can update merkle roots
 */
contract Rewards is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");

    /// @notice The OCUL token contract
    IERC20 public immutable token;

    /// @notice Current epoch number (increments with each merkle root update)
    uint256 public currentEpoch;

    /// @notice Merkle root for the current epoch
    bytes32 public merkleRoot;

    /// @notice Total tokens distributed across all epochs
    uint256 public totalDistributed;

    /// @notice Tracks claimed status: keccak256(epoch, address) => claimed
    mapping(bytes32 => bool) public claimed;

    /// @notice Historical merkle roots by epoch
    mapping(uint256 => bytes32) public epochRoots;

    /// @notice Max claimable per address per epoch
    uint256 public maxClaimPerEpoch;

    // --- Events ---
    event MerkleRootUpdated(uint256 indexed epoch, bytes32 merkleRoot);
    event RewardClaimed(
        address indexed account,
        uint256 indexed epoch,
        uint256 amount
    );
    event MaxClaimUpdated(uint256 maxClaim);

    constructor(
        address _token,
        address admin,
        uint256 _maxClaimPerEpoch
    ) {
        require(_token != address(0), "Rewards: zero token");
        require(admin != address(0), "Rewards: zero admin");

        token = IERC20(_token);
        maxClaimPerEpoch = _maxClaimPerEpoch;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(UPDATER_ROLE, admin);
    }

    /**
     * @notice Update the merkle root for a new epoch.
     * @param _merkleRoot New merkle root.
     */
    function updateMerkleRoot(
        bytes32 _merkleRoot
    ) external onlyRole(UPDATER_ROLE) whenNotPaused {
        require(_merkleRoot != bytes32(0), "Rewards: empty root");

        currentEpoch++;
        merkleRoot = _merkleRoot;
        epochRoots[currentEpoch] = _merkleRoot;

        emit MerkleRootUpdated(currentEpoch, _merkleRoot);
    }

    /**
     * @notice Claim rewards for the current epoch.
     * @param amount Amount of OCUL tokens to claim.
     * @param merkleProof Merkle proof of (msg.sender, amount) inclusion.
     */
    function claim(
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external whenNotPaused nonReentrant {
        require(amount > 0, "Rewards: zero amount");
        require(amount <= maxClaimPerEpoch, "Rewards: exceeds max claim");

        bytes32 claimKey = keccak256(abi.encodePacked(currentEpoch, msg.sender));
        require(!claimed[claimKey], "Rewards: already claimed");

        // Verify the merkle proof
        bytes32 leaf = keccak256(
            bytes.concat(keccak256(abi.encode(msg.sender, amount)))
        );
        require(
            MerkleProof.verify(merkleProof, merkleRoot, leaf),
            "Rewards: invalid proof"
        );

        claimed[claimKey] = true;
        totalDistributed += amount;

        token.safeTransfer(msg.sender, amount);

        emit RewardClaimed(msg.sender, currentEpoch, amount);
    }

    /**
     * @notice Check if an address has claimed for a specific epoch.
     */
    function hasClaimed(
        uint256 epoch,
        address account
    ) external view returns (bool) {
        bytes32 claimKey = keccak256(abi.encodePacked(epoch, account));
        return claimed[claimKey];
    }

    /**
     * @notice Update max claim per epoch.
     */
    function setMaxClaimPerEpoch(
        uint256 _maxClaim
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        maxClaimPerEpoch = _maxClaim;
        emit MaxClaimUpdated(_maxClaim);
    }

    /// @notice Pause claims.
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /// @notice Unpause claims.
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Returns the token balance available for rewards.
     */
    function availableRewards() external view returns (uint256) {
        return token.balanceOf(address(this));
    }
}
