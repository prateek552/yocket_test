"use strict";
const DocumentClient = require("aws-sdk").DynamoDB.DocumentClient;
const documentClient = new DocumentClient(
    {
        region: 'localhost',
        endpoint: 'http://localhost:8000',
        accessKeyId: 'DEFAULT_ACCESS_KEY', 
        secretAccessKey: 'DEFAULT_SECRET' 
    }
);

class DynamoDBHandling {
  constructor(tableName) {
    (this.tableName = tableName);
  }

  async putInDB(item) {
    try {
      let params = {
        TableName: this.tableName,
        Item: item,
      };
      await documentClient.put(params).promise();
      return {
        code: 200,
        message: "Success",
      };
    } catch (error) {
      return {
        code: 400,
        message: {
          error: error,
          table: this.tableName,
        },
      };
    }
  }

  async fetchPost( limit, lastEvaluatedKey = undefined) {
    try {
        let date = lastEvaluatedKey?.Date;
        if(date == undefined){
            let dateObj = new Date();
            date = (dateObj.getMonth()+1)+"-"+dateObj.getFullYear();
        }
        console.log(date)
      const params = {
        TableName: this.tableName,
        KeyConditionExpression: "#date = :date",
        ExpressionAttributeNames: {
          "#date": "Date",
        },
        ExpressionAttributeValues: {
          ":date": date,
        },
        ScanIndexForward: false,
        Limit: limit,
      };
      let shift = false;
      if(lastEvaluatedKey && lastEvaluatedKey.TimeStamp){
        params.ExclusiveStartKey  = lastEvaluatedKey
        shift = true
      }
      console.log(params)
      let item = await documentClient.query(params).promise();
      console.log(item);
      let [items, lastKey] = [item['Items'] , item.LastEvaluatedKey];
      return {
        code: 200,
        message: {items, lastKey}
    };  
    } catch (error) {
      console.error(error);
      return {
        code: 400,
        message: {
          error: error,
          table: this.tableName,
        },
      };
    }
  }

 

}



module.exports = DynamoDBHandling;