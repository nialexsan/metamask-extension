import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import { NetworkConfiguration } from '@metamask/network-controller';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../../components/component-library';
import { Content, Header } from '../../../components/multichain/pages/page';
import { selectBridgeHistoryForAccount } from '../../../ducks/bridge-status/selectors';
import useBridgeChainInfo from '../utils/useBridgeChainInfo';
import { selectedAddressTxListSelector } from '../../../selectors';
import { I18nContext } from '../../../contexts/i18n';
import { getTransactionBreakdownData } from '../../../components/app/transaction-breakdown/transaction-breakdown-utils';
import { MetaMaskReduxState } from '../../../store/store';
import { hexToDecimal } from '../../../../shared/modules/conversion.utils';
import UserPreferencedCurrencyDisplay from '../../../components/app/user-preferenced-currency-display/user-preferenced-currency-display.component';
import { EtherDenomination } from '../../../../shared/constants/common';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import CurrencyDisplay from '../../../components/ui/currency-display/currency-display.component';
import { StatusTypes } from '../../../../app/scripts/controllers/bridge-status/types';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextTransform,
} from '../../../helpers/constants/design-system';
import { formatDate } from '../../../helpers/utils/util';
import { ConfirmInfoRowDivider as Divider } from '../../../components/app/confirm/info/row';
import { calcTokenAmount } from '../../../../shared/lib/transactions-controller-utils';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../shared/constants/network';
import TransactionDetailRow from './transaction-detail-row';
import BridgeExplorerLinks from './bridge-explorer-links';
import BridgeStepList from './bridge-step-list';

const getBlockExplorerUrl = (
  networkConfiguration: NetworkConfiguration | undefined,
  txHash: string | undefined,
) => {
  if (!networkConfiguration || !txHash) {
    return undefined;
  }
  const index = networkConfiguration.defaultBlockExplorerUrlIndex;
  if (index === undefined) {
    return undefined;
  }

  const rootUrl = networkConfiguration.blockExplorerUrls[index]?.replace(
    /\/$/u,
    '',
  );
  return `${rootUrl}/tx/${txHash}`;
};

const StatusToColorMap: Record<StatusTypes, TextColor> = {
  [StatusTypes.PENDING]: TextColor.warningDefault,
  [StatusTypes.COMPLETE]: TextColor.successDefault,
  [StatusTypes.FAILED]: TextColor.errorDefault,
  [StatusTypes.UNKNOWN]: TextColor.errorDefault,
};

const CrossChainSwapTxDetails = () => {
  const t = useContext(I18nContext);
  const rootState = useSelector((state) => state);
  const history = useHistory();
  const { srcTxHash } = useParams<{ srcTxHash: string }>();
  const bridgeHistory = useSelector(selectBridgeHistoryForAccount);
  const selectedAddressTxList = useSelector(
    selectedAddressTxListSelector,
  ) as TransactionMeta[];
  const bridgeHistoryItem = srcTxHash ? bridgeHistory[srcTxHash] : undefined;
  const { srcNetworkConfiguration, destNetworkConfiguration } =
    useBridgeChainInfo({
      bridgeHistoryItem,
    });

  const srcBlockExplorerUrl = getBlockExplorerUrl(
    srcNetworkConfiguration,
    srcTxHash,
  );

  const destTxHash = bridgeHistoryItem?.status.destChain?.txHash;
  const destBlockExplorerUrl = getBlockExplorerUrl(
    destNetworkConfiguration,
    destTxHash,
  );

  const srcChainTxMeta = selectedAddressTxList.find(
    (tx) => tx.hash === srcTxHash,
  );

  const status = bridgeHistoryItem?.status.status;

  const destChainIconUrl = destNetworkConfiguration
    ? CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
        destNetworkConfiguration.chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
      ]
    : undefined;
  const bridgeTypeDirection = 'To';
  const bridgeTypeDestNetwork = destNetworkConfiguration?.name;

  const data = srcChainTxMeta
    ? getTransactionBreakdownData({
        state: rootState as MetaMaskReduxState,
        transaction: srcChainTxMeta,
        isTokenApprove: false,
      })
    : undefined;

  const bridgeAmount = bridgeHistoryItem
    ? `${calcTokenAmount(
        bridgeHistoryItem.quote.destTokenAmount,
        bridgeHistoryItem.quote.destAsset.decimals,
      ).toFixed()} ${bridgeHistoryItem.quote.destAsset.symbol}`
    : undefined;

  return (
    <div className="bridge">
      <div className="bridge__container">
        <Header
          className="bridge__header"
          startAccessory={
            <ButtonIcon
              iconName={IconName.ArrowLeft}
              size={ButtonIconSize.Sm}
              ariaLabel={t('back')}
              onClick={() => history.goBack()}
            />
          }
        >
          {t('bridge')} details
        </Header>
        <Content className="bridge__content">
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={4}
          >
            {status !== StatusTypes.COMPLETE && bridgeHistoryItem && (
              <BridgeStepList
                bridgeHistoryItem={bridgeHistoryItem}
                srcChainTxMeta={srcChainTxMeta}
              />
            )}

            {/* Links to block explorers */}
            <BridgeExplorerLinks
              srcBlockExplorerUrl={srcBlockExplorerUrl}
              destBlockExplorerUrl={destBlockExplorerUrl}
            />

            <Divider />

            {/* General tx details */}
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              gap={2}
            >
              <TransactionDetailRow
                title="Status"
                value={
                  <Text
                    textTransform={TextTransform.Capitalize}
                    color={status ? StatusToColorMap[status] : undefined}
                  >
                    {status?.toLowerCase()}
                  </Text>
                }
              />
              <TransactionDetailRow
                title="Bridge type"
                value={
                  <Box
                    display={Display.Flex}
                    gap={1}
                    alignItems={AlignItems.baseline}
                  >
                    {bridgeTypeDirection}{' '}
                    {destNetworkConfiguration && (
                      <AvatarNetwork
                        size={AvatarNetworkSize.Xs}
                        src={destChainIconUrl}
                        name={destNetworkConfiguration?.name}
                      />
                    )}
                    {bridgeTypeDestNetwork}
                  </Box>
                }
              />
              <TransactionDetailRow
                title="Time stamp"
                value={formatDate(srcChainTxMeta?.time, "M/d/y 'at' hh:mm a")}
              />
              <TransactionDetailRow
                title="Nonce"
                value={
                  srcChainTxMeta?.txParams.nonce
                    ? hexToDecimal(srcChainTxMeta?.txParams.nonce)
                    : undefined
                }
              />
            </Box>

            <Divider />

            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              gap={2}
            >
              <TransactionDetailRow
                title="Bridge amount"
                value={bridgeAmount}
              />
              <TransactionDetailRow
                title="Gas limit (units)"
                value={data?.gas ? hexToDecimal(data?.gas) : undefined}
              />
              <TransactionDetailRow
                title="Gas used (units)"
                value={data?.gasUsed ? hexToDecimal(data?.gasUsed) : undefined}
              />
              {data?.isEIP1559Transaction &&
                typeof data?.baseFee !== 'undefined' && (
                  <TransactionDetailRow
                    title="Base fee (GWEI)"
                    value={
                      <CurrencyDisplay
                        currency={data?.nativeCurrency}
                        denomination={EtherDenomination.GWEI}
                        value={data?.baseFee}
                        numberOfDecimals={10}
                        hideLabel
                      />
                    }
                  />
                )}
              {data?.isEIP1559Transaction &&
                typeof data?.priorityFee !== 'undefined' && (
                  <TransactionDetailRow
                    title="Priority fee (GWEI)"
                    value={
                      <CurrencyDisplay
                        currency={data?.nativeCurrency}
                        denomination={EtherDenomination.GWEI}
                        value={data?.priorityFee}
                        numberOfDecimals={10}
                        hideLabel
                      />
                    }
                  />
                )}

              <TransactionDetailRow
                title="Total gas fee"
                value={
                  <>
                    <UserPreferencedCurrencyDisplay
                      currency={data?.nativeCurrency}
                      denomination={EtherDenomination.ETH}
                      numberOfDecimals={6}
                      value={data?.hexGasTotal}
                      type={PRIMARY}
                    />
                    {data?.showFiat && (
                      <Box
                        display={Display.Flex}
                        justifyContent={JustifyContent.flexEnd}
                      >
                        <UserPreferencedCurrencyDisplay
                          type={SECONDARY}
                          value={data?.hexGasTotal}
                        />
                      </Box>
                    )}
                  </>
                }
              />
              <TransactionDetailRow
                title="Max fee per gas"
                value={
                  <>
                    <UserPreferencedCurrencyDisplay
                      currency={data?.nativeCurrency}
                      denomination={EtherDenomination.ETH}
                      numberOfDecimals={9}
                      value={data?.maxFeePerGas}
                      type={PRIMARY}
                    />
                    {data?.showFiat && (
                      <Box
                        display={Display.Flex}
                        justifyContent={JustifyContent.flexEnd}
                      >
                        <UserPreferencedCurrencyDisplay
                          currency={data?.nativeCurrency}
                          type={SECONDARY}
                          value={data?.maxFeePerGas}
                        />
                      </Box>
                    )}
                  </>
                }
              />
            </Box>

            <Divider />

            <TransactionDetailRow
              title="Total"
              value={
                <>
                  <UserPreferencedCurrencyDisplay
                    type={PRIMARY}
                    value={data?.totalInHex}
                    numberOfDecimals={data?.l1HexGasTotal ? 18 : undefined}
                  />
                  {data?.showFiat && (
                    <UserPreferencedCurrencyDisplay
                      type={SECONDARY}
                      value={data?.totalInHex}
                    />
                  )}
                </>
              }
            />

            <Divider />
          </Box>
        </Content>
      </div>
    </div>
  );
};

export default CrossChainSwapTxDetails;