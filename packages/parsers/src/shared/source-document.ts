import { deterministicId } from "@govgraph/domain";
import type { SourceDocument } from "@govgraph/domain";

type SourceDocumentInput = Omit<SourceDocument, "id" | "retrievedAt"> & {
  retrievedAt?: string;
};

export function createSourceDocument(input: SourceDocumentInput): SourceDocument {
  return {
    id: deterministicId(input.sourceFamily, input.sourceUrl),
    retrievedAt: input.retrievedAt ?? new Date().toISOString(),
    ...input,
  };
}
