import {useCallback, useState} from 'react';

import type {Expression} from 'sentry/components/arithmeticBuilder/expression';
import {EquationBuilder} from 'sentry/views/explore/metrics/equationBuilder';

interface TraceMetricEquationRowProps {
  /**
   * The equation in its saved, fully inlined form (without the `equation|` prefix).
   */
  equation: string;
  onUpdate: (equation: string) => void;
  /**
   * Row label (A, B, ...) to the aggregate it stands for.
   */
  referenceMap: Record<string, string>;
  disabled?: boolean;
}

/**
 * Equation row for the trace metrics visualize list. The user edits the
 * equation with row letters; the saved equation is always the inlined form.
 */
export function TraceMetricEquationRow({
  equation,
  referenceMap,
  disabled,
  onUpdate,
}: TraceMetricEquationRowProps) {
  // The letter form the user typed, kept while the saved equation it produced
  // is still the current one. When the equation changes from elsewhere (for
  // example a referenced row was edited) the letters are derived again.
  const [internal, setInternal] = useState<{equation: string; text: string} | null>(null);

  const handleExpressionChange = useCallback(
    (resolved: Expression, internalText: string) => {
      setInternal({equation: resolved.text, text: internalText});
      onUpdate(resolved.text);
    },
    [onUpdate]
  );

  return (
    <EquationBuilder
      expression={equation}
      referenceMap={referenceMap}
      handleExpressionChange={handleExpressionChange}
      storedInternalExpression={
        internal?.equation === equation ? internal.text : undefined
      }
      disabled={disabled}
    />
  );
}
