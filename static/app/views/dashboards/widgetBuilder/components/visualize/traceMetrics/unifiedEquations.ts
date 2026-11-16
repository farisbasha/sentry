import {isTokenFunction} from 'sentry/components/arithmeticBuilder/token';
import {tokenizeExpression} from 'sentry/components/arithmeticBuilder/tokenizer';
import {
  explodeFieldString,
  generateFieldAsString,
  type Column,
} from 'sentry/utils/discover/fields';
import {extractTraceMetricFromColumn} from 'sentry/views/dashboards/widgetBuilder/utils/buildTraceMetricAggregate';
import {FieldValueKind} from 'sentry/views/discover/table/types';
import {getFunctionLabel} from 'sentry/views/explore/utils/getFunctionLabel';

/**
 * A metric aggregate that only exists inside an equation. It is shown in the
 * visualize list so the equation can refer to it, but it is not part of the
 * widget's saved aggregates and so is not plotted.
 */
export interface HiddenTraceMetricRow {
  /**
   * The aggregate text exactly as it appears inside the equation(s).
   */
  aggregate: string;
  /**
   * Index in the visualize fields of the first equation referencing this aggregate.
   */
  anchorIndex: number;
  field: Column;
}

export interface UnifiedTraceMetricRows {
  /**
   * Row label (A, B, ƒ1, ...) for each hidden row, keyed by `aggregate`.
   */
  hiddenLabels: Map<string, string>;
  hiddenRows: HiddenTraceMetricRow[];
  /**
   * Hidden rows keyed by the field index they render above.
   */
  hiddenRowsByAnchor: Map<number, HiddenTraceMetricRow[]>;
  /**
   * Row label to aggregate text, for every metric row (visible or hidden).
   */
  referenceMap: Record<string, string>;
  /**
   * Normalized aggregates referenced by at least one equation.
   */
  referencedKeys: Set<string>;
  /**
   * Row label (A, B, ƒ1, ...) for each visible field, keyed by field index.
   */
  stateLabels: Map<number, string>;
}

/**
 * Normalizes an aggregate string so equivalent spellings compare equal.
 */
function aggregateKey(aggregate: string): string {
  return generateFieldAsString(explodeFieldString(aggregate));
}

/**
 * Unique function calls inside an equation, in order of first appearance.
 */
export function getEquationAggregates(equation: string): string[] {
  const seen = new Set<string>();
  const aggregates: string[] = [];
  for (const token of tokenizeExpression(equation)) {
    if (!isTokenFunction(token) || seen.has(token.text)) {
      continue;
    }
    seen.add(token.text);
    aggregates.push(token.text);
  }
  return aggregates;
}

function getEquationLabel(index: number): string {
  return `ƒ${index}`;
}

/**
 * Derives the hidden metric rows, row labels and equation reference map for a
 * trace metrics visualize list.
 *
 * Every function call inside an equation that does not match a visible
 * aggregate becomes a hidden row placed directly above the first equation that
 * uses it. Functions without a metric tuple (e.g. `performance_score()`) are
 * not rows; they stay as plain text in the equation.
 */
export function getUnifiedTraceMetricRows(fields: Column[]): UnifiedTraceMetricRows {
  const visibleKeys = new Set(
    fields
      .filter(field => field.kind === FieldValueKind.FUNCTION)
      .map(field => aggregateKey(generateFieldAsString(field)))
  );

  const hiddenRows: HiddenTraceMetricRow[] = [];
  const hiddenRowsByAnchor = new Map<number, HiddenTraceMetricRow[]>();
  const referencedKeys = new Set<string>();
  const seenHidden = new Set<string>();

  fields.forEach((field, index) => {
    if (field.kind !== FieldValueKind.EQUATION) {
      return;
    }
    for (const aggregate of getEquationAggregates(field.field)) {
      const key = aggregateKey(aggregate);
      referencedKeys.add(key);
      if (visibleKeys.has(key) || seenHidden.has(key)) {
        continue;
      }
      const column = explodeFieldString(aggregate);
      if (!extractTraceMetricFromColumn(column)) {
        continue;
      }
      seenHidden.add(key);
      const row = {aggregate, anchorIndex: index, field: column};
      hiddenRows.push(row);
      hiddenRowsByAnchor.set(index, [...(hiddenRowsByAnchor.get(index) ?? []), row]);
    }
  });

  const stateLabels = new Map<number, string>();
  const hiddenLabels = new Map<string, string>();
  const referenceMap: Record<string, string> = {};
  let metricIndex = 0;
  let equationIndex = 1;

  fields.forEach((field, index) => {
    for (const row of hiddenRowsByAnchor.get(index) ?? []) {
      const label = getFunctionLabel(metricIndex++);
      hiddenLabels.set(row.aggregate, label);
      referenceMap[label] = row.aggregate;
    }
    if (field.kind === FieldValueKind.EQUATION) {
      stateLabels.set(index, getEquationLabel(equationIndex++));
    } else if (field.kind === FieldValueKind.FUNCTION) {
      const label = getFunctionLabel(metricIndex++);
      stateLabels.set(index, label);
      referenceMap[label] = generateFieldAsString(field);
    }
  });

  return {
    hiddenRows,
    hiddenRowsByAnchor,
    hiddenLabels,
    referencedKeys,
    referenceMap,
    stateLabels,
  };
}

/**
 * Rewrites every equation that uses `oldAggregate` to use `newAggregate`
 * instead. Fields are returned unchanged when nothing referenced it.
 */
export function replaceAggregateInEquations(
  fields: Column[],
  oldAggregate: string,
  newAggregate: string
): Column[] {
  const oldKey = aggregateKey(oldAggregate);
  let changed = false;

  const nextFields = fields.map(field => {
    if (field.kind !== FieldValueKind.EQUATION) {
      return field;
    }
    const tokens = tokenizeExpression(field.field);
    if (
      !tokens.some(token => isTokenFunction(token) && aggregateKey(token.text) === oldKey)
    ) {
      return field;
    }
    changed = true;
    const text = tokens
      .map(token =>
        isTokenFunction(token) && aggregateKey(token.text) === oldKey
          ? newAggregate
          : token.text
      )
      .filter(part => part.length > 0)
      .join(' ');
    return {...field, field: text};
  });

  return changed ? nextFields : fields;
}

/**
 * Whether an aggregate column is used by any equation in the list.
 */
export function isAggregateReferenced(
  referencedKeys: Set<string>,
  field: Column
): boolean {
  return (
    field.kind === FieldValueKind.FUNCTION &&
    referencedKeys.has(aggregateKey(generateFieldAsString(field)))
  );
}
