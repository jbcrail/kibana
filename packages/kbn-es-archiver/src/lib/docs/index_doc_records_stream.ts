/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import type { Client } from '@elastic/elasticsearch';
import AggregateError from 'aggregate-error';
import { Writable } from 'stream';
import { Stats } from '../stats';
import { Progress } from '../progress';
import { ES_CLIENT_HEADERS } from '../../client_headers';

enum BulkOperation {
  Create = 'create',
  Index = 'index',
}

export function createIndexDocRecordsStream(
  client: Client,
  stats: Stats,
  progress: Progress,
  useCreate: boolean = false,
  performance?: LoadActionPerfOptions
) {
  async function indexDocs(docs: any[]) {
    const operation = useCreate === true ? BulkOperation.Create : BulkOperation.Index;
    const ops = new WeakMap<any, any>();
    const errors: string[] = [];

    await client.helpers.bulk(
      {
        retries: 5,
        concurrency: performance?.concurrency || DEFAULT_PERFORMANCE_OPTIONS.concurrency,
        datasource: docs.map((doc) => {
          const body = doc.source;
          const op = doc.data_stream ? BulkOperation.Create : operation;
          const index = doc.data_stream || doc.index;
          ops.set(body, {
            [op]: {
              _index: index,
              _id: doc.id,
            },
          });
          return body;
        }),
        onDocument(doc) {
          return ops.get(doc);
        },
        onDrop(dropped) {
          const dj = JSON.stringify(dropped.document);
          const ej = JSON.stringify(dropped.error);
          errors.push(`Bulk doc failure [operation=${operation}]:\n  doc: ${dj}\n  error: ${ej}`);
        },
      },
      {
        headers: ES_CLIENT_HEADERS,
      }
    );

    if (errors.length) {
      throw new AggregateError(errors);
    }

    for (const doc of docs) {
      stats.indexedDoc(doc.data_stream || doc.index);
    }
  }

  return new Writable({
    highWaterMark: performance?.batchSize || DEFAULT_PERFORMANCE_OPTIONS.batchSize,
    objectMode: true,

    async write(record, enc, callback) {
      try {
        await indexDocs([record.value]);
        progress.addToComplete(1);
        callback(null);
      } catch (err) {
        callback(err);
      }
    },

    async writev(chunks, callback) {
      try {
        await indexDocs(chunks.map(({ chunk: record }) => record.value));
        progress.addToComplete(chunks.length);
        callback(null);
      } catch (err) {
        callback(err);
      }
    },
  });
}

export interface LoadActionPerfOptions {
  batchSize: number;
  concurrency: number;
}

const DEFAULT_PERFORMANCE_OPTIONS: LoadActionPerfOptions = {
  batchSize: 5000,
  concurrency: 4,
} as const;
