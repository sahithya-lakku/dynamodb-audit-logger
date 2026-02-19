const AWS = require('aws-sdk');
const { documentClient } = require('../utils/db');
const { uploadJson } = require('../utils/s3');
const { buildAuditEvent } = require('../libs/auditLogic');

const sqs = new AWS.SQS({ region: process.env.AWS_REGION });

async function persistAuditEvent(auditEvent) {
  await documentClient
    .put({
      TableName: process.env.AUDIT_TABLE_NAME,
      Item: auditEvent
    })
    .promise();

  const s3Key = `audits/${auditEvent.occurredAt}/${auditEvent.auditId}.json`;
  await uploadJson(process.env.AUDIT_BUCKET_NAME, s3Key, auditEvent);

  if (process.env.AUDIT_QUEUE_URL) {
    await sqs
      .sendMessage({
        QueueUrl: process.env.AUDIT_QUEUE_URL,
        MessageBody: JSON.stringify({
          auditId: auditEvent.auditId,
          eventName: auditEvent.eventName,
          occurredAt: auditEvent.occurredAt,
          s3Key
        })
      })
      .promise();
  }

  return {
    auditId: auditEvent.auditId,
    s3Key
  };
}

exports.handler = async (event) => {
  const results = [];

  for (const record of event.Records || []) {
    if (!['INSERT', 'MODIFY', 'REMOVE'].includes(record.eventName)) {
      continue;
    }

    const auditEvent = buildAuditEvent(record);
    const persisted = await persistAuditEvent(auditEvent);
    results.push(persisted);
  }

  return {
    processed: results.length,
    results
  };
};

module.exports.persistAuditEvent = persistAuditEvent;
