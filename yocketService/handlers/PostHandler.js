const DynamoDBHandler = require('../helpers/DynamoDBHandler')

//Importing the TableName from environment (can be found in the serverless.yml)
const{
    YOCKET_USER_POST_TABLE
} = process.env

/*
  Function - putPost
  Description -The main function that is called when the PutPost api is hit. It is used to add a new post in the YOCKET_USER_POST_TABLE.
  Parameters 
      - event - The event contains all the parameters that is passed to the api.
          - event.body -  It contains the body of the post request
   Returns - Returns If the Post is successfully added or not
*/
module.exports.putPost = async(event) => {
    let response
    try{
        let eventBody =JSON.parse(event.body);
        let date = new Date();
        eventBody.Date = (date.getMonth()+1)+"-"+date.getFullYear();
        eventBody.TimeStamp = Date.now();
        const DynamoDBHelper = new DynamoDBHandler(YOCKET_USER_POST_TABLE)
        response = await DynamoDBHelper.putInDB(eventBody)
    }catch( e ){
        console.log(e);
    }finally{
        return {
            statusCode: response?response.code:500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({message: response.message?response.message:"Internal Server Error"}),
        }
    }
}


/*
  Function - fetchPost
  Description -The main function that is called when the fetchPost api is hit. It is used to fetch the posts from YOCKET_USER_POST_TABLE.
  Parameters 
      - event - The event contains all the parameters that is passed to the api.
          - date -  it is used to get the next sequence of posts
          - limit - limit the number of posts you want
          - lastEvaluatedKey - key from the last request response
   Returns - Returns If the Post is successfully added or not
*/
module.exports.fetchPost = async(event) => {
    let response
    try{
        let limit = event.queryStringParameters.limit?event.queryStringParameters.limit:10;
        let lastEvaluatedKey = JSON.parse(event.body)?.lastEvaluatedKey;
        console.log(lastEvaluatedKey)
        const DynamoDBHelper = new DynamoDBHandler(YOCKET_USER_POST_TABLE)
        response = await DynamoDBHelper.fetchPost(limit, lastEvaluatedKey)
        let items = response.message.items;
        while(items.length < limit){
            if(!response.message.lastKey){
                let date = new Date(
                    new Date().getFullYear(),
                new Date().getMonth() - 1, 
                new Date().getDate());
                response.message.lastKey = {
                    Date: (date.getMonth()-1)+"-"+date.getFullYear()
                }
            }
            limit = limit - items.length;
            response = await DynamoDBHelper.fetchPost(limit, response.message.lastKey);
            if(response.message.items.length == 0 ){
                break;
            }
            console.log(response.message.items)
            items.push(...response.message.items);
        }
        response.message.items = items;
    }catch( e ){
        console.log(e);
    }finally{
        return {
            statusCode: response?response.code:500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({message: response.message?response.message:"Internal Server Error"}),
        }
    }
}