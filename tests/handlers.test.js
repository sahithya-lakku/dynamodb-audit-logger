jest.mock('../src/utils/db', () => ({
  documentClient: {
    put: jest.fn(() => ({ promise: jest.fn().mockResolvedValue({}) })),
    query: jest.fn(() => ({ promise: jest.fn().mockResolvedValue({ Items: [{ auditId: '1' }] }) }))
  }
}));

jest.mock('../src/utils/s3', () => ({
  uploadJson: jest.fn().mockResolvedValue({})
}));

jest.mock('aws-sdk', () => {
  const original = jest.requireActual('aws-sdk');
  return {
    ...original,
    SQS: jest.fn(() => ({
      sendMessage: jest.fn(() => ({ promise: jest.fn().mockResolvedValue({}) }))
    }))
  };
});

const { handler: processHandler } = require('../src/handlers/processStream');
const { handler: getAuditsHandler } = require('../src/handlers/getAudits');

describe('handlers', () => {
  beforeEach(() => {
    process.env.AUDIT_TABLE_NAME = 'AuditLogsTable';
    process.env.AUDIT_BUCKET_NAME = 'audit-bucket';
    process.env.AUDIT_QUEUE_URL = 'https://sqs.example/queue';
    process.env.AUDIT_DATE_INDEX_NAME = 'LogTypeOccurredAtIndex';
  });

  test('processStream handler processes INSERT events', async () => {
    const event = {
      Records: [
        {
          eventName: 'INSERT',
          eventID: 'evt-1',
          eventSourceARN: 'arn:test',
          dynamodb: {
            Keys: { pk: { S: 'USER#1' } },
            NewImage: { pk: { S: 'USER#1' }, name: { S: 'Ada' } }
          }
        }
      ]
    };

    const result = await processHandler(event);

    expect(result.processed).toBe(1);
  });

  test('getAudits handler returns response body', async () => {
    const result = await getAuditsHandler({
      queryStringParameters: {
        limit: '5'
      }
    });

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).count).toBe(1);
  });
});
