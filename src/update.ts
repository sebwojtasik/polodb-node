type NumericOperators<T> = {
  /** Increments the value of the field by the specified amount. */
  $inc?: Partial<T>
  /** Only updates the field if the specified value is less than the existing field value. */
  $min?: Partial<T>
  /** Only updates the field if the specified value is greater than the existing field value. */
  $max?: Partial<T>
  /** Multiplies the value of the field by the specified amount. */
  $mul?: Partial<T>
}

type RenameOperator = {
  /** Renames a field. */
  $rename?: Record<string, string>
}

type SetOperator<T> = {
  /** Sets the value of a field in a document.  */
  $set?: Partial<T>
}

type UnsetOperator<T> = {
  /** Removes the specified field from a document.  */
  $unset?: { [P in keyof T]?: '' | 1 | true }
}

export type Update<T> = RenameOperator & SetOperator<T> & UnsetOperator<T> & NumericOperators<T>
