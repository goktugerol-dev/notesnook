import React from 'react';
import { View } from 'react-native';
import { useThemeStore } from '../../../stores/theme';
import { useMessageStore } from '../../../stores/stores';
import { COLORS_NOTE } from '../../../utils/color-scheme';
import { Announcement } from '../../announcements/announcement';
import { Card } from '../../list/card';
import Paragraph from '../../ui/typography/paragraph';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SIZE } from '../../../utils/size';
export const Header = React.memo(
  ({ type, messageCard = true, color, shouldShow = false, noAnnouncement, warning }) => {
    const colors = useThemeStore(state => state.colors);
    const announcements = useMessageStore(state => state.announcements);

    return (
      <>
        {warning ? (
          <View
            style={{
              padding: 12,
              backgroundColor: colors.errorBg,
              width: '95%',
              alignSelf: 'center',
              borderRadius: 5,
              flexDirection: 'row',
              alignItems: 'center'
            }}
          >
            <Icon name="sync-alert" size={SIZE.md} color={colors.red} f />
            <Paragraph style={{ marginLeft: 5 }} color={colors.red}>
              {warning.title}
            </Paragraph>
          </View>
        ) : announcements.length !== 0 && !noAnnouncement ? (
          <Announcement color={color || colors.accent} />
        ) : type === 'search' ? null : !shouldShow ? (
          <View
            style={{
              marginBottom: 5,
              padding: 0,
              width: '100%',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            {messageCard ? (
              <Card color={COLORS_NOTE[color?.toLowerCase()] || colors.accent} />
            ) : null}
          </View>
        ) : null}
      </>
    );
  }
);

Header.displayName = 'Header';
