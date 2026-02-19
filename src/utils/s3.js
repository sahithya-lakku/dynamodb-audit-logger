const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  region: process.env.AWS_REGION
});

async function uploadJson(bucket, key, payload) {
  await s3
    .putObject({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify(payload, null, 2),
      ContentType: 'application/json'
    })
    .promise();

  return { bucket, key };
}

module.exports = {
  s3,
  uploadJson
};
