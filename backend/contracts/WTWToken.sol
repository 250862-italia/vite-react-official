// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title WTWToken - Wash The World Token
 * @dev Token ERC20 per la piattaforma Wash The World
 * Include funzionalità di staking, cashback e sistema di ricompense
 */
contract WTWToken is ERC20, ERC20Burnable, Ownable, Pausable {
    
    // Struttura per lo staking
    struct Stake {
        uint256 amount;
        uint256 startTime;
        uint256 endTime;
        uint256 rewardRate;
        bool isActive;
    }
    
    // Mapping per gli stake degli utenti
    mapping(address => Stake[]) public stakes;
    mapping(address => uint256) public totalStaked;
    mapping(address => uint256) public totalRewards;
    
    // Variabili per il sistema di ricompense
    uint256 public constant REWARD_RATE = 5; // 5% APY
    uint256 public constant MIN_STAKE_TIME = 30 days;
    uint256 public constant MAX_STAKE_TIME = 365 days;
    
    // Eventi
    event TokensMinted(address indexed to, uint256 amount, string reason);
    event TokensBurned(address indexed from, uint256 amount, string reason);
    event StakeCreated(address indexed user, uint256 amount, uint256 duration);
    event StakeWithdrawn(address indexed user, uint256 amount, uint256 rewards);
    event CashbackPaid(address indexed user, uint256 amount);
    event ReferralReward(address indexed referrer, address indexed referred, uint256 amount);
    
    constructor() ERC20("Wash The World Token", "WTW") Ownable(msg.sender) {
        // Mint iniziale per il team (10% del supply totale)
        _mint(msg.sender, 1000000 * 10**decimals());
    }
    
    /**
     * @dev Mint token per nuovi utenti (solo owner)
     */
    function mintForUser(address to, uint256 amount, string memory reason) external onlyOwner {
        _mint(to, amount);
        emit TokensMinted(to, amount, reason);
    }
    
    /**
     * @dev Burn token (solo owner)
     */
    function burnFromUser(address from, uint256 amount, string memory reason) external onlyOwner {
        _burn(from, amount);
        emit TokensBurned(from, amount, reason);
    }
    
    /**
     * @dev Sistema di staking
     */
    function stake(uint256 amount, uint256 duration) external whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(duration >= MIN_STAKE_TIME, "Duration too short");
        require(duration <= MAX_STAKE_TIME, "Duration too long");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // Trasferisci token al contratto
        _transfer(msg.sender, address(this), amount);
        
        // Calcola il reward rate basato sulla durata
        uint256 rewardRate = REWARD_RATE + (duration - MIN_STAKE_TIME) / 30 days;
        
        // Crea lo stake
        Stake memory newStake = Stake({
            amount: amount,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            rewardRate: rewardRate,
            isActive: true
        });
        
        stakes[msg.sender].push(newStake);
        totalStaked[msg.sender] += amount;
        
        emit StakeCreated(msg.sender, amount, duration);
    }
    
    /**
     * @dev Withdraw stake e ricompense
     */
    function withdrawStake(uint256 stakeIndex) external whenNotPaused {
        require(stakeIndex < stakes[msg.sender].length, "Invalid stake index");
        Stake storage userStake = stakes[msg.sender][stakeIndex];
        require(userStake.isActive, "Stake not active");
        require(block.timestamp >= userStake.endTime, "Stake not matured");
        
        uint256 stakedAmount = userStake.amount;
        uint256 rewards = calculateRewards(msg.sender, stakeIndex);
        
        // Aggiorna lo stato
        userStake.isActive = false;
        totalStaked[msg.sender] -= stakedAmount;
        totalRewards[msg.sender] += rewards;
        
        // Trasferisci token e ricompense
        _transfer(address(this), msg.sender, stakedAmount + rewards);
        
        emit StakeWithdrawn(msg.sender, stakedAmount, rewards);
    }
    
    /**
     * @dev Calcola le ricompense per uno stake
     */
    function calculateRewards(address user, uint256 stakeIndex) public view returns (uint256) {
        require(stakeIndex < stakes[user].length, "Invalid stake index");
        Stake memory userStake = stakes[user][stakeIndex];
        
        if (!userStake.isActive) return 0;
        
        uint256 timeStaked = block.timestamp - userStake.startTime;
        uint256 maxTime = userStake.endTime - userStake.startTime;
        
        if (timeStaked < maxTime) {
            timeStaked = maxTime;
        }
        
        return (userStake.amount * userStake.rewardRate * timeStaked) / (365 days * 100);
    }
    
    /**
     * @dev Sistema di cashback
     */
    function payCashback(address user, uint256 amount) external onlyOwner {
        _mint(user, amount);
        emit CashbackPaid(user, amount);
    }
    
    /**
     * @dev Sistema di referral
     */
    function payReferralReward(address referrer, address referred, uint256 amount) external onlyOwner {
        _mint(referrer, amount);
        emit ReferralReward(referrer, referred, amount);
    }
    
    /**
     * @dev Pausa il contratto (solo owner)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause il contratto (solo owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Override per supportare pausa
     */
    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, amount);
    }
    
    /**
     * @dev Getter per gli stake di un utente
     */
    function getUserStakes(address user) external view returns (Stake[] memory) {
        return stakes[user];
    }
    
    /**
     * @dev Getter per le statistiche di un utente
     */
    function getUserStats(address user) external view returns (
        uint256 totalStakedAmount,
        uint256 totalRewardsEarned,
        uint256 activeStakes
    ) {
        totalStakedAmount = totalStaked[user];
        totalRewardsEarned = totalRewards[user];
        
        uint256 activeCount = 0;
        for (uint256 i = 0; i < stakes[user].length; i++) {
            if (stakes[user][i].isActive) {
                activeCount++;
            }
        }
        activeStakes = activeCount;
    }
} 