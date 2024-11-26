import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ButtonPrimary,
  ButtonPrimarySize,
  IconName,
  PopoverPosition,
  Text,
} from '../../../components/component-library';
import {
  getFromAmount,
  getFromChain,
  getFromToken,
  getToToken,
  getBridgeQuotes,
  getValidationErrors,
} from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import useSubmitBridgeTransaction from '../hooks/useSubmitBridgeTransaction';
import {
  BlockSize,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import useLatestBalance from '../../../hooks/bridge/useLatestBalance';
import { SWAPS_CHAINID_DEFAULT_TOKEN_MAP } from '../../../../shared/constants/swaps';
import { Row, Tooltip } from '../layout';
import { getNativeCurrency } from '../../../ducks/metamask/metamask';
import { useIsTxSubmittable } from '../../../hooks/bridge/useIsTxSubmittable';
import { useCrossChainSwapsEventTracker } from '../../../hooks/bridge/useCrossChainSwapsEventTracker';
import { useRequestProperties } from '../../../hooks/bridge/events/useRequestProperties';
import { useRequestMetadataProperties } from '../../../hooks/bridge/events/useRequestMetadataProperties';
import { useTradeProperties } from '../../../hooks/bridge/events/useTradeProperties';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';

export const BridgeCTAButton = () => {
  const dispatch = useDispatch();
  const t = useI18nContext();

  const fromToken = useSelector(getFromToken);
  const toToken = useSelector(getToToken);

  const fromChain = useSelector(getFromChain);

  const fromAmount = useSelector(getFromAmount);

  const { isLoading, activeQuote } = useSelector(getBridgeQuotes);

  const { submitBridgeTransaction } = useSubmitBridgeTransaction();
  const {
    isNoQuotesAvailable,
    isInsufficientBalance: isInsufficientBalance_,
    isInsufficientGasBalance: isInsufficientGasBalance_,
    isInsufficientGasForQuote: isInsufficientGasForQuote_,
  } = useSelector(getValidationErrors);

  const ticker = useSelector(getNativeCurrency);

  const { normalizedBalance } = useLatestBalance(fromToken, fromChain?.chainId);
  const { normalizedBalance: nativeAssetBalance } = useLatestBalance(
    fromChain?.chainId
      ? SWAPS_CHAINID_DEFAULT_TOKEN_MAP[
          fromChain.chainId as keyof typeof SWAPS_CHAINID_DEFAULT_TOKEN_MAP
        ]
      : null,
    fromChain?.chainId,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isInsufficientBalance = isInsufficientBalance_(normalizedBalance);
  const isInsufficientGasBalance =
    isInsufficientGasBalance_(nativeAssetBalance);
  const isInsufficientGasForQuote =
    isInsufficientGasForQuote_(nativeAssetBalance);

  const isTxSubmittable = useIsTxSubmittable();
  const trackCrossChainSwapsEvent = useCrossChainSwapsEventTracker();
  const { quoteRequestProperties } = useRequestProperties();
  const requestMetadataProperties = useRequestMetadataProperties();
  const tradeProperties = useTradeProperties();

  const label = useMemo(() => {
    if (isLoading && !isTxSubmittable) {
      return t('swapFetchingQuotes');
    }

    if (isNoQuotesAvailable) {
      return t('swapQuotesNotAvailableErrorTitle');
    }

    if (isInsufficientBalance) {
      return t('alertReasonInsufficientBalance');
    }

    if (isInsufficientGasForQuote) {
      return (
        <Row gap={1}>
          {t('bridgeValidationInsufficientGasReason')}
          <Tooltip
            title={t('bridgeValidationInsufficientGasTitle', [ticker])}
            position={PopoverPosition.TopEnd}
            iconName={IconName.Info}
            isOpen
          >
            {t('bridgeValidationInsufficientGasMessage', [ticker])}
          </Tooltip>
        </Row>
      );
    }

    if (!fromAmount) {
      if (!toToken) {
        return t('bridgeSelectTokenAndAmount');
      }
      return t('bridgeEnterAmount');
    }

    if (isTxSubmittable) {
      return t('submit');
    }

    return t('swapSelectToken');
  }, [
    isLoading,
    fromAmount,
    toToken,
    ticker,
    isTxSubmittable,
    normalizedBalance,
    isInsufficientBalance,
    isInsufficientGasBalance,
    isInsufficientGasForQuote,
  ]);

  return activeQuote ? (
    <ButtonPrimary
      width={BlockSize.Full}
      size={activeQuote ? ButtonPrimarySize.Md : ButtonPrimarySize.Lg}
      variant={TextVariant.bodyMd}
      data-testid="bridge-cta-button"
      onClick={() => {
        quoteRequestProperties &&
          requestMetadataProperties &&
          tradeProperties &&
          trackCrossChainSwapsEvent({
            event: MetaMetricsEventName.ActionSubmitted,
            properties: {
              ...quoteRequestProperties,
              ...requestMetadataProperties,
              ...tradeProperties,
            },
          });
        if (activeQuote && isTxSubmittable && !isSubmitting) {
          setIsSubmitting(true);
          dispatch(submitBridgeTransaction(activeQuote));
        }
      }}
      disabled={!isTxSubmittable || isSubmitting}
    >
      {label}
    </ButtonPrimary>
  ) : (
    <Text
      variant={TextVariant.bodyMd}
      width={BlockSize.Full}
      textAlign={TextAlign.Center}
      color={TextColor.textAlternative}
    >
      {label}
    </Text>
  );
};
