const AWS = require('aws-sdk');
const sharp = require('sharp');

const s3 = new AWS.S3();

// 람다 호출시 실행되는 함수
// envent : 호출상황에 대한 정보가 담겨있음
// context : 실행되는 함수 완경에 대한 정보가 담겨있음
// callback : 실행되는 함수 환경에 대한 정보가 담겨있음
exports.handler = async (event, context, callback) => {
    // event객체로부터 버킷이름과 파일경로를 받아옴
    const Bucket = event.Records[0].s3.bucket.name;
    const Key = event.Records[0].s3.object.key;
    const filename = Key.split('/')[Key.split('/').length - 1];
    //확장자
    const ext = Key.split('.')[Key.split('.').length - 1];

    const requiredFormat = ext === 'jpg' ? 'jpeg' : ext; // sharp에서는 jpg 대신 jpeg 사용합니다.
    console.log('name', filename, 'ext', ext);

    try { //s3.getObject 메서드로 버킷으로부터 파일을 불러옴
        const s3Object = await s3.getObject({ Bucket, Key }).promise(); // 버퍼로 가져오기
        console.log('original', s3Object.Body.length);//s3Object.Body에 파일버퍼가 담겨있음
       //sharp에 파일버퍼를 넣고
        const resizedImage = await sharp(s3Object.Body) // 리사이징
            .resize(200, 200, { fit: 'inside' }) //크기지정
            .toFormat(requiredFormat)
            .toBuffer(); //리사이징된 이미지결과를 버퍼로 출력
        await s3.putObject({ // thumb 폴더에 저장
            Bucket,
            Key: `thumb/${filename}`,
            Body: resizedImage,
        }).promise();
        console.log('put', resizedImage.length);
        return callback(null, `thumb/${filename}`);
    } catch (error) {
        console.error(error);
        return callback(error);
    }
};