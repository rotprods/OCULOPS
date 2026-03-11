// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title Treasury
 * @notice Holds OCUL tokens and releases them according to approved operations.
 * @dev Rate-limited, role-gated, pausable vault.
 *
 * Roles:
 *   DEFAULT_ADMIN_ROLE — full control
 *   TREASURER_ROLE     — can approve releases (multi-sig off-chain)
 *   DISTRIBUTOR_ROLE   — can release tokens (settlement service)
 */
contract Treasury is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");

    /// @notice The OCUL token contract
    IERC20 public immutable token;

    /// @notice Maximum tokens releasable in a single operation (1% of supply)
    uint256 public maxPerOperation;

    /// @notice Maximum tokens releasable per day (5% of supply)
    uint256 public dailyLimit;

    /// @notice Tracks daily spend
    uint256 public dailySpent;
    uint256 public lastResetTimestamp;

    /// @notice Rate limit: max operations per hour
    uint256 public constant MAX_OPS_PER_HOUR = 10;
    uint256 public opsThisHour;
    uint256 public hourStart;

    // --- Events ---
    event TokensReleased(address indexed to, uint256 amount, string reason);
    event LimitsUpdated(uint256 maxPerOp, uint256 dailyLimit);
    event EmergencyWithdraw(address indexed to, uint256 amount);

    constructor(
        address _token,
        address admin,
        uint256 _maxPerOperation,
        uint256 _dailyLimit
    ) {
        require(_token != address(0), "Treasury: zero token");
        require(admin != address(0), "Treasury: zero admin");

        token = IERC20(_token);
        maxPerOperation = _maxPerOperation;
        dailyLimit = _dailyLimit;
        lastResetTimestamp = block.timestamp;
        hourStart = block.timestamp;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(TREASURER_ROLE, admin);
    }

    /**
     * @notice Release tokens to a recipient.
     * @param to Recipient address.
     * @param amount Amount of tokens to release.
     * @param reason Human-readable reason for the release.
     */
    function release(
        address to,
        uint256 amount,
        string calldata reason
    ) external onlyRole(DISTRIBUTOR_ROLE) whenNotPaused nonReentrant {
        require(to != address(0), "Treasury: zero recipient");
        require(amount > 0, "Treasury: zero amount");
        require(amount <= maxPerOperation, "Treasury: exceeds max per operation");

        _enforceRateLimit();
        _enforceDailyLimit(amount);

        token.safeTransfer(to, amount);

        emit TokensReleased(to, amount, reason);
    }

    /**
     * @notice Update operational limits.
     */
    function updateLimits(
        uint256 _maxPerOperation,
        uint256 _dailyLimit
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        maxPerOperation = _maxPerOperation;
        dailyLimit = _dailyLimit;
        emit LimitsUpdated(_maxPerOperation, _dailyLimit);
    }

    /**
     * @notice Emergency pause — freezes all releases.
     */
    function pause() external onlyRole(TREASURER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause releases.
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Emergency withdraw — only DEFAULT_ADMIN, last resort.
     * @dev Only callable when paused.
     */
    function emergencyWithdraw(
        address to,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        require(paused(), "Treasury: must be paused");
        require(to != address(0), "Treasury: zero recipient");
        token.safeTransfer(to, amount);
        emit EmergencyWithdraw(to, amount);
    }

    /**
     * @notice Returns the current token balance of the treasury.
     */
    function balance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    // --- Internal ---

    function _enforceRateLimit() internal {
        if (block.timestamp >= hourStart + 1 hours) {
            hourStart = block.timestamp;
            opsThisHour = 0;
        }
        opsThisHour++;
        require(opsThisHour <= MAX_OPS_PER_HOUR, "Treasury: rate limit exceeded");
    }

    function _enforceDailyLimit(uint256 amount) internal {
        if (block.timestamp >= lastResetTimestamp + 1 days) {
            lastResetTimestamp = block.timestamp;
            dailySpent = 0;
        }
        dailySpent += amount;
        require(dailySpent <= dailyLimit, "Treasury: daily limit exceeded");
    }
}
