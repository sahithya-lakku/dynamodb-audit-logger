const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

function unmarshallImage(image = {}) {
  if (!image || Object.keys(image).length === 0) {
    return null;
  }

  return AWS.DynamoDB.Converter.unmarshall(image);
}

function computeDiff(oldItem = {}, newItem = {}) {
  const keys = new Set([...Object.keys(oldItem || {}), ...Object.keys(newItem || {})]);
  const diff = {};

  keys.forEach((key) => {
    const before = oldItem ? oldItem[key] : undefined;
    const after = newItem ? newItem[key] : undefined;

    if (JSON.stringify(before) !== JSON.stringify(after)) {
      diff[key] = {
        before,
        after
      };
    }
  });

  return diff;
}

function buildAuditEvent(record) {
  const { eventName, eventSourceARN: sourceArn, eventID } = record;
  const oldItem = unmarshallImage(record.dynamodb.OldImage);
  const newItem = unmarshallImage(record.dynamodb.NewImage);
  const timestamp = new Date().toISOString();

  // Base shape shared by all operations.
  const baseEvent = {
    auditId: uuidv4(),
    logType: 'AUDIT',
    streamEventId: eventID,
    eventName,
    sourceArn,
    occurredAt: timestamp,
    keys: unmarshallImage(record.dynamodb.Keys),
    metadata: {
      approximateCreationDateTime: record.dynamodb.ApproximateCreationDateTime,
      sequenceNumber: record.dynamodb.SequenceNumber,
      sizeBytes: record.dynamodb.SizeBytes
    }
  };

  if (eventName === 'INSERT') {
    // Capture a full post-insert snapshot.
    return {
      ...baseEvent,
      operation: 'CREATE',
      snapshot: newItem
    };
  }

  if (eventName === 'MODIFY') {
    // Persist both versions and a machine-readable diff.
    return {
      ...baseEvent,
      operation: 'UPDATE',
      before: oldItem,
      after: newItem,
      diff: computeDiff(oldItem, newItem)
    };
  }

  if (eventName === 'REMOVE') {
    // Preserve deleted item content for audits/recovery workflows.
    return {
      ...baseEvent,
      operation: 'DELETE',
      deleted: oldItem
    };
  }

  return {
    ...baseEvent,
    operation: 'UNKNOWN',
    before: oldItem,
    after: newItem
  };
}

module.exports = {
  buildAuditEvent,
  computeDiff,
  unmarshallImage
};
