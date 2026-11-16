import {Container} from '@sentry/scraps/layout';

import {t} from 'sentry/locale';
import {TraceItemSearchQueryBuilder} from 'sentry/views/explore/components/traceItemSearchQueryBuilder';
import {useTraceMetricItemAttributes} from 'sentry/views/explore/hooks/useTraceItemAttributes';
import {HiddenTraceMetricSearchFields} from 'sentry/views/explore/metrics/constants';
import type {TraceMetric} from 'sentry/views/explore/metrics/metricQuery';
import {createTraceMetricFilter} from 'sentry/views/explore/metrics/utils';
import {TraceItemDataset} from 'sentry/views/explore/types';

interface TraceMetricRowFilterProps {
  initialQuery: string;
  onSearch: (query: string) => void;
  traceMetric: TraceMetric;
  disabled?: boolean;
}

/**
 * Per-row search bar that attaches an `_if` filter to a trace metric aggregate.
 * Attribute suggestions are scoped to the row's metric.
 */
export function TraceMetricRowFilter({
  traceMetric,
  initialQuery,
  onSearch,
  disabled,
}: TraceMetricRowFilterProps) {
  const attributeQuery = createTraceMetricFilter(traceMetric);
  const options = {query: attributeQuery, enabled: Boolean(attributeQuery)};

  const {attributes: stringAttributes, secondaryAliases: stringSecondaryAliases} =
    useTraceMetricItemAttributes(options, 'string', HiddenTraceMetricSearchFields);
  const {attributes: numberAttributes, secondaryAliases: numberSecondaryAliases} =
    useTraceMetricItemAttributes(options, 'number', HiddenTraceMetricSearchFields);
  const {attributes: booleanAttributes, secondaryAliases: booleanSecondaryAliases} =
    useTraceMetricItemAttributes(options, 'boolean', HiddenTraceMetricSearchFields);

  return (
    <Container width="100%" minWidth="0">
      <TraceItemSearchQueryBuilder
        // Remount when the metric changes so stale suggestions are dropped
        key={`${traceMetric.name}-${traceMetric.type}`}
        itemType={TraceItemDataset.TRACEMETRICS}
        initialQuery={initialQuery}
        onSearch={onSearch}
        searchSource="dashboards"
        placeholder={t('Filter this series')}
        supportedAggregates={[]}
        stringAttributes={stringAttributes}
        numberAttributes={numberAttributes}
        booleanAttributes={booleanAttributes}
        stringSecondaryAliases={stringSecondaryAliases}
        numberSecondaryAliases={numberSecondaryAliases}
        booleanSecondaryAliases={booleanSecondaryAliases}
        attributeQuery={attributeQuery}
        hiddenAttributeKeys={HiddenTraceMetricSearchFields}
        namespace={traceMetric.name}
        disableRecentSearches={!traceMetric.name}
        showSearchIcon={false}
        portalTarget={document.body}
        disableFullWidthFilterKeyMenu
        disabled={disabled || !traceMetric.name}
      />
    </Container>
  );
}
