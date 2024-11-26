import React from 'react';
import {
  SelectButtonProps,
  SelectButtonSize,
} from '../../../../components/component-library/select-button/select-button.types';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  BadgeWrapper,
  BadgeWrapperPosition,
  SelectButton,
  Text,
} from '../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderColor,
  BorderRadius,
  Display,
  OverflowWrap,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { AssetPicker } from '../../../../components/multichain/asset-picker-amount/asset-picker';

export const BridgeAssetPickerButton = ({
  asset,
  networkProps,
  networkImageSrc,
  ...props
}: {
  networkImageSrc?: string;
} & SelectButtonProps<'div'> &
  Pick<React.ComponentProps<typeof AssetPicker>, 'asset' | 'networkProps'>) => {
  const t = useI18nContext();

  return (
    <SelectButton
      borderRadius={BorderRadius.pill}
      backgroundColor={BackgroundColor.backgroundDefault}
      borderColor={BorderColor.borderMuted}
      style={{
        padding: 8,
        paddingRight: 11,
        paddingInline: asset ? undefined : 24,
      }}
      gap={0}
      size={SelectButtonSize.Lg}
      alignItems={AlignItems.center}
      descriptionProps={{
        variant: TextVariant.bodyMd,
        overflowWrap: OverflowWrap.BreakWord,
        ellipsis: false,
      }}
      caretIconProps={{
        display: Display.None,
      }}
      label={<Text ellipsis>{asset?.symbol ?? t('bridgeTo')}</Text>}
      startAccessory={
        asset ? (
          <BadgeWrapper
            marginRight={2}
            badge={
              asset && networkProps?.network?.name ? (
                <AvatarNetwork
                  name={networkProps.network.name}
                  src={networkImageSrc}
                  size={AvatarNetworkSize.Xs}
                  style={{ borderRadius: 3 }}
                  borderColor={BorderColor.backgroundDefault}
                  borderWidth={2}
                />
              ) : undefined
            }
            position={BadgeWrapperPosition.bottomRight}
            badgeContainerProps={{ width: BlockSize.Min }}
          >
            {asset ? (
              <AvatarToken
                src={asset.image || undefined}
                backgroundColor={BackgroundColor.backgroundHover}
                name={asset.symbol}
                borderWidth={0}
              />
            ) : undefined}
          </BadgeWrapper>
        ) : undefined
      }
      {...props}
    />
  );
};
