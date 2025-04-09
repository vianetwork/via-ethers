import { type ContractRunner } from "ethers";
import type { IL1SharedBridge, IL1SharedBridgeInterface } from "../IL1SharedBridge";
export declare class IL1SharedBridge__factory {
    static readonly abi: readonly [{
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: true;
            readonly internalType: "uint256";
            readonly name: "chainId";
            readonly type: "uint256";
        }, {
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "from";
            readonly type: "address";
        }, {
            readonly indexed: false;
            readonly internalType: "address";
            readonly name: "l1Token";
            readonly type: "address";
        }, {
            readonly indexed: false;
            readonly internalType: "uint256";
            readonly name: "amount";
            readonly type: "uint256";
        }];
        readonly name: "BridgehubDepositBaseTokenInitiated";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: true;
            readonly internalType: "uint256";
            readonly name: "chainId";
            readonly type: "uint256";
        }, {
            readonly indexed: true;
            readonly internalType: "bytes32";
            readonly name: "txDataHash";
            readonly type: "bytes32";
        }, {
            readonly indexed: true;
            readonly internalType: "bytes32";
            readonly name: "l2DepositTxHash";
            readonly type: "bytes32";
        }];
        readonly name: "BridgehubDepositFinalized";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: true;
            readonly internalType: "uint256";
            readonly name: "chainId";
            readonly type: "uint256";
        }, {
            readonly indexed: true;
            readonly internalType: "bytes32";
            readonly name: "txDataHash";
            readonly type: "bytes32";
        }, {
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "from";
            readonly type: "address";
        }, {
            readonly indexed: false;
            readonly internalType: "address";
            readonly name: "to";
            readonly type: "address";
        }, {
            readonly indexed: false;
            readonly internalType: "address";
            readonly name: "l1Token";
            readonly type: "address";
        }, {
            readonly indexed: false;
            readonly internalType: "uint256";
            readonly name: "amount";
            readonly type: "uint256";
        }];
        readonly name: "BridgehubDepositInitiated";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: true;
            readonly internalType: "uint256";
            readonly name: "chainId";
            readonly type: "uint256";
        }, {
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "to";
            readonly type: "address";
        }, {
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "l1Token";
            readonly type: "address";
        }, {
            readonly indexed: false;
            readonly internalType: "uint256";
            readonly name: "amount";
            readonly type: "uint256";
        }];
        readonly name: "ClaimedFailedDepositSharedBridge";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: true;
            readonly internalType: "uint256";
            readonly name: "chainId";
            readonly type: "uint256";
        }, {
            readonly indexed: true;
            readonly internalType: "bytes32";
            readonly name: "l2DepositTxHash";
            readonly type: "bytes32";
        }, {
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "from";
            readonly type: "address";
        }, {
            readonly indexed: false;
            readonly internalType: "address";
            readonly name: "to";
            readonly type: "address";
        }, {
            readonly indexed: false;
            readonly internalType: "address";
            readonly name: "l1Token";
            readonly type: "address";
        }, {
            readonly indexed: false;
            readonly internalType: "uint256";
            readonly name: "amount";
            readonly type: "uint256";
        }];
        readonly name: "LegacyDepositInitiated";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: true;
            readonly internalType: "uint256";
            readonly name: "chainId";
            readonly type: "uint256";
        }, {
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "to";
            readonly type: "address";
        }, {
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "l1Token";
            readonly type: "address";
        }, {
            readonly indexed: false;
            readonly internalType: "uint256";
            readonly name: "amount";
            readonly type: "uint256";
        }];
        readonly name: "WithdrawalFinalizedSharedBridge";
        readonly type: "event";
    }, {
        readonly inputs: readonly [];
        readonly name: "BRIDGE_HUB";
        readonly outputs: readonly [{
            readonly internalType: "contract IBridgehub";
            readonly name: "";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "L1_WETH_TOKEN";
        readonly outputs: readonly [{
            readonly internalType: "address";
            readonly name: "";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "_chainId";
            readonly type: "uint256";
        }, {
            readonly internalType: "bytes32";
            readonly name: "_txDataHash";
            readonly type: "bytes32";
        }, {
            readonly internalType: "bytes32";
            readonly name: "_txHash";
            readonly type: "bytes32";
        }];
        readonly name: "bridgehubConfirmL2Transaction";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "_chainId";
            readonly type: "uint256";
        }, {
            readonly internalType: "address";
            readonly name: "_prevMsgSender";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "_l2Value";
            readonly type: "uint256";
        }, {
            readonly internalType: "bytes";
            readonly name: "_data";
            readonly type: "bytes";
        }];
        readonly name: "bridgehubDeposit";
        readonly outputs: readonly [{
            readonly components: readonly [{
                readonly internalType: "bytes32";
                readonly name: "magicValue";
                readonly type: "bytes32";
            }, {
                readonly internalType: "address";
                readonly name: "l2Contract";
                readonly type: "address";
            }, {
                readonly internalType: "bytes";
                readonly name: "l2Calldata";
                readonly type: "bytes";
            }, {
                readonly internalType: "bytes[]";
                readonly name: "factoryDeps";
                readonly type: "bytes[]";
            }, {
                readonly internalType: "bytes32";
                readonly name: "txDataHash";
                readonly type: "bytes32";
            }];
            readonly internalType: "struct L2TransactionRequestTwoBridgesInner";
            readonly name: "request";
            readonly type: "tuple";
        }];
        readonly stateMutability: "payable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "_chainId";
            readonly type: "uint256";
        }, {
            readonly internalType: "address";
            readonly name: "_prevMsgSender";
            readonly type: "address";
        }, {
            readonly internalType: "address";
            readonly name: "_l1Token";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "_amount";
            readonly type: "uint256";
        }];
        readonly name: "bridgehubDepositBaseToken";
        readonly outputs: readonly [];
        readonly stateMutability: "payable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "_chainId";
            readonly type: "uint256";
        }, {
            readonly internalType: "address";
            readonly name: "_depositSender";
            readonly type: "address";
        }, {
            readonly internalType: "address";
            readonly name: "_l1Token";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "_amount";
            readonly type: "uint256";
        }, {
            readonly internalType: "bytes32";
            readonly name: "_l2TxHash";
            readonly type: "bytes32";
        }, {
            readonly internalType: "uint256";
            readonly name: "_l2BatchNumber";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "_l2MessageIndex";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint16";
            readonly name: "_l2TxNumberInBatch";
            readonly type: "uint16";
        }, {
            readonly internalType: "bytes32[]";
            readonly name: "_merkleProof";
            readonly type: "bytes32[]";
        }];
        readonly name: "claimFailedDeposit";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "_depositSender";
            readonly type: "address";
        }, {
            readonly internalType: "address";
            readonly name: "_l1Token";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "_amount";
            readonly type: "uint256";
        }, {
            readonly internalType: "bytes32";
            readonly name: "_l2TxHash";
            readonly type: "bytes32";
        }, {
            readonly internalType: "uint256";
            readonly name: "_l2BatchNumber";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "_l2MessageIndex";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint16";
            readonly name: "_l2TxNumberInBatch";
            readonly type: "uint16";
        }, {
            readonly internalType: "bytes32[]";
            readonly name: "_merkleProof";
            readonly type: "bytes32[]";
        }];
        readonly name: "claimFailedDepositLegacyErc20Bridge";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "_chainId";
            readonly type: "uint256";
        }, {
            readonly internalType: "bytes32";
            readonly name: "_l2TxHash";
            readonly type: "bytes32";
        }];
        readonly name: "depositHappened";
        readonly outputs: readonly [{
            readonly internalType: "bytes32";
            readonly name: "";
            readonly type: "bytes32";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "_msgSender";
            readonly type: "address";
        }, {
            readonly internalType: "address";
            readonly name: "_l2Receiver";
            readonly type: "address";
        }, {
            readonly internalType: "address";
            readonly name: "_l1Token";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "_amount";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "_l2TxGasLimit";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "_l2TxGasPerPubdataByte";
            readonly type: "uint256";
        }, {
            readonly internalType: "address";
            readonly name: "_refundRecipient";
            readonly type: "address";
        }];
        readonly name: "depositLegacyErc20Bridge";
        readonly outputs: readonly [{
            readonly internalType: "bytes32";
            readonly name: "txHash";
            readonly type: "bytes32";
        }];
        readonly stateMutability: "payable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "_chainId";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "_l2BatchNumber";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "_l2MessageIndex";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint16";
            readonly name: "_l2TxNumberInBatch";
            readonly type: "uint16";
        }, {
            readonly internalType: "bytes";
            readonly name: "_message";
            readonly type: "bytes";
        }, {
            readonly internalType: "bytes32[]";
            readonly name: "_merkleProof";
            readonly type: "bytes32[]";
        }];
        readonly name: "finalizeWithdrawal";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "_l2BatchNumber";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "_l2MessageIndex";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint16";
            readonly name: "_l2TxNumberInBatch";
            readonly type: "uint16";
        }, {
            readonly internalType: "bytes";
            readonly name: "_message";
            readonly type: "bytes";
        }, {
            readonly internalType: "bytes32[]";
            readonly name: "_merkleProof";
            readonly type: "bytes32[]";
        }];
        readonly name: "finalizeWithdrawalLegacyErc20Bridge";
        readonly outputs: readonly [{
            readonly internalType: "address";
            readonly name: "l1Receiver";
            readonly type: "address";
        }, {
            readonly internalType: "address";
            readonly name: "l1Token";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "amount";
            readonly type: "uint256";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "_chainId";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "_l2BatchNumber";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "_l2MessageIndex";
            readonly type: "uint256";
        }];
        readonly name: "isWithdrawalFinalized";
        readonly outputs: readonly [{
            readonly internalType: "bool";
            readonly name: "";
            readonly type: "bool";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "_chainId";
            readonly type: "uint256";
        }];
        readonly name: "l2BridgeAddress";
        readonly outputs: readonly [{
            readonly internalType: "address";
            readonly name: "";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "legacyBridge";
        readonly outputs: readonly [{
            readonly internalType: "contract IL1ERC20Bridge";
            readonly name: "";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "_chainId";
            readonly type: "uint256";
        }];
        readonly name: "receiveEth";
        readonly outputs: readonly [];
        readonly stateMutability: "payable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "_eraLegacyBridgeLastDepositBatch";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "_eraLegacyBridgeLastDepositTxNumber";
            readonly type: "uint256";
        }];
        readonly name: "setEraLegacyBridgeLastDepositTime";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "_eraPostDiamondUpgradeFirstBatch";
            readonly type: "uint256";
        }];
        readonly name: "setEraPostDiamondUpgradeFirstBatch";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "_eraPostLegacyBridgeUpgradeFirstBatch";
            readonly type: "uint256";
        }];
        readonly name: "setEraPostLegacyBridgeUpgradeFirstBatch";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }];
    static createInterface(): IL1SharedBridgeInterface;
    static connect(address: string, runner?: ContractRunner | null): IL1SharedBridge;
}
