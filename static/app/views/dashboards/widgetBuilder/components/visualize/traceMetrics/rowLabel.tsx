import styled from '@emotion/styled';

import {Flex} from '@sentry/scraps/layout';
import {Text} from '@sentry/scraps/text';

import {t} from 'sentry/locale';

/**
 * Letter badge (A, B, ƒ1, ...) shown at the start of a trace metrics visualize
 * row so equations can refer to the row.
 */
export function RowLabel({label, muted}: {label: string; muted?: boolean}) {
  return (
    <LabelBadge
      justify="center"
      align="center"
      width="24px"
      height="36px"
      radius="md"
      flexShrink={0}
      muted={muted}
      aria-label={t('Row %s', label)}
    >
      <Text as="span" bold variant={muted ? 'muted' : 'accent'}>
        {label}
      </Text>
    </LabelBadge>
  );
}

const LabelBadge = styled(Flex)<{muted?: boolean}>`
  background-color: ${p =>
    p.muted
      ? p.theme.tokens.background.secondary
      : p.theme.tokens.background.transparent.accent.muted};
`;
