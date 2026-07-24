/**
 * shadcn primitives under components/ui are generated wrappers: they expose
 * props for labelling and are always consumed by application code, so auditing
 * them reports failures the user cannot act on in their own source.
 */
export const isGeneratedUiPrimitive = (relPath: string): boolean =>
  /(?:^|\/)components\/ui\//u.test(relPath);
