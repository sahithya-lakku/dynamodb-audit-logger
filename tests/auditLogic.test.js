const { computeDiff, buildAuditEvent } = require('../src/libs/auditLogic');

describe('auditLogic', () => {
  test('computeDiff returns changed fields', () => {
    const oldItem = { name: 'Ada', status: 'active', age: 30 };
    const newItem = { name: 'Ada', status: 'inactive', age: 31 };

    const diff = computeDiff(oldItem, newItem);

    expect(diff).toEqual({
      status: { before: 'active', after: 'inactive' },
      age: { before: 30, after: 31 }
    });
  });

  test('buildAuditEvent for MODIFY contains diff', () => {
    const record = {
      eventName: 'MODIFY',
      eventID: 'evt-1',
      eventSourceARN: 'arn:aws:dynamodb:region:acct:table/MainTable/stream/x',
      dynamodb: {
        ApproximateCreationDateTime: 123,
        SequenceNumber: '1',
        SizeBytes: 10,
        Keys: { pk: { S: 'USER#1' } },
        OldImage: { pk: { S: 'USER#1' }, status: { S: 'active' } },
        NewImage: { pk: { S: 'USER#1' }, status: { S: 'inactive' } }
      }
    };

    const auditEvent = buildAuditEvent(record);

    expect(auditEvent.operation).toBe('UPDATE');
    expect(auditEvent.logType).toBe('AUDIT');
    expect(auditEvent.diff).toEqual({
      status: { before: 'active', after: 'inactive' }
    });
  });
});
