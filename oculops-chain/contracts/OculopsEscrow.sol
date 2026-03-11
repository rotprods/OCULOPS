// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title OculopsEscrow
 * @notice Milestone-based escrow for OCUL tokens.
 *         Admin (Roberto) manages releases. Platform takes fees.
 */
contract OculopsEscrow is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    IERC20 public immutable token;
    address public treasury;

    uint256 public creationFeeBps = 100;  // 1%
    uint256 public releaseFeeBps = 200;   // 2%
    uint256 public escrowCount;

    enum EscrowStatus { Active, Completed, Refunded, Expired }

    struct Escrow {
        address client;
        address provider;
        uint256 totalAmount;        // after creation fee
        uint256 milestoneCount;
        uint256 milestonesReleased;
        uint256 amountReleased;
        uint256 deadline;
        EscrowStatus status;
        uint256 createdAt;
    }

    mapping(uint256 => Escrow) public escrows;

    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed client,
        address indexed provider,
        uint256 depositAmount,
        uint256 netAmount,
        uint256 fee,
        uint256 milestoneCount,
        uint256 deadline
    );
    event MilestoneReleased(
        uint256 indexed escrowId,
        uint256 milestoneIndex,
        uint256 amount,
        uint256 fee
    );
    event EscrowRefunded(uint256 indexed escrowId, uint256 amount);
    event EscrowExpired(uint256 indexed escrowId, uint256 refunded);
    event FeesUpdated(uint256 creationBps, uint256 releaseBps);
    event TreasuryUpdated(address newTreasury);

    constructor(
        address _token,
        address _treasury,
        address _admin
    ) {
        require(_token != address(0), "Zero token");
        require(_treasury != address(0), "Zero treasury");
        require(_admin != address(0), "Zero admin");

        token = IERC20(_token);
        treasury = _treasury;

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
    }

    // ══════════════════════════════════════════════
    //  CREATE ESCROW
    // ══════════════════════════════════════════════

    /**
     * @notice Client creates an escrow, depositing OCUL tokens.
     * @param provider Address receiving funds on milestone completion
     * @param amount Total OCUL to deposit (creation fee deducted)
     * @param milestoneCount Number of equal milestones
     * @param deadline Unix timestamp after which client can reclaim
     */
    function createEscrow(
        address provider,
        uint256 amount,
        uint256 milestoneCount,
        uint256 deadline
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(provider != address(0), "Zero provider");
        require(provider != msg.sender, "Self-escrow");
        require(amount > 0, "Zero amount");
        require(milestoneCount > 0 && milestoneCount <= 20, "Bad milestones");
        require(deadline > block.timestamp, "Past deadline");

        uint256 fee = (amount * creationFeeBps) / 10000;
        uint256 netAmount = amount - fee;

        // Pull tokens from client
        token.safeTransferFrom(msg.sender, address(this), netAmount);
        if (fee > 0) {
            token.safeTransferFrom(msg.sender, treasury, fee);
        }

        uint256 escrowId = escrowCount++;
        escrows[escrowId] = Escrow({
            client: msg.sender,
            provider: provider,
            totalAmount: netAmount,
            milestoneCount: milestoneCount,
            milestonesReleased: 0,
            amountReleased: 0,
            deadline: deadline,
            status: EscrowStatus.Active,
            createdAt: block.timestamp
        });

        emit EscrowCreated(
            escrowId, msg.sender, provider,
            amount, netAmount, fee,
            milestoneCount, deadline
        );

        return escrowId;
    }

    // ══════════════════════════════════════════════
    //  RELEASE MILESTONE (Admin only)
    // ══════════════════════════════════════════════

    /**
     * @notice Admin releases the next milestone payment to provider.
     *         Release fee is split: half burned, half to treasury.
     */
    function releaseMilestone(uint256 escrowId) 
        external 
        onlyRole(ADMIN_ROLE) 
        whenNotPaused 
        nonReentrant 
    {
        Escrow storage e = escrows[escrowId];
        require(e.status == EscrowStatus.Active, "Not active");
        require(e.milestonesReleased < e.milestoneCount, "All released");

        uint256 milestoneAmount = e.totalAmount / e.milestoneCount;
        
        // Last milestone gets remainder to avoid dust
        if (e.milestonesReleased == e.milestoneCount - 1) {
            milestoneAmount = e.totalAmount - e.amountReleased;
        }

        uint256 fee = (milestoneAmount * releaseFeeBps) / 10000;
        uint256 providerAmount = milestoneAmount - fee;

        // Pay provider
        token.safeTransfer(e.provider, providerAmount);

        // Fee to treasury
        if (fee > 0) {
            token.safeTransfer(treasury, fee);
        }

        e.milestonesReleased++;
        e.amountReleased += milestoneAmount;

        emit MilestoneReleased(
            escrowId, e.milestonesReleased - 1,
            providerAmount, fee
        );

        // Complete if all milestones done
        if (e.milestonesReleased == e.milestoneCount) {
            e.status = EscrowStatus.Completed;
        }
    }

    // ══════════════════════════════════════════════
    //  REFUND (Admin only)
    // ══════════════════════════════════════════════

    /**
     * @notice Admin refunds remaining balance to client (dispute resolution).
     */
    function refund(uint256 escrowId) 
        external 
        onlyRole(ADMIN_ROLE) 
        nonReentrant 
    {
        Escrow storage e = escrows[escrowId];
        require(e.status == EscrowStatus.Active, "Not active");

        uint256 remaining = e.totalAmount - e.amountReleased;
        require(remaining > 0, "Nothing to refund");

        e.status = EscrowStatus.Refunded;
        e.amountReleased = e.totalAmount; // mark fully resolved

        token.safeTransfer(e.client, remaining);

        emit EscrowRefunded(escrowId, remaining);
    }

    // ══════════════════════════════════════════════
    //  CLAIM EXPIRED (Client)
    // ══════════════════════════════════════════════

    /**
     * @notice Client reclaims remaining funds after deadline.
     */
    function claimExpired(uint256 escrowId) external nonReentrant {
        Escrow storage e = escrows[escrowId];
        require(e.status == EscrowStatus.Active, "Not active");
        require(msg.sender == e.client, "Not client");
        require(block.timestamp > e.deadline, "Not expired");

        uint256 remaining = e.totalAmount - e.amountReleased;
        require(remaining > 0, "Nothing to claim");

        e.status = EscrowStatus.Expired;
        e.amountReleased = e.totalAmount;

        token.safeTransfer(e.client, remaining);

        emit EscrowExpired(escrowId, remaining);
    }

    // ══════════════════════════════════════════════
    //  VIEW FUNCTIONS
    // ══════════════════════════════════════════════

    function getEscrow(uint256 escrowId) external view returns (Escrow memory) {
        return escrows[escrowId];
    }

    function getRemainingBalance(uint256 escrowId) external view returns (uint256) {
        Escrow storage e = escrows[escrowId];
        return e.totalAmount - e.amountReleased;
    }

    function getMilestoneAmount(uint256 escrowId) external view returns (uint256) {
        Escrow storage e = escrows[escrowId];
        if (e.milestoneCount == 0) return 0;
        return e.totalAmount / e.milestoneCount;
    }

    // ══════════════════════════════════════════════
    //  ADMIN CONTROLS
    // ══════════════════════════════════════════════

    function setFees(uint256 _creationBps, uint256 _releaseBps) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(_creationBps <= 500, "Creation fee >5%");
        require(_releaseBps <= 500, "Release fee >5%");
        creationFeeBps = _creationBps;
        releaseFeeBps = _releaseBps;
        emit FeesUpdated(_creationBps, _releaseBps);
    }

    function setTreasury(address _treasury) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(_treasury != address(0), "Zero address");
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    function pause() external onlyRole(ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }
}
