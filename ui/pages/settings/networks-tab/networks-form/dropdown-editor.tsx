import React, { ReactNode, useEffect, useRef, useState } from 'react';
import classnames from 'classnames';
import {
  Box as BoxComponent,
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconName,
  IconSize,
  Input,
  Label,
  Popover as PopoverComponent,
  PopoverPosition,
  Text,
} from '../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Display,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import Tooltip from '../../../../components/ui/tooltip';

export enum DropdownEditorStyle {
  /** When open, the dropdown overlays elements that follow  */
  Popover,
  /** When open, the dropdown pushes down elements that follow */
  Box,
}

// A dropdown for selecting, adding, and deleting items
export const DropdownEditor = <Item,>({
  title,
  placeholder,
  items,
  selectedItemIndex,
  addButtonText,
  error,
  style,
  onItemSelected,
  onItemDeleted,
  onItemAdd,
  onDropdownOpened,
  itemKey,
  itemIsDeletable = () => true,
  renderItem,
  renderTooltip,
}: {
  title: string;
  placeholder: string;
  items?: Item[];
  selectedItemIndex?: number;
  addButtonText: string;
  error?: boolean;
  style: DropdownEditorStyle;
  onItemSelected: (index: number) => void;
  onItemDeleted: (deletedIndex: number, newSelectedIndex?: number) => void;
  onItemAdd: () => void;
  onDropdownOpened?: () => void;
  itemKey: (item: Item) => string;
  itemIsDeletable?: (item: Item, items: Item[]) => boolean;
  renderItem: (item: Item, isList: boolean) => string | ReactNode;
  renderTooltip: (item: Item, isList: boolean) => string | undefined;
}) => {
  const t = useI18nContext();
  const dropdown = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const renderDropdownList = () => (
    <BoxComponent>
      {items?.map((item, index) => {
        const row = (
          <BoxComponent
            alignItems={AlignItems.center}
            paddingLeft={4}
            paddingRight={4}
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
            key={itemKey(item)}
            onClick={() => {
              onItemSelected(index);
              setIsDropdownOpen(false);
            }}
            className={classnames('networks-tab__item', {
              'networks-tab__item--selected': index === selectedItemIndex,
            })}
          >
            {index === selectedItemIndex && (
              <BoxComponent
                className="networks-tab__item-selected-pill"
                borderRadius={BorderRadius.pill}
                backgroundColor={BackgroundColor.primaryDefault}
              />
            )}
            {renderItem(item, true)}
            {itemIsDeletable(item, items) && (
              <ButtonIcon
                marginLeft={1}
                ariaLabel={t('delete')}
                size={ButtonIconSize.Sm}
                iconName={IconName.Trash}
                color={IconColor.errorDefault}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();

                  // Determine which item should be selected after deletion
                  let newSelectedIndex;
                  if (selectedItemIndex === undefined || items.length <= 1) {
                    newSelectedIndex = undefined;
                  } else if (index === selectedItemIndex) {
                    newSelectedIndex = 0;
                  } else if (index > selectedItemIndex) {
                    newSelectedIndex = selectedItemIndex;
                  } else if (index < selectedItemIndex) {
                    newSelectedIndex = selectedItemIndex - 1;
                  }

                  onItemDeleted(index, newSelectedIndex);
                }}
              />
            )}
          </BoxComponent>
        );

        const tooltip = renderTooltip(item, true);
        return tooltip ? (
          <Tooltip title={tooltip} position="bottom">
            {row}
          </Tooltip>
        ) : (
          row
        );
      })}

      <BoxComponent
        onClick={onItemAdd}
        padding={4}
        display={Display.Flex}
        alignItems={AlignItems.center}
        className="networks-tab__item"
      >
        <Icon
          color={IconColor.primaryDefault}
          name={IconName.Add}
          size={IconSize.Sm}
          marginRight={2}
        />
        <Text
          as="button"
          backgroundColor={BackgroundColor.transparent}
          color={TextColor.primaryDefault}
          variant={TextVariant.bodySmMedium}
        >
          {addButtonText}
        </Text>
      </BoxComponent>
    </BoxComponent>
  );

  let borderColor = BorderColor.borderDefault;
  if (error) {
    borderColor = BorderColor.errorDefault;
  } else if (isDropdownOpen) {
    borderColor = BorderColor.primaryDefault;
  }

  // Call back in a useEffect so it triggers after the opening has rendered
  useEffect(() => {
    if (isDropdownOpen) {
      onDropdownOpened?.();
    }
  }, [isDropdownOpen]);

  const selectedItem = items?.[selectedItemIndex];
  const tooltip = selectedItem ? renderTooltip(selectedItem, false) : undefined;

  const box = (
    <BoxComponent
      onClick={() => {
        setIsDropdownOpen(!isDropdownOpen);
      }}
      className="networks-tab__item-dropdown"
      display={Display.Flex}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.spaceBetween}
      borderRadius={BorderRadius.LG}
      borderColor={borderColor}
      borderWidth={1}
      paddingLeft={4}
      paddingRight={4}
      ref={dropdown}
    >
      {selectedItem ? (
        renderItem(selectedItem, false)
      ) : (
        <Input
          className="networks-tab__item-placeholder"
          placeholder={placeholder}
          readOnly
          tabIndex={-1}
          paddingTop={3}
          paddingBottom={3}
        />
      )}
      <ButtonIcon
        marginLeft="auto"
        iconName={isDropdownOpen ? IconName.ArrowUp : IconName.ArrowDown}
        ariaLabel={title}
        size={ButtonIconSize.Md}
      />
    </BoxComponent>
  );

  return (
    <BoxComponent paddingTop={4}>
      <Label variant={TextVariant.bodyMdMedium}>{title}</Label>
      {tooltip ? (
        <Tooltip title={tooltip} position="bottom">
          {box}
        </Tooltip>
      ) : (
        box
      )}
      {style === DropdownEditorStyle.Popover ? (
        <PopoverComponent
          paddingTop={items && items.length > 0 ? 2 : 0}
          paddingBottom={items && items.length > 0 ? 2 : 0}
          paddingLeft={0}
          matchWidth={true}
          paddingRight={0}
          className="networks-tab__item-popover"
          referenceElement={dropdown.current}
          position={PopoverPosition.Bottom}
          isOpen={isDropdownOpen}
          onClickOutside={() => setIsDropdownOpen(false)}
        >
          {renderDropdownList()}
        </PopoverComponent>
      ) : (
        <BoxComponent
          marginTop={2}
          display={isDropdownOpen ? Display.Block : Display.None}
          borderColor={BorderColor.borderMuted}
          borderRadius={BorderRadius.LG}
        >
          {renderDropdownList()}
        </BoxComponent>
      )}
    </BoxComponent>
  );
};

export default DropdownEditor;