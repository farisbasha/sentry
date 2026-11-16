import {useTheme} from '@emotion/react';
import styled from '@emotion/styled';
import {IconHide} from '@sentry/icons/hide';

import {Button} from '@sentry/scraps/button';
import {Flex} from '@sentry/scraps/layout';
import {Tooltip} from '@sentry/scraps/tooltip';

import {t} from 'sentry/locale';
import type {QueryFieldValue} from 'sentry/utils/discover/fields';
import {
  FieldBar,
  FieldExtras,
  FieldRow,
} from 'sentry/views/dashboards/widgetBuilder/components/visualize/utils';
import {
  applyTraceMetricAggregateFilter,
  extractTraceMetricFromColumn,
  getTraceMetricFunctionParts,
} from 'sentry/views/dashboards/widgetBuilder/utils/buildTraceMetricAggregate';

import {MetricSelectRow} from './metricSelectRow';
import {RowLabel} from './rowLabel';
import {TraceMetricRowFilter} from './traceMetricRowFilter';
import type {HiddenTraceMetricRow as HiddenTraceMetricRowData} from './unifiedEquations';

interface HiddenTraceMetricRowProps {
  label: string;
  onFieldChange: (field: QueryFieldValue) => void;
  onShow: () => void;
  row: HiddenTraceMetricRowData;
  disabled?: boolean;
  /**
   * Leave room for the drag handle the visible rows render.
   */
  indent?: boolean;
}

/**
 * A metric row that only feeds an equation. It is not plotted and not saved on
 * its own; edits rewrite the equation that references it.
 */
export function HiddenTraceMetricRow({
  row,
  label,
  disabled,
  indent,
  onFieldChange,
  onShow,
}: HiddenTraceMetricRowProps) {
  const theme = useTheme();
  const traceMetric = extractTraceMetricFromColumn(row.field) ?? {name: '', type: ''};
  const filter = getTraceMetricFunctionParts(row.field)?.filter ?? '';

  return (
    <HiddenRow gap="xs" width="100%" data-test-id="hidden-metric-row">
      {indent && <DragHandleSpacer />}
      <FieldRow>
        <RowLabel label={label} muted />
        <FieldBar>
          <MetricSelectRow
            disabled={!!disabled}
            field={row.field}
            index={-1}
            onFieldChange={onFieldChange}
          />
          <TraceMetricRowFilter
            traceMetric={traceMetric}
            initialQuery={filter}
            disabled={disabled}
            onSearch={nextFilter =>
              onFieldChange(applyTraceMetricAggregateFilter(row.field, nextFilter))
            }
          />
        </FieldBar>
        <FieldExtras compact>
          <Flex align="center" height={theme.form.md.height}>
            <Tooltip
              title={t('Only used in an equation. Click to also show it in the chart.')}
            >
              <Button
                variant="transparent"
                icon={<IconHide />}
                size="zero"
                aria-label={t('Show series')}
                disabled={disabled}
                onClick={onShow}
              />
            </Tooltip>
          </Flex>
        </FieldExtras>
      </FieldRow>
    </HiddenRow>
  );
}

const HiddenRow = styled(Flex)`
  opacity: 0.75;
`;

const DragHandleSpacer = styled('div')`
  flex-shrink: 0;
  width: 24px;
`;
