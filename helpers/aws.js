const aws=require('aws-sdk');
const multer=require('multer');
const multers3=require('multer-s3');
const keys=require('../config/keys');

aws.config.update({
    accessKeyId: keys.AWSAccessID,
    secretAccessKey: keys.AWSSecretKey,
    region: 'eu-london-1'
});

const s3=new aws.S3({});
const upload=multer({
    storage:multers3({
        s3:s3,
        bucket: 'rental-app',
        acl: 'public-read',
        metadata: (req,file,cb)=>{
            cb(null,{fieldName:file.fieldname});
        },
        key: (req,file,cb)=>{
            cb(null,file.originalname);
        },
        rename: (fieldName,fileName)=>{
            return file.replace(/\+/g,'-').toLowerCase();
        }
    })
});
exports.upload=upload;