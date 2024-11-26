import React, { useEffect, useRef, useState } from 'react';
import { Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import { zeroAddress } from 'ethereumjs-util';
import { SwapsTokenObject } from '../../../../shared/constants/swaps';
import {
  Text,
  TextField,
  TextFieldType,
  ButtonLink,
  PopoverPosition,
  IconName,
  Button,
  ButtonSize,
} from '../../../components/component-library';
import { AssetPicker } from '../../../components/multichain/asset-picker-amount/asset-picker';
import { TabName } from '../../../components/multichain/asset-picker-amount/asset-picker-modal/asset-picker-modal-tabs';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getCurrentCurrency, SwapsEthToken } from '../../../selectors';
import {
  ERC20Asset,
  NativeAsset,
} from '../../../components/multichain/asset-picker-amount/asset-picker-modal/types';
import { formatFiatAmount, formatTokenAmount } from '../utils/quote';
import { Column, Row, Tooltip } from '../layout';
import {
  Display,
  FontWeight,
  TextAlign,
  TextColor,
  JustifyContent,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { AssetType } from '../../../../shared/constants/transaction';
import {
  CHAIN_ID_TO_CURRENCY_SYMBOL_MAP,
  CHAIN_ID_TOKEN_IMAGE_MAP,
} from '../../../../shared/constants/network';
import {
  BRIDGE_MIN_FIAT_SRC_AMOUNT,
  BRIDGE_QUOTE_MAX_RETURN_DIFFERENCE_PERCENTAGE,
} from '../../../../shared/constants/bridge';
import { BridgeToken } from '../types';
import useLatestBalance from '../../../hooks/bridge/useLatestBalance';
import {
  getBridgeQuotes,
  getValidationErrors,
} from '../../../ducks/bridge/selectors';
import { shortenAddress } from '../../../helpers/utils/util';
import { BridgeAssetPickerButton } from './components/bridge-asset-picker-button';

const generateAssetFromToken = (
  chainId: Hex,
  tokenDetails: SwapsTokenObject | SwapsEthToken,
): ERC20Asset | NativeAsset => {
  if ('iconUrl' in tokenDetails && tokenDetails.address !== zeroAddress()) {
    return {
      type: AssetType.token,
      image: tokenDetails.iconUrl,
      symbol: tokenDetails.symbol,
      address: tokenDetails.address,
    };
  }

  return {
    type: AssetType.native,
    image:
      CHAIN_ID_TOKEN_IMAGE_MAP[
        chainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP
      ],
    symbol:
      CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[
        chainId as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP
      ],
  };
};

export const BridgeInputGroup = ({
  header,
  token,
  onAssetChange,
  onAmountChange,
  networkProps,
  isTokenListLoading,
  customTokenListGenerator,
  amountFieldProps,
  amountInFiat,
  onMaxButtonClick,
}: {
  amountInFiat?: BigNumber;
  onAmountChange?: (value: string) => void;
  token: BridgeToken | null;
  amountFieldProps: Pick<
    React.ComponentProps<typeof TextField>,
    'testId' | 'autoFocus' | 'value' | 'readOnly' | 'disabled' | 'className'
  >;

  onMaxButtonClick?: (value: string) => void;
} & Pick<
  React.ComponentProps<typeof AssetPicker>,
  | 'networkProps'
  | 'header'
  | 'customTokenListGenerator'
  | 'onAssetChange'
  | 'isTokenListLoading'
>) => {
  const t = useI18nContext();

  const { isLoading } = useSelector(getBridgeQuotes);
  const currency = useSelector(getCurrentCurrency);

  const selectedChainId = networkProps?.network?.chainId;
  const isAmountReadOnly =
    amountFieldProps?.readOnly || amountFieldProps?.disabled;

  const { isInsufficientBalance, isSrcAmountTooLow, isEstimatedReturnLow } =
    useSelector(getValidationErrors);

  const blockExplorerUrl =
    networkProps?.network?.defaultBlockExplorerUrlIndex === undefined
      ? undefined
      : networkProps.network.blockExplorerUrls?.[
          networkProps.network.defaultBlockExplorerUrlIndex
        ];

  const { normalizedBalance } = useLatestBalance(token, selectedChainId);
  const asset =
    selectedChainId && token
      ? generateAssetFromToken(selectedChainId, token)
      : undefined;

  const inputRef = useRef<HTMLInputElement | null>(null);

  const [isLowReturnTooltipOpen, setIsLowReturnTooltipOpen] = useState(true);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = amountFieldProps?.value?.toString() ?? '';
      inputRef.current.focus();
    }
  }, [amountFieldProps]);

  return (
    <Column paddingInline={6} gap={1}>
      <Row gap={4}>
        <TextField
          style={{ minWidth: 96, maxWidth: 140 }}
          display={Display.Flex}
          inputRef={inputRef}
          type={TextFieldType.Text}
          className="amount-input"
          placeholder={
            isLoading && isAmountReadOnly ? t('bridgeCalculatingAmount') : '0'
          }
          onKeyPress={(e?: React.KeyboardEvent<HTMLDivElement>) => {
            // Only allow numbers and at most one decimal point
            if (
              e &&
              !/^[0-9]*\.{0,1}[0-9]*$/u.test(
                `${amountFieldProps.value ?? ''}${e.key}`,
              )
            ) {
              e.preventDefault();
            }
          }}
          onChange={(e) => {
            // Remove characters that are not numbers or decimal points if rendering a controlled or pasted value
            const cleanedValue = e.target.value.replace(/[^0-9.]+/gu, '');
            onAmountChange?.(cleanedValue);
          }}
          {...amountFieldProps}
        />
        <AssetPicker
          header={header}
          visibleTabs={[TabName.TOKENS]}
          asset={asset}
          onAssetChange={onAssetChange}
          networkProps={networkProps}
          customTokenListGenerator={customTokenListGenerator}
          isTokenListLoading={isTokenListLoading}
        >
          {(onClickHandler, networkImageSrc) =>
            isAmountReadOnly && !asset ? (
              <Button
                onClick={onClickHandler}
                size={ButtonSize.Lg}
                paddingLeft={6}
                paddingRight={6}
                fontWeight={FontWeight.Normal}
              >
                {t('bridgeTo')}
              </Button>
            ) : (
              <BridgeAssetPickerButton
                onClick={onClickHandler}
                networkImageSrc={networkImageSrc}
                asset={asset}
                networkProps={networkProps}
              />
            )
          }
        </AssetPicker>
      </Row>

      <Row justifyContent={JustifyContent.spaceBetween}>
        <Text
          variant={TextVariant.bodyMd}
          fontWeight={FontWeight.Normal}
          color={TextColor.textAlternative}
          textAlign={TextAlign.End}
          ellipsis
        >
          {amountInFiat && formatFiatAmount(amountInFiat, currency, 2)}
        </Text>
        <Text
          display={Display.Flex}
          gap={2}
          variant={TextVariant.bodySm}
          color={
            !isAmountReadOnly && isInsufficientBalance(normalizedBalance)
              ? TextColor.errorDefault
              : TextColor.textAlternative
          }
          style={{ height: 20 }}
        >
          {isAmountReadOnly &&
          token?.aggregators &&
          asset &&
          selectedChainId &&
          blockExplorerUrl &&
          asset.type === AssetType.token
            ? shortenAddress(asset.address)
            : undefined}
          {!isAmountReadOnly && normalizedBalance
            ? formatTokenAmount(normalizedBalance, token?.symbol)
            : undefined}
          {onMaxButtonClick &&
            asset &&
            asset.type !== AssetType.native &&
            normalizedBalance && (
              <ButtonLink
                variant={TextVariant.bodySm}
                onClick={() => onMaxButtonClick(normalizedBalance?.toString())}
              >
                {t('max')}
              </ButtonLink>
            )}
        </Text>
        {!isAmountReadOnly && isSrcAmountTooLow && (
          <Text variant={TextVariant.bodySm} color={TextColor.errorDefault}>
            {t('minimumAmountError', [
              formatFiatAmount(
                new BigNumber(BRIDGE_MIN_FIAT_SRC_AMOUNT),
                currency,
                0,
              ),
            ])}
          </Text>
        )}
        {isAmountReadOnly && isEstimatedReturnLow && isLowReturnTooltipOpen && (
          <Tooltip
            title={t('lowEstimatedReturnTooltipTitle')}
            position={PopoverPosition.BottomStart}
            isOpen={isLowReturnTooltipOpen}
            onClose={() => setIsLowReturnTooltipOpen(false)}
            iconName={IconName.Info}
          >
            {t('lowEstimatedReturnTooltipMessage', [
              BRIDGE_QUOTE_MAX_RETURN_DIFFERENCE_PERCENTAGE * 100,
            ])}
          </Tooltip>
        )}
      </Row>
    </Column>
  );
};
