import { BigNumber } from 'bignumber.js';
import {
  ChainId,
  Quote,
  QuoteMetadata,
  QuoteResponse,
  // eslint-disable-next-line import/no-restricted-paths
} from '../../ui/pages/bridge/types';

// All fields need to be types not interfaces, same with their children fields
// o/w you get a type error

export enum StatusTypes {
  UNKNOWN = 'UNKNOWN',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
  COMPLETE = 'COMPLETE',
}

export type StatusRequest = {
  bridgeId: string; // lifi, socket, squid
  srcTxHash: string; // lifi, socket, squid
  bridge: string; // lifi, socket, squid
  srcChainId: ChainId; // lifi, socket, squid
  destChainId: ChainId; // lifi, socket, squid
  quote?: Quote; // squid
  refuel?: boolean; // lifi
};

export type Asset = {
  chainId: ChainId;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
};

export type SrcChainStatus = {
  chainId: ChainId;
  txHash: string;
  amount?: string;
  token?: Asset;
};

export type DestChainStatus = {
  chainId: ChainId;
  txHash?: string;
  amount?: string;
  token?: Record<string, never> | Asset;
};

export enum BridgeId {
  HOP = 'hop',
  CELER = 'celer',
  CELERCIRCLE = 'celercircle',
  CONNEXT = 'connext',
  POLYGON = 'polygon',
  AVALANCHE = 'avalanche',
  MULTICHAIN = 'multichain',
  AXELAR = 'axelar',
  ACROSS = 'across',
  STARGATE = 'stargate',
}

export enum FeeType {
  METABRIDGE = 'metabridge',
  REFUEL = 'refuel',
}

export type FeeData = {
  amount: string;
  asset: Asset;
};

export type Protocol = {
  displayName?: string;
  icon?: string;
  name?: string; // for legacy quotes
};

export enum ActionTypes {
  BRIDGE = 'bridge',
  SWAP = 'swap',
  REFUEL = 'refuel',
}

export type Step = {
  action: ActionTypes;
  srcChainId: ChainId;
  destChainId?: ChainId;
  srcAsset: Asset;
  destAsset: Asset;
  srcAmount: string;
  destAmount: string;
  protocol: Protocol;
};

export type StatusResponse = {
  status: StatusTypes;
  srcChain: SrcChainStatus;
  destChain?: DestChainStatus;
  bridge?: BridgeId;
  isExpectedToken?: boolean;
  isUnrecognizedRouterAddress?: boolean;
  refuel?: RefuelStatusResponse;
};

export type RefuelStatusResponse = object & StatusResponse;

export type RefuelData = object & Step;

type PricingData<QuoteMetaDataValue> = {
  [P in keyof QuoteMetaDataValue]: QuoteMetaDataValue[P] extends
    | BigNumber
    | (BigNumber | null)
    ? string
    : QuoteMetaDataValue[P];
};

type QuoteMetadataForState = {
  [P in keyof QuoteMetadata]: QuoteMetadata[P] extends BigNumber
    ? string
    : PricingData<QuoteMetadata[P]>;
};

export type BridgeHistoryItem = {
  quote: Quote;
  status: StatusResponse;
  startTime?: number;
  estimatedProcessingTimeInSeconds: number;
  slippagePercentage: number;
  completionTime?: number;
  pricingData?: QuoteMetadataForState;
  initialDestAssetBalance?: number;
  targetContractAddress?: string;
  account: string;
};

// [P in keyof T]: T[P] extends From ? To : T[P];
export enum BridgeStatusAction {
  START_POLLING_FOR_BRIDGE_TX_STATUS = 'startPollingForBridgeTxStatus',
  WIPE_BRIDGE_STATUS = 'wipeBridgeStatus',
  GET_STATE = 'getState',
}

export type StartPollingForBridgeTxStatusArgs = {
  statusRequest: StatusRequest;
  quoteResponse: QuoteResponse & QuoteMetadata;
  startTime?: BridgeHistoryItem['startTime'];
  slippagePercentage: BridgeHistoryItem['slippagePercentage'];
  pricingData?: BridgeHistoryItem['pricingData'];
  initialDestAssetBalance?: BridgeHistoryItem['initialDestAssetBalance'];
  targetContractAddress?: BridgeHistoryItem['targetContractAddress'];
};

export type SourceChainTxHash = string;

export type BridgeStatusControllerState = {
  txHistory: Record<SourceChainTxHash, BridgeHistoryItem>;
};
