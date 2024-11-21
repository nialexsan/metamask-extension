/* eslint-disable camelcase */
import { useSelector } from 'react-redux';
import { getBridgeQuotes } from '../../../ducks/bridge/selectors';
import { formatProviderLabel } from '../../../pages/bridge/utils/quote';
import { useIsTxSubmittable } from '../useIsTxSubmittable';
import { MILLISECOND, MINUTE } from '../../../../shared/constants/time';

export const useQuoteProperties = () => {
  const { isLoading, recommendedQuote, sortedQuotes, quotesInitialLoadTimeMs } =
    useSelector(getBridgeQuotes);

  const can_submit = useIsTxSubmittable();

  const initial_load_time_all_quotes = quotesInitialLoadTimeMs
    ? (Date.now() - quotesInitialLoadTimeMs) / (MILLISECOND * MINUTE)
    : undefined;

  if (!isLoading && initial_load_time_all_quotes !== undefined) {
    return {
      can_submit,
      best_quote_provider: formatProviderLabel(recommendedQuote),
      quotes_count: sortedQuotes.length,
      quotes_list: sortedQuotes.map(formatProviderLabel),
      initial_load_time_all_quotes,
    };
  }

  return;
};
