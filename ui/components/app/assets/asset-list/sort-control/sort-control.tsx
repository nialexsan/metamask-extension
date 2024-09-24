import React, { ReactNode, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import classnames from 'classnames';
import { Box } from '../../../../component-library';
import { TokenWithBalance } from '../asset-list';
import { SortOrder, SortingCallbacksT, sortAssets } from '../../util/sort';
import {
  BackgroundColor,
  BorderRadius,
} from '../../../../../helpers/constants/design-system';
import { setTokenSortConfig } from '../../../../../store/actions';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsUserTrait,
} from '../../../../../../shared/constants/metametrics';

// intentionally used generic naming convention for styled selectable list item
// inspired from ui/components/multichain/network-list-item
// should probably be broken out into component library
type SelectableListItemProps = {
  isSelected: boolean;
  onClick?: React.MouseEventHandler<HTMLSpanElement>;
  children: ReactNode;
};

export const SelectableListItem = ({
  isSelected,
  onClick,
  children,
}: SelectableListItemProps) => {
  return (
    <Box className="selectable-list-item-wrapper">
      <Box
        className={classnames('selectable-list-item', {
          'selectable-list-item--selected': isSelected,
        })}
        onClick={onClick}
      >
        {children}
      </Box>
      {isSelected && (
        <Box
          className="selectable-list-item__selected-indicator"
          borderRadius={BorderRadius.pill}
          backgroundColor={BackgroundColor.primaryDefault}
        />
      )}
    </Box>
  );
};

type SortControlProps = {
  tokenList: TokenWithBalance[];
  setTokenList: (arg: TokenWithBalance[]) => void;
  setSorted: (arg: boolean) => void;
  sorted: boolean;
};

const SortControl = ({
  tokenList,
  setTokenList,
  setSorted,
}: SortControlProps) => {
  const trackEvent = useContext(MetaMetricsContext);
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tokenSortConfig = useSelector((state: any) => {
    return state.metamask.tokenSortConfig;
  });

  const dispatch = useDispatch();

  useEffect(() => {
    const [nativeToken] = tokenList.filter((token) => token.isNative);
    const nonNativeTokens = tokenList.filter((token) => !token.isNative);
    const dedupedTokenList = [nativeToken, ...nonNativeTokens];

    const sortedAssets = sortAssets(dedupedTokenList, tokenSortConfig);
    setSorted(true);
    setTokenList(sortedAssets);
  }, [tokenSortConfig?.key]);

  const handleSort = (
    key: string,
    sortCallback: keyof SortingCallbacksT,
    order: SortOrder,
  ) => {
    console.log('handle sort');
    dispatch(
      setTokenSortConfig({
        key,
        sortCallback,
        order,
      }),
    );
    trackEvent({
      category: MetaMetricsEventCategory.Settings,
      event: MetaMetricsEventName.TokenSortPreference,
      properties: {
        [MetaMetricsUserTrait.TokenSortPreference]: key,
      },
    });
  };
  return (
    <>
      <SelectableListItem
        isSelected={tokenSortConfig.key === 'symbol'}
        onClick={() => handleSort('symbol', 'alphaNumeric', 'asc')}
      >
        Alphabetically (A-Z)
      </SelectableListItem>
      <SelectableListItem
        isSelected={tokenSortConfig.key === 'tokenFiatAmount'}
        onClick={() => handleSort('tokenFiatAmount', 'stringNumeric', 'dsc')}
      >
        Declining balance ($ high-low)
      </SelectableListItem>
    </>
  );
};

export default SortControl;
