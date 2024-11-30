type ComparisonOperators<T> = {
  /** Matches values that are equal to a specified value. */
  $eq?: T
  /** Matches values that are greater than a specified value. */
  $gt?: T
  /** Matches values that are greater than or equal to a specified value. */
  $gte?: T
  /** Matches values that are less than a specified value. */
  $lt?: T
  /** Matches values that are less than or equal to a specified value. */
  $lte?: T
  /** Matches all values that are not equal to a specified value. */
  $ne?: T
  /** Matches any of the values specified in an array. */
  $in?: T[]
  /** Matches none of the values specified in an array. */
  $nin?: T[]
}

type StringOperators = {
  /** Matches values that are equal to the given regular expression. */
  $regex?: RegExp
}

type OperatorType<T> = T extends number | Date
  ? T | ComparisonOperators<T>
  : T extends string
    ? T | ComparisonOperators<T> | StringOperators
    : T extends Array<unknown>
      ? T | ComparisonOperators<T>
      : T extends object
        ? Filter<T>
        : T | ComparisonOperators<T>

type SimpleFilter<T> = {
  [P in keyof T]?: T[P]
}

export type Filter<T> =
  | {
      [P in keyof T]?: OperatorType<T[P]>
    }
  | {
      $or: SimpleFilter<T>[]
    }
