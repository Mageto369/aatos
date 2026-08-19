import { ValueTransformer } from 'typeorm';

/**
 * Returns Postgres numeric/decimal columns as JavaScript numbers.
 *
 * node-postgres hands back `numeric` as a string to avoid silent precision
 * loss, and TypeORM passes that through. Every consumer then has to remember
 * to coerce: the API serialises "38000.0000" instead of 38000, the deals list
 * renders "$193800.0000", and PaymentsPage's running total starts at 0 and
 * string-concatenates into "$058140.0000". Coercing once here fixes all of
 * them and keeps the arithmetic in the services honest too.
 *
 * Values are within IEEE-754 integer-safe range for this domain — trade values
 * in the millions with four decimal places — so Number is appropriate. If a
 * column ever needs true arbitrary precision, give that column its own
 * transformer rather than widening this one.
 */
export const decimalTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) => (value === null || value === undefined ? value : Number(value)),
};
