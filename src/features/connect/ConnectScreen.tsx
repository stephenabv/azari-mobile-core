import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ExternalLinks } from '../../core/media/ExternalLinks';
import { SiteContentBundle } from '../../data/CatalogRepository';
import { useSiteContent } from '../../data/queries';
import { SocialPlatformRegistry } from '../../domain/social/SocialPlatform';
import type { RootScreenProps } from '../../navigation/types';
import { SocialLogo } from '../../ui/brand';
import { EmptyView, Screen } from '../../ui/components';
import { useResponsive } from '../../ui/responsive/useResponsive';
import { useTheme, useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';
import {
  MENU_TILE_SIZE,
  MenuList,
  createMenuOpener,
  type MenuGroup,
  type MenuItem,
} from '../more/MenuList';

const registry = new SocialPlatformRegistry();

/**
 * Sales email, phone number and social links from the website's footer
 * content, listed like the rest of the More menu. Social rows show the
 * platform's logo; links to unknown sites show a globe.
 */
export function ConnectScreen({
  navigation,
}: RootScreenProps<'ConnectWithUs'>) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { size } = useResponsive();
  const content = useSiteContent().data ?? SiteContentBundle.empty();
  const footer = content.get('footer');

  const groups = useMemo<MenuGroup[]>(() => {
    const contact: MenuItem[] = [];
    if (footer.email.trim()) {
      contact.push({
        key: 'email',
        label: footer.email.trim(),
        description: 'Email our sales team',
        icon: 'chat',
        tone: 'accent',
        target: { url: ExternalLinks.email(footer.email) },
      });
    }
    if (footer.phone.trim()) {
      contact.push({
        key: 'phone',
        label: footer.phone.trim(),
        description: 'Call us',
        icon: 'phone',
        tone: 'accent',
        target: { url: ExternalLinks.phone(footer.phone) },
      });
    }
    const social: MenuItem[] = registry
      .links(footer.socials, url => ExternalLinks.classify(url) === 'web')
      .map(link => ({
        key: `social-${link.url}`,
        label: link.name,
        leading: (
          <SocialLogo
            platform={link.platform}
            size={MENU_TILE_SIZE}
            fallbackColor={theme.colors.text}
            fallbackTile={theme.colors.surface}
          />
        ),
        target: { url: link.url },
      }));
    return [
      { label: 'Contact', items: contact },
      { label: 'Social media', items: social },
    ];
  }, [footer, theme]);

  const empty = groups.every(g => g.items.length === 0);

  return (
    <Screen testID="connect-screen">
      <View style={size === 'compact' ? null : styles.narrow}>
        {empty ? (
          <EmptyView title="Contact details are not available right now." />
        ) : (
          <MenuList
            groups={groups}
            onOpen={createMenuOpener(route => navigation.navigate(route))}
          />
        )}
      </View>
    </Screen>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    narrow: {
      width: '100%',
      maxWidth: 640,
      alignSelf: 'center',
      paddingTop: t.spacing(2),
    },
  });
