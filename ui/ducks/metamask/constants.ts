import { NameType } from '@metamask/name-controller';
import { getDefaultPreferencesControllerState } from '../../../app/scripts/controllers/preferences-controller';
import { MemStoreControllersComposedState } from '../../../app/scripts/metamask-controller-stores';
import {
  DEFAULT_AUTO_LOCK_TIME_LIMIT,
  ThemeType,
} from '../../../shared/constants/preferences';
import { LedgerTransportTypes } from '../../../shared/constants/hardware-wallets';

export const initialMetamaskState: Partial<{
  [ControllerName in keyof MemStoreControllersComposedState]: Partial<
    MemStoreControllersComposedState[ControllerName]
  >;
}> = {
  KeyringController: {
    isUnlocked: false,
    keyrings: [],
  },
  AccountsController: {
    internalAccounts: { accounts: {}, selectedAccount: '' },
  },
  AccountTracker: {
    currentBlockGasLimit: '',
    currentBlockGasLimitByChainId: {},
  },
  AddressBookController: {
    addressBook: {},
  },
  ApprovalController: {
    pendingApprovals: {},
    approvalFlows: [],
  },
  CurrencyController: {
    currentCurrency: 'usd',
    currencyRates: {
      ETH: {
        conversionRate: null,
        conversionDate: 0,
        usdConversionRate: null,
      },
    },
  },
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  CustodyController: {
    custodyAccountDetails: {},
  },
  ///: END:ONLY_INCLUDE_IF
  DecryptMessageController: {
    unapprovedDecryptMsgs: {},
  },
  GasFeeController: {
    gasFeeEstimates: {},
    gasEstimateType: 'none',
  },
  MetaMetricsController: {
    participateInMetaMetrics: null,
    dataCollectionForMarketing: null,
  },
  NameController: {
    names: {
      [NameType.ETHEREUM_ADDRESS]: {},
    },
  },
  NetworkController: {
    selectedNetworkClientId: '',
    networkConfigurationsByChainId: {},
    networksMetadata: {},
  },
  NftController: {
    allNfts: {},
  },
  OnboardingController: {
    firstTimeFlowType: null,
    completedOnboarding: false,
  },
  PreferencesController: {
    ...getDefaultPreferencesControllerState(),
    theme: ThemeType.os,
    useBlockie: false,
    use4ByteResolution: true,
    useNftDetection: true,
    useTokenDetection: true,
    openSeaEnabled: true,
    securityAlertsEnabled: true,
    featureFlags: {},
    currentLocale: '',
    knownMethodData: {},
    // Ledger transport type is deprecated. We currently only support webhid
    // on chrome, and u2f on firefox.
    ledgerTransportType: window.navigator.hid
      ? LedgerTransportTypes.webhid
      : LedgerTransportTypes.u2f,
    preferences: {
      ...getDefaultPreferencesControllerState().preferences,
      autoLockTimeLimit: DEFAULT_AUTO_LOCK_TIME_LIMIT,
      showExtensionInFullSizeView: false,
      showFiatInTestnets: false,
      showNativeTokenAsMainBalance: true,
      showTestNetworks: false,
      smartTransactionsOptInStatus: true,
      petnamesEnabled: true,
      featureNotificationsEnabled: false,
      privacyMode: false,
      showMultiRpcModal: false,
      tokenSortConfig: {
        key: 'tokenFiatAmount',
        order: 'dsc',
        sortCallback: 'stringNumeric',
      },
      tokenNetworkFilter: {},
    },
  },
  SignatureController: {
    unapprovedPersonalMsgs: {},
    unapprovedTypedMessages: {},
  },
  TokensController: {
    allTokens: {},
  },
  TxController: {
    transactions: [],
  },
} as const;
