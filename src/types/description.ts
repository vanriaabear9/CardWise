/** One description (explanation) of a term. A term can have many. */
export interface Description {
  id: number;
  termId: number;
  descriptionText: string;
  /** Display order within the term (0 = first). */
  position: number;
}
