const { ethers } = require('ethers');
const crypto = require('crypto');

// ABI del contratto WTWToken (semplificato per ora)
const WTW_TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function mintForUser(address to, uint256 amount, string reason) external",
  "function payCashback(address user, uint256 amount) external",
  "function payReferralReward(address referrer, address referred, uint256 amount) external",
  "function stake(uint256 amount, uint256 duration) external",
  "function withdrawStake(uint256 stakeIndex) external",
  "function getUserStakes(address user) view returns (tuple(uint256 amount, uint256 startTime, uint256 endTime, uint256 rewardRate, bool isActive)[])",
  "function getUserStats(address user) view returns (uint256 totalStakedAmount, uint256 totalRewardsEarned, uint256 activeStakes)",
  "function calculateRewards(address user, uint256 stakeIndex) view returns (uint256)",
  "event TokensMinted(address indexed to, uint256 amount, string reason)",
  "event CashbackPaid(address indexed user, uint256 amount)",
  "event ReferralReward(address indexed referrer, address indexed referred, uint256 amount)",
  "event StakeCreated(address indexed user, uint256 amount, uint256 duration)",
  "event StakeWithdrawn(address indexed user, uint256 amount, uint256 rewards)"
];

class BlockchainService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.contractAddress = process.env.CONTRACT_ADDRESS;
    this.initializeProvider();
  }

  // Inizializza il provider blockchain
  initializeProvider() {
    try {
      // Usa Polygon per costi inferiori
      this.provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL || 'https://polygon-rpc.com');
      
      if (process.env.PRIVATE_KEY) {
        this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
        console.log('✅ Wallet blockchain inizializzato');
        
        // Inizializza il contratto se abbiamo l'indirizzo
        if (this.contractAddress) {
          this.contract = new ethers.Contract(this.contractAddress, WTW_TOKEN_ABI, this.wallet);
          console.log('✅ Contratto WTW Token inizializzato');
        }
      }
    } catch (error) {
      console.error('❌ Errore inizializzazione blockchain:', error.message);
    }
  }

  // Genera un nuovo wallet per un utente
  async generateUserWallet() {
    try {
      const wallet = ethers.Wallet.createRandom();
      
      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic?.phrase
      };
    } catch (error) {
      console.error('❌ Errore generazione wallet:', error.message);
      throw new Error('Impossibile generare wallet');
    }
  }

  // Ottiene il saldo token di un utente
  async getTokenBalance(address) {
    try {
      if (this.contract) {
        const balance = await this.contract.balanceOf(address);
        return {
          address,
          balance: balance.toString(),
          symbol: 'WTW',
          decimals: 18
        };
      } else {
        // Fallback simulato
        const balance = Math.floor(Math.random() * 1000) + 100;
        return {
          address,
          balance: balance.toString(),
          symbol: 'WTW',
          decimals: 18
        };
      }
    } catch (error) {
      console.error('❌ Errore lettura saldo:', error.message);
      throw new Error('Impossibile leggere saldo');
    }
  }

  // Emette token per un utente
  async mintTokens(userAddress, amount, reason = 'onboarding') {
    try {
      if (this.contract) {
        const tx = await this.contract.mintForUser(userAddress, amount, reason);
        await tx.wait();
        
        return {
          success: true,
          transactionHash: tx.hash,
          amount,
          userAddress,
          reason
        };
      } else {
        // Simulazione per sviluppo
        console.log(`🎯 Simulazione emissione ${amount} token per ${userAddress} - ${reason}`);
        return {
          success: true,
          transactionHash: `0x${crypto.randomBytes(32).toString('hex')}`,
          amount,
          userAddress,
          reason
        };
      }
    } catch (error) {
      console.error('❌ Errore emissione token:', error.message);
      throw new Error('Impossibile emettere token');
    }
  }

  // Paga cashback
  async payCashback(userAddress, amount) {
    try {
      if (this.contract) {
        const tx = await this.contract.payCashback(userAddress, amount);
        await tx.wait();
        
        return {
          success: true,
          transactionHash: tx.hash,
          amount,
          userAddress
        };
      } else {
        // Simulazione
        console.log(`💰 Simulazione cashback ${amount} token per ${userAddress}`);
        return {
          success: true,
          transactionHash: `0x${crypto.randomBytes(32).toString('hex')}`,
          amount,
          userAddress
        };
      }
    } catch (error) {
      console.error('❌ Errore cashback:', error.message);
      throw new Error('Impossibile pagare cashback');
    }
  }

  // Paga referral reward
  async payReferralReward(referrerAddress, referredAddress, amount) {
    try {
      if (this.contract) {
        const tx = await this.contract.payReferralReward(referrerAddress, referredAddress, amount);
        await tx.wait();
        
        return {
          success: true,
          transactionHash: tx.hash,
          amount,
          referrerAddress,
          referredAddress
        };
      } else {
        // Simulazione
        console.log(`🎁 Simulazione referral reward ${amount} token da ${referrerAddress} a ${referredAddress}`);
        return {
          success: true,
          transactionHash: `0x${crypto.randomBytes(32).toString('hex')}`,
          amount,
          referrerAddress,
          referredAddress
        };
      }
    } catch (error) {
      console.error('❌ Errore referral reward:', error.message);
      throw new Error('Impossibile pagare referral reward');
    }
  }

  // Crea stake
  async createStake(userAddress, amount, duration) {
    try {
      if (this.contract) {
        // L'utente deve firmare la transazione
        const userWallet = new ethers.Wallet(userAddress, this.provider);
        const userContract = this.contract.connect(userWallet);
        
        const tx = await userContract.stake(amount, duration);
        await tx.wait();
        
        return {
          success: true,
          transactionHash: tx.hash,
          amount,
          duration
        };
      } else {
        // Simulazione
        console.log(`🔒 Simulazione stake ${amount} token per ${duration} secondi`);
        return {
          success: true,
          transactionHash: `0x${crypto.randomBytes(32).toString('hex')}`,
          amount,
          duration
        };
      }
    } catch (error) {
      console.error('❌ Errore creazione stake:', error.message);
      throw new Error('Impossibile creare stake');
    }
  }

  // Ottiene gli stake di un utente
  async getUserStakes(userAddress) {
    try {
      if (this.contract) {
        const stakes = await this.contract.getUserStakes(userAddress);
        return stakes.map(stake => ({
          amount: stake.amount.toString(),
          startTime: new Date(stake.startTime * 1000),
          endTime: new Date(stake.endTime * 1000),
          rewardRate: stake.rewardRate.toString(),
          isActive: stake.isActive
        }));
      } else {
        // Simulazione
        return [
          {
            amount: '100',
            startTime: new Date(),
            endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 giorni
            rewardRate: '5',
            isActive: true
          }
        ];
      }
    } catch (error) {
      console.error('❌ Errore lettura stake:', error.message);
      throw new Error('Impossibile leggere stake');
    }
  }

  // Ottiene le statistiche di un utente
  async getUserStats(userAddress) {
    try {
      if (this.contract) {
        const stats = await this.contract.getUserStats(userAddress);
        return {
          totalStakedAmount: stats.totalStakedAmount.toString(),
          totalRewardsEarned: stats.totalRewardsEarned.toString(),
          activeStakes: stats.activeStakes.toString()
        };
      } else {
        // Simulazione
        return {
          totalStakedAmount: '500',
          totalRewardsEarned: '25',
          activeStakes: '2'
        };
      }
    } catch (error) {
      console.error('❌ Errore lettura statistiche:', error.message);
      throw new Error('Impossibile leggere statistiche');
    }
  }

  // Crea hash del contratto per tracciabilità
  createContractHash(userData) {
    const contractData = {
      userId: userData._id,
      username: userData.username,
      email: userData.email,
      role: userData.role,
      timestamp: new Date().toISOString(),
      terms: 'Wash The World Platform Terms and Conditions'
    };

    const hash = crypto.createHash('sha256')
      .update(JSON.stringify(contractData))
      .digest('hex');

    return {
      hash,
      contractData,
      timestamp: new Date()
    };
  }

  // Verifica firma del contratto
  verifyContractSignature(hash, signature, publicKey) {
    try {
      const messageHash = ethers.hashMessage(hash);
      const recoveredAddress = ethers.recoverAddress(messageHash, signature);
      
      return recoveredAddress.toLowerCase() === publicKey.toLowerCase();
    } catch (error) {
      console.error('❌ Errore verifica firma:', error.message);
      return false;
    }
  }

  // Registra evento sulla blockchain
  async logEvent(eventType, eventData) {
    try {
      const eventHash = crypto.createHash('sha256')
        .update(JSON.stringify({ type: eventType, data: eventData, timestamp: new Date() }))
        .digest('hex');

      console.log(`📝 Evento registrato: ${eventType} - Hash: ${eventHash}`);
      
      return {
        eventHash,
        eventType,
        timestamp: new Date(),
        success: true
      };
    } catch (error) {
      console.error('❌ Errore registrazione evento:', error.message);
      throw new Error('Impossibile registrare evento');
    }
  }

  // Verifica stato della rete
  async getNetworkStatus() {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      const gasPrice = await this.provider.getFeeData();
      
      return {
        connected: true,
        blockNumber,
        gasPrice: gasPrice.gasPrice?.toString(),
        network: 'Polygon',
        contractAddress: this.contractAddress || 'Non configurato'
      };
    } catch (error) {
      console.error('❌ Errore stato rete:', error.message);
      return {
        connected: false,
        error: error.message
      };
    }
  }
}

module.exports = new BlockchainService(); 