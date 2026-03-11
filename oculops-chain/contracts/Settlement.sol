// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title Settlement
 * @notice Records settlement batch hashes on-chain for auditability.
 * @dev Does NOT hold tokens. Only records immutable hashes of off-chain
 *      settlement batches. The actual settlement data lives in Supabase.
 *
 * Pattern: "Blockchain as notary" — store proof, not data.
 *
 * Roles:
 *   DEFAULT_ADMIN_ROLE — full control
 *   RECORDER_ROLE      — can record settlement batches
 */
contract Settlement is AccessControl, Pausable {

    bytes32 public constant RECORDER_ROLE = keccak256("RECORDER_ROLE");

    /// @notice Rate limit: max batches per hour
    uint256 public constant MAX_BATCHES_PER_HOUR = 100;
    uint256 public batchesThisHour;
    uint256 public hourStart;

    /// @notice Total number of recorded batches
    uint256 public totalBatches;

    /// @notice Total value settled (denominated in OCUL, for analytics)
    uint256 public totalSettledAmount;

    struct BatchRecord {
        uint256 settlementCount;
        uint256 totalAmount;
        uint256 timestamp;
        bool recorded;
    }

    /// @notice Mapping from batchHash to its record
    mapping(bytes32 => BatchRecord) public batches;

    // --- Events ---
    event BatchRecorded(
        bytes32 indexed batchHash,
        uint256 settlementCount,
        uint256 totalAmount,
        uint256 timestamp
    );

    constructor(address admin) {
        require(admin != address(0), "Settlement: zero admin");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(RECORDER_ROLE, admin);

        hourStart = block.timestamp;
    }

    /**
     * @notice Record a settlement batch hash on-chain.
     * @param batchHash keccak256 hash of the batch data (computed off-chain).
     * @param settlementCount Number of individual settlements in the batch.
     * @param totalAmount Total OCUL value of all settlements in the batch.
     */
    function recordBatch(
        bytes32 batchHash,
        uint256 settlementCount,
        uint256 totalAmount
    ) external onlyRole(RECORDER_ROLE) whenNotPaused {
        require(batchHash != bytes32(0), "Settlement: empty hash");
        require(settlementCount > 0, "Settlement: zero count");
        require(!batches[batchHash].recorded, "Settlement: duplicate batch");

        _enforceRateLimit();

        batches[batchHash] = BatchRecord({
            settlementCount: settlementCount,
            totalAmount: totalAmount,
            timestamp: block.timestamp,
            recorded: true
        });

        totalBatches++;
        totalSettledAmount += totalAmount;

        emit BatchRecorded(batchHash, settlementCount, totalAmount, block.timestamp);
    }

    /**
     * @notice Verify a batch was recorded.
     * @param batchHash The batch hash to verify.
     * @return recorded Whether the batch was recorded.
     * @return timestamp When it was recorded (0 if not recorded).
     */
    function verifyBatch(bytes32 batchHash)
        external
        view
        returns (bool recorded, uint256 timestamp)
    {
        BatchRecord storage b = batches[batchHash];
        return (b.recorded, b.timestamp);
    }

    /**
     * @notice Get full details of a recorded batch.
     */
    function getBatch(bytes32 batchHash)
        external
        view
        returns (
            uint256 settlementCount,
            uint256 totalAmount,
            uint256 timestamp,
            bool recorded
        )
    {
        BatchRecord storage b = batches[batchHash];
        return (b.settlementCount, b.totalAmount, b.timestamp, b.recorded);
    }

    /// @notice Pause batch recording. Only callable by admin.
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /// @notice Unpause batch recording. Only callable by admin.
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // --- Internal ---

    function _enforceRateLimit() internal {
        if (block.timestamp >= hourStart + 1 hours) {
            hourStart = block.timestamp;
            batchesThisHour = 0;
        }
        batchesThisHour++;
        require(
            batchesThisHour <= MAX_BATCHES_PER_HOUR,
            "Settlement: rate limit exceeded"
        );
    }
}
