/* eslint-disable camelcase */
import { useSelector } from 'react-redux';
import { getBridgeQuotes } from '../../../ducks/bridge/selectors';
import { MINUTE } from '../../../../shared/constants/time';
import { formatProviderLabel } from '../../../pages/bridge/utils/quote';
import { useAsyncResult } from '../../useAsyncResult';
import { getCurrentCurrency } from '../../../selectors';
import { fetchTokenExchangeRates } from '../../../helpers/utils/util';
import { zeroAddress } from 'ethereumjs-util';
import { Numeric } from '../../../../shared/modules/Numeric';
import { getAddress } from 'ethers/lib/utils';

export const useTradeProperties = () => {
  const { activeQuote } = useSelector(getBridgeQuotes);
  const currency = useSelector(getCurrentCurrency);

  // If user's selected currency is not usd, fetch usd exchange rates for the gas token
  // and convert the quoted_gas amount to usd
  const { value: usd_quoted_gas } = useAsyncResult<
    number | undefined
  >(async () => {
    if (!activeQuote?.gasFee) return;

    const { amount, fiat } = activeQuote.gasFee;

    if (currency.toLowerCase() !== 'usd' && amount) {
      const exchangeRates = await fetchTokenExchangeRates(
        'usd',
        [],
        new Numeric(activeQuote.quote.srcChainId, 10).toPrefixedHexString(),
      );
      const usdConversionRate = exchangeRates?.[zeroAddress()];
      return new Numeric(activeQuote.gasFee.amount)
        .applyConversionRate(usdConversionRate)
        .toNumber();
    }
    return fiat?.toNumber();
  }, [activeQuote, currency]);

  // If user's selected currency is not usd, fetch usd exchange rates for the dest asset
  // and convert the dest amount to usd
  const { value: usd_quoted_return } = useAsyncResult<
    number | undefined
  >(async () => {
    if (!activeQuote?.quote) return;

    const { quote, toTokenAmount } = activeQuote;
    const { destAsset, destChainId } = quote;
    const destAssetAddress = destAsset?.address;
    const destAmount = toTokenAmount?.amount;

    if (
      currency.toLowerCase() !== 'usd' &&
      destAmount &&
      destAssetAddress &&
      destChainId
    ) {
      const exchangeRates = await fetchTokenExchangeRates(
        'usd',
        [destAssetAddress],
        new Numeric(destChainId, 10).toPrefixedHexString(),
      );
      const usdConversionRate =
        exchangeRates?.[destAssetAddress] ??
        exchangeRates?.[getAddress(destAssetAddress)];
      return new Numeric(destAmount)
        .applyConversionRate(usdConversionRate)
        .toNumber();
    }
    return toTokenAmount?.fiat?.toNumber();
  }, [activeQuote, currency]);

  const quoted_time_minutes = activeQuote?.estimatedProcessingTimeInSeconds
    ? activeQuote.estimatedProcessingTimeInSeconds / MINUTE
    : undefined;

  if (
    usd_quoted_return !== undefined &&
    usd_quoted_gas !== undefined &&
    quoted_time_minutes !== undefined
  ) {
    return {
      usd_quoted_gas,
      gas_included: false, // TODO check if trade has gas included
      quoted_time_minutes,
      usd_quoted_return,
      provider: formatProviderLabel(activeQuote),
    };
  }

  return;
};
