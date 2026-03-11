// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title OculopsToken (OCUL)
 * @notice ERC-20 utility token for the OCULOPS platform.
 * @dev Fixed supply of 100M tokens minted at deployment.
 *      - Burnable: enables token sinks (fee burns, expired rewards)
 *      - Pausable: emergency stop for all transfers
 *      - AccessControl: granular role management
 *
 * Roles:
 *   DEFAULT_ADMIN_ROLE — can grant/revoke other roles
 *   PAUSER_ROLE        — can pause/unpause transfers
 */
contract OculopsToken is ERC20, ERC20Burnable, ERC20Pausable, AccessControl {

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @notice Total supply: 100,000,000 OCUL (18 decimals)
    uint256 public constant TOTAL_SUPPLY = 100_000_000 * 10 ** 18;

    /**
     * @param initialRecipient Address that receives the entire supply at deployment.
     *        Typically the Treasury contract or a multi-sig wallet.
     * @param admin Address that receives DEFAULT_ADMIN_ROLE and PAUSER_ROLE.
     */
    constructor(
        address initialRecipient,
        address admin
    ) ERC20("Oculops Credit", "OCUL") {
        require(initialRecipient != address(0), "OculopsToken: zero recipient");
        require(admin != address(0), "OculopsToken: zero admin");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);

        _mint(initialRecipient, TOTAL_SUPPLY);
    }

    /// @notice Pause all token transfers. Only callable by PAUSER_ROLE.
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /// @notice Unpause token transfers. Only callable by PAUSER_ROLE.
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // --- Internal overrides required by Solidity ---

    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Pausable) {
        super._update(from, to, value);
    }
}
