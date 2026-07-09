package com.trustintern.blockchain;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class BlockchainService {

    @Autowired
    private BlockRepository blockRepository;

    /**
     * Mints a new block on the blockchain.
     * Uses double-save pattern to ensure the auto-increment blockNumber is included in the cryptographic hash.
     */
    @Transactional
    public synchronized Block addBlock(String certificateId, Integer studentId, String certificateHash) {
        // Fetch last block to chain hashes
        String previousHash = "0";
        var lastBlockOpt = blockRepository.findTopByOrderByBlockNumberDesc();
        if (lastBlockOpt.isPresent()) {
            previousHash = lastBlockOpt.get().getCurrentHash();
        }

        // Build base block structure
        Block block = Block.builder()
                .certificateId(certificateId)
                .studentId(studentId)
                .certificateHash(certificateHash)
                .previousHash(previousHash)
                .timestamp(System.currentTimeMillis())
                .currentHash("") // Temporary empty hash
                .build();

        // Save block to generate the database Primary Key (blockNumber)
        block = blockRepository.save(block);

        // Compute true cryptographic hash including the newly assigned blockNumber
        String hash = block.calculateHash();
        block.setCurrentHash(hash);

        // Save final block with calculated hash
        return blockRepository.save(block);
    }

    /**
     * Iterates through the entire blockchain ledger to verify hashes and parent links.
     * If any block's content is tampered with in database, this check fails.
     */
    public boolean isChainValid() {
        List<Block> chain = blockRepository.findAll();
        for (int i = 0; i < chain.size(); i++) {
            Block currentBlock = chain.get(i);
            
            // Recalculate block hash and compare
            String calculatedHash = currentBlock.calculateHash();
            if (!currentBlock.getCurrentHash().equals(calculatedHash)) {
                return false;
            }
            
            // Compare previous hash with previous block's current hash
            if (i > 0) {
                Block previousBlock = chain.get(i - 1);
                if (!currentBlock.getPreviousHash().equals(previousBlock.getCurrentHash())) {
                    return false;
                }
            }
        }
        return true;
    }
}
