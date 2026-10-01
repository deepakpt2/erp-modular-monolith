import { pgTable, varchar, integer, boolean, timestamp, uuid, text, index } from 'drizzle-orm/pg-core';

export const dmsDocument = pgTable('dms_document', {
  id: uuid('id').primaryKey().defaultRandom(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  originalFileName: varchar('original_file_name', { length: 255 }).notNull(),
  fileSize: integer('file_size').notNull(), // bytes
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  storagePath: varchar('storage_path', { length: 500 }).notNull(), // /data/dms/2026/09/uuid.pdf
  hashSha256: varchar('hash_sha256', { length: 64 }).notNull(),
  uploadedBy: uuid('uploaded_by'), // FK to user
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const dmsDocumentLink = pgTable('dms_document_link', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull().references(() => dmsDocument.id, { onDelete: 'cascade' }),
  linkedTable: varchar('linked_table', { length: 50 }).notNull(), // e.g., 'mm_purchase_order', 'mm_goods_receipt', 'fin_ap_invoice'
  linkedId: uuid('linked_id').notNull(),
  linkedDocNumber: varchar('linked_doc_number', { length: 50 }),
  docCategory: varchar('doc_category', { length: 20 }).notNull().default('OTHER'), // INVOICE, SPEC, CERT, GR, PO, OTHER
  description: text('description'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  idxLinked: index('idx_dms_linked').on(t.linkedTable, t.linkedId),
  idxDoc: index('idx_dms_doc').on(t.documentId),
}));
