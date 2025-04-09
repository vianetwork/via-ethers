import type { BaseContract, BigNumberish, BytesLike, FunctionFragment, Result, Interface, EventFragment, AddressLike, ContractRunner, ContractMethod, Listener } from "ethers";
import type { TypedContractEvent, TypedDeferredTopicFilter, TypedEventLog, TypedLogDescription, TypedListener, TypedContractMethod } from "./common";
export type L2LogStruct = {
    l2ShardId: BigNumberish;
    isService: boolean;
    txNumberInBatch: BigNumberish;
    sender: AddressLike;
    key: BytesLike;
    value: BytesLike;
};
export type L2LogStructOutput = [
    l2ShardId: bigint,
    isService: boolean,
    txNumberInBatch: bigint,
    sender: string,
    key: string,
    value: string
] & {
    l2ShardId: bigint;
    isService: boolean;
    txNumberInBatch: bigint;
    sender: string;
    key: string;
    value: string;
};
export type L2MessageStruct = {
    txNumberInBatch: BigNumberish;
    sender: AddressLike;
    data: BytesLike;
};
export type L2MessageStructOutput = [
    txNumberInBatch: bigint,
    sender: string,
    data: string
] & {
    txNumberInBatch: bigint;
    sender: string;
    data: string;
};
export type L2TransactionRequestDirectStruct = {
    chainId: BigNumberish;
    mintValue: BigNumberish;
    l2Contract: AddressLike;
    l2Value: BigNumberish;
    l2Calldata: BytesLike;
    l2GasLimit: BigNumberish;
    l2GasPerPubdataByteLimit: BigNumberish;
    factoryDeps: BytesLike[];
    refundRecipient: AddressLike;
};
export type L2TransactionRequestDirectStructOutput = [
    chainId: bigint,
    mintValue: bigint,
    l2Contract: string,
    l2Value: bigint,
    l2Calldata: string,
    l2GasLimit: bigint,
    l2GasPerPubdataByteLimit: bigint,
    factoryDeps: string[],
    refundRecipient: string
] & {
    chainId: bigint;
    mintValue: bigint;
    l2Contract: string;
    l2Value: bigint;
    l2Calldata: string;
    l2GasLimit: bigint;
    l2GasPerPubdataByteLimit: bigint;
    factoryDeps: string[];
    refundRecipient: string;
};
export type L2TransactionRequestTwoBridgesOuterStruct = {
    chainId: BigNumberish;
    mintValue: BigNumberish;
    l2Value: BigNumberish;
    l2GasLimit: BigNumberish;
    l2GasPerPubdataByteLimit: BigNumberish;
    refundRecipient: AddressLike;
    secondBridgeAddress: AddressLike;
    secondBridgeValue: BigNumberish;
    secondBridgeCalldata: BytesLike;
};
export type L2TransactionRequestTwoBridgesOuterStructOutput = [
    chainId: bigint,
    mintValue: bigint,
    l2Value: bigint,
    l2GasLimit: bigint,
    l2GasPerPubdataByteLimit: bigint,
    refundRecipient: string,
    secondBridgeAddress: string,
    secondBridgeValue: bigint,
    secondBridgeCalldata: string
] & {
    chainId: bigint;
    mintValue: bigint;
    l2Value: bigint;
    l2GasLimit: bigint;
    l2GasPerPubdataByteLimit: bigint;
    refundRecipient: string;
    secondBridgeAddress: string;
    secondBridgeValue: bigint;
    secondBridgeCalldata: string;
};
export interface IBridgehubInterface extends Interface {
    getFunction(nameOrSignature: "acceptAdmin" | "addStateTransitionManager" | "addToken" | "baseToken" | "createNewChain" | "getHyperchain" | "l2TransactionBaseCost" | "proveL1ToL2TransactionStatus" | "proveL2LogInclusion" | "proveL2MessageInclusion" | "removeStateTransitionManager" | "requestL2TransactionDirect" | "requestL2TransactionTwoBridges" | "setPendingAdmin" | "setSharedBridge" | "sharedBridge" | "stateTransitionManager" | "stateTransitionManagerIsRegistered" | "tokenIsRegistered"): FunctionFragment;
    getEvent(nameOrSignatureOrTopic: "NewAdmin" | "NewChain" | "NewPendingAdmin"): EventFragment;
    encodeFunctionData(functionFragment: "acceptAdmin", values?: undefined): string;
    encodeFunctionData(functionFragment: "addStateTransitionManager", values: [AddressLike]): string;
    encodeFunctionData(functionFragment: "addToken", values: [AddressLike]): string;
    encodeFunctionData(functionFragment: "baseToken", values: [BigNumberish]): string;
    encodeFunctionData(functionFragment: "createNewChain", values: [
        BigNumberish,
        AddressLike,
        AddressLike,
        BigNumberish,
        AddressLike,
        BytesLike
    ]): string;
    encodeFunctionData(functionFragment: "getHyperchain", values: [BigNumberish]): string;
    encodeFunctionData(functionFragment: "l2TransactionBaseCost", values: [BigNumberish, BigNumberish, BigNumberish, BigNumberish]): string;
    encodeFunctionData(functionFragment: "proveL1ToL2TransactionStatus", values: [
        BigNumberish,
        BytesLike,
        BigNumberish,
        BigNumberish,
        BigNumberish,
        BytesLike[],
        BigNumberish
    ]): string;
    encodeFunctionData(functionFragment: "proveL2LogInclusion", values: [BigNumberish, BigNumberish, BigNumberish, L2LogStruct, BytesLike[]]): string;
    encodeFunctionData(functionFragment: "proveL2MessageInclusion", values: [
        BigNumberish,
        BigNumberish,
        BigNumberish,
        L2MessageStruct,
        BytesLike[]
    ]): string;
    encodeFunctionData(functionFragment: "removeStateTransitionManager", values: [AddressLike]): string;
    encodeFunctionData(functionFragment: "requestL2TransactionDirect", values: [L2TransactionRequestDirectStruct]): string;
    encodeFunctionData(functionFragment: "requestL2TransactionTwoBridges", values: [L2TransactionRequestTwoBridgesOuterStruct]): string;
    encodeFunctionData(functionFragment: "setPendingAdmin", values: [AddressLike]): string;
    encodeFunctionData(functionFragment: "setSharedBridge", values: [AddressLike]): string;
    encodeFunctionData(functionFragment: "sharedBridge", values?: undefined): string;
    encodeFunctionData(functionFragment: "stateTransitionManager", values: [BigNumberish]): string;
    encodeFunctionData(functionFragment: "stateTransitionManagerIsRegistered", values: [AddressLike]): string;
    encodeFunctionData(functionFragment: "tokenIsRegistered", values: [AddressLike]): string;
    decodeFunctionResult(functionFragment: "acceptAdmin", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "addStateTransitionManager", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "addToken", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "baseToken", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "createNewChain", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "getHyperchain", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "l2TransactionBaseCost", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "proveL1ToL2TransactionStatus", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "proveL2LogInclusion", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "proveL2MessageInclusion", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "removeStateTransitionManager", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "requestL2TransactionDirect", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "requestL2TransactionTwoBridges", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "setPendingAdmin", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "setSharedBridge", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "sharedBridge", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "stateTransitionManager", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "stateTransitionManagerIsRegistered", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "tokenIsRegistered", data: BytesLike): Result;
}
export declare namespace NewAdminEvent {
    type InputTuple = [oldAdmin: AddressLike, newAdmin: AddressLike];
    type OutputTuple = [oldAdmin: string, newAdmin: string];
    interface OutputObject {
        oldAdmin: string;
        newAdmin: string;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace NewChainEvent {
    type InputTuple = [
        chainId: BigNumberish,
        stateTransitionManager: AddressLike,
        chainGovernance: AddressLike
    ];
    type OutputTuple = [
        chainId: bigint,
        stateTransitionManager: string,
        chainGovernance: string
    ];
    interface OutputObject {
        chainId: bigint;
        stateTransitionManager: string;
        chainGovernance: string;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace NewPendingAdminEvent {
    type InputTuple = [
        oldPendingAdmin: AddressLike,
        newPendingAdmin: AddressLike
    ];
    type OutputTuple = [oldPendingAdmin: string, newPendingAdmin: string];
    interface OutputObject {
        oldPendingAdmin: string;
        newPendingAdmin: string;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export interface IBridgehub extends BaseContract {
    connect(runner?: ContractRunner | null): IBridgehub;
    waitForDeployment(): Promise<this>;
    interface: IBridgehubInterface;
    queryFilter<TCEvent extends TypedContractEvent>(event: TCEvent, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TypedEventLog<TCEvent>>>;
    queryFilter<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TypedEventLog<TCEvent>>>;
    on<TCEvent extends TypedContractEvent>(event: TCEvent, listener: TypedListener<TCEvent>): Promise<this>;
    on<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, listener: TypedListener<TCEvent>): Promise<this>;
    once<TCEvent extends TypedContractEvent>(event: TCEvent, listener: TypedListener<TCEvent>): Promise<this>;
    once<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, listener: TypedListener<TCEvent>): Promise<this>;
    listeners<TCEvent extends TypedContractEvent>(event: TCEvent): Promise<Array<TypedListener<TCEvent>>>;
    listeners(eventName?: string): Promise<Array<Listener>>;
    removeAllListeners<TCEvent extends TypedContractEvent>(event?: TCEvent): Promise<this>;
    acceptAdmin: TypedContractMethod<[], [void], "nonpayable">;
    addStateTransitionManager: TypedContractMethod<[
        _stateTransitionManager: AddressLike
    ], [
        void
    ], "nonpayable">;
    addToken: TypedContractMethod<[_token: AddressLike], [void], "nonpayable">;
    baseToken: TypedContractMethod<[_chainId: BigNumberish], [string], "view">;
    createNewChain: TypedContractMethod<[
        _chainId: BigNumberish,
        _stateTransitionManager: AddressLike,
        _baseToken: AddressLike,
        _salt: BigNumberish,
        _admin: AddressLike,
        _initData: BytesLike
    ], [
        bigint
    ], "nonpayable">;
    getHyperchain: TypedContractMethod<[
        _chainId: BigNumberish
    ], [
        string
    ], "view">;
    l2TransactionBaseCost: TypedContractMethod<[
        _chainId: BigNumberish,
        _gasPrice: BigNumberish,
        _l2GasLimit: BigNumberish,
        _l2GasPerPubdataByteLimit: BigNumberish
    ], [
        bigint
    ], "view">;
    proveL1ToL2TransactionStatus: TypedContractMethod<[
        _chainId: BigNumberish,
        _l2TxHash: BytesLike,
        _l2BatchNumber: BigNumberish,
        _l2MessageIndex: BigNumberish,
        _l2TxNumberInBatch: BigNumberish,
        _merkleProof: BytesLike[],
        _status: BigNumberish
    ], [
        boolean
    ], "view">;
    proveL2LogInclusion: TypedContractMethod<[
        _chainId: BigNumberish,
        _batchNumber: BigNumberish,
        _index: BigNumberish,
        _log: L2LogStruct,
        _proof: BytesLike[]
    ], [
        boolean
    ], "view">;
    proveL2MessageInclusion: TypedContractMethod<[
        _chainId: BigNumberish,
        _batchNumber: BigNumberish,
        _index: BigNumberish,
        _message: L2MessageStruct,
        _proof: BytesLike[]
    ], [
        boolean
    ], "view">;
    removeStateTransitionManager: TypedContractMethod<[
        _stateTransitionManager: AddressLike
    ], [
        void
    ], "nonpayable">;
    requestL2TransactionDirect: TypedContractMethod<[
        _request: L2TransactionRequestDirectStruct
    ], [
        string
    ], "payable">;
    requestL2TransactionTwoBridges: TypedContractMethod<[
        _request: L2TransactionRequestTwoBridgesOuterStruct
    ], [
        string
    ], "payable">;
    setPendingAdmin: TypedContractMethod<[
        _newPendingAdmin: AddressLike
    ], [
        void
    ], "nonpayable">;
    setSharedBridge: TypedContractMethod<[
        _sharedBridge: AddressLike
    ], [
        void
    ], "nonpayable">;
    sharedBridge: TypedContractMethod<[], [string], "view">;
    stateTransitionManager: TypedContractMethod<[
        _chainId: BigNumberish
    ], [
        string
    ], "view">;
    stateTransitionManagerIsRegistered: TypedContractMethod<[
        _stateTransitionManager: AddressLike
    ], [
        boolean
    ], "view">;
    tokenIsRegistered: TypedContractMethod<[
        _baseToken: AddressLike
    ], [
        boolean
    ], "view">;
    getFunction<T extends ContractMethod = ContractMethod>(key: string | FunctionFragment): T;
    getFunction(nameOrSignature: "acceptAdmin"): TypedContractMethod<[], [void], "nonpayable">;
    getFunction(nameOrSignature: "addStateTransitionManager"): TypedContractMethod<[
        _stateTransitionManager: AddressLike
    ], [
        void
    ], "nonpayable">;
    getFunction(nameOrSignature: "addToken"): TypedContractMethod<[_token: AddressLike], [void], "nonpayable">;
    getFunction(nameOrSignature: "baseToken"): TypedContractMethod<[_chainId: BigNumberish], [string], "view">;
    getFunction(nameOrSignature: "createNewChain"): TypedContractMethod<[
        _chainId: BigNumberish,
        _stateTransitionManager: AddressLike,
        _baseToken: AddressLike,
        _salt: BigNumberish,
        _admin: AddressLike,
        _initData: BytesLike
    ], [
        bigint
    ], "nonpayable">;
    getFunction(nameOrSignature: "getHyperchain"): TypedContractMethod<[_chainId: BigNumberish], [string], "view">;
    getFunction(nameOrSignature: "l2TransactionBaseCost"): TypedContractMethod<[
        _chainId: BigNumberish,
        _gasPrice: BigNumberish,
        _l2GasLimit: BigNumberish,
        _l2GasPerPubdataByteLimit: BigNumberish
    ], [
        bigint
    ], "view">;
    getFunction(nameOrSignature: "proveL1ToL2TransactionStatus"): TypedContractMethod<[
        _chainId: BigNumberish,
        _l2TxHash: BytesLike,
        _l2BatchNumber: BigNumberish,
        _l2MessageIndex: BigNumberish,
        _l2TxNumberInBatch: BigNumberish,
        _merkleProof: BytesLike[],
        _status: BigNumberish
    ], [
        boolean
    ], "view">;
    getFunction(nameOrSignature: "proveL2LogInclusion"): TypedContractMethod<[
        _chainId: BigNumberish,
        _batchNumber: BigNumberish,
        _index: BigNumberish,
        _log: L2LogStruct,
        _proof: BytesLike[]
    ], [
        boolean
    ], "view">;
    getFunction(nameOrSignature: "proveL2MessageInclusion"): TypedContractMethod<[
        _chainId: BigNumberish,
        _batchNumber: BigNumberish,
        _index: BigNumberish,
        _message: L2MessageStruct,
        _proof: BytesLike[]
    ], [
        boolean
    ], "view">;
    getFunction(nameOrSignature: "removeStateTransitionManager"): TypedContractMethod<[
        _stateTransitionManager: AddressLike
    ], [
        void
    ], "nonpayable">;
    getFunction(nameOrSignature: "requestL2TransactionDirect"): TypedContractMethod<[
        _request: L2TransactionRequestDirectStruct
    ], [
        string
    ], "payable">;
    getFunction(nameOrSignature: "requestL2TransactionTwoBridges"): TypedContractMethod<[
        _request: L2TransactionRequestTwoBridgesOuterStruct
    ], [
        string
    ], "payable">;
    getFunction(nameOrSignature: "setPendingAdmin"): TypedContractMethod<[_newPendingAdmin: AddressLike], [void], "nonpayable">;
    getFunction(nameOrSignature: "setSharedBridge"): TypedContractMethod<[_sharedBridge: AddressLike], [void], "nonpayable">;
    getFunction(nameOrSignature: "sharedBridge"): TypedContractMethod<[], [string], "view">;
    getFunction(nameOrSignature: "stateTransitionManager"): TypedContractMethod<[_chainId: BigNumberish], [string], "view">;
    getFunction(nameOrSignature: "stateTransitionManagerIsRegistered"): TypedContractMethod<[
        _stateTransitionManager: AddressLike
    ], [
        boolean
    ], "view">;
    getFunction(nameOrSignature: "tokenIsRegistered"): TypedContractMethod<[_baseToken: AddressLike], [boolean], "view">;
    getEvent(key: "NewAdmin"): TypedContractEvent<NewAdminEvent.InputTuple, NewAdminEvent.OutputTuple, NewAdminEvent.OutputObject>;
    getEvent(key: "NewChain"): TypedContractEvent<NewChainEvent.InputTuple, NewChainEvent.OutputTuple, NewChainEvent.OutputObject>;
    getEvent(key: "NewPendingAdmin"): TypedContractEvent<NewPendingAdminEvent.InputTuple, NewPendingAdminEvent.OutputTuple, NewPendingAdminEvent.OutputObject>;
    filters: {
        "NewAdmin(address,address)": TypedContractEvent<NewAdminEvent.InputTuple, NewAdminEvent.OutputTuple, NewAdminEvent.OutputObject>;
        NewAdmin: TypedContractEvent<NewAdminEvent.InputTuple, NewAdminEvent.OutputTuple, NewAdminEvent.OutputObject>;
        "NewChain(uint256,address,address)": TypedContractEvent<NewChainEvent.InputTuple, NewChainEvent.OutputTuple, NewChainEvent.OutputObject>;
        NewChain: TypedContractEvent<NewChainEvent.InputTuple, NewChainEvent.OutputTuple, NewChainEvent.OutputObject>;
        "NewPendingAdmin(address,address)": TypedContractEvent<NewPendingAdminEvent.InputTuple, NewPendingAdminEvent.OutputTuple, NewPendingAdminEvent.OutputObject>;
        NewPendingAdmin: TypedContractEvent<NewPendingAdminEvent.InputTuple, NewPendingAdminEvent.OutputTuple, NewPendingAdminEvent.OutputObject>;
    };
}
