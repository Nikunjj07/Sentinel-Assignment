require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: "0.8.28",
    mocha: {
        timeout: 40000,
        bail: false,
        exit: true  // Force exit after tests complete
    },
    networks: {
        hardhat: {
            allowUnlimitedContractSize: false,
            mining: {
                auto: true,
                interval: 0
            },
            loggingEnabled: false
        }
    }
};
