const AWS = require('aws-sdk');

const options = {};

if (process.env.AWS_REGION) {
  options.region = process.env.AWS_REGION;
}

const documentClient = new AWS.DynamoDB.DocumentClient(options);

module.exports = {
  documentClient
};
