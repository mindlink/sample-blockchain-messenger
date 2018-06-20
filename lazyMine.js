function checkPendingTransactions() {
    if (eth.getBlock("pending").transactions.length > 0) {
        if (eth.mining) return;

        console.log("Mining pending transactions...\n");
        miner.start(1);
    } else {
        if (!eth.mining) return;

        miner.stop();
        console.log("Mining stopped.\n");
    }
}

eth.filter("latest", function(err, block) { checkPendingTransactions(); });
eth.filter("pending", function(err, block) { checkPendingTransactions(); });
checkPendingTransactions();