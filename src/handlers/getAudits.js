const { documentClient } = require('../utils/db');

exports.handler = async (event) => {
  const params = event.queryStringParameters || {};
  const limit = Number.parseInt(params.limit, 10) || 25;
  const dateRange = params.dateRange;

  // Query the date index so date-range filters stay efficient at scale.
  const queryParams = {
    TableName: process.env.AUDIT_TABLE_NAME,
    IndexName: process.env.AUDIT_DATE_INDEX_NAME,
    KeyConditionExpression: '#logType = :logType',
    ExpressionAttributeNames: {
      '#logType': 'logType'
    },
    ExpressionAttributeValues: {
      ':logType': 'AUDIT'
    },
    ScanIndexForward: false,
    Limit: Math.min(limit, 100)
  };

  if (dateRange) {
    const [from, to] = dateRange.split(',');

    if (from && to) {
      queryParams.KeyConditionExpression = '#logType = :logType AND #occurredAt BETWEEN :from AND :to';
      queryParams.ExpressionAttributeNames['#occurredAt'] = 'occurredAt';
      queryParams.ExpressionAttributeValues[':from'] = from;
      queryParams.ExpressionAttributeValues[':to'] = to;
    }
  }

  const result = await documentClient.query(queryParams).promise();

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      count: result.Items?.length || 0,
      items: result.Items || []
    })
  };
};
