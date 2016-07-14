var mocha     = require('mocha'),
    Readable  = require('stream').Readable,
    aws       = require('aws-sdk'),
    Promise   = require('promise');

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
        Bucket: 'qa-automation-trainingpeaks-com',
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
