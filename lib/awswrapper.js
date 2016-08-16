var mocha     = require('mocha'),
    aws       = require('aws-sdk'),

exports.saveScreenshot = saveScreenshot;

function saveScreenshot(title)
{
  var promise = driver.takeScreenshot();
  promise.catch = promise.thenCatch.bind(promise);

  var s3 = new aws.S3();

  promise.then(function (image)
  {
    var buffer = new Buffer(image, 'base64');

    var params =  {
      Bucket: process.env.AWS_BUCKET,
      ACL: 'public-read',
      ContentType: 'image/jpeg',
      Body: buffer,
      Key: title
    };

    s3.putObject(params, function(err, data) {
      if(err) return console.error(err);
      else console.log('        Sreenshot saved to S3');
    });
  });

  promise.thenCatch(function (error)
  {
    console.error('       Failed to save screenshot', error.message);
  });

  return promise;
}
