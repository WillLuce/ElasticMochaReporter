
var elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client({
  host: process.env.ELASTICSEARCH_HOST,
  log: ''
});

exports.addResult = addResult;
function addResult(result)
{
  client.create({
    index: process.env.ELASTICSEARCH_INDEX_NAME,
    type: process.env.ELASTICSEARCH_DOCUMENT_TYPE,
    body: result
  }, function (error) {
    if (error) {
      console.error('elasticsearch cluster is down!');
    } else {
      console.log('All is well');
    }
  });
}
