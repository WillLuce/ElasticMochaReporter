
var elasticsearch = require('elasticsearch');

var index_name    = 'functional_tests',
    document_type = 'web_test_result';

var client = new elasticsearch.Client({
      host: 'http://localhost:9200',
      log: ''
    });


exports.addResult = addResult;


function addResult(result)
{
  client.create({
    index: index_name,
    type: document_type,
    body: result
  }, function (error) {
      if (error) {
        console.error('elasticsearch cluster is down!');
      } else {
        console.log('All is well');
      }
    });
}
